import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@nmm/ui/components";
import type { User } from "@nmm/shared";
import type { PostDto } from "@/shared/api/generated/api-server";
import { canManagePost } from "../model/post-permissions";

type PostCardsProps = {
  currentUser: User | null | undefined;
  posts: PostDto[];
};

export function PostCards({ currentUser, posts }: PostCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) =>
        canManagePost(currentUser, post) ? (
          <ManageablePostCard key={post.id} post={post} />
        ) : (
          <ReadonlyPostCard key={post.id} post={post} />
        )
      )}
    </div>
  );
}

type PostCardProps = {
  post: PostDto;
};

function ReadonlyPostCard({ post }: PostCardProps) {
  return (
    <Card>
      <PostCardContent post={post} />
    </Card>
  );
}

function ManageablePostCard({ post }: PostCardProps) {
  return (
    <Card>
      <PostCardContent post={post} />
      <CardFooter className="justify-end gap-2">
        <Button asChild size="icon" variant="ghost" aria-label="수정">
          <Link to="/posts/$postId/edit" params={{ postId: post.id }}>
            <Pencil />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function PostCardContent({ post }: PostCardProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <Link to="/posts/$postId" params={{ postId: post.id }} className="hover:underline">
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription>{post.excerpt}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3 text-sm">{post.content}</p>
      </CardContent>
    </>
  );
}
