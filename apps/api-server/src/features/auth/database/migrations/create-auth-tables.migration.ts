import { type MigrationInterface, type QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateAuthTables1710000000000 implements MigrationInterface {
    name = "CreateAuthTables1710000000000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "auth_user",
                columns: [
                    { name: "id", type: "text", isPrimary: true },
                    { name: "name", type: "text", isNullable: false },
                    { name: "email", type: "text", isNullable: false, isUnique: true },
                    { name: "emailVerified", type: "boolean", isNullable: false, default: false },
                    { name: "image", type: "text", isNullable: true },
                    { name: "createdAt", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" }
                ]
            }),
            true
        );

        await queryRunner.createTable(
            new Table({
                name: "auth_session",
                columns: [
                    { name: "id", type: "text", isPrimary: true },
                    { name: "expiresAt", type: "timestamptz", isNullable: false },
                    { name: "token", type: "text", isNullable: false, isUnique: true },
                    { name: "createdAt", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" },
                    { name: "ipAddress", type: "text", isNullable: true },
                    { name: "userAgent", type: "text", isNullable: true },
                    { name: "userId", type: "text", isNullable: false }
                ]
            }),
            true
        );
        await queryRunner.createIndex(
            "auth_session",
            new TableIndex({
                name: "auth_session_userId_idx",
                columnNames: ["userId"]
            })
        );
        await queryRunner.createForeignKey(
            "auth_session",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedTableName: "auth_user",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createTable(
            new Table({
                name: "auth_account",
                columns: [
                    { name: "id", type: "text", isPrimary: true },
                    { name: "accountId", type: "text", isNullable: false },
                    { name: "providerId", type: "text", isNullable: false },
                    { name: "userId", type: "text", isNullable: false },
                    { name: "accessToken", type: "text", isNullable: true },
                    { name: "refreshToken", type: "text", isNullable: true },
                    { name: "idToken", type: "text", isNullable: true },
                    { name: "accessTokenExpiresAt", type: "timestamptz", isNullable: true },
                    { name: "refreshTokenExpiresAt", type: "timestamptz", isNullable: true },
                    { name: "scope", type: "text", isNullable: true },
                    { name: "password", type: "text", isNullable: true },
                    { name: "createdAt", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" }
                ]
            }),
            true
        );
        await queryRunner.createIndex(
            "auth_account",
            new TableIndex({
                name: "auth_account_userId_idx",
                columnNames: ["userId"]
            })
        );
        await queryRunner.createForeignKey(
            "auth_account",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedTableName: "auth_user",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createTable(
            new Table({
                name: "auth_verification",
                columns: [
                    { name: "id", type: "text", isPrimary: true },
                    { name: "identifier", type: "text", isNullable: false },
                    { name: "value", type: "text", isNullable: false },
                    { name: "expiresAt", type: "timestamptz", isNullable: false },
                    { name: "createdAt", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" }
                ]
            }),
            true
        );
        await queryRunner.createIndex(
            "auth_verification",
            new TableIndex({
                name: "auth_verification_identifier_idx",
                columnNames: ["identifier"]
            })
        );

        await queryRunner.createTable(
            new Table({
                name: "app_users",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    { name: "auth_user_id", type: "text", isNullable: false, isUnique: true },
                    { name: "email", type: "text", isNullable: false, isUnique: true },
                    { name: "name", type: "text", isNullable: false },
                    { name: "created_at", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" },
                    { name: "updated_at", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" }
                ]
            }),
            true
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("app_users", true, true, true);
        await queryRunner.dropTable("auth_verification", true, true, true);
        await queryRunner.dropTable("auth_account", true, true, true);
        await queryRunner.dropTable("auth_session", true, true, true);
        await queryRunner.dropTable("auth_user", true, true, true);
    }
}
