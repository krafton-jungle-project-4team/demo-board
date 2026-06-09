import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { CompleteSignUpRequestSchema, UpdateCurrentUserRequestSchema, UserSchema, type User } from "@nmm/shared";
import { DataSource } from "typeorm";
import { authErrors, type UserRecord } from "../domain";
import { AuthQueryService, type AuthRequestContext } from "./auth-query.service";

type AuthUserRow = {
    id: string;
    email: string;
    name: string;
    image: string | null;
    role: string;
    status: string;
    createdAt: Date;
};

@Injectable()
export class AuthCommandService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly authQueryService: AuthQueryService
    ) {}

    async completeSignUp(input: unknown, context: AuthRequestContext): Promise<User> {
        const request = CompleteSignUpRequestSchema.parse(input);
        const user = await this.authQueryService.requireUserRecord({ ...context, allowPending: true });

        await this.updateUserProfile(user.id, {
            name: request.name,
            status: "ACTIVE"
        });

        return this.findUser(user.id);
    }

    async updateCurrentUser(input: unknown, context: AuthRequestContext): Promise<User> {
        const request = UpdateCurrentUserRequestSchema.parse(input);
        const user = await this.authQueryService.requireActiveUserRecord(context);

        await this.updateUserProfile(user.id, {
            name: request.name,
            status: user.status
        });

        return this.findUser(user.id);
    }

    private async updateUserProfile(userId: string, input: Pick<UserRecord, "name" | "status">) {
        await this.dataSource.query('UPDATE "user" SET "name" = $1, "status" = $2, "updatedAt" = $3 WHERE "id" = $4', [
            input.name,
            input.status,
            new Date(),
            userId
        ]);
    }

    private async findUser(id: string): Promise<User> {
        const rows = await this.dataSource.query<AuthUserRow[]>(
            'SELECT "id", "email", "name", "image", "role", "status", "createdAt" FROM "user" WHERE "id" = $1 LIMIT 1',
            [id]
        );
        const user = rows[0];

        if (!user) {
            throw authErrors.sessionRequired();
        }

        return UserSchema.parse({
            id: user.id,
            email: user.email,
            name: user.name.trim() || null,
            image: user.image,
            role: user.role === "ADMIN" ? "ADMIN" : "USER",
            status: this.toUserStatus(user.status),
            createdAt: user.createdAt.toISOString()
        });
    }

    private toUserStatus(value: string) {
        if (value === "ACTIVE" || value === "SUSPENDED") {
            return value;
        }

        return "PENDING";
    }
}
