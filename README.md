# NMM Template

React, NestJS, shared contract, UI package를 묶은 앱 템플릿이다.

## 실행

```sh
npm install
npm run db:migrate
npm run dev
```

## 확인

```sh
npm run verify
```

## 실거래 RAG 임베딩

```sh
npm run db:migrate
npm run estate:embeddings:sync -- --limit 20
```

`OPENAI_API_KEY`가 있어야 임베딩을 생성한다.

## MCP 서버

```sh
npm run dev:mcp
```

MCP endpoint는 기본 `http://localhost:3002/mcp`다.
