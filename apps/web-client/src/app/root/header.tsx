import { Link } from "@tanstack/react-router";
import { Button } from "@nmm/ui/components/button";

export function Header() {
    return (
        <header className="border-b">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Button asChild variant="ghost" size="sm" className="font-semibold">
                    <Link to="/">NMM Template</Link>
                </Button>
                <nav className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                        <Link
                            to="/"
                            activeProps={{
                                className: "bg-accent text-accent-foreground"
                            }}
                        >
                            예시
                        </Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
