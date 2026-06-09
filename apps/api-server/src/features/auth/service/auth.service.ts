import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { CompleteSignUpRequestSchema, UpdateCurrentUserRequestSchema, UserSchema, type User } from "@nmm/shared";
import { AuthRepository, type UserRecord } from "../database/auth.repository";

export const sessionCookieName = "nmm_session";

export type AuthRequestContext = {
  authorization?: string;
  cookieHeader?: string;
  allowPending?: boolean;
};

export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/api";
};

type ActiveUser = User & {
  name: string;
  status: "ACTIVE";
};

type GitHubProfile = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  createGitHubAuthorizationUrl(redirectTo?: string) {
    const config = this.getGitHubOAuthConfig();
    const state = randomBytes(32).toString("base64url");

    this.authRepository.saveOAuthState(state, {
      redirectTo: this.normalizeRedirectPath(redirectTo, this.loginRedirectPath),
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
    authorizationUrl.searchParams.set("client_id", config.clientId);
    authorizationUrl.searchParams.set("redirect_uri", config.callbackUrl);
    authorizationUrl.searchParams.set("scope", "read:user user:email");
    authorizationUrl.searchParams.set("state", state);

    return authorizationUrl.toString();
  }

  async completeGitHubCallback(input: { code?: string; state?: string }) {
    if (!input.code || !input.state) {
      throw new BadRequestException("GitHub OAuth callback code와 state가 필요합니다.");
    }

    const state = this.consumeOAuthState(input.state);
    const accessToken = await this.exchangeGitHubCode(input.code);
    const profile = await this.fetchGitHubProfile(accessToken);
    const emails = await this.fetchGitHubEmails(accessToken);
    const email = this.pickGitHubEmail(profile, emails);
    const user = this.upsertGitHubUser({
      accessToken,
      email,
      profile
    });
    const sessionToken = this.createSession(user);
    const redirectPath = user.status === "PENDING" ? this.signupRedirectPath : state.redirectTo;

    return {
      user: this.toUser(user),
      sessionToken,
      redirectUrl: this.toWebUrl(redirectPath)
    };
  }

  completeSignUp(input: unknown, context: AuthRequestContext): User {
    const request = CompleteSignUpRequestSchema.parse(input);
    const user = this.requireUserRecord({ ...context, allowPending: true });

    user.name = request.name;
    user.status = "ACTIVE";
    this.authRepository.saveUser(user);

    return this.toUser(user);
  }

  updateCurrentUser(input: unknown, context: AuthRequestContext): User {
    const request = UpdateCurrentUserRequestSchema.parse(input);
    const user = this.requireActiveUserRecord(context);

    user.name = request.name;
    this.authRepository.saveUser(user);

    return this.toUser(user);
  }

  getCurrentUser(context: AuthRequestContext): User {
    return this.toUser(this.requireUserRecord({ ...context, allowPending: true }));
  }

  requireUser(context: AuthRequestContext): ActiveUser {
    return this.toActiveUser(this.requireUserRecord(context));
  }

  readSessionToken(context: AuthRequestContext) {
    return this.readCookieToken(context.cookieHeader) ?? this.readBearerToken(context.authorization);
  }

  deleteSession(sessionToken: string | undefined) {
    if (sessionToken) {
      this.authRepository.deleteSession(sessionToken);
    }
  }

  getSessionCookieOptions(): SessionCookieOptions {
    return {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NMM_AUTH_COOKIE_SECURE === "true",
      path: "/api"
    };
  }

  getClearedSessionCookieOptions(): SessionCookieOptions {
    return this.getSessionCookieOptions();
  }

  createOAuthErrorRedirectUrl(reason = "oauth") {
    const errorPath = new URLSearchParams({ reason }).toString();

    return this.toWebUrl(`${this.errorRedirectPath}?${errorPath}`);
  }

  private requireUserRecord(context: AuthRequestContext): UserRecord {
    const sessionToken = this.readSessionToken(context);
    const user = sessionToken ? this.authRepository.findUserBySessionToken(sessionToken) : undefined;

    if (!user) {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }

    if (user.status === "SUSPENDED") {
      throw new ForbiddenException("정지된 사용자입니다.");
    }

    if (user.status === "PENDING" && !context.allowPending) {
      throw new ForbiddenException("가입 완료가 필요합니다.");
    }

    return user;
  }

  private requireActiveUserRecord(context: AuthRequestContext): UserRecord {
    const user = this.requireUserRecord(context);

    if (user.status !== "ACTIVE" || !user.name) {
      throw new ForbiddenException("가입 완료가 필요합니다.");
    }

    return user;
  }

  private getGitHubOAuthConfig() {
    const clientId = process.env.NMM_OAUTH_GITHUB_CLIENT_ID;
    const clientSecret = process.env.NMM_OAUTH_GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException("GitHub OAuth 환경 변수가 필요합니다.");
    }

    return {
      clientId,
      clientSecret,
      callbackUrl: new URL("/api/auth/github/callback", this.apiOrigin).toString()
    };
  }

  private async exchangeGitHubCode(code: string) {
    const config = this.getGitHubOAuthConfig();
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.callbackUrl
      })
    });
    const tokenResponse = await this.readJsonObject(response);
    const accessToken = this.readString(tokenResponse, "access_token");

    if (!response.ok || !accessToken) {
      throw new UnauthorizedException("GitHub access token을 발급받지 못했습니다.");
    }

    return accessToken;
  }

  private async fetchGitHubProfile(accessToken: string): Promise<GitHubProfile> {
    const response = await this.fetchGitHubApi("https://api.github.com/user", accessToken);
    const profile = await this.readJsonObject(response);
    const id = this.readNumber(profile, "id");
    const login = this.readString(profile, "login");

    if (!response.ok || id === undefined || !login) {
      throw new UnauthorizedException("GitHub 사용자 정보를 확인하지 못했습니다.");
    }

    return {
      id,
      login,
      name: this.readString(profile, "name") ?? null,
      email: this.readString(profile, "email") ?? null,
      avatarUrl: this.readString(profile, "avatar_url") ?? null
    };
  }

  private async fetchGitHubEmails(accessToken: string): Promise<GitHubEmail[]> {
    const response = await this.fetchGitHubApi("https://api.github.com/user/emails", accessToken);
    const data: unknown = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      throw new UnauthorizedException("GitHub 이메일 정보를 확인하지 못했습니다.");
    }

    return data.filter((item): item is GitHubEmail => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return false;
      }

      const record = item as Record<string, unknown>;

      return (
        typeof record.email === "string" && typeof record.primary === "boolean" && typeof record.verified === "boolean"
      );
    });
  }

  private fetchGitHubApi(url: string, accessToken: string) {
    return fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
  }

  private pickGitHubEmail(profile: GitHubProfile, emails: GitHubEmail[]) {
    const primaryEmail = emails.find((email) => email.primary && email.verified);
    const verifiedEmail = primaryEmail ?? emails.find((email) => email.verified);
    const email = verifiedEmail?.email ?? profile.email;

    if (!email) {
      throw new UnauthorizedException("GitHub에서 검증된 이메일을 확인하지 못했습니다.");
    }

    return this.normalizeEmail(email);
  }

  private upsertGitHubUser(input: { accessToken: string; email: string; profile: GitHubProfile }): UserRecord {
    const providerAccountKey = this.createProviderAccountKey("github", String(input.profile.id));
    const existingAccount = this.authRepository.findOAuthAccount(providerAccountKey);
    const now = new Date().toISOString();
    let user = existingAccount ? this.authRepository.findUserById(existingAccount.userId) : undefined;

    if (!user) {
      user = this.authRepository.findUserByEmail(input.email);
    }

    if (!user) {
      user = {
        id: this.authRepository.createUserId(),
        email: input.email,
        name: null,
        image: input.profile.avatarUrl,
        role: "USER",
        status: "PENDING",
        createdAt: now
      };
      this.saveUser(user);
    } else {
      user.image = input.profile.avatarUrl;
      this.saveUser(user);
    }

    this.authRepository.saveOAuthAccount(providerAccountKey, {
      provider: "github",
      providerAccountId: String(input.profile.id),
      userId: user.id,
      accessToken: input.accessToken,
      providerLogin: input.profile.login,
      updatedAt: now
    });

    return user;
  }

  private consumeOAuthState(state: string) {
    const stateRecord = this.authRepository.consumeOAuthState(state);

    if (!stateRecord || stateRecord.expiresAt < Date.now()) {
      throw new BadRequestException("GitHub OAuth state가 유효하지 않습니다.");
    }

    return stateRecord;
  }

  private createSession(user: UserRecord) {
    const sessionToken = randomBytes(32).toString("base64url");

    this.authRepository.saveSession(sessionToken, user.id);

    return sessionToken;
  }

  private saveUser(user: UserRecord) {
    this.authRepository.saveUser(user);
  }

  private toUser(user: UserRecord): User {
    return UserSchema.parse(user);
  }

  private toActiveUser(user: UserRecord): ActiveUser {
    const parsedUser = this.toUser(user);

    if (parsedUser.status !== "ACTIVE" || !parsedUser.name) {
      throw new ForbiddenException("가입 완료가 필요합니다.");
    }

    return parsedUser as ActiveUser;
  }

  private normalizeRedirectPath(value: string | undefined, fallback: string) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return fallback;
    }

    return value;
  }

  private toWebUrl(path: string) {
    return new URL(path, this.webOrigin).toString();
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private readCookieToken(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(";").map((item) => item.trim());
    const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${sessionCookieName}=`));
    const token = sessionCookie?.slice(`${sessionCookieName}=`.length);

    return token ? decodeURIComponent(token) : undefined;
  }

  private readBearerToken(authorization: string | undefined) {
    if (!authorization?.startsWith("Bearer ")) {
      return undefined;
    }

    return authorization.slice("Bearer ".length).trim() || undefined;
  }

  private createProviderAccountKey(provider: "github", providerAccountId: string) {
    return `${provider}:${providerAccountId}`;
  }

  private async readJsonObject(response: Response) {
    const data: unknown = await response.json();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new UnauthorizedException("OAuth 응답 형식이 올바르지 않습니다.");
    }

    return data as Record<string, unknown>;
  }

  private readString(record: Record<string, unknown>, key: string) {
    const value = record[key];

    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  private readNumber(record: Record<string, unknown>, key: string) {
    const value = record[key];

    return typeof value === "number" ? value : undefined;
  }

  private get apiOrigin() {
    return process.env.NMM_API_ORIGIN ?? "http://localhost:3000";
  }

  private get webOrigin() {
    return process.env.NMM_WEB_ORIGIN ?? "http://localhost:5173";
  }

  private get loginRedirectPath() {
    return process.env.NMM_AUTH_LOGIN_REDIRECT_PATH ?? "/posts";
  }

  private get signupRedirectPath() {
    return process.env.NMM_AUTH_SIGNUP_REDIRECT_PATH ?? "/auth/complete-signup";
  }

  private get errorRedirectPath() {
    return process.env.NMM_AUTH_ERROR_REDIRECT_PATH ?? "/auth/error";
  }
}
