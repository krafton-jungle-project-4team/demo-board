import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CreatePostRequestSchema, type CreatePostRequest } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { Spinner } from "@nmm/ui/components/spinner";
import { Textarea } from "@nmm/ui/components/textarea";

export type PostFormValues = CreatePostRequest;

type PostFormProps = {
    initialValues?: PostFormValues;
    isSubmitting: boolean;
    submitLabel: string;
    errorMessage?: string;
    onSubmit: (values: PostFormValues) => void | Promise<void>;
};

const EMPTY_POST_FORM_VALUES = {
    title: "",
    content: ""
} satisfies PostFormValues;

export function PostForm({
    initialValues = EMPTY_POST_FORM_VALUES,
    isSubmitting,
    submitLabel,
    errorMessage,
    onSubmit
}: PostFormProps) {
    const form = useForm<PostFormValues>({
        resolver: zodResolver(CreatePostRequestSchema),
        defaultValues: initialValues
    });
    const titleField = form.register("title", {
        setValueAs: normalizePostText
    });
    const contentField = form.register("content", {
        setValueAs: normalizePostText
    });
    const titleError = form.formState.errors.title;
    const contentError = form.formState.errors.content;
    const isTitleInvalid = titleError !== undefined;
    const isContentInvalid = contentError !== undefined;
    const handlePostSubmit = form.handleSubmit(onSubmit);

    return (
        <form className="flex flex-col gap-6" onSubmit={handlePostSubmit}>
            <FieldGroup>
                <Field data-invalid={isTitleInvalid}>
                    <FieldLabel htmlFor="post-title">제목</FieldLabel>
                    <Input id="post-title" disabled={isSubmitting} aria-invalid={isTitleInvalid} {...titleField} />
                    <FieldError errors={[titleError]} />
                </Field>
                <Field data-invalid={isContentInvalid}>
                    <FieldLabel htmlFor="post-content">내용</FieldLabel>
                    <Textarea
                        id="post-content"
                        disabled={isSubmitting}
                        aria-invalid={isContentInvalid}
                        className="min-h-36"
                        {...contentField}
                    />
                    <FieldError errors={[contentError]} />
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

function normalizePostText(value: unknown) {
    return typeof value === "string" ? value.trim() : value;
}
