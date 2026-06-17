import { SearchIcon, XIcon } from "lucide-react";
import type { BoardPostSearchScope } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@nmm/ui/components/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@nmm/ui/components/select";
import type { ChangeEvent, FormEvent } from "react";

type BoardPostSearchScopeOption = {
    value: BoardPostSearchScope;
    label: string;
    ariaLabel?: string;
};

const BOARD_POST_SEARCH_SCOPE_OPTIONS: BoardPostSearchScopeOption[] = [
    { value: "all", label: "전체", ariaLabel: "제목, 본문, 태그" },
    { value: "title", label: "제목" },
    { value: "content", label: "본문" },
    { value: "titleContent", label: "제목+본문" },
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
        <form className="mx-auto w-full max-w-2xl" onSubmit={onSubmit}>
            <FieldGroup className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Field className="w-full sm:w-auto">
                    <FieldLabel htmlFor="board-post-search-scope" className="sr-only">
                        검색 범위
                    </FieldLabel>
                    <Select value={searchScope} onValueChange={onSearchScopeChange}>
                        <SelectTrigger id="board-post-search-scope" className="w-full sm:w-36" aria-label="검색 범위">
                            <SelectValue placeholder="검색 범위" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>{searchScopeItems}</SelectGroup>
                        </SelectContent>
                    </Select>
                </Field>
                <Field className="min-w-0 flex-1">
                    <FieldLabel htmlFor="board-post-search" className="sr-only">
                        게시글 검색
                    </FieldLabel>
                    <InputGroup>
                        <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                            id="board-post-search"
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="검색어 입력"
                            autoComplete="off"
                        />
                        {hasKeyword ? (
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton size="icon-xs" aria-label="검색어 지우기" onClick={onClear}>
                                    <XIcon />
                                </InputGroupButton>
                            </InputGroupAddon>
                        ) : null}
                    </InputGroup>
                </Field>
                <Button type="submit" className="shrink-0">
                    <SearchIcon data-icon="inline-start" />
                    검색
                </Button>
            </FieldGroup>
        </form>
    );
}

function renderBoardPostSearchScopeOption(option: BoardPostSearchScopeOption) {
    return (
        <SelectItem key={option.value} value={option.value} aria-label={option.ariaLabel ?? option.label}>
            {option.label}
        </SelectItem>
    );
}
