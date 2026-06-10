import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Comment, CommentListResponse, ListPostsQuery, Post, PostListResponse, PostTag } from "@nmm/shared";
import { In, Repository } from "typeorm";
import { appErrors } from "../../../app-errors";
import { ASSERT_THROW } from "../../../core/assert";
import { UserEntity } from "../../auth/database";
import { CommentEntity, PostEntity, PostTagEntity, PostTagLinkEntity } from "../database";

@Injectable()
export class BoardQueryService {
    constructor(
        @InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>,
        @InjectRepository(PostTagEntity) private readonly tags: Repository<PostTagEntity>,
        @InjectRepository(PostTagLinkEntity) private readonly postTagLinks: Repository<PostTagLinkEntity>,
        @InjectRepository(CommentEntity) private readonly comments: Repository<CommentEntity>,
        @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>
    ) {}

    async findTags(): Promise<PostTag[]> {
        const tagEntities = await this.tags.find();
        const tags = tagEntities.map((tag) => tag.toPostTag());

        return tags;
    }

    async findPosts(query: ListPostsQuery): Promise<PostListResponse> {
        const users = await this.users.find();
        const posts = await this.posts.find();
        const keyword = query.q.trim().toLowerCase();
        const postsWithTags = await Promise.all(
            posts.map(async (post) => {
                const author = users.find((user) => user.id === post.authorId);
                const authorName = author?.name.trim();
                const links = await this.postTagLinks.findBy({ postId: post.id });
                const tagIds = links.map((link) => Number(link.tagId));
                const tags = tagIds.length === 0 ? [] : await this.tags.findBy({ id: In(tagIds) });

                ASSERT_THROW(authorName, "Board author not found.");

                return {
                    post,
                    authorName,
                    tags
                };
            })
        );
        const filteredPosts = postsWithTags.filter(({ authorName, post, tags }) => {
            const searchableValues = [
                post.title,
                post.excerpt,
                post.content,
                authorName,
                ...tags.map((tag) => tag.name)
            ];
            const matchesKeyword = !keyword || searchableValues.some((value) => value.toLowerCase().includes(keyword));
            const matchesTag = !query.tagId || tags.some((tag) => Number(tag.id) === query.tagId);

            return matchesKeyword && matchesTag;
        });

        const sortedPosts = [...filteredPosts].sort((left, right) => {
            if (query.sort === "created-asc") {
                return left.post.createdAt.getTime() - right.post.createdAt.getTime();
            }

            if (query.sort === "title-asc") {
                return left.post.title.localeCompare(right.post.title);
            }

            return right.post.createdAt.getTime() - left.post.createdAt.getTime();
        });
        const totalItems = sortedPosts.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
        const page = Math.min(query.page, totalPages);
        const startIndex = (page - 1) * query.pageSize;
        const pagePosts = sortedPosts.slice(startIndex, startIndex + query.pageSize);
        const items = pagePosts.map(({ authorName, post, tags }) => {
            const responseTags = tags.map((tag) => tag.toPostTag());

            return post.toPost(responseTags, authorName);
        });

        return {
            items,
            page,
            pageSize: query.pageSize,
            totalItems,
            totalPages
        };
    }

    async findPost(id: number): Promise<Post> {
        const users = await this.users.find();
        const post = await this.posts.findOneBy({ id });

        if (!post) {
            throw appErrors.boardPostNotFound();
        }

        const author = users.find((user) => user.id === post.authorId);
        const authorName = author?.name.trim();
        const links = await this.postTagLinks.findBy({ postId: post.id });
        const tagIds = links.map((link) => Number(link.tagId));
        const tagEntities = tagIds.length === 0 ? [] : await this.tags.findBy({ id: In(tagIds) });
        const tags = tagEntities.map((tag) => tag.toPostTag());

        ASSERT_THROW(authorName, "Board author not found.");

        return post.toPost(tags, authorName);
    }

    async findComment(postId: number, commentId: number): Promise<Comment> {
        const users = await this.users.find();
        const post = await this.posts.findOneBy({ id: postId });

        if (!post) {
            throw appErrors.boardPostNotFound();
        }

        const comment = await this.comments.findOneBy({
            id: commentId,
            postId
        });

        if (!comment) {
            throw appErrors.boardCommentNotFound();
        }

        const author = users.find((user) => user.id === comment.authorId);
        const authorName = author?.name.trim();

        ASSERT_THROW(authorName, "Board comment author not found.");

        return comment.toComment(authorName);
    }

    async findComments(postId: number): Promise<CommentListResponse> {
        const users = await this.users.find();
        const post = await this.posts.findOneBy({ id: postId });

        if (!post) {
            throw appErrors.boardPostNotFound();
        }

        const comments = await this.comments.findBy({ postId });
        const items = comments.map((comment) => {
            const author = users.find((user) => user.id === comment.authorId);
            const authorName = author?.name.trim();

            ASSERT_THROW(authorName, "Board comment author not found.");

            return comment.toComment(authorName);
        });

        return { items };
    }
}
