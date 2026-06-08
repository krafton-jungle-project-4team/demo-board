# NMM 워크스페이스 보일러플레이트 구성

날짜: 2026-06-08

## 이유

`Temp.md`의 진행 문서를 기준으로 npm workspaces + Vite React TS + Nest API + shared 패키지 보일러플레이트를 실제 동작 가능한 상태로 만들기 위해서다.
001에서 프로젝트 목적과 AI 기록 규칙만 정리된 상태였으므로, 실제 개발을 시작할 수 있는 최소 앱 구조가 필요했다.

## 작업

- 기준 커밋: `e87691d`
- 완료 커밋: 이 메모가 포함된 커밋
- 루트 npm workspaces, `apps/web-client`, `apps/api-server`, `packages/shared`를 구성했다.
- shared 계약/도메인 코드, Vite proxy, Nest API, React Todo 화면을 추가했다.
- 최신 TypeScript/tsup 환경에서 동작하도록 `ignoreDeprecations`, shared conditional exports, shared watch clean 설정을 보완했다.
- `npm install`로 workspace lockfile을 생성했다.
- 이 작업은 이후 003 프로젝트 표준 검증과 004 TSConfig 정리의 기반이 되었다.

## 결과

- `npm run build`: 통과
- `npm run typecheck`: 통과
- `npm run dev`: shared/web/api 동시 실행 확인
- `curl http://localhost:5173/`: Vite HTML 응답 확인
- `curl http://localhost:3000/api/health`: `{"ok":true}` 확인
- `POST /api/todos` 후 `GET /api/todos`: 생성된 todo 조회 확인

## Temp.md 원문

아래는 `@nmm` 기준 **CLI 순서형 세팅 가이드**다.
기준은 **npm workspaces + Vite React TS + Nest API + shared 패키지**다.

Vite는 `npm create vite@latest ... -- --template react-ts` 형식을 지원하고, Nest CLI는 `nest new <name>`과 `--skip-install`, `--skip-git`, `--package-manager`, `--strict` 옵션을 지원한다. npm workspaces는 루트 `package.json`의 `workspaces`에 선언된 로컬 패키지를 `npm install` 때 자동 symlink한다. ([vitejs][1])

---

## 0. Node/npm 확인

```bash
node -v
npm -v
```

Vite 최신 버전은 Node.js `20.19+` 또는 `22.12+`를 요구한다. 가능하면 Node 22 LTS 계열을 쓰는 게 낫다. ([vitejs][1])

---

## 1. 루트 생성

```bash
mkdir nmm
cd nmm

npm init -y
mkdir -p apps packages
```

루트 `package.json` 생성:

```bash
cat > package.json <<'EOF'
{
  "name": "@nmm/root",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "predev": "npm run build -w @nmm/shared",
    "dev": "concurrently -n shared,web,api \"npm run dev -w @nmm/shared\" \"npm run dev -w @nmm/web-client\" \"npm run start:dev -w @nmm/api-server\"",

    "dev:web": "npm run dev -w @nmm/web-client",
    "dev:api": "npm run start:dev -w @nmm/api-server",
    "dev:shared": "npm run dev -w @nmm/shared",

    "build": "npm run build -w @nmm/shared && npm run build -w @nmm/web-client && npm run build -w @nmm/api-server",
    "build:web": "npm run build -w @nmm/web-client",
    "build:api": "npm run build -w @nmm/api-server",
    "build:shared": "npm run build -w @nmm/shared",

    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "devDependencies": {
    "concurrently": "latest"
  }
}
EOF
```

---

## 2. Vite web-client 생성

```bash
npm create vite@latest apps/web-client -- --template react-ts
```

`apps/web-client/package.json` 수정:

```bash
node - <<'NODE'
const fs = require("fs");

const path = "apps/web-client/package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

pkg.name = "@nmm/web-client";
pkg.private = true;

pkg.scripts = {
  dev: "vite --port 5173",
  build: "tsc -p tsconfig.app.json --noEmit && vite build",
  typecheck: "tsc -p tsconfig.app.json --noEmit",
  preview: "vite preview"
};

pkg.dependencies = {
  ...pkg.dependencies,
  "@nmm/shared": "file:../../packages/shared"
};

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE
```

---

## 3. Nest api-server 생성

```bash
cd apps

npx @nestjs/cli@latest new api-server \
  --strict \
  --package-manager npm \
  --skip-install \
  --skip-git

cd ..
```

`apps/api-server/package.json` 수정:

```bash
node - <<'NODE'
const fs = require("fs");

const path = "apps/api-server/package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));

pkg.name = "@nmm/api-server";
pkg.private = true;

pkg.scripts = {
  ...pkg.scripts,
  typecheck: "tsc -p tsconfig.json --noEmit"
};

pkg.dependencies = {
  ...pkg.dependencies,
  "@nmm/shared": "file:../../packages/shared"
};

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE
```

기본 테스트 파일은 나중에 컨트롤러를 바꾸면 깨질 수 있으므로 일단 제거:

```bash
rm -f apps/api-server/src/app.controller.spec.ts
```

---

## 4. shared 패키지 생성

```bash
mkdir -p packages/shared/src/contracts
mkdir -p packages/shared/src/domain
```

`packages/shared/package.json`:

```bash
cat > packages/shared/package.json <<'EOF'
{
  "name": "@nmm/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "latest"
  },
  "devDependencies": {
    "tsup": "latest",
    "typescript": "latest"
  }
}
EOF
```

`tsup`은 TypeScript 라이브러리를 ESM/CJS 등 여러 포맷으로 번들링할 수 있다. 여기서는 Vite 쪽 ESM과 Nest 쪽 CJS 호환성을 같이 잡기 위해 `esm,cjs` 둘 다 빌드한다. ([Tsup][2])

