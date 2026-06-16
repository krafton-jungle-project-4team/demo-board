import { Injectable } from "@nestjs/common";
import {
    BoardCommentListResponseSchema,
    BoardCommentReplyResponseSchema,
    BoardCommentResponseSchema,
    BoardPostDetailResponseSchema,
    BoardPostListItemSchema,
    BoardPostListResponseSchema,
    BoardTagListResponseSchema,
    type BoardCommentListQuery,
    type BoardCommentListResponse,
    type BoardCommentReplyResponse,
    type BoardCommentResponse,
    type BoardPostDetailResponse,
    type BoardPostListQuery,
    type BoardPostListResponse,
    type BoardTagResponse
} from "@nmm/shared";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { BoardTagEntity } from "../database";
import { BOARD_ERRORS, createBoardError } from "../board.errors";

const BOARD_POST_EXCERPT_LENGTH = 160;
const DELETED_COMMENT_CONTENT = "삭제된 댓글입니다.";

type BoardTagJson = {
    id: number | string;
    name: string;
};

type BoardPostListRow = {
    id: string;
    dong_code: string | null;
    dong_name: string | null;
    title: string;
    content: string;
    tags: BoardTagJson[] | null;
    author_id: string;
    author_name: string;
    author_email: string;
    author_residence_dong_code: string | null;
    author_residence_dong_name: string | null;
    created_at: Date | string;
    updated_at: Date | string;
};

type BoardPostDetailRow = BoardPostListRow;

type BoardPostCountRow = {
    total_count: string;
};

type BoardCommentRow = {
    id: string;
    post_id: string;
    parent_comment_id: string | null;
    author_id: string;
    author_name: string;
    author_email: string;
    author_residence_dong_code: string | null;
    author_residence_dong_name: string | null;
    content: string;
    depth: number;
    deleted_at: Date | string | null;
    created_at: Date | string;
    updated_at: Date | string;
};

type BoardCommentCountRow = {
    total_count: string;
};

const boardTagCteSql = `
WITH board_post_tag_names AS (
    SELECT
        board_post_tags.post_id,
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object('id', board_tags.id, 'name', board_tags.name)
            ) FILTER (WHERE board_tags.id IS NOT NULL),
            '[]'::jsonb
        ) AS tags,
        COALESCE(string_agg(DISTINCT board_tags.name, ' '), '') AS tag_text
    FROM board_post_tags
    JOIN board_tags
        ON board_tags.id = board_post_tags.tag_id
    GROUP BY board_post_tags.post_id
)
`;

const boardPostSearchConditionSql = `
(
    $1::text IS NULL
    OR (
        $2::text = 'title'
        AND (board_posts.title % $1 OR board_posts.title %> $1)
    )
    OR (
        $2::text = 'content'
        AND (board_posts.content % $1 OR board_posts.content %> $1)
    )
    OR (
        $2::text = 'tag'
        AND (
            COALESCE(board_post_tag_names.tag_text, '') % $1
            OR COALESCE(board_post_tag_names.tag_text, '') %> $1
        )
    )
    OR (
        $2::text = 'titleContent'
        AND (
            board_posts.title % $1
            OR board_posts.title %> $1
            OR board_posts.content % $1
            OR board_posts.content %> $1
        )
    )
)
`;

const boardPostListWhereSql = `
WHERE ($3::text IS NULL OR board_posts.dong_code = $3::text)
    AND ${boardPostSearchConditionSql}
`;

