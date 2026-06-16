import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { SONGPA_BOARD_DONGS, SongpaBoardDongCodeSchema } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@nmm/ui/components/select";
import { toast } from "@nmm/ui/components/sonner";
import { Spinner } from "@nmm/ui/components/spinner";
import { currentUserQueryOptions, useUpdateResidenceDongMutation } from "@/features/auth";
import { ApiClientError } from "@/shared/api/http-client";

export function ProfilePage() {
    const { data: currentUser, isPending: isCurrentUserPending } = useQuery(currentUserQueryOptions);

    if (isCurrentUserPending) {
        return (
            <section className="mx-auto flex w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                <Card className="w-full">
                    <CardContent className="text-sm text-muted-foreground">프로필을 불러오는 중</CardContent>
                </Card>
            </section>
        );
    }

    if (!currentUser) {
        return (
            <section className="mx-auto flex w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>로그인이 필요합니다</CardTitle>
                        <CardDescription>거주동 설정은 로그인 후 사용할 수 있습니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link to="/auth/login">로그인</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        );
    }

    return (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <Card>
                <CardHeader>
                    <CardTitle>프로필 설정</CardTitle>
                    <CardDescription>내 동네 글 작성에 사용할 송파구 거주동을 선택하세요.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResidenceDongForm
                        key={currentUser.residenceDongCode ?? "empty-residence-dong"}
                        initialResidenceDongCode={currentUser.residenceDongCode ?? ""}
                    />
                </CardContent>
            </Card>
        </section>
    );
}

function ResidenceDongForm({ initialResidenceDongCode }: { initialResidenceDongCode: string }) {
    const updateResidenceDongMutation = useUpdateResidenceDongMutation();
    const [residenceDongCode, setResidenceDongCode] = useState(initialResidenceDongCode);
    const [formError, setFormError] = useState<string | undefined>();
    const isSubmitDisabled = updateResidenceDongMutation.isPending || residenceDongCode.length === 0;

    function handleResidenceDongChange(value: string) {
        setResidenceDongCode(value);
        setFormError(undefined);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const parsedResidenceDongCode = SongpaBoardDongCodeSchema.safeParse(residenceDongCode);

        if (!parsedResidenceDongCode.success) {
            setFormError("송파구 거주동을 선택해주세요.");
            return;
        }

        try {
            await updateResidenceDongMutation.mutateAsync({
                residenceDongCode: parsedResidenceDongCode.data
            });
            toast.success("거주동을 저장했습니다.");
        } catch (error) {
            const errorMessage = getErrorMessage(error);

            setFormError(errorMessage);
            toast.error(errorMessage);
        }
    }

    return (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <FieldGroup>
                <Field data-invalid={formError !== undefined}>
                    <FieldLabel htmlFor="residence-dong">거주동</FieldLabel>
                    <Select
                        value={residenceDongCode}
                        disabled={updateResidenceDongMutation.isPending}
                        onValueChange={handleResidenceDongChange}
                    >
                        <SelectTrigger id="residence-dong" className="w-full" aria-invalid={formError !== undefined}>
                            <SelectValue placeholder="동 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {SONGPA_BOARD_DONGS.map((dong) => (
                                    <SelectItem key={dong.stdgCd} value={dong.stdgCd}>
                                        {dong.stdgNm}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <FieldDescription>동네 게시글을 작성할 때 선택한 동으로 자동 등록됩니다.</FieldDescription>
                    <FieldError>{formError}</FieldError>
                </Field>
            </FieldGroup>
            <Button type="submit" disabled={isSubmitDisabled} className="self-end">
                {updateResidenceDongMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
                저장
            </Button>
        </form>
    );
}

function getErrorMessage(error: unknown) {
    if (error instanceof ApiClientError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "알 수 없는 오류가 발생했습니다.";
}
