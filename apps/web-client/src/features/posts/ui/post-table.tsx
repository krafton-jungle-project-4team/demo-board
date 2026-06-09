import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components";
import type { User } from "@nmm/shared";
import type { PostDto } from "@/shared/api/generated/api-server";
import { canManagePost } from "../model/post-permissions";

type PostTableProps = {
  currentUser: User | null | undefined;
  posts: PostDto[];
};

export function PostTable({ currentUser, posts }: PostTableProps) {
  const hasManageablePost = posts.some((post) => canManagePost(currentUser, post));

  if (hasManageablePost) {
    return <ManageablePostTable currentUser={currentUser} posts={posts} />;
  }

  return <ReadonlyPostTable posts={posts} />;
}

type ReadonlyPostTableProps = {
  posts: PostDto[];
};

function ReadonlyPostTable({ posts }: ReadonlyPostTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead className="hidden md:table-cell">작성자</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <ReadonlyPostTableRow key={post.id} post={post} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ManageablePostTable({ currentUser, posts }: PostTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead className="hidden md:table-cell">작성자</TableHead>
            <TableHead className="w-20 text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <ManageablePostTableRow key={post.id} currentUser={currentUser} post={post} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type PostTableRowProps = {
  post: PostDto;
};

function ReadonlyPostTableRow({ post }: PostTableRowProps) {
  return (
    <TableRow>
      <PostSummaryCells post={post} />
    </TableRow>
  );
}

type ManageablePostTableRowProps = PostTableRowProps & {
  currentUser: User | null | undefined;
};

function ManageablePostTableRow({ currentUser, post }: ManageablePostTableRowProps) {
  return (
    <TableRow>
      <PostSummaryCells post={post} />
      <TableCell>
        <div className="flex justify-end">
          {canManagePost(currentUser, post) ? <PostEditIconButton postId={post.id} /> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

function PostSummaryCells({ post }: PostTableRowProps) {
  return (
    <>
      <TableCell>
        <div className="grid gap-1">
          <Link to="/posts/$postId" params={{ postId: post.id }} className="font-medium hover:underline">
            {post.title}
          </Link>
          <p className="text-muted-foreground line-clamp-1 text-sm">{post.excerpt}</p>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">{post.authorName}</TableCell>
    </>
  );
}

type PostEditIconButtonProps = {
  postId: string;
};

function PostEditIconButton({ postId }: PostEditIconButtonProps) {
  return (
    <Button asChild size="icon" variant="ghost" aria-label="수정">
      <Link to="/posts/$postId/edit" params={{ postId }}>
        <Pencil />
      </Link>
    </Button>
  );
}
