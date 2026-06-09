import { Inject, Injectable } from "@nestjs/common";
import type { CompleteSignUpRequest, UpdateCurrentUserRequest, User } from "@nmm/shared";
import { AUTH_REPOSITORY, authErrors, type ActiveUser, type AuthRepository, type UserRecord } from "../domain";

@Injectable()
export class AuthCommandService {
    constructor(@Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepository) {}

    async completeSignUp(request: CompleteSignUpRequest, user: UserRecord): Promise<User> {
        await this.authRepository.updateUserProfile(user.id, {
            name: request.name,
            status: "ACTIVE"
        });

        return this.findUser(user.id);
    }

    async updateCurrentUser(request: UpdateCurrentUserRequest, user: ActiveUser): Promise<User> {
        await this.authRepository.updateUserProfile(user.id, {
            name: request.name,
            status: user.status
        });

        return this.findUser(user.id);
    }

    private async findUser(id: string): Promise<User> {
        const user = await this.authRepository.findUser(id);

        if (!user) {
            throw authErrors.sessionRequired();
        }

        return user;
    }
}