@Injectable()
export class BoardQueryService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(BoardTagEntity) private readonly tags: Repository<BoardTagEntity>
    ) {}

    async getPostList(query: BoardPostListQuery): Promise<BoardPostListResponse> {
        const offset = (query.page - 1) * query.pageSize;
        const keyword = query.q ?? null;
        const dongCode = query.dongCode ?? null;
        const [countRows, rows] = await Promise.all([
            this.dataSource.query(this.createPostListCountSql(), [keyword, query.searchScope, dongCode]) as Promise<
                BoardPostCountRow[]
            >,
            this.dataSource.query(this.createPostListSql(), [
                keyword,
                query.searchScope,
                dongCode,
                query.pageSize,
                offset
            ]) as Promise<BoardPostListRow[]>
        ]);
        const totalItems = Number(countRows[0]?.total_count ?? 0);
        const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);

        return BoardPostListResponseSchema.parse({
            items: rows.map(toBoardPostListItem),
            page: query.page,
            pageSize: query.pageSize,
            totalItems,
            totalPages,
            hasPreviousPage: query.page > 1,
            hasNextPage: totalPages > query.page
        });
    }

    async getPost(postId: number): Promise<BoardPostDetailResponse> {
        const rows = (await this.dataSource.query(this.createPostDetailSql(), [postId])) as BoardPostDetailRow[];
        const row = rows[0];

        if (!row) {
            throw createBoardError(BOARD_ERRORS.POST_NOT_FOUND);
        }

        return BoardPostDetailResponseSchema.parse({
            id: Number(row.id),
            dongCode: row.dong_code,
            dongName: row.dong_name,
            title: row.title,
            content: row.content,
            tags: parseBoardTags(row.tags),
            author: toBoardAuthor(row),
            createdAt: toIsoString(row.created_at),
            updatedAt: toIsoString(row.updated_at)
        });
    }

    async getTags(): Promise<BoardTagResponse[]> {
        const tags = await this.tags.find({
            order: {
                normalizedName: "ASC",
                id: "ASC"
            }
        });

        return BoardTagListResponseSchema.parse(tags.map((tag) => tag.toBoardTagResponse()));
    }

    async getComments(postId: number, query: BoardCommentListQuery): Promise<BoardCommentListResponse> {
        await this.assertPostExists(postId);

        const offset = (query.page - 1) * query.pageSize;
        const [countRows, parentRows] = await Promise.all([
            this.dataSource.query(
                `
                SELECT COUNT(*)::text AS total_count
                FROM board_comments
                WHERE post_id = $1
                    AND parent_comment_id IS NULL
                `,
                [postId]
            ) as Promise<BoardCommentCountRow[]>,
            this.dataSource.query(
                `
                SELECT ${this.boardCommentSelectSql()}
                FROM board_comments
                JOIN auth_users ON auth_users.id = board_comments.author_id
                LEFT JOIN board_songpa_dongs author_dongs
                    ON author_dongs.code = auth_users.residence_dong_code
                WHERE board_comments.post_id = $1
                    AND board_comments.parent_comment_id IS NULL
                ORDER BY board_comments.created_at ASC, board_comments.id ASC
                LIMIT $2
                OFFSET $3
                `,
                [postId, query.pageSize, offset]
            ) as Promise<BoardCommentRow[]>
        ]);
        const parentCommentIds = parentRows.map((row) => Number(row.id));
        const repliesByParentId = await this.getRepliesByParentId(parentCommentIds);
        const totalCount = Number(countRows[0]?.total_count ?? 0);

        return BoardCommentListResponseSchema.parse({
            items: parentRows.map((row) => toBoardCommentResponse(row, repliesByParentId.get(Number(row.id)) ?? [])),
            pageInfo: {
                page: query.page,
                pageSize: query.pageSize,
                totalCount,
                totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / query.pageSize)
            }
        });
    }

    private async assertPostExists(postId: number) {
        const rows = (await this.dataSource.query("SELECT 1 FROM board_posts WHERE id = $1", [postId])) as unknown[];

        if (rows.length === 0) {
            throw createBoardError(BOARD_ERRORS.POST_NOT_FOUND);
        }
    }

    private async getRepliesByParentId(parentCommentIds: number[]) {
        if (parentCommentIds.length === 0) {
            return new Map<number, BoardCommentReplyResponse[]>();
        }

        const rows = (await this.dataSource.query(
            `
            SELECT ${this.boardCommentSelectSql()}
            FROM board_comments
            JOIN auth_users ON auth_users.id = board_comments.author_id
            LEFT JOIN board_songpa_dongs author_dongs
                ON author_dongs.code = auth_users.residence_dong_code
            WHERE board_comments.parent_comment_id = ANY($1::bigint[])
            ORDER BY board_comments.created_at ASC, board_comments.id ASC
            `,
            [parentCommentIds]
        )) as BoardCommentRow[];

        return rows.reduce((repliesByParentId, row) => {
            if (row.parent_comment_id === null) {
                return repliesByParentId;
            }

            const parentCommentId = Number(row.parent_comment_id);
            const replies = repliesByParentId.get(parentCommentId) ?? [];
            replies.push(toBoardCommentReplyResponse(row));
            repliesByParentId.set(parentCommentId, replies);

            return repliesByParentId;
        }, new Map<number, BoardCommentReplyResponse[]>());
    }

    private boardCommentSelectSql() {
        return `
            board_comments.id::text AS id,
            board_comments.post_id::text AS post_id,
            board_comments.parent_comment_id::text AS parent_comment_id,
            board_comments.content,
            board_comments.depth,
            board_comments.deleted_at,
            board_comments.created_at,
            board_comments.updated_at,
            auth_users.id::text AS author_id,
            auth_users.name AS author_name,
            auth_users.email AS author_email,
            auth_users.residence_dong_code AS author_residence_dong_code,
            author_dongs.name AS author_residence_dong_name
        `;
    }

    private createPostListCountSql() {
        return `
        ${boardTagCteSql}
        SELECT COUNT(*)::text AS total_count
        FROM board_posts
        LEFT JOIN board_post_tag_names
            ON board_post_tag_names.post_id = board_posts.id
        ${boardPostListWhereSql}
        `;
    }

    private createPostListSql() {
        return `
        ${boardTagCteSql}
        SELECT
            board_posts.id::text AS id,
            board_posts.dong_code,
            board_dongs.name AS dong_name,
            board_posts.title,
            board_posts.content,
            COALESCE(board_post_tag_names.tags, '[]'::jsonb) AS tags,
            auth_users.id::text AS author_id,
            auth_users.name AS author_name,
            auth_users.email AS author_email,
            auth_users.residence_dong_code AS author_residence_dong_code,
            author_dongs.name AS author_residence_dong_name,
            board_posts.created_at,
            board_posts.updated_at,
            CASE
                WHEN $1::text IS NULL THEN 0
                WHEN $2::text = 'title' THEN GREATEST(
                    similarity(board_posts.title, $1),
                    word_similarity($1, board_posts.title)
                )
                WHEN $2::text = 'content' THEN GREATEST(
                    similarity(board_posts.content, $1),
                    word_similarity($1, board_posts.content)
                )
                WHEN $2::text = 'tag' THEN GREATEST(
                    similarity(COALESCE(board_post_tag_names.tag_text, ''), $1),
                    word_similarity($1, COALESCE(board_post_tag_names.tag_text, ''))
                )
                WHEN $2::text = 'titleContent' THEN GREATEST(
                    similarity(board_posts.title, $1),
                    word_similarity($1, board_posts.title),
                    similarity(board_posts.content, $1),
                    word_similarity($1, board_posts.content)
                )
                ELSE 0
            END AS search_rank
        FROM board_posts
        JOIN auth_users ON auth_users.id = board_posts.author_id
        LEFT JOIN board_songpa_dongs board_dongs
            ON board_dongs.code = board_posts.dong_code
        LEFT JOIN board_songpa_dongs author_dongs
            ON author_dongs.code = auth_users.residence_dong_code
        LEFT JOIN board_post_tag_names
            ON board_post_tag_names.post_id = board_posts.id
        ${boardPostListWhereSql}
        ORDER BY
            search_rank DESC,
            board_posts.created_at DESC,
            board_posts.id DESC
        LIMIT $4
        OFFSET $5
        `;
    }

    private createPostDetailSql() {
        return `
        ${boardTagCteSql}
        SELECT
            board_posts.id::text AS id,
            board_posts.dong_code,
            board_dongs.name AS dong_name,
            board_posts.title,
            board_posts.content,
            COALESCE(board_post_tag_names.tags, '[]'::jsonb) AS tags,
            auth_users.id::text AS author_id,
            auth_users.name AS author_name,
            auth_users.email AS author_email,
            auth_users.residence_dong_code AS author_residence_dong_code,
            author_dongs.name AS author_residence_dong_name,
            board_posts.created_at,
            board_posts.updated_at
        FROM board_posts
        JOIN auth_users ON auth_users.id = board_posts.author_id
        LEFT JOIN board_songpa_dongs board_dongs
            ON board_dongs.code = board_posts.dong_code
        LEFT JOIN board_songpa_dongs author_dongs
            ON author_dongs.code = auth_users.residence_dong_code
        LEFT JOIN board_post_tag_names
            ON board_post_tag_names.post_id = board_posts.id
        WHERE board_posts.id = $1
        `;
    }
}

