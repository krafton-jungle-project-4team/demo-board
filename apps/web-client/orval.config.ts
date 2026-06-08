import { defineConfig } from "orval";

export default defineConfig({
  apiServer: {
    input: {
      target: "../../openapi/api-server.json",
      filters: {
        mode: "include",
        tags: ["posts"]
      }
    },
    output: {
      mode: "single",
      target: "src/shared/api/generated/api-server.ts",
      client: "fetch",
      httpClient: "fetch",
      override: {
        fetch: {
          includeHttpResponseReturnType: false
        }
      }
    }
  }
});
