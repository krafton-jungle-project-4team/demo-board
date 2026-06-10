import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@nmm/ui/components";
import type { Post, User } from "@nmm/shared";
import { canManagePost } from "../model/post-permissions";
import { PostTagBadges } from "./post-tag-badges";

type PostCardsProps = {
    currentUser: User | null | undefined;
    posts: Post[];
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
    post: Post;
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
                    <Link to="/posts/$postId/edit" params={{ postId: String(post.id) }}>
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
                    <Link to="/posts/$postId" params={{ postId: String(post.id) }} className="hover:underline">
                        {post.title}
                    </Link>
                </CardTitle>
                <CardDescription>{post.excerpt}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    <p className="text-muted-foreground line-clamp-3 text-sm">{post.content}</p>
                    <PostTagBadges tags={post.tags} />
                </div>
            </CardContent>
        </>
    );
}
