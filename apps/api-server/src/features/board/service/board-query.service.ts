import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { CommentListResponse, ListPostsQuery, Post, PostListResponse, PostTag } from "@nmm/shared";
import { In, Repository } from "typeorm";
import { appErrors } from "../../../app-errors";
import { CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity } from "../database";

@Injectable()
export class BoardQueryService {
    constructor(
        @InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>,
        @InjectRepository(PostTagEntity) private readonly tags: Repository<PostTagEntity>,
        @InjectRepository(PostTagLinkEntity) private readonly postTagLinks: Repository<PostTagLinkEntity>,
        @InjectRepository(CommentEntity) private readonly comments: Repository<CommentEntity>
    ) {}

    async findTags(): Promise<PostTag[]> {
        return (await this.listTags()).map((tag) => tag.toPostTag());
    }

    async findPostTags(postId: number): Promise<PostTag[]> {
        return (await this.listPostTags(postId)).map((tag) => tag.toPostTag());
    }

    async findPosts(query: ListPostsQuery): Promise<PostListResponse> {
        const filteredPosts = await this.filterPosts(await this.listPosts(), query);
        const sortedPosts = this.sortPosts(filteredPosts, query.sort);
        const totalItems = sortedPosts.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const page = Math.min(query.page, totalPages);
        const startIndex = (page - 1) * query.pageSize;
        const items = await Promise.all(
            sortedPosts
                .slice(startIndex, startIndex + query.pageSize)
                .map(async (post) => post.toPost(await this.findPostTags(post.id)))
        );

        return {
            items,
            page,
            pageSize: query.pageSize,
            totalItems,
            totalPages
        };
    }

    async findPost(id: number): Promise<Post> {
        const post = await this.findExistingPost(id);

        return post.toPost(await this.findPostTags(post.id));
    }

    async findComments(postId: number): Promise<CommentListResponse> {
        await this.findExistingPost(postId);

        return {
            items: (await this.listComments(postId)).map((comment) => comment.toComment())
        };
    }

    async findExistingPost(id: number): Promise<PostEntity> {
        const post = await this.findPostEntity(id);

        if (!post) {
            throw appErrors.boardPostNotFound();
        }

        return post;
    }

    async findExistingComment(postId: number, commentId: number): Promise<CommentEntity> {
        const comment = await this.findComment(postId, commentId);

        if (!comment) {
            throw appErrors.boardCommentNotFound();
        }

        return comment;
    }

    async listTags(): Promise<PostTagEntity[]> {
        return (await this.tags.find()).map((tag) => PostTagEntity.from(tag));
    }

    async listPostTags(postId: number): Promise<PostTagEntity[]> {
        const links = await this.postTagLinks.findBy({ postId });

        return this.findTagsByIds(links.map((link) => Number(link.tagId)));
    }

    async listPosts(): Promise<PostEntity[]> {
        return (await this.posts.find()).map((post) => PostEntity.from(post));
    }

    async findPostEntity(id: number): Promise<PostEntity | undefined> {
        const post = await this.posts.findOneBy({ id });

        return post ? PostEntity.from(post) : undefined;
    }

    async listComments(postId: number): Promise<CommentEntity[]> {
        return (await this.comments.findBy({ postId })).map((comment) => CommentEntity.from(comment));
    }

    async findComment(postId: number, commentId: number): Promise<CommentEntity | undefined> {
        return this.toOptionalCommentEntity(
            await this.comments.findOneBy({
                id: commentId,
                postId
            })
        );
    }

    async resolveTags(tagIds: number[]) {
        const uniqueTagIds = [...new Set(tagIds)];
        const tags = await this.findTagsByIds(uniqueTagIds);
        const tagById = new Map(tags.map((tag) => [tag.id, tag]));

        if (uniqueTagIds.some((tagId) => !tagById.has(tagId))) {
            throw appErrors.boardUnknownTags();
        }

        return uniqueTagIds.map((tagId) => tagById.get(tagId) as PostTagEntity);
    }

    private async filterPosts(posts: PostEntity[], query: ListPostsQuery) {
        const keyword = query.q.trim().toLowerCase();

        const postsWithTags = await Promise.all(
            posts.map(async (post) => ({
                post,
                tags: await this.listPostTags(post.id)
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

    private async findTagsByIds(ids: number[]): Promise<PostTagEntity[]> {
        if (ids.length === 0) {
            return [];
        }

        return (await this.tags.findBy({ id: In(ids) })).map((tag) => PostTagEntity.from(tag));
    }

    private toOptionalCommentEntity(comment: CommentEntity | null) {
        if (!comment) {
            return undefined;
        }

        return CommentEntity.from(comment);
    }
}
