import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { typeormAdapter } from "@hedystia/better-auth-typeorm";
import { betterAuth } from "better-auth";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import type { AuthUser } from "@nmm/shared";
import { DataSource, Repository } from "typeorm";
import { serverEnv } from "../../../infra/env";
import { AppUserEntity } from "../database";

type BetterAuthUser = {
    id: string;
    email: string;
    name: string;
};

function createAuth(
    dataSource: DataSource,
    onUserCreated: (user: BetterAuthUser) => Promise<unknown>,
    onUserUpdated: (user: BetterAuthUser) => Promise<unknown>
) {
    return betterAuth({
        baseURL: serverEnv.auth.baseUrl,
        basePath: "/api/auth",
        secret: serverEnv.auth.secret,
        trustedOrigins: [serverEnv.app.webOrigin],
        database: typeormAdapter(dataSource),
        emailAndPassword: {
            enabled: true
        },
        user: {
            modelName: "auth_user"
        },
        session: {
            modelName: "auth_session"
        },
        account: {
            modelName: "auth_account"
        },
        verification: {
            modelName: "auth_verification"
        },
        databaseHooks: {
            user: {
                create: {
                    after: async (user) => {
                        await onUserCreated({
                            id: String(user.id),
                            email: user.email,
                            name: user.name
                        });
                    }
                },
                update: {
                    after: async (user) => {
                        await onUserUpdated({
                            id: String(user.id),
                            email: user.email,
                            name: user.name
                        });
                    }
                }
            }
        }
    });
}

type AppAuth = ReturnType<typeof createAuth>;

@Injectable()
export class AuthService {
    private readonly auth: AppAuth;
    private readonly handleAuthRequest: (request: IncomingMessage, response: ServerResponse) => Promise<void>;

    constructor(
        @InjectDataSource() dataSource: DataSource,
        @InjectRepository(AppUserEntity) private readonly appUsers: Repository<AppUserEntity>
    ) {
        this.auth = createAuth(dataSource, this.ensureAppUser.bind(this), this.syncAppUser.bind(this));
        this.handleAuthRequest = toNodeHandler(this.auth);
    }

    handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
        return this.handleAuthRequest(request, response);
    }

    async findCurrentUser(headers: IncomingHttpHeaders): Promise<AuthUser | null> {
        const session = await this.auth.api.getSession({
            headers: fromNodeHeaders(headers)
        });

        if (!session) {
            return null;
        }

        return this.findOrCreateAppUser({
            id: String(session.user.id),
            email: session.user.email,
            name: session.user.name
        });
    }

    private async findOrCreateAppUser(user: BetterAuthUser): Promise<AuthUser> {
        const appUser = await this.findAppUser(user.id);

        if (appUser) {
            return appUser.toAuthUser();
        }

        return this.ensureAppUser(user);
    }

    private async findAppUser(authUserId: string) {
        return this.appUsers.findOne({
            where: {
                authUserId
            }
        });
    }

    private async ensureAppUser(user: BetterAuthUser): Promise<AuthUser> {
        const existingUser = await this.findAppUser(user.id);

        if (existingUser) {
            return existingUser.toAuthUser();
        }

        const appUser = await this.appUsers.save(
            this.appUsers.create({
                authUserId: user.id,
                email: user.email,
                name: user.name
            })
        );

        return appUser.toAuthUser();
    }

    private async syncAppUser(user: BetterAuthUser): Promise<void> {
        const existingUser = await this.findAppUser(user.id);

        if (!existingUser) {
            await this.ensureAppUser(user);
            return;
        }

        existingUser.email = user.email;
        existingUser.name = user.name;

        await this.appUsers.save(existingUser);
    }
}
