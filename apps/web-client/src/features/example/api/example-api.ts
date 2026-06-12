import { ExampleResponseSchema, type ExampleResponse } from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getExample(): Promise<ExampleResponse> {
    return requestApiData("example", ExampleResponseSchema);
}
