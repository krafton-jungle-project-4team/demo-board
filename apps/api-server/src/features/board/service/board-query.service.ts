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
import { BOARD_REPOSITORY, boardErrors, type BoardRepository, type PostRecord } from "../domain";

@Injectable()
export class BoardQueryService {
    constructor(@Inject(BOARD_REPOSITORY) private readonly boardRepository: BoardRepository) {}

    async findTags(): Promise<PostTag[]> {
        return (await this.boardRepository.listTags()).map((tag) => PostTagSchema.parse(tag));
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
        return this.toPost(await this.findPostRecord(id));
    }

    async findComments(postId: number): Promise<CommentListResponse> {
        await this.findPostRecord(postId);

        return CommentListResponseSchema.parse({
            items: await this.boardRepository.listComments(postId)
        });
    }

    async findPostRecord(id: number) {
        const post = await this.boardRepository.findPost(id);

        if (!post) {
            throw boardErrors.postNotFound();
        }

        return post;
    }

    async findCommentRecord(postId: number, commentId: number): Promise<Comment> {
        const comment = await this.boardRepository.findComment(postId, commentId);

        if (!comment) {
            throw boardErrors.commentNotFound();
        }

        return comment;
    }

    async resolveTagIds(tagIds: number[]) {
        const uniqueTagIds = [...new Set(tagIds)];
        const tags = await this.boardRepository.findTagsByIds(uniqueTagIds);
        const knownTagIds = new Set(tags.map((tag) => tag.id));
        const unknownTagIds = uniqueTagIds.filter((tagId) => !knownTagIds.has(tagId));

        if (unknownTagIds.length > 0) {
            throw boardErrors.unknownTags();
        }

        return uniqueTagIds;
    }

    async toPost(post: PostRecord): Promise<Post> {
        return PostSchema.parse({
            id: post.id,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            authorId: post.authorId,
            authorName: post.authorName,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            tags: await this.boardRepository.findTagsByIds(post.tagIds)
        });
    }

    private async filterPosts(posts: PostRecord[], query: ListPostsQuery) {
        const keyword = query.q.trim().toLowerCase();

        const postsWithTags = await Promise.all(
            posts.map(async (post) => ({
                post,
                tags: await this.boardRepository.findTagsByIds(post.tagIds)
            }))
        );

        return postsWithTags
            .filter(({ post, tags }) => {
                const matchesKeyword =
                    !keyword ||
                    [post.title, post.excerpt, post.content, post.authorName, ...tags.map((tag) => tag.name)].some(
                        (value) => value.toLowerCase().includes(keyword)
                    );
                const matchesTag = !query.tagId || post.tagIds.includes(query.tagId);

                return matchesKeyword && matchesTag;
            })
            .map(({ post }) => post);
    }

    private sortPosts(posts: PostRecord[], sort: ListPostsQuery["sort"]) {
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
