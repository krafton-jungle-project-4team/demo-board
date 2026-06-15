import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BoardPostWriteRequestSchema, type BoardPostDetailResponse, type BoardPostWriteRequest } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { Spinner } from "@nmm/ui/components/spinner";
import { Textarea } from "@nmm/ui/components/textarea";

const BoardPostFormSchema = z.object({
    title: z.string().trim().min(1, "제목을 입력하세요.").max(200, "제목은 200자 이하로 입력하세요."),
    content: z.string().trim().min(1, "내용을 입력하세요.").max(20000, "내용은 20000자 이하로 입력하세요."),
    tagsText: z.string()
});

export type BoardPostFormValues = BoardPostWriteRequest;

type BoardPostFormFields = z.infer<typeof BoardPostFormSchema>;

type BoardPostFormProps = {
    initialPost?: BoardPostDetailResponse;
    isSubmitting: boolean;
    submitLabel: string;
    errorMessage?: string;
    onSubmit: (values: BoardPostFormValues) => void | Promise<void>;
};

const EMPTY_BOARD_POST_FORM_FIELDS = {
    title: "",
    content: "",
    tagsText: ""
} satisfies BoardPostFormFields;

export function BoardPostForm({ initialPost, isSubmitting, submitLabel, errorMessage, onSubmit }: BoardPostFormProps) {
    const form = useForm<BoardPostFormFields>({
        resolver: zodResolver(BoardPostFormSchema),
        defaultValues: initialPost ? toBoardPostFormFields(initialPost) : EMPTY_BOARD_POST_FORM_FIELDS
    });
    const titleField = form.register("title");
    const contentField = form.register("content");
    const tagsTextField = form.register("tagsText");
    const titleError = form.formState.errors.title;
    const contentError = form.formState.errors.content;
    const tagsTextError = form.formState.errors.tagsText;
    const handlePostSubmit = form.handleSubmit(handleSubmit);

    function handleSubmit(values: BoardPostFormFields) {
        const request = BoardPostWriteRequestSchema.parse({
            title: values.title,
            content: values.content,
            tags: parseTagsText(values.tagsText)
        });

        return onSubmit(request);
    }

    return (
        <form className="flex flex-col gap-6" onSubmit={handlePostSubmit}>
            <FieldGroup>
                <Field data-invalid={titleError !== undefined}>
                    <FieldLabel htmlFor="board-post-title">제목</FieldLabel>
                    <Input
                        id="board-post-title"
                        disabled={isSubmitting}
                        aria-invalid={titleError !== undefined}
                        {...titleField}
                    />
                    <FieldError errors={[titleError]} />
                </Field>
                <Field data-invalid={contentError !== undefined}>
                    <FieldLabel htmlFor="board-post-content">내용</FieldLabel>
                    <Textarea
                        id="board-post-content"
                        disabled={isSubmitting}
                        aria-invalid={contentError !== undefined}
                        className="min-h-64"
                        {...contentField}
                    />
                    <FieldError errors={[contentError]} />
                </Field>
                <Field data-invalid={tagsTextError !== undefined}>
                    <FieldLabel htmlFor="board-post-tags">태그</FieldLabel>
                    <Input
                        id="board-post-tags"
                        disabled={isSubmitting}
                        aria-invalid={tagsTextError !== undefined}
                        placeholder="쉼표로 구분"
                        {...tagsTextField}
                    />
                    <FieldDescription>예: 질문, 정보, 후기</FieldDescription>
                    <FieldError errors={[tagsTextError]} />
                </Field>
            </FieldGroup>
            <FieldError>{errorMessage}</FieldError>
            <Button type="submit" disabled={isSubmitting} className="self-end">
                {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                {submitLabel}
            </Button>
        </form>
    );
}

function toBoardPostFormFields(post: BoardPostDetailResponse): BoardPostFormFields {
    return {
        title: post.title,
        content: post.content,
        tagsText: post.tags.map((tag) => tag.name).join(", ")
    };
}

function parseTagsText(tagsText: string) {
    return tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
}
