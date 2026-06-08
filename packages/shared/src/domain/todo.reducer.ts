import type { Todo } from "../contracts/todo.contract";

export type TodoState = {
  todos: Record<string, Todo>;
};

export const initialTodoState: TodoState = {
  todos: {}
};

export type TodoEvent =
  | { type: "todo.created"; payload: Todo }
  | { type: "todo.updated"; payload: Todo }
  | { type: "todo.deleted"; payload: { id: string } };

export function todoReducer(state: TodoState, event: TodoEvent): TodoState {
  switch (event.type) {
    case "todo.created":
    case "todo.updated":
      return {
        ...state,
        todos: {
          ...state.todos,
          [event.payload.id]: event.payload
        }
      };

    case "todo.deleted": {
      const next = { ...state.todos };
      delete next[event.payload.id];
      return { ...state, todos: next };
    }
  }
}
