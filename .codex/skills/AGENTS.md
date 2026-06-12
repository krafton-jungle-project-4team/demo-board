# 스킬 지침

## 범위

- `.codex/skills`에 적용한다.

## 스킬 형식

- 각 skill은 `SKILL.md`를 가진다.
- `SKILL.md`는 짧게 쓴다.
- 자세한 규칙은 필요할 때 `references/`에 둔다.
- UI metadata가 필요한 skill은 `agents/openai.yaml`을 둔다.

## 출처

- 외부 변환 skill은 원본 URL, license, 적용 범위를 기록한다.
- 관련 없는 upstream 문서를 대량 복사하지 않는다.

## 검증

- Skill 지침에는 사용 조건과 사용 증거 artifact를 적는다.
- 생성 프로젝트에는 `docs/generation/skill-usage.md`를 요구한다.

## 확인

- 변경 후 루트 `npm run verify`를 실행한다.
