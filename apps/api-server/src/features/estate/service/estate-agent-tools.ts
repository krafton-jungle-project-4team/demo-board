export type AgentToolName =
    | "search_estate_transactions"
    | "open_recommendation_detail"
    | "explain_recommendation"
    | "compare_recommendations";

export type AgentToolDefinition = {
    name: AgentToolName;
    description: string;
    examples: string[];
};

export type AgentToolEmbedding = AgentToolDefinition & {
    embedding: number[];
};

export const AGENT_TOOL_DEFINITIONS: AgentToolDefinition[] = [
    {
        name: "search_estate_transactions",
        description:
            "사용자가 실거래, 매물, 건물명, 법정동, 가격, 면적, 건물 용도 조건으로 후보를 찾아달라고 요청할 때 실행한다.",
        examples: [
            "거여동 오피스텔 찾아줘",
            "잠실동 오피스텔 찾아줘",
            "잠실동 10억 이하 20평대 아파트 추천해줘",
            "헬리오시티 실거래 검색해줘"
        ]
    },
    {
        name: "open_recommendation_detail",
        description: "최근 추천 후보 중 특정 번호의 상세페이지로 이동하거나 열어달라고 요청할 때 실행한다.",
        examples: ["2번 상세 보여줘", "1번 페이지로 이동해줘", "3번 열어줘"]
    },
    {
        name: "explain_recommendation",
        description: "최근 추천 후보 중 특정 번호가 왜 추천됐는지, 추천 근거를 설명해달라고 요청할 때 실행한다.",
        examples: ["4번 왜 추천했어?", "1번 추천 이유 알려줘", "2번 근거 설명해줘"]
    },
    {
        name: "compare_recommendations",
        description: "최근 추천 후보 중 두 번호의 가격, 면적, 연식, 층, 추천도를 비교해달라고 요청할 때 실행한다.",
        examples: ["1번 2번 비교해줘", "2번이랑 5번 차이 알려줘", "3번 4번 중 뭐가 나아?"]
    }
];

export function createToolEmbeddingInput(tool: AgentToolDefinition) {
    return [`도구명: ${tool.name}`, `역할: ${tool.description}`, "예시:", ...tool.examples].join("\n");
}
