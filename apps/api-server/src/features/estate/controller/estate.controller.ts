import { Controller, Get, Query } from "@nestjs/common";
import { EstateTransactionEntity } from "../database";
import { EstateQueryService } from "../service/estate-query.service";

@Controller("estate")
export class EstateController {
    constructor(private readonly estateQueryService: EstateQueryService) {}

    @Get("transactions") 
    getTransactions(
        @Query() query: { legalDongName?: string; buildingUse?: string; buildingName?: string }
    ): Promise<EstateTransactionEntity[]> {
        return this.estateQueryService.getTransactions({
            legalDongName: query.legalDongName,
            buildingUse: query.buildingUse,
            buildingName: query.buildingName
        });
    }
}
