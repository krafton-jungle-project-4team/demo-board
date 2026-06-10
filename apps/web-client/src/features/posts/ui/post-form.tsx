import { Button, Input, Label, Textarea } from "@nmm/ui/components";
import type { CreatePostRequest } from "@nmm/shared";
import type { ChangeEvent, FormEvent } from "react";

type PostFormProps = {
    values: CreatePostRequest;
    isPending: boolean;
    onCancel: () => void;
    onSubmit: () => void;
    onValuesChange: (values: CreatePostRequest) => void;
};

export function PostForm({ values, isPending, onCancel, onSubmit, onValuesChange }: PostFormProps) {
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
