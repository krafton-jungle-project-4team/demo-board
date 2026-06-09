import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  AuthSessionResponseSchema,
  LoginRequestSchema,
  SignUpRequestSchema,
  UserSchema,
  type AuthSessionResponse,
  type User
} from "@nmm/shared";

type UserRecord = User & {
  passwordHash: string;
  passwordSalt: string;
};

@Injectable()
export class AuthService {
  private nextUserNumber = 2;
  private readonly users = new Map<string, UserRecord>();
  private readonly userIdsByEmail = new Map<string, string>();
  private readonly sessionUserIds = new Map<string, string>();

  constructor() {
    const seededUser = this.createUserRecord({
      id: "user-sijun",
      email: "sijun@example.com",
      name: "sijun",
      password: "password123"
    });

    this.saveUser(seededUser);
  }

  signUp(input: unknown): AuthSessionResponse {
    const request = SignUpRequestSchema.parse(input);
    const email = this.normalizeEmail(request.email);

    if (this.userIdsByEmail.has(email)) {
      throw new ConflictException("이미 가입된 이메일입니다.");
    }

    const user = this.createUserRecord({
      id: `user-${this.nextUserNumber++}`,
      email,
      name: request.name,
      password: request.password
    });

    this.saveUser(user);

    return this.createSession(user);
  }

  login(input: unknown): AuthSessionResponse {
    const request = LoginRequestSchema.parse(input);
    const userId = this.userIdsByEmail.get(this.normalizeEmail(request.email));
    const user = userId ? this.users.get(userId) : undefined;

    if (!user || !this.verifyPassword(request.password, user)) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    return this.createSession(user);
  }

  requireUser(authorization: string | undefined): User {
    const sessionToken = this.readBearerToken(authorization);
    const userId = sessionToken ? this.sessionUserIds.get(sessionToken) : undefined;
    const user = userId ? this.users.get(userId) : undefined;

    if (!user) {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }

    return this.toUser(user);
  }

  private createUserRecord(input: { id: string; email: string; name: string; password: string }): UserRecord {
    const passwordSalt = randomBytes(16).toString("hex");

    return {
      id: input.id,
      email: this.normalizeEmail(input.email),
      name: input.name,
      role: "USER",
      createdAt: new Date().toISOString(),
      passwordSalt,
      passwordHash: this.hashPassword(input.password, passwordSalt)
    };
  }

  private createSession(user: UserRecord): AuthSessionResponse {
    const sessionToken = randomBytes(32).toString("base64url");

    this.sessionUserIds.set(sessionToken, user.id);

    return AuthSessionResponseSchema.parse({
      user: this.toUser(user),
      sessionToken
    });
  }

  private saveUser(user: UserRecord) {
    this.users.set(user.id, user);
    this.userIdsByEmail.set(user.email, user.id);
  }

  private toUser(user: UserRecord): User {
    return UserSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashPassword(password: string, salt: string) {
    return scryptSync(password, salt, 64).toString("hex");
  }

  private verifyPassword(password: string, user: UserRecord) {
    const expected = Buffer.from(user.passwordHash, "hex");
    const actual = Buffer.from(this.hashPassword(password, user.passwordSalt), "hex");

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private readBearerToken(authorization: string | undefined) {
    if (!authorization?.startsWith("Bearer ")) {
      return undefined;
    }

    return authorization.slice("Bearer ".length).trim() || undefined;
  }
}
