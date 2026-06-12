import { Link } from "@tanstack/react-router";
import { PostListQuerySchema } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";

const defaultPostListSearch = PostListQuerySchema.parse({});

export function Header() {
    return (
        <header className="border-b">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Button asChild variant="ghost" size="sm" className="font-semibold">
                    <Link to="/" search={defaultPostListSearch}>
                        NMM Board
                    </Link>
                </Button>
                <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                        <Link
                            to="/"
                            search={defaultPostListSearch}
                            activeProps={{
                                className: "bg-accent text-accent-foreground"
                            }}
                        >
                            게시글
                        </Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
