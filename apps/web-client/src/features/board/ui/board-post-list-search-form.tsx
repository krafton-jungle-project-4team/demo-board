import { SearchIcon, XIcon } from "lucide-react";
import type { BoardPostSearchScope } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { ToggleGroup, ToggleGroupItem } from "@nmm/ui/components/toggle-group";
import type { ChangeEvent, FormEvent } from "react";

type BoardPostSearchScopeOption = {
    value: BoardPostSearchScope;
    label: string;
    ariaLabel?: string;
};

const BOARD_POST_SEARCH_SCOPE_OPTIONS: BoardPostSearchScopeOption[] = [
    { value: "titleContent", label: "전체", ariaLabel: "제목과 본문" },
    { value: "title", label: "제목" },
    { value: "content", label: "본문" },
    { value: "tag", label: "태그" }
];

type BoardPostListSearchFormProps = {
    keyword: string;
    searchScope: BoardPostSearchScope;
    onKeywordChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSearchScopeChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClear: () => void;
};

export function BoardPostListSearchForm({
    keyword,
    searchScope,
    onKeywordChange,
    onSearchScopeChange,
    onSubmit,
    onClear
}: BoardPostListSearchFormProps) {
    const hasKeyword = keyword.trim().length > 0;
    const searchScopeItems = BOARD_POST_SEARCH_SCOPE_OPTIONS.map(renderBoardPostSearchScopeOption);

    return (
        <form onSubmit={onSubmit}>
            <FieldGroup className="gap-3 md:flex-row md:items-center">
                <Field className="w-full md:w-auto">
                    <FieldLabel className="sr-only">검색 범위</FieldLabel>
                    <ToggleGroup
                        type="single"
                        value={searchScope}
                        onValueChange={onSearchScopeChange}
                        variant="default"
                        size="sm"
                        className="inline-flex h-9 max-w-full items-center overflow-hidden rounded-md border border-border bg-background p-0.5"
                        aria-label="검색 범위"
                    >
                        {searchScopeItems}
                    </ToggleGroup>
                </Field>
                <Field className="min-w-0 flex-1 md:max-w-sm">
                    <FieldLabel htmlFor="board-post-search" className="sr-only">
                        게시글 검색
                    </FieldLabel>
                    <div className="flex min-w-0 gap-2">
                        <div className="relative min-w-0 flex-1">
                            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="board-post-search"
                                value={keyword}
                                onChange={onKeywordChange}
                                placeholder="검색어 입력"
                                autoComplete="off"
                                className="pr-9 pl-8"
                            />
                            {hasKeyword ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="검색어 지우기"
                                    className="absolute top-1/2 right-1 -translate-y-1/2"
                                    onClick={onClear}
                                >
                                    <XIcon />
                                </Button>
                            ) : null}
                        </div>
                        <Button type="submit" className="shrink-0">
                            <SearchIcon data-icon="inline-start" />
                            검색
                        </Button>
                    </div>
                </Field>
            </FieldGroup>
        </form>
    );
}

function renderBoardPostSearchScopeOption(option: BoardPostSearchScopeOption) {
    const ariaLabel = option.ariaLabel ?? option.label;

    return (
        <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={ariaLabel}
            className="h-8 rounded-sm px-3 text-muted-foreground hover:bg-muted hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground"
        >
            {option.label}
        </ToggleGroupItem>
    );
}
