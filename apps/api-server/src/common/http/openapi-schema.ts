import { toJSONSchema, type ZodType } from "zod";

export type OpenApiSchema = {
    [key: string]: unknown;
    type?: string;
    properties?: Record<string, OpenApiSchema>;
    required?: string[];
    items?: OpenApiSchema;
    enum?: unknown[];
    nullable?: boolean;
    additionalProperties?: boolean | OpenApiSchema;
    oneOf?: OpenApiSchema[];
    anyOf?: OpenApiSchema[];
    allOf?: OpenApiSchema[];
    $ref?: string;
};

export function zodToOpenApiSchema(schema: ZodType, options: { io?: "input" | "output" } = {}): OpenApiSchema {
    const openApiSchema = toJSONSchema(schema, {
        target: "openapi-3.0",
        io: options.io ?? "output"
    }) as OpenApiSchema;

    return stripValidationKeywords(openApiSchema) as OpenApiSchema;
}

export function apiSuccessSchema(dataSchema: OpenApiSchema): OpenApiSchema {
    return {
        type: "object",
        required: ["requestId", "data"],
        additionalProperties: false,
        properties: {
            requestId: {
                type: "string"
            },
            data: dataSchema
        }
    };
}

export const apiErrorResponseSchema: OpenApiSchema = {
    type: "object",
    required: ["requestId", "error"],
    additionalProperties: false,
    properties: {
        requestId: {
            type: "string"
        },
        error: {
            type: "object",
            required: ["code", "message"],
            additionalProperties: false,
            properties: {
                code: {
                    type: "string"
                },
                message: {
                    type: "string"
                }
            }
        }
    }
};

const validationKeywordSet = new Set([
    "default",
    "exclusiveMaximum",
    "exclusiveMinimum",
    "format",
    "maxItems",
    "maxLength",
    "maximum",
    "minItems",
    "minLength",
    "minimum",
    "multipleOf",
    "pattern"
]);

function stripValidationKeywords(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => stripValidationKeywords(item));
    }

    if (!isRecord(value)) {
        return value;
    }

    return Object.fromEntries(
        Object.entries(value)
            .filter(([key]) => !validationKeywordSet.has(key))
            .map(([key, nestedValue]) => [key, stripValidationKeywords(nestedValue)])
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
