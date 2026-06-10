import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
    CompleteSignUpRequest,
    CompleteSignUpResponse,
    UpdateCurrentUserRequest,
    UpdateCurrentUserResponse,
    UserStatus
} from "@nmm/shared";
import { Not, Repository } from "typeorm";
import type { AuthClaims } from "../auth.model";
import { SessionEntity, UserEntity } from "../database";

type AuthUserProfile = {
    name: string | null;
    status: UserStatus;
};

@Injectable()
export class AuthCommandService {
    private readonly logger = new Logger(AuthCommandService.name);

    constructor(
        @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
        @InjectRepository(SessionEntity) private readonly sessions: Repository<SessionEntity>
    ) {}

    async completeSignUp(request: CompleteSignUpRequest, claims: AuthClaims): Promise<CompleteSignUpResponse> {
        this.logger.debug("completeSignUp called");

        await this.updateUserProfile(claims.userId, {
            name: request.name,
            status: "ACTIVE"
        });
        await this.deleteUserSessions(claims.userId, claims.sessionId);

        return { userId: claims.userId };
    }

    async updateCurrentUser(request: UpdateCurrentUserRequest, claims: AuthClaims): Promise<UpdateCurrentUserResponse> {
        this.logger.debug("updateCurrentUser called");

        await this.updateUserProfile(claims.userId, {
            name: request.name,
            status: claims.status
        });

        return { userId: claims.userId };
    }

    private async updateUserProfile(userId: string, profile: AuthUserProfile) {
        const result = await this.users.update(
            { id: userId },
            {
                name: profile.name ?? "",
                status: profile.status,
                updatedAt: new Date()
            }
        );

        if (result.affected === 0) {
            throw new Error("Authenticated user not found.");
        }
    }

    private async deleteUserSessions(userId: string, exceptSessionId?: string) {
        await this.sessions.delete({
            userId,
            ...(exceptSessionId ? { id: Not(exceptSessionId) } : {})
        });
    }
}
