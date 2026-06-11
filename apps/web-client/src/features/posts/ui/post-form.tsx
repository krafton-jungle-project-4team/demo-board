import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useController, useForm, type Control, type Resolver } from "react-hook-form";
import { CreatePostRequestSchema, type CreatePostRequest, type PostTag } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { Textarea } from "@nmm/ui/components/textarea";

export type PostFormValues = CreatePostRequest;
const postFormResolver = zodResolver(CreatePostRequestSchema) as Resolver<PostFormValues>;

type PostFormProps = {
    availableTags: PostTag[];
    defaultValues: PostFormValues;
    isPending: boolean;
    onCancel: () => void;
    onSubmit: (values: PostFormValues) => void;
};

export function PostForm({ availableTags, defaultValues, isPending, onCancel, onSubmit }: PostFormProps) {
    const form = useForm<PostFormValues>({
        resolver: postFormResolver,
        defaultValues,
        mode: "onChange"
    });

    function handleValidSubmit(values: PostFormValues) {
        onSubmit(values);
    }

    return (
        <form className="grid gap-4" onSubmit={form.handleSubmit(handleValidSubmit)}>
            <FieldGroup>
                <PostTitleField control={form.control} disabled={isPending} />
                <PostExcerptField control={form.control} disabled={isPending} />
                <PostContentField control={form.control} disabled={isPending} />
                {availableTags.length > 0 ? (
                    <PostTagsField control={form.control} availableTags={availableTags} disabled={isPending} />
                ) : null}
                <Field orientation="horizontal" className="justify-end gap-2">
                    <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
                        취소
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        저장
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}

type PostFieldProps = {
    control: Control<PostFormValues>;
    disabled: boolean;
};

function PostTitleField({ control, disabled }: PostFieldProps) {
    const { field, fieldState } = useController({
        control,
        name: "title"
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="post-title">제목</FieldLabel>
            <Input {...field} id="post-title" required aria-invalid={fieldState.invalid} disabled={disabled} />
            <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
    );
}

function PostExcerptField({ control, disabled }: PostFieldProps) {
    const { field, fieldState } = useController({
        control,
        name: "excerpt"
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="post-excerpt">요약</FieldLabel>
            <Input {...field} id="post-excerpt" required aria-invalid={fieldState.invalid} disabled={disabled} />
            <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
    );
}

function PostContentField({ control, disabled }: PostFieldProps) {
    const { field, fieldState } = useController({
        control,
        name: "content"
    });

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="post-content">본문</FieldLabel>
            <Textarea {...field} id="post-content" required aria-invalid={fieldState.invalid} disabled={disabled} />
            <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
    );
}

type PostTagsFieldProps = PostFieldProps & {
    availableTags: PostTag[];
};

function PostTagsField({ availableTags, control, disabled }: PostTagsFieldProps) {
    const { field, fieldState } = useController({
        control,
        name: "tagIds"
    });
    const selectedTagIds = field.value;
    const selectedTagIdSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

    function handleTagClick(tagId: number) {
        const hasTag = selectedTagIdSet.has(tagId);
        const tagIds = hasTag
            ? selectedTagIds.filter((selectedTagId) => selectedTagId !== tagId)
            : [...selectedTagIds, tagId];

        field.onChange(tagIds);
    }

    return (
        <FieldSet>
            <FieldLegend variant="label">태그</FieldLegend>
            <FieldGroup className="flex-row flex-wrap gap-2">
                {availableTags.map((tag) => (
                    <PostTagToggle
                        key={tag.id}
                        isSelected={selectedTagIdSet.has(tag.id)}
                        disabled={disabled}
                        tag={tag}
                        onToggle={handleTagClick}
                    />
                ))}
            </FieldGroup>
            <FieldError>{fieldState.error?.message}</FieldError>
        </FieldSet>
    );
}

type PostTagToggleProps = {
    isSelected: boolean;
    disabled: boolean;
    tag: PostTag;
    onToggle: (tagId: number) => void;
};

function PostTagToggle({ isSelected, disabled, tag, onToggle }: PostTagToggleProps) {
    function handleClick() {
        onToggle(tag.id);
    }

    return (
        <Button
            type="button"
            size="sm"
            variant={isSelected ? "secondary" : "outline"}
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={handleClick}
        >
            {tag.name}
        </Button>
    );
}
