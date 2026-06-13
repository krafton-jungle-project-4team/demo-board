import { z } from "zod";

//댓글 요청 검증규칙 스키마를 생성해서 변수 삽입, 스키마란?:데이터 형식이 맞는지 검사해주는놈
export const CreateCommentRequestSchema = z.object({
    content: z.string().trim().min(1).max(300) //content는 문자열이고, 앞 뒤 공백 제거하고, 1~300글자여야함.
});

//type of로 CCRS의 타입 가져옴. CCRS는 현재 그냥 스키마 값이니까. 그후 z.infet로 스키마 타입 추론함.
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

export const UpdateCommentRequestSchema = z.object({
    content: z.string().trim().min(1).max(300)
});

export type UpdateCommentRequest = z.infer<typeof UpdateCommentRequestSchema>;

//댓글 목록 조회 검증 스키마, coerce:강제 변환
export const CommentListQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(50).default(20)
});

export type CommentListQuery = z.infer<typeof CommentListQuerySchema>;

//작성자 정보 스키마
export const CommentAuthorSchema = z.object({
    id: z.number().int().positive(),
    nickname: z.string().min(1)
});

export type CommentAuthor = z.infer<typeof CommentAuthorSchema>;

//대댓글 모양 검사
export const CommentReplyResponseSchema = z.object({
    id: z.number().int().positive(),
    postId: z.number().int().positive(),
    parentCommentId: z.number().int().positive(),
    author: CommentAuthorSchema,
    content: z.string().min(1),
    depth: z.literal(1), //대댓글 1개까지만 허용
    isDeleted: z.boolean(),
    createdAt: z.iso.datetime(), //iso:날짜/시간 문자열인지 체크
    updatedAt: z.iso.datetime()
});

export type CommentReplyResponse = z.infer<typeof CommentReplyResponseSchema>;

//일반댓글 모양 스키마
export const CommentResponseSchema = z.object({
    id: z.number().int().positive(),
    postId: z.number().int().positive(),
    parentCommentId: z.null(),
    author: CommentAuthorSchema,
    content: z.string().min(1),
    depth: z.literal(0),
    isDeleted: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    replies: z.array(CommentReplyResponseSchema) //대댓글 형식 검사
});

export type CommentResponse = z.infer<typeof CommentResponseSchema>;

//전체 응답을 체크하는 스키마
export const CommentPageInfoSchema = z.object({
    //페이지 정보
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalCount: z.number().int().min(0),
    totalPages: z.number().int().min(0)
});

export const CommentListResponseSchema = z.object({
    //댓글 목록들
    items: z.array(CommentResponseSchema),
    pageInfo: CommentPageInfoSchema
});

export type CommentPageInfo = z.infer<typeof CommentPageInfoSchema>;
export type CommentListResponse = z.infer<typeof CommentListResponseSchema>;

//댓글 변경(C UD) 후 응답 모양 체크
export const CommentCommandResponseSchema = z.object({
    id: z.number().int().positive()
});

export type CommentCommandResponse = z.infer<typeof CommentCommandResponseSchema>;
