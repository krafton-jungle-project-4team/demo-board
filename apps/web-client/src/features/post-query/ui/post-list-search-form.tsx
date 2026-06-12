import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@nmm/ui/components/input-group";
import type { ChangeEvent, FormEvent } from "react";

type PostListSearchFormProps = {
    keyword: string;
    onKeywordChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClear: () => void;
};

export function PostListSearchForm({ keyword, onKeywordChange, onSubmit, onClear }: PostListSearchFormProps) {
    const hasKeyword = keyword.trim().length > 0;

    return (
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
            <FieldGroup className="min-w-0 flex-1">
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
            </FieldGroup>
            <Button type="submit" className="sm:w-24">
                검색
            </Button>
        </form>
    );
}
