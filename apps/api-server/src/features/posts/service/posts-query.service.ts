import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { PostDetailResponse, PostListResponse } from "@nmm/shared";
import { Repository } from "typeorm";
import { PostEntity } from "../database";
import { createPostNotFoundError } from "../posts.errors";

@Injectable()
export class PostsQueryService {
    constructor(@InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>) {}

    async getPosts(): Promise<PostListResponse> {
        const posts = await this.posts.find({
            order: {
                id: "DESC"
            }
        });
        const postItems = posts.map((post) => post.toPost());

        return {
            posts: postItems
        };
    }

    async getPost(postId: number): Promise<PostDetailResponse> {
        const post = await this.findPostOrThrow(postId);
        const postDetail = post.toPost();

        return postDetail;
    }

    private async findPostOrThrow(postId: number) {
        const post = await this.posts.findOne({
            where: {
                id: postId
            }
        });

        if (!post) {
            throw createPostNotFoundError();
        }

        return post;
    }
}
