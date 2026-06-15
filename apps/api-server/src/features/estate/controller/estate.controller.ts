import { Controller, Get, Query } from "@nestjs/common";
import { EstateQueryService, type EstateTransactionListItemResponse } from "../service/estate-query.service";

@Controller("estate")
export class EstateController {
    constructor(private readonly estateQueryService: EstateQueryService) {}

    @Get("transactions")
    getTransactions(
        @Query() query: { legalDongName?: string; buildingUse?: string; buildingName?: string }
    ): Promise<EstateTransactionListItemResponse[]> {
        return this.estateQueryService.getTransactions({
            legalDongName: query.legalDongName,
            buildingUse: query.buildingUse,
            buildingName: query.buildingName
        });
    }
}
