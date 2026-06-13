import { type FormEvent, useState } from "react";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Textarea } from "@nmm/ui/components/textarea";

type CommentFormProps = {
    buttonText: string;
    initialContent?: string;
    isPending: boolean;
    label: string;
    onSubmit: (content: string) => Promise<void> | void;
};

export function CommentForm({ buttonText, initialContent = "", isPending, label, onSubmit }: CommentFormProps) {
    const [content, setContent] = useState(initialContent);
    const trimmedContent = content.trim();
    const isSubmitDisabled = isPending || trimmedContent.length === 0 || trimmedContent.length > 300;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitDisabled) {
            return;
        }

        await onSubmit(trimmedContent);
        setContent("");
    }

    function handleContentChange(event: FormEvent<HTMLTextAreaElement>) {
        setContent(event.currentTarget.value);
    }

    return (
        <form onSubmit={handleSubmit}>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor={label}>{label}</FieldLabel>
                    <Textarea
                        id={label}
                        value={content}
                        maxLength={300}
                        rows={3}
                        onChange={handleContentChange}
                        placeholder="댓글을 입력하세요."
                    />
                </Field>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">{trimmedContent.length}/300</span>
                    <Button type="submit" disabled={isSubmitDisabled}>
                        {buttonText}
                    </Button>
                </div>
            </FieldGroup>
        </form>
    );
}
