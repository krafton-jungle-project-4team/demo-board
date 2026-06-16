# MCP 서버

실거래 데이터를 Agent가 도구로 조회할 수 있게 하는 Streamable HTTP MCP 서버다.

## 실행

```sh
npm run dev:mcp
```

기본 endpoint는 `http://localhost:3002/mcp`다.

## 환경변수

- `NMM_MCP_PORT`: MCP 서버 포트. 기본값 `3002`.
- `NMM_MCP_API_BASE_URL`: API 서버 base URL. Docker 기본값 `http://api-server:3000/api`.
- `NMM_MCP_BEARER_TOKEN`: MCP 요청 검증과 API 서버 호출에 사용할 bearer token.
- `NMM_MCP_ALLOWED_ORIGINS`: 허용할 Origin 목록. 쉼표로 구분한다.
- `NMM_MCP_REQUEST_TIMEOUT_MS`: API 서버 요청 timeout. 기본값 `5000`.

## Tools

- `estate_search_transactions`: `GET /api/estate/transactions`를 호출해 실거래 목록을 검색한다.
- `estate_list_legal_dongs`: `GET /api/estate/legal-dongs`를 호출해 법정동 후보를 반환한다.
- `estate_get_transaction`: `GET /api/estate/transactions/:transactionId`를 호출해 실거래 단건 상세를 반환한다.
- `estate_find_similar_transactions`: `POST /api/estate/ai/transactions/similar`를 호출해 RAG 유사 실거래를 찾는다.
- `estate_summarize_market`: `GET /api/estate/ai/market-summary`를 호출해 시세 요약을 반환한다.

모든 tool은 DB를 직접 읽지 않고 API 서버만 호출한다.

## 확인

```sh
npm run db:migrate
npm run estate:embeddings:sync -- --limit 20
npm run dev:mcp
npm run verify
```

유사 매물 검색은 임베딩이 없으면 `ESTATE_EMBEDDING_NOT_FOUND`를 반환한다.

## 평가 프롬프트

- 잠실동 실거래 최근 목록을 10개만 보여줘.
- 헬리오시티 관련 실거래를 찾아줘.
- 잠실동 법정동 후보가 있는지 확인해줘.
- 실거래 ID 1번의 상세 정보를 보여줘.
- 송파구 아파트 80제곱미터 이상 거래의 시세를 요약해줘.
- 헬리오시티 80제곱미터 이상 최근 거래금액 범위를 알려줘.
- 취소 거래를 제외하고 방이동 오피스텔 시세를 요약해줘.
- 취소 거래를 포함하면 오금동 거래 요약이 어떻게 달라지는지 확인해줘.
- 거래 ID 1번과 유사한 실거래를 찾아줘.
- “잠실 84제곱 아파트 최근 거래”와 비슷한 실거래를 찾아줘.
- 유사 매물 검색에서 임베딩이 없을 때 어떤 조치가 필요한지 알려줘.
