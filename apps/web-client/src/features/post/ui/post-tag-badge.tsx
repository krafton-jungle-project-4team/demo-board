import type { PostTagResponse } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";

export type PostTagBadgeProps = {
    postTag: PostTagResponse;
    className?: string;
};

export function PostTagBadge({ postTag, className }: PostTagBadgeProps) {
    return (
        <Badge variant="secondary" className={className}>
            {postTag.name}
        </Badge>
    );
}
