import { Button, Input, Label, Textarea } from "@nmm/ui/components";
import type { CreatePostRequest, PostTag } from "@nmm/shared";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";

type PostFormProps = {
    availableTags: PostTag[];
    values: CreatePostRequest;
    isPending: boolean;
    onCancel: () => void;
    onSubmit: () => void;
    onValuesChange: (values: CreatePostRequest) => void;
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

    function handleTagClick(event: MouseEvent<HTMLButtonElement>) {
        const tagId = Number(event.currentTarget.value);
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
                            <Button
                                key={tag.id}
                                type="button"
                                size="sm"
                                value={tag.id}
                                variant={values.tagIds.includes(tag.id) ? "secondary" : "outline"}
                                aria-pressed={values.tagIds.includes(tag.id)}
                                onClick={handleTagClick}
                            >
                                {tag.name}
                            </Button>
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
