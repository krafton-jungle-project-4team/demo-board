import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { CompleteSignUpRequest, UpdateCurrentUserRequest, User } from "@nmm/shared";
import { Not, Repository } from "typeorm";
import type { AuthClaims } from "../auth.model";
import { SessionEntity, UserEntity } from "../database";

type AuthUserProfile = Pick<User, "name" | "status">;

@Injectable()
export class AuthCommandService {
    constructor(
        @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
        @InjectRepository(SessionEntity) private readonly sessions: Repository<SessionEntity>
    ) {}

    async completeSignUp(request: CompleteSignUpRequest, claims: AuthClaims): Promise<User> {
        await this.updateUserProfile(claims.userId, {
            name: request.name,
            status: "ACTIVE"
        });
        await this.deleteUserSessions(claims.userId, claims.sessionId);

        return this.findUserRecord(claims.userId);
    }

    async updateCurrentUser(request: UpdateCurrentUserRequest, claims: AuthClaims): Promise<User> {
        await this.updateUserProfile(claims.userId, {
            name: request.name,
            status: claims.status
        });

        return this.findUserRecord(claims.userId);
    }

    private async findUserRecord(userId: string): Promise<User> {
        const user = await this.users.findOneBy({ id: userId });

        if (!user) {
            throw new Error("Authenticated user not found.");
        }

        return UserEntity.from(user).toUser();
    }

    private async updateUserProfile(userId: string, profile: AuthUserProfile) {
        await this.users.update(
            { id: userId },
            {
                name: profile.name ?? "",
                status: profile.status,
                updatedAt: new Date()
            }
        );
    }

    private async deleteUserSessions(userId: string, exceptSessionId?: string) {
        await this.sessions.delete({
            userId,
            ...(exceptSessionId ? { id: Not(exceptSessionId) } : {})
        });
    }
}
