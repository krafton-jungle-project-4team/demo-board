import { type MigrationInterface, type QueryRunner, Table } from "typeorm";

export class CreateExampleItems1710000000001 implements MigrationInterface {
    name = "CreateExampleItems1710000000001";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "example_items",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    { name: "message", type: "text", isNullable: false },
                    { name: "created_at", type: "timestamptz", isNullable: false, default: "CURRENT_TIMESTAMP" }
                ]
            }),
            true
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("example_items", true, true, true);
    }
}
