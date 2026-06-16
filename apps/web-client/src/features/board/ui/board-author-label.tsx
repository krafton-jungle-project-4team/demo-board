import type { BoardAuthor } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";

type BoardAuthorLabelProps = {
    author: BoardAuthor;
};

export function BoardAuthorLabel({ author }: BoardAuthorLabelProps) {
    return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
            <span>{author.name}</span>
            {author.residenceDongName ? <Badge variant="outline">{author.residenceDongName}</Badge> : null}
        </span>
    );
}
