import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.mjs";
import Pencil from "lucide-react/dist/esm/icons/pencil.mjs";
import type { Post, User } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Separator } from "@nmm/ui/components/separator";
import { useCurrentUserQuery } from "@/features/auth/api/auth-queries";
import { usePostDetailQuery } from "@/features/posts/api/post-queries";
import { canManagePost } from "@/features/posts/model/post-permissions";
import { PostComments } from "@/features/posts/ui/post-comments";
import { PostTagBadges } from "@/features/posts/ui/post-tag-badges";

type PostDetailPageProps = {
    postId: string;
};

export function PostDetailPage({ postId }: PostDetailPageProps) {
    const currentUser = useCurrentUserQuery().data;
    const post = usePostDetailQuery(postId).data;

    if (canManagePost(currentUser, post)) {
        return <ManageablePostDetail currentUser={currentUser} post={post} />;
    }

    return <ReadonlyPostDetail currentUser={currentUser} post={post} />;
}

type PostDetailProps = {
    currentUser: User | null | undefined;
    post: Post;
};

function ReadonlyPostDetail({ currentUser, post }: PostDetailProps) {
    return <PostDetailLayout currentUser={currentUser} post={post} />;
}

function ManageablePostDetail({ currentUser, post }: PostDetailProps) {
    return (
        <PostDetailLayout
            currentUser={currentUser}
            post={post}
            action={
                <Button asChild variant="outline">
                    <Link to="/posts/$postId/edit" params={{ postId: String(post.id) }}>
                        <Pencil />
                        수정
                    </Link>
                </Button>
            }
        />
    );
}

type PostDetailLayoutProps = PostDetailProps & {
    action?: ReactNode;
};

function PostDetailLayout({ action, currentUser, post }: PostDetailLayoutProps) {
    return (
        <article className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
                <Button asChild variant="ghost">
                    <Link to="/posts">
                        <ArrowLeft />
                        목록
                    </Link>
                </Button>
                {action}
            </div>

            <div className="grid gap-3">
                <Badge variant="secondary">{post.authorName}</Badge>
                <h1 className="text-2xl font-semibold tracking-normal">{post.title}</h1>
                <p className="text-muted-foreground">{post.excerpt}</p>
                <PostTagBadges tags={post.tags} />
            </div>

            <Separator />
            <p className="whitespace-pre-wrap text-sm leading-7">{post.content}</p>

            <PostComments currentUser={currentUser} postId={post.id} />
        </article>
    );
}
