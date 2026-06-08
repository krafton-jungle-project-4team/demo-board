import { z } from "zod";

export const TodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  done: z.boolean()
});

export type Todo = z.infer<typeof TodoSchema>;

export const CreateTodoRequestSchema = z.object({
  title: z.string().min(1)
});

export type CreateTodoRequest = z.infer<typeof CreateTodoRequestSchema>;
