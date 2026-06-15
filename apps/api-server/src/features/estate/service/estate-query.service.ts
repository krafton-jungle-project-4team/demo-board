import {
    EstateLegalDongListResponseSchema,
    EstateTransactionListResponseSchema,
    type EstateLegalDongListResponse,
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

    async getTransactions(query: EstateTransactionListQuery): Promise<EstateTransactionListResponse> {
        //조건으로 필터링
        const queryBuilder = this.estateTransactions.createQueryBuilder("estateTransaction");

        if (query.legalDongName) {
            queryBuilder.andWhere("estateTransaction.legalDongName = :legalDongName", {
                legalDongName: query.legalDongName
            });
        }

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

        const [transactions, totalItems] = await queryBuilder
            .orderBy("estateTransaction.contractDate", "DESC")
            .addOrderBy("estateTransaction.id", "ASC")
            .skip((query.page - 1) * query.pageSize)
            .take(query.pageSize)
            .getManyAndCount();
        const totalPages = Math.ceil(totalItems / query.pageSize);

        return EstateTransactionListResponseSchema.parse({
            items: transactions.map(toEstateTransactionListItem),
            page: query.page,
            pageSize: query.pageSize,
            totalItems,
            totalPages,
            hasPreviousPage: query.page > 1,
            hasNextPage: query.page < totalPages
        });
    }

    async getLegalDongNames(): Promise<EstateLegalDongListResponse> {
        const legalDongs = await this.estateTransactions
            .createQueryBuilder("estateTransaction")
            .select("estateTransaction.legalDongName", "legalDongName")
            .distinct(true)
            .orderBy("estateTransaction.legalDongName", "ASC")
            .getRawMany<{ legalDongName: string }>();

        return EstateLegalDongListResponseSchema.parse(legalDongs.map(toLegalDongName));
    }
}

function toEstateTransactionListItem(
    transaction: EstateTransactionEntity
): EstateTransactionListResponse["items"][number] {
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

function toLegalDongName(legalDong: { legalDongName: string }) {
    return legalDong.legalDongName;
}
