import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import {
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@nmm/ui/components";
import type { Post, User } from "@nmm/shared";
import { canManagePost } from "../model/post-permissions";
import { PostTagBadges } from "./post-tag-badges";

type PostTableProps = {
    currentUser: User | null | undefined;
    posts: Post[];
};

export function PostTable({ currentUser, posts }: PostTableProps) {
    const hasManageablePost = posts.some((post) => canManagePost(currentUser, post));

    if (hasManageablePost) {
        return <ManageablePostTable currentUser={currentUser} posts={posts} />;
    }

    return <ReadonlyPostTable posts={posts} />;
}

type ReadonlyPostTableProps = {
    posts: Post[];
};

function ReadonlyPostTable({ posts }: ReadonlyPostTableProps) {
    return (
        <Card className="gap-0 py-0">
            <CardContent className="p-0">
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
            </CardContent>
        </Card>
    );
}

function ManageablePostTable({ currentUser, posts }: PostTableProps) {
    return (
        <Card className="gap-0 py-0">
            <CardContent className="p-0">
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
            </CardContent>
        </Card>
    );
}

type PostTableRowProps = {
    post: Post;
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
                    <Link
                        to="/posts/$postId"
                        params={{ postId: String(post.id) }}
                        className="font-medium hover:underline"
                    >
                        {post.title}
                    </Link>
                    <p className="text-muted-foreground line-clamp-1 text-sm">{post.excerpt}</p>
                    <PostTagBadges tags={post.tags} />
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{post.authorName}</TableCell>
        </>
    );
}

type PostEditIconButtonProps = {
    postId: number;
};

function PostEditIconButton({ postId }: PostEditIconButtonProps) {
    return (
        <Button asChild size="icon" variant="ghost" aria-label="수정">
            <Link to="/posts/$postId/edit" params={{ postId: String(postId) }}>
                <Pencil />
            </Link>
        </Button>
    );
}
