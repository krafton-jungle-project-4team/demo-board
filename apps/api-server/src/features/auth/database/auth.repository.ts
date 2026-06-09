import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserSchema } from "@nmm/shared";
import { Not, Repository } from "typeorm";
import { SessionEntity, type AuthRepository, type AuthUserProfile, UserEntity, type UserRecord } from "../domain";

@Injectable()
export class AuthTypeOrmRepository implements AuthRepository {
    constructor(
        @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
        @InjectRepository(SessionEntity) private readonly sessions: Repository<SessionEntity>
    ) {}

    async findUser(id: string): Promise<UserRecord | undefined> {
        const user = await this.users.findOneBy({ id });

        return user ? this.toUserRecord(user) : undefined;
    }

    async updateUserProfile(userId: string, profile: AuthUserProfile) {
        await this.users.update(
            { id: userId },
            {
                name: profile.name ?? "",
                status: profile.status,
                updatedAt: new Date()
            }
        );
    }

    async deleteUserSessions(userId: string, exceptSessionId?: string) {
        await this.sessions.delete({
            userId,
            ...(exceptSessionId ? { id: Not(exceptSessionId) } : {})
        });
    }

    private toUserRecord(user: UserEntity): UserRecord {
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
