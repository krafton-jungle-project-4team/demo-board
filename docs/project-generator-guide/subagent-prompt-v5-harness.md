# 서브 에이전트 프롬프트 v5 하네스

v5는 2개 에이전트로 나눠 실행한다.

- 생성 에이전트: `subagent-prompt-v5-generate.md`
- 기능 에이전트: `subagent-prompt-v5-feature.md`

이 분리는 실제 사용자 흐름을 검증하기 위함이다. 생성 프롬프트에 `bookmarks` 구현 세부사항을 섞지 않고, 생성 후 단순 기능 프롬프트만으로 현재 프로젝트 수준의 품질이 나오는지 확인한다.
