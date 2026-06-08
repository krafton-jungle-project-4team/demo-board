import { randomUUID } from "node:crypto";
import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateTodoRequestSchema, type Todo } from "@nmm/shared";

@Controller()
export class AppController {
  private todos: Todo[] = [];

  @Get("health")
  health() {
    return {
      ok: true
    };
  }

  @Get("todos")
  findTodos(): Todo[] {
    return this.todos;
  }

  @Post("todos")
  createTodo(@Body() body: unknown): Todo {
    const dto = CreateTodoRequestSchema.parse(body);

    const todo: Todo = {
      id: randomUUID(),
      title: dto.title,
      done: false
    };

    this.todos.push(todo);

    return todo;
  }
}
