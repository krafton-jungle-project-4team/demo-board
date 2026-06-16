import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { z } from "zod";
import { Repository } from "typeorm";
import { serverEnv } from "../../../infra/env";
import { BOARD_POST_MODERATION_STATUS_HELD, BOARD_POST_MODERATION_STATUS_VISIBLE, BoardPostEntity } from "../database";

const BOARD_MODERATION_IDLE_DELAY_MS = 20_000;
const BOARD_MODERATION_RETRY_DELAY_MS = 60_000;
const BOARD_MODERATION_BATCH_SIZE = 20;
const BOARD_MODERATION_HELD_REASON_MAX_LENGTH = 200;
const DEFAULT_HELD_REASON = "AI 모더레이션 기준에 따라 보류되었습니다.";
const SUBMIT_BOARD_POST_MODERATION_DECISION_TOOL_NAME = "submit_board_post_moderation_decision";

const BOARD_POST_MODERATION_SYSTEM_PROMPT = [
    "당신은 지역 커뮤니티 게시글 업로드 후 사후 모더레이터입니다.",
    "이미 게시된 글의 제목과 본문을 검토해 게시 유지 가능 여부를 판단하세요.",
    "욕설, 비속어, 초성 욕설, 우회 표기 욕설, 인신공격, 조롱, 혐오, 위협, 폭력, 성적 내용, 사기, 불법 행위, 명예훼손 위험, 스팸 또는 광고성 내용이 있으면 보류하세요.",
    "반드시 submit_board_post_moderation_decision 함수를 한 번 호출해 최종 판단을 제출하세요.",
    "게시 유지가 가능하면 status를 visible로, heldReason을 빈 문자열로 제출하세요.",
    "보류해야 하면 status를 held로, heldReason을 운영자가 볼 한국어 한 문장으로 짧게 제출하세요."
].join(" ");

const BoardPostModerationToolArgumentsSchema = z.object({
    postId: z.number().int().positive(),
    status: z.enum([BOARD_POST_MODERATION_STATUS_VISIBLE, BOARD_POST_MODERATION_STATUS_HELD]),
    heldReason: z.string().trim().max(BOARD_MODERATION_HELD_REASON_MAX_LENGTH)
});

type BoardPostModerationToolArguments = z.infer<typeof BoardPostModerationToolArgumentsSchema>;

type BoardPostModerationDecision =
    | {
          moderationStatus: typeof BOARD_POST_MODERATION_STATUS_VISIBLE;
          heldReason: null;
      }
    | {
          moderationStatus: typeof BOARD_POST_MODERATION_STATUS_HELD;
          heldReason: string;
      };

type BoardModerationBatchResult = {
    visibleCount: number;
    heldCount: number;
    failedCount: number;
    staleCount: number;
};

type BoardModerationRunResult = "idle" | "processed" | "retry";
type BoardPostProcessResult = "visible" | "held" | "failed" | "stale";

type OpenAiResponsesApiResponse = {
    output?: unknown;
};

type OpenAiFunctionCall = {
    name: string;
    arguments: string;
};

const boardPostModerationDecisionParameters = {
    type: "object",
    properties: {
        postId: {
            type: "integer",
            description: "평가 대상 게시글 ID입니다."
        },
        status: {
            type: "string",
            enum: [BOARD_POST_MODERATION_STATUS_VISIBLE, BOARD_POST_MODERATION_STATUS_HELD],
            description: "게시 유지가 가능하면 visible, 보류해야 하면 held입니다."
        },
        heldReason: {
            type: "string",
            description: "status가 held일 때의 짧은 한국어 사유입니다. visible이면 빈 문자열입니다."
        }
    },
    required: ["postId", "status", "heldReason"],
    additionalProperties: false
} as const;

