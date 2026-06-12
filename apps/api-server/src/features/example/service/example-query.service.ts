import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ExampleResponse } from "@nmm/shared";
import { Repository } from "typeorm";
import { ExampleItemEntity } from "../database";

const DEFAULT_EXAMPLE_MESSAGE = "API template is ready.";

@Injectable()
export class ExampleQueryService {
    constructor(@InjectRepository(ExampleItemEntity) private readonly exampleItems: Repository<ExampleItemEntity>) {}

    async getExample(): Promise<ExampleResponse> {
        const exampleItem = await this.findOrCreateExampleItem();

        return exampleItem.toExampleResponse();
    }

    private async findOrCreateExampleItem() {
        const exampleItem = await this.exampleItems.findOne({
            order: {
                id: "ASC"
            },
            where: {}
        });

        if (exampleItem) {
            return exampleItem;
        }

        return this.exampleItems.save(
            this.exampleItems.create({
                message: DEFAULT_EXAMPLE_MESSAGE
            })
        );
    }
}
