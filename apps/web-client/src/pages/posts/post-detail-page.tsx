import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@nmm/ui/components";
import type { Post } from "@nmm/shared";
import { useCurrentUserQuery } from "@/features/auth";
import { canManagePost, usePostDetailQuery } from "@/features/posts";

type PostDetailPageProps = {
    postId: string;
};

export function PostDetailPage({ postId }: PostDetailPageProps) {
    const currentUser = useCurrentUserQuery().data;
    const post = usePostDetailQuery(postId).data;

    if (canManagePost(currentUser, post)) {
        return <ManageablePostDetail post={post} />;
    }

    return <ReadonlyPostDetail post={post} />;
}

type PostDetailProps = {
    post: Post;
};

function ReadonlyPostDetail({ post }: PostDetailProps) {
    return <PostDetailLayout post={post} />;
}

function ManageablePostDetail({ post }: PostDetailProps) {
    return (
        <PostDetailLayout
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

function PostDetailLayout({ action, post }: PostDetailLayoutProps) {
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
                <span className="text-sm text-muted-foreground">{post.authorName}</span>
                <h1 className="text-2xl font-semibold tracking-normal">{post.title}</h1>
                <p className="text-muted-foreground">{post.excerpt}</p>
            </div>

            <div className="border-t pt-6">
                <p className="whitespace-pre-wrap text-sm leading-7">{post.content}</p>
            </div>
        </article>
    );
}
