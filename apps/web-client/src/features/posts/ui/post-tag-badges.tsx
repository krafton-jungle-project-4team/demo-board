import { Badge } from "@nmm/ui/components";
import type { PostTag } from "@nmm/shared";

type PostTagBadgesProps = {
    tags: PostTag[];
};

export function PostTagBadges({ tags }: PostTagBadgesProps) {
    if (tags.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                    {tag.name}
                </Badge>
            ))}
        </div>
    );
}
