# 문서 지침

## 범위

- `docs`에 적용한다.
- 같은 의미를 유지하는 한 가장 짧게 쓴다.

## AI 기록

- 의미 있는 AI 작업은 `docs/ai`에 기록한다.
- 이유, 작업, 결과를 포함한다.
- 메모가 포함된 커밋은 `이 메모가 포함된 커밋`으로 적는다.
- 날짜는 파일명이 아니라 문서 안에 적는다.

## 프로젝트 생성기 문서

- 반복 근거는 `docs/project-generator-guide/iterations.md`에 둔다.
- Prompt/harness 지침은 짧고 바로 검증 가능하게 쓴다.
- 생성 프로젝트 경로, 점수, verify 결과, 다음 변경을 기록한다.

## 스킬

- 문장 수정에는 `writing-guidelines`를 적용한다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
