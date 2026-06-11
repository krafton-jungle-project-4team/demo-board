import { Button, Input, Label, Textarea } from "@nmm/ui/components";
import type { PostTag } from "@nmm/shared";
import type { ChangeEvent, FormEvent } from "react";

export type PostFormValues = {
    title: string;
    excerpt: string;
    content: string;
    tagIds: number[];
};

type PostFormProps = {
    availableTags: PostTag[];
    values: PostFormValues;
    isPending: boolean;
    onCancel: () => void;
    onSubmit: () => void;
    onValuesChange: (values: PostFormValues) => void;
};

export function PostForm({ availableTags, values, isPending, onCancel, onSubmit, onValuesChange }: PostFormProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit();
    }

    function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
        onValuesChange({
            ...values,
            title: event.target.value
        });
    }

    function handleExcerptChange(event: ChangeEvent<HTMLInputElement>) {
        onValuesChange({
            ...values,
            excerpt: event.target.value
        });
    }

    function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
        onValuesChange({
            ...values,
            content: event.target.value
        });
    }

    function handleTagClick(tagId: number) {
        const hasTag = values.tagIds.includes(tagId);
        const tagIds = hasTag
            ? values.tagIds.filter((selectedTagId) => selectedTagId !== tagId)
            : [...values.tagIds, tagId];

        onValuesChange({
            ...values,
            tagIds
        });
    }

    return (
        <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
                <Label htmlFor="post-title">제목</Label>
                <Input id="post-title" required value={values.title} onChange={handleTitleChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="post-excerpt">요약</Label>
                <Input id="post-excerpt" required value={values.excerpt} onChange={handleExcerptChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="post-content">본문</Label>
                <Textarea id="post-content" required value={values.content} onChange={handleContentChange} />
            </div>
            {availableTags.length > 0 ? (
                <fieldset className="grid gap-2">
                    <legend className="text-sm leading-none font-medium">태그</legend>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                            <PostTagToggle
                                key={tag.id}
                                isSelected={values.tagIds.includes(tag.id)}
                                tag={tag}
                                onToggle={handleTagClick}
                            />
                        ))}
                    </div>
                </fieldset>
            ) : null}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    취소
                </Button>
                <Button type="submit" disabled={isPending}>
                    저장
                </Button>
            </div>
        </form>
    );
}

type PostTagToggleProps = {
    isSelected: boolean;
    tag: PostTag;
    onToggle: (tagId: number) => void;
};

function PostTagToggle({ isSelected, tag, onToggle }: PostTagToggleProps) {
    function handleClick() {
        onToggle(tag.id);
    }

    return (
        <Button
            type="button"
            size="sm"
            variant={isSelected ? "secondary" : "outline"}
            aria-pressed={isSelected}
            onClick={handleClick}
        >
            {tag.name}
        </Button>
    );
}
