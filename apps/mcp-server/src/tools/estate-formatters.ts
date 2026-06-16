import type {
    EstateMarketSummaryResponse,
    EstateSimilarTransactionResponse,
    EstateTransactionListResponse,
    EstateTransactionResponse
} from "@nmm/shared";

type LegalDongListOutput = {
    items: string[];
    totalItems: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    nextOffset?: number;
};

const TEXT_ITEM_LIMIT = 5;

export function formatTransactionList(response: EstateTransactionListResponse) {
    if (response.items.length === 0) {
        return `실거래 검색 결과가 없습니다. page=${response.page}, pageSize=${response.pageSize}`;
    }

    const lines = [
        `실거래 ${response.totalItems.toLocaleString("ko-KR")}건 중 ${response.items.length.toLocaleString("ko-KR")}건을 반환했습니다.`,
        `페이지 ${response.page}/${response.totalPages}, 다음 페이지: ${response.hasNextPage ? "있음" : "없음"}`,
        ...response.items.slice(0, TEXT_ITEM_LIMIT).map(formatTransactionListItem)
    ];

    return lines.join("\n");
}

export function createLegalDongListOutput(items: string[], limit: number, offset: number): LegalDongListOutput {
    const pagedItems = items.slice(offset, offset + limit);
    const nextOffset = offset + pagedItems.length;
    const hasMore = nextOffset < items.length;

    return {
        items: pagedItems,
        totalItems: items.length,
        limit,
        offset,
        hasMore,
        ...(hasMore ? { nextOffset } : {})
    };
}

export function formatLegalDongList(output: LegalDongListOutput) {
    if (output.items.length === 0) {
        return `법정동 후보가 없습니다. offset=${output.offset}, limit=${output.limit}`;
    }

    return [
        `법정동 후보 ${output.totalItems.toLocaleString("ko-KR")}개 중 ${output.items.length.toLocaleString("ko-KR")}개를 반환했습니다.`,
        `다음 페이지: ${output.hasMore ? `offset=${output.nextOffset}` : "없음"}`,
        output.items.join(", ")
    ].join("\n");
}

export function formatTransactionDetail(transaction: EstateTransactionResponse) {
    const buildingName = transaction.buildingName ?? "건물명 없음";
    const address = [
        transaction.districtName,
        transaction.legalDongName,
        transaction.mainLotNumber,
        transaction.subLotNumber ? `-${transaction.subLotNumber}` : ""
    ]
        .filter(Boolean)
        .join(" ");
    const floor = transaction.floor === null ? "층 정보 없음" : `${transaction.floor}층`;
    const canceled = transaction.canceledAt ? `해제일 ${transaction.canceledAt}` : "정상 거래";

    return [
        `실거래 #${transaction.id} 상세입니다.`,
        `${address} ${buildingName}`,
        `${transaction.buildingUse}, ${transaction.buildingAreaSquareMeter}㎡, ${floor}, ${transaction.builtYear}년 건축`,
        `계약일 ${transaction.contractDate}, 거래금액 ${transaction.dealAmount10kKrw.toLocaleString("ko-KR")}만원, ${canceled}`,
        `신고구분 ${transaction.reportType}, 중개사 소재지 ${transaction.brokeredAgentSggName ?? "-"}`
    ].join("\n");
}

export function formatSimilarTransactions(response: EstateSimilarTransactionResponse) {
    if (response.items.length === 0) {
        return "유사 실거래 검색 결과가 없습니다.";
    }

    return [
        `유사 실거래 ${response.items.length.toLocaleString("ko-KR")}건을 반환했습니다.`,
        ...response.items.slice(0, TEXT_ITEM_LIMIT).map((item) => {
            const transaction = item.transaction;
            const buildingName = transaction.buildingName ?? "건물명 없음";

            return `- #${transaction.id} ${transaction.legalDongName} ${buildingName}, ${transaction.buildingUse}, ${transaction.buildingAreaSquareMeter}㎡, ${transaction.dealAmount10kKrw.toLocaleString("ko-KR")}만원, score=${formatPercent(item.score)}`;
        })
    ].join("\n");
}

export function formatMarketSummary(response: EstateMarketSummaryResponse) {
    if (response.totalCount === 0) {
        return "조건에 맞는 실거래가 없어 시세 요약을 만들 수 없습니다.";
    }

    return [
        `실거래 ${response.totalCount.toLocaleString("ko-KR")}건 기준 시세 요약입니다.`,
        `최근 거래일: ${response.latestContractDate ?? "없음"}`,
        `거래금액: 최소 ${formatNullableNumber(response.dealAmount10kKrw.min)}만원, 최대 ${formatNullableNumber(response.dealAmount10kKrw.max)}만원, 평균 ${formatNullableNumber(response.dealAmount10kKrw.average)}만원, 중간값 ${formatNullableNumber(response.dealAmount10kKrw.median)}만원`,
        `면적: 최소 ${formatNullableNumber(response.buildingAreaSquareMeter.min)}㎡, 최대 ${formatNullableNumber(response.buildingAreaSquareMeter.max)}㎡, 평균 ${formatNullableNumber(response.buildingAreaSquareMeter.average)}㎡`
    ].join("\n");
}

function formatTransactionListItem(transaction: EstateTransactionListResponse["items"][number]) {
    const buildingName = transaction.buildingName ?? "건물명 없음";
    const floor = transaction.floor === null ? "층 정보 없음" : `${transaction.floor}층`;

    return `- #${transaction.id} ${transaction.legalDongName} ${buildingName}, ${transaction.buildingUse}, ${transaction.buildingAreaSquareMeter}㎡, ${floor}, ${transaction.dealAmount10kKrw.toLocaleString("ko-KR")}만원, ${transaction.contractDate}`;
}

function formatPercent(value: number) {
    return `${(value * 100).toFixed(1)}%`;
}

function formatNullableNumber(value: number | null) {
    return value === null ? "없음" : Math.round(value).toLocaleString("ko-KR");
}
