import { Button, Input, Label, Textarea } from "@nmm/ui/components";
import type { CreatePostRequest } from "@nmm/shared";

type PostFormProps = {
    values: CreatePostRequest;
    isPending: boolean;
    onCancel: () => void;
    onSubmit: () => void;
    onValuesChange: (values: CreatePostRequest) => void;
};

export function PostForm({ values, isPending, onCancel, onSubmit, onValuesChange }: PostFormProps) {
    return (
        <form
            className="grid gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <div className="grid gap-2">
                <Label htmlFor="post-title">제목</Label>
                <Input
                    id="post-title"
                    required
                    value={values.title}
                    onChange={(event) =>
                        onValuesChange({
                            ...values,
                            title: event.target.value
                        })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="post-excerpt">요약</Label>
                <Input
                    id="post-excerpt"
                    required
                    value={values.excerpt}
                    onChange={(event) =>
                        onValuesChange({
                            ...values,
                            excerpt: event.target.value
                        })
                    }
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="post-content">본문</Label>
                <Textarea
                    id="post-content"
                    required
                    value={values.content}
                    onChange={(event) =>
                        onValuesChange({
                            ...values,
                            content: event.target.value
                        })
                    }
                />
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
