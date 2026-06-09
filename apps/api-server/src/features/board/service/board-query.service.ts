import { Inject, Injectable } from "@nestjs/common";
import {
    CommentListResponseSchema,
    CommentSchema,
    PostListResponseSchema,
    PostSchema,
    PostTagSchema,
    type Comment,
    type CommentListResponse,
    type ListPostsQuery,
    type Post,
    type PostListResponse,
    type PostTag
} from "@nmm/shared";
import {
    BOARD_REPOSITORY,
    boardErrors,
    type BoardRepository,
    type CommentEntity,
    type PostEntity,
    type PostTagEntity
} from "../domain";

@Injectable()
export class BoardQueryService {
    constructor(@Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository) {}

    async findTags(): Promise<PostTag[]> {
        return (await this.boardRepository.listTags()).map((tag) => this.toPostTag(tag));
    }

    async findPosts(query: ListPostsQuery): Promise<PostListResponse> {
        const filteredPosts = await this.filterPosts(await this.boardRepository.listPosts(), query);
        const sortedPosts = this.sortPosts(filteredPosts, query.sort);
        const totalItems = sortedPosts.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const page = Math.min(query.page, totalPages);
        const startIndex = (page - 1) * query.pageSize;
        const items = await Promise.all(
            sortedPosts.slice(startIndex, startIndex + query.pageSize).map((post) => this.toPost(post))
        );

        return PostListResponseSchema.parse({
            items,
            page,
            pageSize: query.pageSize,
            totalItems,
            totalPages
        });
    }

    async findPost(id: number): Promise<Post> {
        return this.toPost(await this.findExistingPost(id));
    }

    async findComments(postId: number): Promise<CommentListResponse> {
        await this.findExistingPost(postId);

        return CommentListResponseSchema.parse({
            items: (await this.boardRepository.listComments(postId)).map((comment) => this.toComment(comment))
        });
    }

    async findExistingPost(id: number): Promise<PostEntity> {
        const post = await this.boardRepository.findPost(id);

        if (!post) {
            throw boardErrors.postNotFound();
        }

        return post;
    }

    async findExistingComment(postId: number, commentId: number): Promise<CommentEntity> {
        const comment = await this.boardRepository.findComment(postId, commentId);

        if (!comment) {
            throw boardErrors.commentNotFound();
        }

        return comment;
    }

    async toPost(post: PostEntity): Promise<Post> {
        return PostSchema.parse({
            id: Number(post.id),
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            authorId: post.authorId,
            authorName: post.authorName,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            tags: (await this.boardRepository.listPostTags(post.id)).map((tag) => this.toPostTag(tag))
        });
    }

    toComment(comment: CommentEntity): Comment {
        return CommentSchema.parse({
            id: Number(comment.id),
            postId: Number(comment.postId),
            content: comment.content,
            authorId: comment.authorId,
            authorName: comment.authorName,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        });
    }

    private toPostTag(tag: PostTagEntity): PostTag {
        return PostTagSchema.parse({
            id: Number(tag.id),
            name: tag.name
        });
    }

    private async filterPosts(posts: PostEntity[], query: ListPostsQuery) {
        const keyword = query.q.trim().toLowerCase();

        const postsWithTags = await Promise.all(
            posts.map(async (post) => ({
                post,
                tags: await this.boardRepository.listPostTags(post.id)
            }))
        );

        return postsWithTags
            .filter(({ post, tags }) => {
                const matchesKeyword =
                    !keyword ||
                    [post.title, post.excerpt, post.content, post.authorName, ...tags.map((tag) => tag.name)].some(
                        (value) => value.toLowerCase().includes(keyword)
                    );
                const matchesTag = !query.tagId || tags.some((tag) => Number(tag.id) === query.tagId);

                return matchesKeyword && matchesTag;
            })
            .map(({ post }) => post);
    }

    private sortPosts(posts: PostEntity[], sort: ListPostsQuery["sort"]) {
        return [...posts].sort((left, right) => {
            if (sort === "created-asc") {
                return left.createdAt.getTime() - right.createdAt.getTime();
            }

            if (sort === "title-asc") {
                return left.title.localeCompare(right.title);
            }

            return right.createdAt.getTime() - left.createdAt.getTime();
        });
    }
}