---

## 5. shared 빌드 설정

`packages/shared/tsup.config.ts`:

```bash
cat > packages/shared/tsup.config.ts <<'EOF'
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".js" : ".cjs"
    };
  }
});
EOF
```

---

## 6. TypeScript 공통 설정

루트 `tsconfig.base.json`:

```bash
cat > tsconfig.base.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
EOF
```

`packages/shared/tsconfig.json`:

```bash
cat > packages/shared/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "noEmit": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "tsup.config.ts"]
}
EOF
```

`apps/web-client/tsconfig.app.json`:

```bash
cat > apps/web-client/tsconfig.app.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "noEmit": true,
    "types": ["vite/client"],
    "verbatimModuleSyntax": true
  },
  "include": ["src"]
}
EOF
```

`apps/api-server/tsconfig.json`:

```bash
cat > apps/api-server/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",

    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    "sourceMap": true,
    "declaration": true,

    "verbatimModuleSyntax": false
  },
  "include": ["src"]
}
EOF
```

---

## 7. shared 코드 작성

`packages/shared/src/contracts/todo.contract.ts`:

```bash
cat > packages/shared/src/contracts/todo.contract.ts <<'EOF'
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
EOF
```

`packages/shared/src/domain/todo.reducer.ts`:

```bash
cat > packages/shared/src/domain/todo.reducer.ts <<'EOF'
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
EOF
```

`packages/shared/src/index.ts`:

```bash
cat > packages/shared/src/index.ts <<'EOF'
export * from "./contracts/todo.contract";
export * from "./domain/todo.reducer";
EOF
```

---

## 8. Vite proxy 설정

`apps/web-client/vite.config.ts`:

```bash
cat > apps/web-client/vite.config.ts <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
});
EOF
```

FE에서 `/api/todos`를 호출하면 개발 중에는 Vite dev server가 `http://localhost:3000/api/todos`로 넘긴다.

---

## 9. Nest main 설정

`apps/api-server/src/main.ts`:

```bash
cat > apps/api-server/src/main.ts <<'EOF'
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");

  app.enableCors({
    origin: "http://localhost:5173",
    credentials: true
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
EOF
```

---

## 10. Nest 컨트롤러에서 shared 사용

`apps/api-server/src/app.controller.ts`:

```bash
cat > apps/api-server/src/app.controller.ts <<'EOF'
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
      id: crypto.randomUUID(),
      title: dto.title,
      done: false
    };

    this.todos.push(todo);

    return todo;
  }
}
EOF
```

---

## 11. React App에서 shared 사용

`apps/web-client/src/App.tsx`:

```bash
cat > apps/web-client/src/App.tsx <<'EOF'
import { useEffect, useState } from "react";
import type { Todo } from "@nmm/shared";
import { CreateTodoRequestSchema } from "@nmm/shared";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");

  async function loadTodos() {
    const res = await fetch("/api/todos");

    if (!res.ok) {
      throw new Error("Failed to fetch todos");
    }

    const data = (await res.json()) as Todo[];
    setTodos(data);
  }

  async function createTodo() {
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
    void loadTodos();
  }, []);

  return (
    <main>
      <h1>Todo</h1>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="title"
      />

      <button type="button" onClick={() => void createTodo()}>
        Add
      </button>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title} / {todo.done ? "done" : "todo"}
          </li>
        ))}
      </ul>
    </main>
  );
}
EOF
```

---

## 12. 설치

루트에서 실행:

```bash
npm install
```

npm workspaces에서는 `npm install <pkg> -w <workspace>`로 특정 workspace에 의존성을 추가할 수 있다. 예를 들어 FE에만 Zustand를 넣고 싶으면 `npm install zustand -w @nmm/web-client`처럼 쓴다. ([npm 문서][3])

---

## 13. shared 빌드

```bash
npm run build:shared
```

빌드 결과:

```txt
packages/shared/dist/
  index.js
  index.cjs
  index.d.ts
```

---

## 14. 타입 체크

```bash
npm run typecheck
```

---

## 15. 개발 서버 실행

```bash
npm run dev
```

실행 주소:

```txt
web-client: http://localhost:5173
api-server: http://localhost:3000
```

API 테스트:

```bash
curl http://localhost:3000/api/health
```

예상 결과:

```json
{"ok":true}
```

Todo 생성 테스트:

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"first todo"}'
```

---

## 최종 구조

```txt
nmm/
  apps/
    web-client/
      src/
      package.json
      vite.config.ts
      tsconfig.app.json

    api-server/
      src/
      package.json
      tsconfig.json

  packages/
    shared/
      src/
        contracts/
          todo.contract.ts
        domain/
          todo.reducer.ts
        index.ts
      package.json
      tsconfig.json
      tsup.config.ts

  package.json
  package-lock.json
  tsconfig.base.json
```

## 이후 의존성 추가 규칙

```bash
# FE 전용
npm install zustand -w @nmm/web-client
npm install @tanstack/react-query -w @nmm/web-client

# BE 전용
npm install @nestjs/config -w @nmm/api-server
npm install prisma @prisma/client -w @nmm/api-server

# shared 전용
npm install zod -w @nmm/shared

# 루트 도구
npm install -D prettier eslint
```

규칙:

```txt
apps/web-client -> @nmm/shared
apps/api-server -> @nmm/shared

web-client -> api-server 직접 import 금지
api-server -> web-client 직접 import 금지
shared -> React/Nest/DB import 금지
```

[1]: https://vite.dev/guide/ "Getting Started | Vite"
[2]: https://tsup.egoist.dev/?utm_source=chatgpt.com "tsup"
[3]: https://docs.npmjs.com/cli/v7/using-npm/workspaces/ "workspaces | npm Docs"