@Injectable()
export class BoardModerationWorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(BoardModerationWorkerService.name);
    private nextRunTimer: ReturnType<typeof setTimeout> | null = null;
    private isProcessing = false;
    private isStopped = false;
    private hasWarnedMissingApiKey = false;

    constructor(@InjectRepository(BoardPostEntity) private readonly posts: Repository<BoardPostEntity>) {}

    onApplicationBootstrap() {
        this.logger.log(
            [
                "Auto-Mod worker started.",
                `idleDelayMs=${BOARD_MODERATION_IDLE_DELAY_MS}`,
                `retryDelayMs=${BOARD_MODERATION_RETRY_DELAY_MS}`,
                `batchSize=${BOARD_MODERATION_BATCH_SIZE}`
            ].join(" ")
        );
        void this.runOnceAndScheduleNext();
    }

    onApplicationShutdown() {
        this.isStopped = true;

        if (this.nextRunTimer) {
            clearTimeout(this.nextRunTimer);
            this.nextRunTimer = null;
            this.logger.log("Auto-Mod worker stopped.");
        }
    }

    private async runOnceAndScheduleNext() {
        let runResult: BoardModerationRunResult = "retry";

        try {
            runResult = await this.processPendingPosts();
        } catch (error) {
            this.logger.error("Auto-Mod worker loop failed.", error instanceof Error ? error.stack : String(error));
        }

        this.scheduleNextRun(getNextRunDelayMs(runResult));
    }

    private scheduleNextRun(delayMs: number) {
        if (this.isStopped) {
            return;
        }

        this.nextRunTimer = setTimeout(() => {
            this.nextRunTimer = null;
            void this.runOnceAndScheduleNext();
        }, delayMs);
    }

    private async processPendingPosts(): Promise<BoardModerationRunResult> {
        if (this.isProcessing) {
            return "idle";
        }

        if (!serverEnv.ai.moderation.openAiApiKey) {
            this.warnMissingApiKey();
            return "retry";
        }

        this.isProcessing = true;

        try {
            const posts = await this.findPendingPosts();

            if (posts.length === 0) {
                return "idle";
            }

            this.logger.log(`Auto-Mod processing ${posts.length} pending board posts.`);

            const batchResult = createEmptyBatchResult();

            for (const post of posts) {
                const result = await this.processPost(post);
                incrementBatchResult(batchResult, result);
            }

            this.logger.log(
                [
                    "Auto-Mod batch finished.",
                    `visible=${batchResult.visibleCount}`,
                    `held=${batchResult.heldCount}`,
                    `failed=${batchResult.failedCount}`,
                    `stale=${batchResult.staleCount}`
                ].join(" ")
            );

            if (batchResult.failedCount > 0) {
                return "retry";
            }

            if (batchResult.staleCount > 0 && batchResult.visibleCount + batchResult.heldCount === 0) {
                return "retry";
            }

            if (posts.length === BOARD_MODERATION_BATCH_SIZE) {
                return "processed";
            }

            return "idle";
        } finally {
            this.isProcessing = false;
        }
    }

    private findPendingPosts() {
        return this.posts
            .createQueryBuilder("post")
            .where("post.moderationStatus <> :heldStatus", {
                heldStatus: BOARD_POST_MODERATION_STATUS_HELD
            })
            .andWhere("post.moderationCheckedAt IS NULL")
            .orderBy("post.createdAt", "ASC")
            .addOrderBy("post.id", "ASC")
            .take(BOARD_MODERATION_BATCH_SIZE)
            .getMany();
    }

    private async processPost(post: BoardPostEntity): Promise<BoardPostProcessResult> {
        const postId = Number(post.id);

        try {
            const decision = await this.createModerationDecision(post);
            const updateResult = await this.posts
                .createQueryBuilder()
                .update(BoardPostEntity)
                .set({
                    moderationStatus: decision.moderationStatus,
                    moderationHeldReason: decision.heldReason,
                    moderationCheckedAt: new Date()
                })
                .where("id = :postId", { postId })
                .andWhere("moderation_status <> :heldStatus", {
                    heldStatus: BOARD_POST_MODERATION_STATUS_HELD
                })
                .andWhere("moderation_checked_at IS NULL")
                .execute();

            if ((updateResult.affected ?? 0) === 0) {
                return "stale";
            }

            if (decision.moderationStatus === BOARD_POST_MODERATION_STATUS_HELD) {
                this.logger.warn(`Auto-Mod held board post ${postId}: ${decision.heldReason}`);
                // TODO: 운영자 기능이 생기면 보류 게시글 보고를 연결한다.
                return "held";
            }

            return "visible";
        } catch (error) {
            this.logger.error(
                `Auto-Mod failed to review board post ${postId}.`,
                error instanceof Error ? error.stack : String(error)
            );
            return "failed";
        }
    }

    private async createModerationDecision(post: BoardPostEntity): Promise<BoardPostModerationDecision> {
        const moderationResult = await this.requestModeration(post);

        if (moderationResult.postId !== Number(post.id)) {
            throw new Error(`OpenAI moderation function call returned mismatched post ID ${moderationResult.postId}.`);
        }

        if (moderationResult.status === BOARD_POST_MODERATION_STATUS_VISIBLE) {
            return {
                moderationStatus: BOARD_POST_MODERATION_STATUS_VISIBLE,
                heldReason: null
            };
        }

        return {
            moderationStatus: BOARD_POST_MODERATION_STATUS_HELD,
            heldReason: normalizeHeldReason(moderationResult.heldReason)
        };
    }

    private async requestModeration(post: BoardPostEntity): Promise<BoardPostModerationToolArguments> {
        const moderationConfig = serverEnv.ai.moderation;
        const response = await fetch(`${moderationConfig.openAiBaseUrl}/responses`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${moderationConfig.openAiApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: moderationConfig.model,
                input: [
                    {
                        role: "system",
                        content: BOARD_POST_MODERATION_SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: createBoardPostModerationInput(post)
                    }
                ],
                tools: [
                    {
                        type: "function",
                        name: SUBMIT_BOARD_POST_MODERATION_DECISION_TOOL_NAME,
                        description: "게시글 Auto-Mod 최종 판단을 서버에 제출합니다.",
                        parameters: boardPostModerationDecisionParameters,
                        strict: true
                    }
                ],
                tool_choice: {
                    type: "function",
                    name: SUBMIT_BOARD_POST_MODERATION_DECISION_TOOL_NAME
                },
                parallel_tool_calls: false,
                max_output_tokens: 200
            })
        });

        if (!response.ok) {
            const responseBody = await response.text();
            throw new Error(
                `OpenAI moderation request failed with status ${response.status}: ${responseBody.slice(0, 500)}`
            );
        }

        const responseBody = (await response.json()) as OpenAiResponsesApiResponse;
        const functionCall = extractOpenAiFunctionCall(responseBody);

        return BoardPostModerationToolArgumentsSchema.parse(JSON.parse(functionCall.arguments));
    }

    private warnMissingApiKey() {
        if (this.hasWarnedMissingApiKey) {
            return;
        }

        this.hasWarnedMissingApiKey = true;
        this.logger.warn("Auto-Mod found pending board posts but OPENAI_API_KEY is not configured.");
    }
}

