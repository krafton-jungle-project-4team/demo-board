import {
    EstateTransactionListResponseSchema,
    type EstateTransactionListQuery,
    type EstateTransactionListResponse
} from "@nmm/shared";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { EstateTransactionEntity } from "../database";

@Injectable()
export class EstateQueryService {
    //실거래 내역 DB에서 가져옴
    constructor(
        @InjectRepository(EstateTransactionEntity)
        private readonly estateTransactions: Repository<EstateTransactionEntity>
    ) {}

    getTransactions(query: EstateTransactionListQuery): Promise<EstateTransactionListResponse> {
        //조건으로 필터링
        const queryBuilder = this.estateTransactions.createQueryBuilder("estateTransaction");

        if (query.q) {
            const keywords = query.q.split(/\s+/);

            keywords.forEach((keyword, index) => {
                queryBuilder.andWhere(
                    new Brackets((bracketQueryBuilder) => {
                        bracketQueryBuilder
                            .where(`estateTransaction.legalDongName ILIKE :keyword${index}`)
                            .orWhere(`estateTransaction.buildingUse ILIKE :keyword${index}`)
                            .orWhere(`estateTransaction.buildingName ILIKE :keyword${index}`);
                    }),
                    {
                        [`keyword${index}`]: `%${keyword}%`
                    }
                );
            });
        }

        return queryBuilder
            .orderBy("estateTransaction.contractDate", "DESC")
            .addOrderBy("estateTransaction.id", "ASC")
            .take(20)
            .getMany()
            .then((transactions) =>
                EstateTransactionListResponseSchema.parse(transactions.map(toEstateTransactionListItem))
            );
    }
}

function toEstateTransactionListItem(transaction: EstateTransactionEntity): EstateTransactionListResponse[number] {
    return {
        id: Number(transaction.id),
        legalDongName: transaction.legalDongName,
        buildingName: transaction.buildingName,
        buildingUse: transaction.buildingUse,
        contractDate: toDateString(transaction.contractDate),
        dealAmount10kKrw: transaction.dealAmount10kKrw,
        buildingAreaSquareMeter: String(transaction.buildingAreaSquareMeter),
        floor: transaction.floor,
        builtYear: transaction.builtYear
    };
}

//zod조건 맞추려고 변환해주는 함수
function toDateString(value: Date | string) {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return value;
}
