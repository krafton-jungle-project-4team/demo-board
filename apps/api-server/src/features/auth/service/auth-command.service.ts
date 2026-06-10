import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { CompleteSignUpRequest, UpdateCurrentUserRequest, User } from "@nmm/shared";
import { Not, Repository } from "typeorm";
import type { AuthClaims } from "../auth.model";
import { SessionEntity, UserEntity } from "../database";
import { AuthQueryService } from "./auth-query.service";

type AuthUserProfile = Pick<User, "name" | "status">;

@Injectable()
export class AuthCommandService {
    constructor(
        @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
        @InjectRepository(SessionEntity) private readonly sessions: Repository<SessionEntity>,
        private readonly authQueryService: AuthQueryService
    ) {}

    async completeSignUp(request: CompleteSignUpRequest, claims: AuthClaims): Promise<User> {
        await this.updateUserProfile(claims.userId, {
            name: request.name,
            status: "ACTIVE"
        });
        await this.deleteUserSessions(claims.userId, claims.sessionId);

        return this.authQueryService.findUserRecord(claims);
    }

    async updateCurrentUser(request: UpdateCurrentUserRequest, claims: AuthClaims): Promise<User> {
        await this.updateUserProfile(claims.userId, {
            name: request.name,
            status: claims.status
        });

        return this.authQueryService.findUserRecord(claims);
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
