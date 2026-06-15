import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    BoardPostScopeSchema,
    BoardPostWriteRequestSchema,
    type BoardPostDetailResponse,
    type BoardPostScope,
    type BoardPostWriteRequest
} from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet
} from "@nmm/ui/components/field";
import { Input } from "@nmm/ui/components/input";
import { Spinner } from "@nmm/ui/components/spinner";
import { Textarea } from "@nmm/ui/components/textarea";
import { ToggleGroup, ToggleGroupItem } from "@nmm/ui/components/toggle-group";

const BoardPostFormSchema = z.object({
    postScope: BoardPostScopeSchema.optional(),
    title: z.string().trim().min(1, "제목을 입력하세요.").max(200, "제목은 200자 이하로 입력하세요."),
    content: z.string().trim().min(1, "내용을 입력하세요.").max(20000, "내용은 20000자 이하로 입력하세요."),
    tagsText: z.string()
});

export type BoardPostFormValues = BoardPostWriteRequest & {
    postScope?: BoardPostScope;
};

type BoardPostFormFields = z.infer<typeof BoardPostFormSchema>;

type BoardPostFormProps = {
    initialPost?: BoardPostDetailResponse;
    postScopeOptions?: {
        canCreateMyDongPost: boolean;
        residenceDongName?: string | null;
    };
    isSubmitting: boolean;
    submitLabel: string;
    errorMessage?: string;
    onSubmit: (values: BoardPostFormValues) => void | Promise<void>;
};

const EMPTY_BOARD_POST_FORM_FIELDS = {
    postScope: "ALL",
    title: "",
    content: "",
    tagsText: ""
} satisfies BoardPostFormFields;

export function BoardPostForm({
    initialPost,
    postScopeOptions,
    isSubmitting,
    submitLabel,
    errorMessage,
    onSubmit
}: BoardPostFormProps) {
    const form = useForm<BoardPostFormFields>({
        resolver: zodResolver(BoardPostFormSchema),
        defaultValues: initialPost ? toBoardPostFormFields(initialPost) : EMPTY_BOARD_POST_FORM_FIELDS
    });
    const postScope = form.watch("postScope") ?? "ALL";
    const titleField = form.register("title");
    const contentField = form.register("content");
    const tagsTextField = form.register("tagsText");
    const titleError = form.formState.errors.title;
    const contentError = form.formState.errors.content;
    const tagsTextError = form.formState.errors.tagsText;
    const handlePostSubmit = form.handleSubmit(handleSubmit);

    function handlePostScopeChange(value: string) {
        if (!value) {
            return;
        }

        form.setValue("postScope", BoardPostScopeSchema.parse(value), {
            shouldDirty: true,
            shouldValidate: true
        });
    }

    function handleSubmit(values: BoardPostFormFields) {
        const request: BoardPostFormValues = BoardPostWriteRequestSchema.parse({
            title: values.title,
            content: values.content,
            tags: parseTagsText(values.tagsText)
        });

        if (postScopeOptions) {
            request.postScope = BoardPostScopeSchema.parse(values.postScope);
        }

        return onSubmit(request);
    }

    return (
        <form className="flex flex-col gap-6" onSubmit={handlePostSubmit}>
            <FieldGroup>
                {postScopeOptions ? (
                    <FieldSet>
                        <FieldLegend>글 범위</FieldLegend>
                        <ToggleGroup
                            type="single"
                            value={postScope}
                            onValueChange={handlePostScopeChange}
                            variant="outline"
                            size="sm"
                            aria-label="글 범위"
                        >
                            <ToggleGroupItem value="ALL" aria-label="전체 글">
                                전체 글
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="MY_DONG"
                                disabled={!postScopeOptions.canCreateMyDongPost}
                                aria-label="내 동네 글"
                            >
                                내 동네 글
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <FieldDescription>
                            {postScopeOptions.canCreateMyDongPost
                                ? `내 동네 글은 ${postScopeOptions.residenceDongName ?? "내 거주동"} 게시글로 등록됩니다.`
                                : "동네 글을 작성하려면 거주동 설정이 필요해요. 지금은 전체 글로 작성할 수 있어요."}
                        </FieldDescription>
                    </FieldSet>
                ) : null}
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
        postScope: undefined,
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
