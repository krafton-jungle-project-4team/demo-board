import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EstateTransactionEntity } from "../database";

type EstateTransactionListQuery = { 
    legalDongName?: string;
    buildingUse?: string;
    buildingName?: string;
};

export type EstateTransactionListItemResponse = { //프론트가 받기 편하게 정제된 데이터
    id: number;
    legalDongName: string;
    buildingName: string | null;
    buildingUse: string;
    contractDate: Date;
    dealAmount10kKrw: number;
    buildingAreaSquareMeter: number;
    floor: number | null;
    builtYear: number;
};

@Injectable()
export class EstateQueryService { //실거래 내역 DB에서 가져옴
    constructor(
        @InjectRepository(EstateTransactionEntity)
        private readonly estateTransactions: Repository<EstateTransactionEntity>
    ) {}

    getTransactions(query: EstateTransactionListQuery): Promise<EstateTransactionListItemResponse[]> { //조건으로 필터링
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
            .getMany()
            .then((transactions) => transactions.map(toEstateTransactionListItem));
    }
}

function toEstateTransactionListItem(
    transaction: EstateTransactionEntity
): EstateTransactionListItemResponse {
    return { //프론트에 줄 정보들
        id: transaction.id,
        legalDongName: transaction.legalDongName,
        buildingName: transaction.buildingName,
        buildingUse: transaction.buildingUse,
        contractDate: transaction.contractDate,
        dealAmount10kKrw: transaction.dealAmount10kKrw,
        buildingAreaSquareMeter: transaction.buildingAreaSquareMeter,
        floor: transaction.floor,
        builtYear: transaction.builtYear
    };
}