function toBoardPostListItem(row: BoardPostListRow) {
    return BoardPostListItemSchema.parse({
        id: Number(row.id),
        dongCode: row.dong_code,
        dongName: row.dong_name,
        title: row.title,
        excerpt: createExcerpt(row.content),
        tags: parseBoardTags(row.tags),
        author: toBoardAuthor(row),
        createdAt: toIsoString(row.created_at),
        updatedAt: toIsoString(row.updated_at)
    });
}

function toBoardCommentResponse(row: BoardCommentRow, replies: BoardCommentReplyResponse[]): BoardCommentResponse {
    return BoardCommentResponseSchema.parse({
        id: Number(row.id),
        postId: Number(row.post_id),
        parentCommentId: null,
        author: toBoardAuthor(row),
        content: row.deleted_at ? DELETED_COMMENT_CONTENT : row.content,
        depth: 0,
        isDeleted: row.deleted_at !== null,
        createdAt: toIsoString(row.created_at),
        updatedAt: toIsoString(row.updated_at),
        replies
    });
}

function toBoardCommentReplyResponse(row: BoardCommentRow): BoardCommentReplyResponse {
    return BoardCommentReplyResponseSchema.parse({
        id: Number(row.id),
        postId: Number(row.post_id),
        parentCommentId: Number(row.parent_comment_id),
        author: toBoardAuthor(row),
        content: row.deleted_at ? DELETED_COMMENT_CONTENT : row.content,
        depth: 1,
        isDeleted: row.deleted_at !== null,
        createdAt: toIsoString(row.created_at),
        updatedAt: toIsoString(row.updated_at)
    });
}

