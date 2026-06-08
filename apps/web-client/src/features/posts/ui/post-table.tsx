import { Link } from "@tanstack/react-router";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components";
import type { PostDto } from "@/shared/api/generated/api-server";
import { PostStatusBadge } from "./post-status-badge";
import { UpdatePostDialog } from "./update-post-dialog";

type PostTableProps = {
  posts: PostDto[];
  onDelete: (id: string) => void;
};

export function PostTable({ posts, onDelete }: PostTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead className="hidden md:table-cell">작성자</TableHead>
            <TableHead className="hidden md:table-cell">상태</TableHead>
            <TableHead className="w-32 text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <div className="grid gap-1">
                  <Link to="/posts/$postId" params={{ postId: post.id }} className="font-medium hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-muted-foreground line-clamp-1 text-sm">{post.excerpt}</p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{post.authorName}</TableCell>
              <TableCell className="hidden md:table-cell">
                <PostStatusBadge status={post.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button asChild size="icon" variant="ghost" aria-label="상세">
                    <Link to="/posts/$postId" params={{ postId: post.id }}>
                      <Eye />
                    </Link>
                  </Button>
                  <UpdatePostDialog
                    post={post}
                    trigger={
                      <Button type="button" size="icon" variant="ghost" aria-label="수정">
                        <Pencil />
                      </Button>
                    }
                  />
                  <Button type="button" size="icon" variant="ghost" aria-label="삭제" onClick={() => onDelete(post.id)}>
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
