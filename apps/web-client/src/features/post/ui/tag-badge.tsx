import type { TagResponse } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";

export type TagBadgeProps = {
    tag: TagResponse;
    className?: string;
};

export function TagBadge({ tag, className }: TagBadgeProps) {
    return (
        <Badge variant="secondary" className={className}>
            {tag.name}
        </Badge>
    );
}
