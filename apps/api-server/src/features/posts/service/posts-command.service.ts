import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
    CreatePostRequest,
    CreatePostResponse,
    DeletePostResponse,
    UpdatePostRequest,
    UpdatePostResponse
} from "@nmm/shared";
import { Repository } from "typeorm";
import { PostEntity } from "../database";
import { createPostNotFoundError } from "../posts.errors";

@Injectable()
export class PostsCommandService {
    constructor(@InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>) {}

    async createPost(request: CreatePostRequest): Promise<CreatePostResponse> {
        const post = PostEntity.fromCreatePostRequest(request);
        const savedPost = await this.posts.save(post);

        return savedPost.toCreatePostResponse();
    }

    async updatePost(postId: number, request: UpdatePostRequest): Promise<UpdatePostResponse> {
        const post = await this.findPostOrThrow(postId);

        post.updateFromRequest(request);

        const savedPost = await this.posts.save(post);

        return savedPost.toUpdatePostResponse();
    }

    async deletePost(postId: number): Promise<DeletePostResponse> {
        const deleteResult = await this.posts.delete({
            id: postId
        });

        if (deleteResult.affected !== 1) {
            throw createPostNotFoundError();
        }

        return {
            id: postId
        };
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
