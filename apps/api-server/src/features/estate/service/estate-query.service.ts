import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EstateTransactionEntity } from "../database";

type EstateTransactionListQuery = {
    legalDongName?: string;
    buildingUse?: string;
    buildingName?: string;
};

@Injectable()
export class EstateQueryService { //실거래 내역 DB에서 가져옴
    constructor(
        @InjectRepository(EstateTransactionEntity)
        private readonly estateTransactions: Repository<EstateTransactionEntity>
    ) {}

    getTransactions(query: EstateTransactionListQuery): Promise<EstateTransactionEntity[]> { //조건으로 필터링
        const queryBuilder = this.estateTransactions.createQueryBuilder("estateTransaction");

        if (query.legalDongName) {
            queryBuilder.andWhere("estateTransaction.legalDongName = :legalDongName", {
                legalDongName: query.legalDongName
            });
        }

        if (query.buildingUse) {
            queryBuilder.andWhere("estateTransaction.buildingUse = :buildingUse", {
                buildingUse: query.buildingUse
            });
        }

        if (query.buildingName) {
            queryBuilder.andWhere("estateTransaction.buildingName ILIKE :buildingName", {
                buildingName: `%${query.buildingName}%`
            });
        }

        return queryBuilder
            .orderBy("estateTransaction.contractDate", "DESC")
            .addOrderBy("estateTransaction.id", "ASC")
            .take(20)
            .getMany();
    }
}
