import { Inject, Injectable } from "@nestjs/common";
import {
    CommentListResponseSchema,
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
import { BOARD_REPOSITORY, boardErrors, type BoardRepository } from "../domain";

@Injectable()
export class BoardQueryService {
    constructor(@Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository) {}

    async findTags(): Promise<PostTag[]> {
        return (await this.boardRepository.listTags()).map((tag) => PostTagSchema.parse(tag));
    }

    async findPosts(query: ListPostsQuery): Promise<PostListResponse> {
        const filteredPosts = this.filterPosts(await this.boardRepository.listPosts(), query);
        const sortedPosts = this.sortPosts(filteredPosts, query.sort);
        const totalItems = sortedPosts.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const page = Math.min(query.page, totalPages);
        const startIndex = (page - 1) * query.pageSize;
        const items = sortedPosts.slice(startIndex, startIndex + query.pageSize);

        return PostListResponseSchema.parse({
            items,
            page,
            pageSize: query.pageSize,
            totalItems,
            totalPages
        });
    }

    async findPost(id: number): Promise<Post> {
        return PostSchema.parse(await this.findExistingPost(id));
    }

    async findComments(postId: number): Promise<CommentListResponse> {
        await this.findExistingPost(postId);

        return CommentListResponseSchema.parse({
            items: await this.boardRepository.listComments(postId)
        });
    }

    async findExistingPost(id: number) {
        const post = await this.boardRepository.findPost(id);

        if (!post) {
            throw boardErrors.postNotFound();
        }

        return post;
    }

    async findExistingComment(postId: number, commentId: number): Promise<Comment> {
        const comment = await this.boardRepository.findComment(postId, commentId);

        if (!comment) {
            throw boardErrors.commentNotFound();
        }

        return comment;
    }

    private filterPosts(posts: Post[], query: ListPostsQuery) {
        const keyword = query.q.trim().toLowerCase();

        return posts.filter((post) => {
            const matchesKeyword =
                !keyword ||
                [post.title, post.excerpt, post.content, post.authorName, ...post.tags.map((tag) => tag.name)].some(
                    (value) => value.toLowerCase().includes(keyword)
                );
            const matchesTag = !query.tagId || post.tags.some((tag) => tag.id === query.tagId);

            return matchesKeyword && matchesTag;
        });
    }

    private sortPosts(posts: Post[], sort: ListPostsQuery["sort"]) {
        return [...posts].sort((left, right) => {
            if (sort === "created-asc") {
                return left.createdAt.localeCompare(right.createdAt);
            }

            if (sort === "title-asc") {
                return left.title.localeCompare(right.title);
            }

            return right.createdAt.localeCompare(left.createdAt);
        });
    }
}
