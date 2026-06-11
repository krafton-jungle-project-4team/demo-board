# Vercel Agent Skills Codex 설치

날짜: 2026-06-11

## 이유

`vercel-labs/agent-skills`를 이 저장소의 Codex repo-local skill로 쓰기 위해 설치 형식과 지침을 맞췄다.

## 작업

- 이 메모가 포함된 커밋에서 `.codex/skills/` 아래 Vercel skill 9개를 추가했다.
- 원본 배포용 ZIP, README, metadata, Claude 전용 compiled 문서는 제외했다.
- skill 폴더명을 `SKILL.md`의 `name`과 맞췄다.
- Codex용 `agents/openai.yaml`을 추가했다.
- `WebFetch`, Claude sandbox 경로, secret 출력 예시, skill script 실행 경로를 Codex 환경에 맞게 고쳤다.

## 결과

- Ruby YAML 파서로 9개 skill의 frontmatter, 폴더명, 설명, `agents/openai.yaml` 존재를 검증했다.
- `quick_validate.py`는 현재 Python 환경에 PyYAML이 없어 실행하지 못했다.
- 새 skill 인식에는 Codex 재시작이 필요하다.
