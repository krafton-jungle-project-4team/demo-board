import type { EstateTransactionListResponse } from "@nmm/shared";

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

function formatTransactionListItem(transaction: EstateTransactionListResponse["items"][number]) {
    const buildingName = transaction.buildingName ?? "건물명 없음";
    const floor = transaction.floor === null ? "층 정보 없음" : `${transaction.floor}층`;

    return `- #${transaction.id} ${transaction.legalDongName} ${buildingName}, ${transaction.buildingUse}, ${transaction.buildingAreaSquareMeter}㎡, ${floor}, ${transaction.dealAmount10kKrw.toLocaleString("ko-KR")}만원, ${transaction.contractDate}`;
}