function createBoardPostModerationInput(post: BoardPostEntity) {
    return [`게시글 ID: ${Number(post.id)}`, `제목: ${post.title}`, `본문:\n${post.content}`].join("\n");
}

function getNextRunDelayMs(runResult: BoardModerationRunResult) {
    if (runResult === "processed") {
        return 0;
    }

    if (runResult === "retry") {
        return BOARD_MODERATION_RETRY_DELAY_MS;
    }

    return BOARD_MODERATION_IDLE_DELAY_MS;
}

function createEmptyBatchResult(): BoardModerationBatchResult {
    return {
        visibleCount: 0,
        heldCount: 0,
        failedCount: 0,
        staleCount: 0
    };
}

function incrementBatchResult(batchResult: BoardModerationBatchResult, result: BoardPostProcessResult) {
    if (result === "visible") {
        batchResult.visibleCount += 1;
        return;
    }

    if (result === "held") {
        batchResult.heldCount += 1;
        return;
    }

    if (result === "failed") {
        batchResult.failedCount += 1;
        return;
    }

    batchResult.staleCount += 1;
}

function normalizeHeldReason(reason: string) {
    const normalizedReason = reason.replace(/\s+/g, " ").trim();

    if (normalizedReason.length === 0) {
        return DEFAULT_HELD_REASON;
    }

    if (normalizedReason.length <= BOARD_MODERATION_HELD_REASON_MAX_LENGTH) {
        return normalizedReason;
    }

    return `${normalizedReason.slice(0, BOARD_MODERATION_HELD_REASON_MAX_LENGTH - 3)}...`;
}

function extractOpenAiFunctionCall(responseBody: OpenAiResponsesApiResponse): OpenAiFunctionCall {
    if (!Array.isArray(responseBody.output)) {
        throw new Error("OpenAI moderation response did not include output items.");
    }

    const functionCalls = responseBody.output.filter((outputItem) => {
        return (
            isRecord(outputItem) &&
            outputItem.type === "function_call" &&
            outputItem.name === SUBMIT_BOARD_POST_MODERATION_DECISION_TOOL_NAME
        );
    });

    if (functionCalls.length !== 1) {
        throw new Error(`OpenAI moderation response returned ${functionCalls.length} moderation function calls.`);
    }

    const [functionCall] = functionCalls;

    if (
        !isRecord(functionCall) ||
        typeof functionCall.name !== "string" ||
        typeof functionCall.arguments !== "string"
    ) {
        throw new Error("OpenAI moderation function call was malformed.");
    }

    return {
        name: functionCall.name,
        arguments: functionCall.arguments
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
