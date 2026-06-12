import { z } from "zod";

export const ExampleResponseSchema = z.object({
    id: z.number().int().positive(),
    message: z.string().min(1),
    createdAt: z.string().datetime()
});

export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;
