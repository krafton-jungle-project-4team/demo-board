import { Badge } from "@nmm/ui/components";
import type { PostDto } from "@/shared/api/generated/api-server";

export function PostStatusBadge({ status }: { status: PostDto["status"] }) {
  return <Badge>{status === "published" ? "공개" : "초안"}</Badge>;
}
