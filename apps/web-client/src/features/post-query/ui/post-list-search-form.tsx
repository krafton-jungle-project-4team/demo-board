import { SearchIcon, XIcon } from "lucide-react";
import type { PostSearchScope } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@nmm/ui/components/input-group";
import { ToggleGroup, ToggleGroupItem } from "@nmm/ui/components/toggle-group";
import type { ChangeEvent, FormEvent } from "react";

const POST_SEARCH_SCOPE_OPTIONS: Array<{ value: PostSearchScope; label: string }> = [
    { value: "title", label: "제목" },
    { value: "content", label: "본문" },
    { value: "tag", label: "태그" },
    { value: "titleContent", label: "제목+본문" }
];

type PostListSearchFormProps = {
    keyword: string;
    searchScope: PostSearchScope;
    onKeywordChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSearchScopeChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClear: () => void;
};

export function PostListSearchForm({
    keyword,
    searchScope,
    onKeywordChange,
    onSearchScopeChange,
    onSubmit,
    onClear
}: PostListSearchFormProps) {
    const hasKeyword = keyword.trim().length > 0;

    return (
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="post-search" className="sr-only">
                        게시글 검색
                    </FieldLabel>
                    <InputGroup>
                        <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                            id="post-search"
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="제목, 본문, 태그 검색"
                            autoComplete="off"
                        />
                        {hasKeyword ? (
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                    type="button"
                                    size="icon-xs"
                                    aria-label="검색어 지우기"
                                    onClick={onClear}
                                >
                                    <XIcon data-icon="inline-start" />
                                </InputGroupButton>
                            </InputGroupAddon>
                        ) : null}
                    </InputGroup>
                </Field>
                <Field>
                    <FieldLabel className="sr-only">검색 범위</FieldLabel>
                    <ToggleGroup
                        type="single"
                        value={searchScope}
                        onValueChange={onSearchScopeChange}
                        variant="outline"
                        size="sm"
                        className="flex-wrap"
                        aria-label="검색 범위"
                    >
                        {POST_SEARCH_SCOPE_OPTIONS.map((option) => (
                            <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
                                {option.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </Field>
            </FieldGroup>
            <Button type="submit" className="sm:w-24">
                검색
            </Button>
        </form>
    );
}
