import {
  Button,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from "@nmm/ui/components";
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
      <div className="grid gap-2">
        <Label>상태</Label>
        <Select
          value={values.status}
          onValueChange={(status) =>
            onValuesChange({
              ...values,
              status: status as CreatePostRequest["status"]
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">초안</SelectItem>
            <SelectItem value="published">공개</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          저장
        </Button>
      </DialogFooter>
    </form>
  );
}
