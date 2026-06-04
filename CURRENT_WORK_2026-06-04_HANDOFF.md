# 점점점 작업 인수인계 - 2026-06-04

## 상황
수원 로컬에서 작업한 내용을 정리한다.
현재는 아직 수원 로컬에서 작업 중이다.
청주 로컬 전환은 2026-06-05부터 예정되어 있다.

이 문서는 청주 로컬에서 `git pull` 이후 어떤 작업이 들어왔는지, 어떤 설정을 확인해야 하는지, 다음 작업 방향이 무엇인지 빠르게 이어가기 위한 인수인계 문서다.

## 오늘의 핵심 변경

1. 화선/화영 페르소나 분리
2. AI provider 분리
3. Claude 연결
4. 방어모드 1차 구축
5. 방어모드 프론트 연출 분리
6. 방어 테스트 매트릭스 문서 작성
7. 첫 상담 진입 flow 러프 문서 작성
8. 천음 도구 개념 정리

## 현재 앱 구조 요약

앱 이름은 `점점점`.

기존 `묵설`은 사용자 노출 캐릭터에서 제거 방향.
현재 상담자는 시간대에 따라 다음으로 분리된다.

- 낮: `화선낭자`
- 밤: `화영낭자`

현재 프론트 흐름:

```text
네이티브 스플래시
-> 내부 스플래시
-> 입장 화면
-> 채팅 화면
```

현재 `mookseoli/App.tsx` 기준 API URL:

```ts
const API_URL = 'http://192.168.45.21:3001';
```

청주 로컬로 이동하면 이 IP는 청주 PC IPv4로 다시 확인해서 바꿔야 한다.

## 프론트 변경 요약

파일:

```text
mookseoli/App.tsx
```

주요 변경:

- 화선/화영 aspect 기준 UI
- 화선/화영 avatar/splash/entrance asset 경로 분리
- 헤더 아바타 제거
- 메시지 아바타 확대
- AI 메시지 프론트 chunking
- 방어 응답 전용 message kind 추가
- 방어 응답 말풍선 스타일 분리
- 방어 라벨 표시
- 방어 잠김 시 placeholder 변경

방어 라벨:

```text
질문 대기
질문 확인
상담 기준
대화 온도 조절
안전 경계
복귀 확인
상담 흐름 일시 정지
```

방어 응답은 일반 AI 응답보다 덜 쪼개지도록 최대 2개 말풍선으로 제한.

## 프론트 asset 정리

기존 flat asset 파일들은 aspect 폴더로 이동되었다.

현재 구조:

```text
mookseoli/assets/aspects/hwaseon/avatar.png
mookseoli/assets/aspects/hwaseon/avatar-source.png
mookseoli/assets/aspects/hwaseon/entrance.png
mookseoli/assets/aspects/hwaseon/splash.png
mookseoli/assets/aspects/hwaseon/splash-source.png

mookseoli/assets/aspects/hwayeong/avatar.png
mookseoli/assets/aspects/hwayeong/avatar-source.png
mookseoli/assets/aspects/hwayeong/entrance.png
mookseoli/assets/aspects/hwayeong/splash.png
mookseoli/assets/aspects/hwayeong/splash-source.png
```

git status에서 기존 asset 삭제가 보이는 것은 파일을 새 폴더로 옮겼기 때문.

## 서버 변경 요약

### Aspect 분리

추가/수정:

```text
server/src/aspects/aspect.types.ts
server/src/aspects/aspect.config.ts
server/src/aspects/hwaseon/persona.md
server/src/aspects/hwayeong/persona.md
```

현재 provider:

```text
화선낭자 -> gemini
화영낭자 -> claude
```

화영 페르소나는 반존댓말 방향으로 수정됨.

화영 말투 원칙:

```text
기본은 반존댓말.
존댓말과 반말을 적당히 섞되, 무례하거나 저급하게 들리면 안 된다.
반말은 짧은 직면이나 마지막 한마디에만 섞는다.
```

### AI provider

파일:

```text
server/src/ai/ai.service.ts
```

현재 구조:

- Gemini: `GEMINI_API_KEY`
- Claude: `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`

Claude 호출은 Anthropic Messages API 사용:

```text
https://api.anthropic.com/v1/messages
anthropic-version: 2023-06-01
```