function toBoardAuthor(row: {
    author_id: string;
    author_name: string;
    author_email: string;
    author_residence_dong_code?: string | null;
    author_residence_dong_name?: string | null;
}) {
    return {
        id: Number(row.author_id),
        name: row.author_name,
        email: row.author_email,
        residenceDongCode: row.author_residence_dong_code ?? null,
        residenceDongName: row.author_residence_dong_name ?? null
    };
}

function parseBoardTags(tags: BoardTagJson[] | string | null): BoardTagResponse[] {
    if (!tags) {
        return [];
    }

    const parsedTags = typeof tags === "string" ? (JSON.parse(tags) as BoardTagJson[]) : tags;

    return BoardTagListResponseSchema.parse(
        parsedTags.map((tag) => ({
            id: Number(tag.id),
            name: tag.name
        }))
    );
}

function createExcerpt(content: string) {
    const normalizedContent = content.replace(/\s+/g, " ").trim();

    if (normalizedContent.length <= BOARD_POST_EXCERPT_LENGTH) {
        return normalizedContent;
    }

    return `${normalizedContent.slice(0, BOARD_POST_EXCERPT_LENGTH)}...`;
}

function toIsoString(value: Date | string) {
    if (value instanceof Date) {
        return value.toISOString();
    }

    return new Date(value).toISOString();
}
