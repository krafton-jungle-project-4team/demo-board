import { useCallback, useEffect, useState } from "react";
import { CreateTodoRequestSchema, type Todo } from "@nmm/shared";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    const res = await fetch("/api/todos");

    if (!res.ok) {
      throw new Error("Failed to fetch todos");
    }

    const data = (await res.json()) as Todo[];
    setTodos(data);
  }, []);

  async function createTodo() {
    setError(null);

    const body = CreateTodoRequestSchema.parse({
      title
    });

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error("Failed to create todo");
    }

    setTitle("");
    await loadTodos();
  }

  useEffect(() => {
    void loadTodos().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    });
  }, [loadTodos]);

  return (
    <main className="app-shell">
      <section className="board">
        <h1>Todo</h1>

        <form
          className="todo-form"
          onSubmit={(event) => {
            event.preventDefault();
            void createTodo().catch((err: unknown) => {
              setError(
                err instanceof Error ? err.message : "Failed to create todo"
              );
            });
          }}
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="title"
            aria-label="Todo title"
          />

          <button type="submit">Add</button>
        </form>

        {error ? <p className="error">{error}</p> : null}

        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id}>
              <span>{todo.title}</span>
              <small>{todo.done ? "done" : "todo"}</small>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