기본 Claude 모델:

```env
CLAUDE_MODEL=claude-sonnet-4-5-20250929
```

### 환경변수

기준 파일:

```text
server/.env
```

필수:

```env
DATABASE_URL=...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
CLAUDE_MODEL=claude-sonnet-4-5-20250929
```

`server/src/.env`에 있던 Gemini key는 중복이므로 삭제 가능.
단, 삭제 전 `server/.env`에 `GEMINI_API_KEY`가 들어 있는지 확인할 것.

`server/.env.example`도 Claude 기준으로 수정됨.

## 방어모드 구현

추가 파일:

```text
server/src/services/defense.service.ts
```

수정 파일:

```text
server/src/services/session.service.ts
server/src/controllers/fortune.controller.ts
mookseoli/App.tsx
```

방어 유형:

```text
vague
laugh
test
attack
unsafe
return_intent
```

방어 단계:

```text
1회: 가볍게 되묻기
2회: 더 분명히 안내
3회 이상: 상담 흐름 일시 정지
```

복귀 조건:

- 진짜 고민으로 보이는 메시지
- 복귀 의사 문장

복귀 의사 예:

```text
미안 질문할게
장난 그만할게
제대로 물어볼게
다시 말할게
진지하게 질문할게
```

복귀 의사는 AI 호출 없이 방어 해제 후 질문 유도 응답을 반환.

화선 복귀 응답:

```text
괜찮아요. 그럼 다시 천천히 볼게요. 궁금한 걸 한 문장으로 말해주세요.
```

화영 복귀 응답:

```text
좋아요. 그럼 묻고 싶은 걸 정확히 말해봐요. 답해줄게.
```

화영 `ㅋㅋㅋ` 1회 방어 응답은 고정:

```text
웃지말고 묻고 싶은 걸 말해봐요. 답해줄게.
```

## 새로 작성한 문서

### 방어 테스트 매트릭스

```text
DEFENSE_TEST_MATRIX.md
```

용도:

- 내부 QA용
- 코딩 테스트가 아니라 사람이 직접 채팅창에 입력해보는 시나리오 표
- 베타테스트 피드백 기준표

포함 내용:

- 방어 유형
- 단계 기준
- 기본 입력 테스트
- 잠김/복귀 시나리오
- 화선/화영 체크 포인트
- 프론트 UX 체크 포인트
- 베타테스트 운영 메모

### 첫 상담 진입 flow draft

```text
CONSULTATION_ENTRY_FLOW_DRAFT.md
```

용도:

- 해석 flow 진입 전 러프 설계
- 사용자 입력 유형별 우선 도구 정리
- 생년월일 요청 타이밍 정리
- 향후 `consultation-router.service.ts` 분리 후보 정리

핵심 원칙:

```text
첫 입력부터 생년월일을 요구하지 말고,
먼저 상담처럼 받아준 뒤,
필요할 때만 정보를 묻는다.
```

## 천음 도구 개념 정리

사용자가 오늘 정의한 신규 핵심 도구.
아직 코드 구현 전.

### 천음이란

`천음`은 사용자가 만든 동양타로/동양 점술 체계.

구성:

```text
12개의 메이저 카드
60개의 마이너 카드
```

사용 방식:

- 타로와 비슷함
- 동양 점술 기반
- 토속신앙/무속의 무구에 가까운 이미지
- 사용자에게 노출되는 이름도 `천음`
- 내부 도구명도 `천음`

### 화선/화영의 천음 사용 비중

천음은 하나지만 운용 방식은 둘로 갈린다.

```text
양의 천음
음의 천음
```

화선:

```text
양의 천음 6 : 음의 천음 4
```

화영:

```text
양의 천음 4 : 음의 천음 6
```

이 비중은 말투만이 아니라 로직으로 구현해야 함.

### 천음의 위치

천음은 무료/유료 모든 곳에서 쓰이는 메인 도구.

새 도구 위계:

```text
공통: 천음
무료: 천음 + 육임 단시점
유료: 천음 + 육임정단 + 귀장술
```

기존 도구들은 천음을 중심으로 보조/심화 도구가 된다.

### 고민 알아맞추기

사용자가 반응이 없거나, 말하기를 거부하거나, 말이 너무 짧을 때:

```text
천음래정 + 선봉문 + 귀장래정
```

이 조합을 쓸 수 있다.

현재 판단:

- 별도 메인 flow보다 방어모드/무응답 대응/말문 열기 flow에 녹이는 것이 적합

### 천음 결과 UX

천음은 시각 효과가 중요하다.

결과 노출:

```text
카드 이미지
+
말풍선 해석
```

즉 채팅에 텍스트만 보내는 것이 아니라, 카드 이미지가 같이 노출되어야 한다.

## 앞으로의 추천 순서

### 1. 천음 정의 문서 작성

파일 후보:

```text
CHEONEUM_TOOL_DRAFT.md
```

정리할 것:

- 천음 카드 구조
- 메이저 12장
- 마이너 60장
- 양의 천음/음의 천음
- 카드 추첨 로직
- 화선/화영 비중 로직
- 카드 이미지 naming 규칙
- 무료/유료 도구 결합 방식
- 결과 말풍선/카드 UI 방식

### 2. 천음 v0 얇은 구현

첫 구현 목표:

```text
사용자 입력
-> 천음 카드 1장 또는 3장 선택
-> 양/음 비중 적용
-> 카드 이미지 + 짧은 해석 반환
```

처음부터 완전한 점술 엔진으로 만들지 말고, 구조를 먼저 만든다.

### 3. 상담 flow 재정리

천음이 메인 도구가 되므로 기존 flow draft는 천음 중심으로 다시 보정해야 한다.

예상 flow:

```text
사용자 입력
-> 방어모드
-> 천음
-> 무료/유료 여부 판단
-> 육임 단시점/육임정단/귀장술 결합
-> 카드 이미지 + 말풍선 해석
```

## 실행/검증 명령

### 서버 실행

수원 로컬에서 사용하던 Node 20 명령:

```bash
cd "/d/아티부/projecta3/server"
npx --yes node@20.19.5 ./node_modules/ts-node/dist/bin.js src/index.ts
```

청주 로컬에서도 Node 버전 문제가 있으면 같은 방식 사용.

### 프론트 실행

asset/프론트 변경이 안 보이면 캐시 삭제:

```bash
cd "/d/아티부/projecta3/mookseoli"
npx expo start -c
```

### 검증

마지막 확인 기준:

```bash
cd server
npm.cmd run build

cd ../mookseoli
npx.cmd tsc --noEmit
```

최근 작업 후 둘 다 통과했음.

PowerShell에서 `npm`/`npx`가 실행 정책 때문에 막히면 `npm.cmd`, `npx.cmd`를 사용.

## 청주 로컬에서 먼저 할 일

1. `git pull`
2. `server/.env` 확인
3. `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `DATABASE_URL` 확인
4. PC IPv4 확인
5. `mookseoli/App.tsx`의 `API_URL`을 청주 PC IP로 수정
6. 서버 재실행
7. Expo `-c`로 실행
8. 방어 테스트 간단 확인
9. 천음 정의 문서 작성부터 이어가기

## 현재 git 상태 참고

작업은 아직 커밋되지 않음.

주요 변경/추가:

```text
M mookseoli/App.tsx
M server/.env.example
M server/src/ai/ai.service.ts
M server/src/controllers/fortune.controller.ts
M server/src/services/mookA.service.ts
M server/src/services/session.service.ts
D server/src/ai/mookA_persona.md
?? server/src/aspects/
?? server/src/services/defense.service.ts
?? mookseoli/assets/aspects/
?? DEFENSE_TEST_MATRIX.md
?? CONSULTATION_ENTRY_FLOW_DRAFT.md
?? CURRENT_WORK_2026-06-04_HANDOFF.md
```

기존 asset 삭제로 보이는 항목은 aspect 폴더로 이동된 결과.

## 주의할 점

- `.env`는 커밋하지 말 것.
- 실제 API key는 문서나 채팅에 적지 말 것.
- `server/src/.env`는 중복이므로 정리 가능하지만, 삭제 전 `server/.env`에 키가 다 있는지 확인.
- 청주 로컬 IP로 바꾸는 것은 로컬 환경 변경 사항이므로 커밋 전 주의.
- 천음은 아직 코드 구현 전이므로, 다음 작업에서 먼저 정의 문서를 만드는 것이 좋음.
