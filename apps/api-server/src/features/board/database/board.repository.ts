import { Injectable } from "@nestjs/common";
import type { Comment, Post, PostTag } from "@nmm/shared";

export type PostRecord = Omit<Post, "tags"> & {
  tagIds: string[];
};

@Injectable()
export class BoardRepository {
  private nextPostNumber = 4;
  private nextCommentNumber = 2;
  private readonly tags: PostTag[] = [
    { id: "tag-react", name: "react" },
    { id: "tag-nest", name: "nest" },
    { id: "tag-boilerplate", name: "boilerplate" }
  ];
  private readonly posts: PostRecord[] = [
    {
      id: "post-1",
      title: "프론트 공통 스택 결정",
      excerpt: "라우터, 서버 상태, URL 상태를 분리해 보일러플레이트의 기준을 잡는다.",
      content: "TanStack Router, TanStack Query, nuqs, shadcn/ui를 연결해 게시판 CRUD 화면의 개발 출발점을 만든다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:00:00.000Z",
      updatedAt: "2026-06-09T00:00:00.000Z",
      tagIds: ["tag-react", "tag-boilerplate"]
    },
    {
      id: "post-2",
      title: "OpenAPI codegen 연결",
      excerpt: "Nest 더미 API에서 spec을 만들고 Orval로 fetch 함수를 생성한다.",
      content: "OpenAPI spec을 생성해 frontend가 API 타입과 호출 함수를 반복 작성하지 않게 한다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:10:00.000Z",
      updatedAt: "2026-06-09T00:10:00.000Z",
      tagIds: ["tag-nest", "tag-boilerplate"]
    },
    {
      id: "post-3",
      title: "URL 상태 규칙",
      excerpt: "검색어, 페이지, 정렬, 보기 방식은 공유 가능한 URL 상태로 둔다.",
      content: "draft, token, PII, 대용량 데이터, 휘발성 UI 상태는 URL에 넣지 않는다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:20:00.000Z",
      updatedAt: "2026-06-09T00:20:00.000Z",
      tagIds: ["tag-boilerplate"]
    }
  ];
  private readonly comments: Comment[] = [
    {
      id: "comment-1",
      postId: "post-1",
      content: "보일러플레이트 기준을 확인하기 위한 댓글 예시입니다.",
      authorId: "user-sijun",
      authorName: "sijun",
      createdAt: "2026-06-09T00:30:00.000Z",
      updatedAt: "2026-06-09T00:30:00.000Z"
    }
  ];

  createPostId() {
    return `post-${this.nextPostNumber++}`;
  }

  createCommentId() {
    return `comment-${this.nextCommentNumber++}`;
  }

  listTags() {
    return this.tags;
  }

  findTag(id: string) {
    return this.tags.find((tag) => tag.id === id);
  }

  listPosts() {
    return this.posts;
  }

  findPost(id: string) {
    return this.posts.find((post) => post.id === id);
  }

  createPost(post: PostRecord) {
    this.posts.unshift(post);
  }

  deletePost(post: PostRecord) {
    this.posts.splice(this.posts.indexOf(post), 1);
  }

  listComments(postId: string) {
    return this.comments.filter((comment) => comment.postId === postId);
  }

  findComment(postId: string, commentId: string) {
    return this.comments.find((comment) => comment.postId === postId && comment.id === commentId);
  }

  createComment(comment: Comment) {
    this.comments.push(comment);
  }

  deleteComment(comment: Comment) {
    this.comments.splice(this.comments.indexOf(comment), 1);
  }

  deleteCommentsByPostId(postId: string) {
    for (let index = this.comments.length - 1; index >= 0; index -= 1) {
      if (this.comments[index]?.postId === postId) {
        this.comments.splice(index, 1);
      }
    }
  }
}
