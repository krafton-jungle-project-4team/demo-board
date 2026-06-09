import { Inject, Injectable } from "@nestjs/common";
import {
    CommentListResponseSchema,
    ListPostsQuerySchema,
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
import { BOARD_QUERY_PROVIDER, boardErrors, type BoardQueryProvider, type PostRecord } from "../domain";

@Injectable()
export class BoardQueryService {
    constructor(@Inject(BOARD_QUERY_PROVIDER) private readonly boardQueryProvider: BoardQueryProvider) {}

    async findTags(): Promise<PostTag[]> {
        return (await this.boardQueryProvider.listTags()).map((tag) => PostTagSchema.parse(tag));
    }

    async findPosts(query: unknown): Promise<PostListResponse> {
        const parsedQuery = ListPostsQuerySchema.parse(query);
        const filteredPosts = await this.filterPosts(await this.boardQueryProvider.listPosts(), parsedQuery);
        const sortedPosts = this.sortPosts(filteredPosts, parsedQuery.sort);
        const totalItems = sortedPosts.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / parsedQuery.pageSize));
        const page = Math.min(parsedQuery.page, totalPages);
        const startIndex = (page - 1) * parsedQuery.pageSize;
        const items = await Promise.all(
            sortedPosts.slice(startIndex, startIndex + parsedQuery.pageSize).map((post) => this.toPost(post))
        );

        return PostListResponseSchema.parse({
            items,
            page,
            pageSize: parsedQuery.pageSize,
            totalItems,
            totalPages
        });
    }

    async findPost(id: string): Promise<Post> {
        return this.toPost(await this.findPostRecord(id));
    }

    async findComments(postId: string): Promise<CommentListResponse> {
        await this.findPostRecord(postId);

        return CommentListResponseSchema.parse({
            items: await this.boardQueryProvider.listComments(postId)
        });
    }

    async findPostRecord(id: string) {
        const post = await this.boardQueryProvider.findPost(id);

        if (!post) {
            throw boardErrors.postNotFound();
        }

        return post;
    }

    async findCommentRecord(postId: string, commentId: string): Promise<Comment> {
        const comment = await this.boardQueryProvider.findComment(postId, commentId);

        if (!comment) {
            throw boardErrors.commentNotFound();
        }

        return comment;
    }

    async resolveTagIds(tagIds: string[]) {
        const uniqueTagIds = [...new Set(tagIds)];
        const tags = await this.boardQueryProvider.findTagsByIds(uniqueTagIds);
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
            tags: await this.boardQueryProvider.findTagsByIds(post.tagIds)
        });
    }

    private async filterPosts(posts: PostRecord[], query: ListPostsQuery) {
        const keyword = query.q.trim().toLowerCase();

        const postsWithTags = await Promise.all(
            posts.map(async (post) => ({
                post,
                tags: await this.boardQueryProvider.findTagsByIds(post.tagIds)
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
