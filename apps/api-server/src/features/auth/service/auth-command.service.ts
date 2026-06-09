import { Inject, Injectable } from "@nestjs/common";
import type { CompleteSignUpRequest, UpdateCurrentUserRequest, User } from "@nmm/shared";
import { AUTH_REPOSITORY, authErrors, type AuthClaims, type AuthRepository } from "../domain";

@Injectable()
export class AuthCommandService {
    constructor(@Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepository) {}

    async completeSignUp(request: CompleteSignUpRequest, claims: AuthClaims): Promise<User> {
        await this.authRepository.updateUserProfile(claims.userId, {
            name: request.name,
            status: "ACTIVE"
        });
        await this.authRepository.deleteUserSessions(claims.userId, claims.sessionId);

        return this.findUser(claims.userId);
    }

    async updateCurrentUser(request: UpdateCurrentUserRequest, claims: AuthClaims): Promise<User> {
        await this.authRepository.updateUserProfile(claims.userId, {
            name: request.name,
            status: claims.status
        });

        return this.findUser(claims.userId);
    }

    private async findUser(id: string): Promise<User> {
        const user = await this.authRepository.findUser(id);

        if (!user) {
            throw authErrors.sessionRequired();
        }

        return user;
    }
}
