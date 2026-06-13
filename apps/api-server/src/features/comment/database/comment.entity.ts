import type { CommentReplyResponse, CommentResponse } from "@nmm/shared";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("comments")
export class CommentEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    postId!: number;

    @Column({ type: "int" })
    authorId!: number;

    @Column({ type: "varchar", length: 50 }) 
    authorNickname!: string;

    @Column({ type: "int", nullable: true })
    parentCommentId!: number | null;

    @Column({ type: "int" })
    depth!: 0 | 1;

    @Column({ type: "text" })
    content!: string;

    @DeleteDateColumn()
    deletedAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    //엔티티를 API에서 응답 받을 수 있게 변환하는코드. 이거네
    toReplyResponse(): CommentReplyResponse {
        return {
            id: this.id,
            postId: this.postId,
            parentCommentId: this.parentCommentId ?? 0,
            author: {
                id: this.authorId,
                nickname: this.authorNickname
            },
            content: this.deletedAt ? "삭제된 댓글입니다." : this.content,
            depth: 1,
            isDeleted: this.deletedAt !== null,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    toCommentResponse(replies: CommentReplyResponse[]): CommentResponse {
        return {
            id: this.id,
            postId: this.postId,
            parentCommentId: null,
            author: {
                id: this.authorId,
                nickname: this.authorNickname
            },
            content: this.deletedAt ? "삭제된 댓글입니다." : this.content,
            depth: 0,
            isDeleted: this.deletedAt !== null,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            replies
        };
    }
}