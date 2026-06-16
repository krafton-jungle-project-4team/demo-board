import {
    EstateLegalDongListResponseSchema,
    EstateTransactionResponseSchema,
    EstateTransactionListResponseSchema,
    type EstateLegalDongListResponse,
    type EstateTransactionListQuery,
    type EstateTransactionResponse,
    type EstateTransactionListResponse
} from "@nmm/shared";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { EstateTransactionEntity } from "../database";
import { ESTATE_ERRORS, createEstateError } from "../estate.errors";

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

    async getTransaction(transactionId: number): Promise<EstateTransactionResponse> {
        const transaction = await this.estateTransactions.findOne({
            where: {
                id: transactionId
            }
        });

        if (!transaction) {
            throw createEstateError(ESTATE_ERRORS.TRANSACTION_NOT_FOUND);
        }

        return toEstateTransactionResponse(transaction);
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
        contractDate: toRequiredDateString(transaction.contractDate),
        dealAmount10kKrw: transaction.dealAmount10kKrw,
        buildingAreaSquareMeter: String(transaction.buildingAreaSquareMeter),
        floor: transaction.floor,
        builtYear: transaction.builtYear
    };
}

function toEstateTransactionResponse(transaction: EstateTransactionEntity): EstateTransactionResponse {
    return EstateTransactionResponseSchema.parse({
        id: Number(transaction.id),
        sourceRowNumber: transaction.sourceRowNumber,
        receiptYear: transaction.receiptYear,
        districtCode: transaction.districtCode,
        districtName: transaction.districtName,
        legalDongCode: transaction.legalDongCode,
        legalDongName: transaction.legalDongName,
        lotTypeCode: transaction.lotTypeCode,
        lotTypeName: transaction.lotTypeName,
        mainLotNumber: transaction.mainLotNumber,
        subLotNumber: transaction.subLotNumber,
        buildingName: transaction.buildingName,
        contractDate: toRequiredDateString(transaction.contractDate),
        dealAmount10kKrw: transaction.dealAmount10kKrw,
        buildingAreaSquareMeter: Number(transaction.buildingAreaSquareMeter),
        landAreaSquareMeter: toNullableNumber(transaction.landAreaSquareMeter),
        floor: transaction.floor,
        rightType: transaction.rightType,
        canceledAt: toNullableDateString(transaction.canceledAt),
        builtYear: transaction.builtYear,
        buildingUse: transaction.buildingUse,
        reportType: transaction.reportType,
        brokeredAgentSggName: transaction.brokeredAgentSggName
    });
}

//zod조건 맞추려고 변환해주는 함수
function toRequiredDateString(value: Date | string) {
    return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function toNullableDateString(value: Date | string | null) {
    if (value === null) {
        return null;
    }

    return toRequiredDateString(value);
}

function toNullableNumber(value: number | string | null) {
    return value === null ? null : Number(value);
}

function toLegalDongName(legalDong: { legalDongName: string }) {
    return legalDong.legalDongName;
}
