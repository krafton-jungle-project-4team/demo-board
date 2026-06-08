import { Link } from "@tanstack/react-router";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@nmm/ui/components";
import type { PostDto } from "@/shared/api/generated/api-server";
import { PostStatusBadge } from "./post-status-badge";
import { UpdatePostDialog } from "./update-post-dialog";

type PostCardsProps = {
  posts: PostDto[];
  onDelete: (id: string) => void;
};

export function PostCards({ posts, onDelete }: PostCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle>{post.title}</CardTitle>
              <PostStatusBadge status={post.status} />
            </div>
            <CardDescription>{post.excerpt}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-3 text-sm">{post.content}</p>
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/posts/$postId" params={{ postId: post.id }}>
                <Eye />
                상세
              </Link>
            </Button>
            <div className="flex gap-1">
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
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
