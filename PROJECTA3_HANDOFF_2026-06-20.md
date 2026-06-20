# 점점점(projecta3) 인수인계 — 2026-06-20

천음(天音) 카드 점사 앱. 이 문서는 현재 상태·구조·편집 위치·남은 작업을 한 번에 잡기 위한 핸드오프다.

---

## 0. 한 줄 개요
- **제품**: "점점점" — 천음 카드 점사 모바일 앱. 두 인격 **화선(낮/양)·화영(밤/음)** = 한 존재의 두 얼굴.
- **스택**: Expo React Native(`mookseoli/`) + Express/TypeScript(`server/`) + Prisma/Neon(Postgres, ap-southeast-1).
- **AI**: 기본 Gemini, **화영=Claude / 화선=OpenAI**(`aspect.config.ts`). 출력은 `stripMarkdown`으로 마크다운 제거.

## 1. 실행 방법
**서버** (`server/`):
```
npx.cmd --yes node@20.19.5 ./node_modules/ts-node/dist/bin.js src/index.ts
```
- ⚠️ 기본 node(22)에서 Prisma `#main-entry-point` 에러 → **반드시 node@20**으로 실행. 스모크 테스트도 `npx --yes node@20.19.5 ...`.

**앱** (`mookseoli/`): `npx expo start` → Expo Go로 폰에서. (expo-secure-store/crypto 포함, Expo Go 동작)
- **`mookseoli/App.tsx:8`의 `API_URL`** = PC의 로컬 LAN IP(`http://192.168.x.x:3001`). **장소 바뀌면 IP 갱신 필요**(반복 이슈). → TODO: `EXPO_PUBLIC_API_URL` 환경변수화.

**제약/보안**:
- `server/.env`(Gemini/Anthropic/OpenAI/Naver/Neon 키)는 **gitignore됨 — 절대 커밋 금지**.
- 사주/육임 레거시 코드는 삭제하지 말 것.

## 2. 천음 시스템 핵심
- **신패 12장**(神牌, major): 양/음 간지(`SINPAE_GANJI` in `cheoneum-divination.service.ts`). 천극·염파·명전·태화·지엄·보원·자은·월령·암류·경연·활도·태허.
- **진패 60장**(眞牌, minor): 60갑자 고정 간지(`cheoneum.cards.ts`), 장군 이름.
- **스프레드 7종**: 일기·양의·통관·천지인·원형이정·순환·낙서구궁.
- **음양**: 화선=양, 화영=음. 신패 간지·여러 배치가 운용에 따라 갈림.
- 룰 전체는 본문 §6 또는 코드(`cheoneum.spreads.ts`, `cheoneum-consultation.service.ts`) 참고. `CHEONEUM_DEPTH_PLAN.md`에 기획 정본.

## 3. 이번까지 구현된 기능 (최근 커밋 순)
- **페르소나**: 화영 **반말 츤데레**(까칠하지만 속은 다정, 천극류 보호 의도), 화선/화영 **영역 분리**(수용 vs 직면), `aspect.config.ts` 톤.
- **출력**: 인사 1~2문장 완화, 해석 인격별 말투(화영=반말 변환), **마크다운 제거**(`ai.service.ts` stripMarkdown).
- **수익화 스텁**: 크레딧+구독(`cheoneum-wallet.service.ts`, in-memory), 페이월/로그인 게이트 UI. **게스트 일기 1회 맛보기 제한**, 로그인 후 일기 무제한.
- **스프레드 시각화 7종**: `getCheoneumLayoutGrid` 단일 격자 — 뽑기 연출(`CheoneumRevealBoard`)·정적 패널 공유, 카드 많으면 화면 맞춤 스케일.
- **관계 엔진**: 앱 공용 `relationship.data.ts` 재사용(`cheoneum-relations.ts`) + 천음 해석(`cheoneum-relation-interpretation.data.ts`). **분야별(byContext: 연애/직장/사업/돈/공부/건강/선택/흐름/일상)** 자동 선택, 관계 블록 **상한(중앙 우선 top6)**.
- **말풍선 분할(Phase 2)**: 페르소나가 빈 줄로 비트 분리 → `splitReplyIntoBubbles`가 `\n\n` 하드경계 존중 → 2~3버블.
- **연속성·같은 판 티키타카(Phase 3)**:
  - 기기 UUID + conversationId **영속(expo-secure-store)**, `X-Device-Id` 헤더 → 앱 재시작에도 대화 복원.
  - 미들웨어가 기기 UUID를 `device:` 소유자로 인정(forbidden 가드 유지), hydrate 인메모리 단락으로 매 턴 DB 왕복 차단.
  - `CheoneumSessionState.lastReading` 저장 → 후속 "그 자리 더 봐줘"가 같은 패를 파고듦(`parseFocusPosition` + `buildCheoneumFocusInsight`).
- **낙서구궁 전면 재설계**:
  - 궁9 스펙(`cheoneum-nakseo.data.ts`: 낙서수·운기·렌즈·마방진·침로·4축·사정사간·지장간 본기) + 신패12 속성(`cheoneum-sinpae-attributes.data.ts`: 길흉·effect·noClash) **v0**.
  - **양/음 이원 운기 엔진**(`cheoneum-nakseo-engine.ts`): 양=납음오행 상생상극, 음=지장간 본기 천간합/충 → 방사·횡액·대로·사정사간. 십성 병행.
- **UI 개선**: 3장↑ 스프레드 **요약 칩 → 탭하면 배치 모달**(1~2장은 인라인). 하단 **맥락별 추천 칩**(분야/후속/되물음/오프너).

## 4. 편집 = 해석이 바뀌는 콘텐츠 파일 (사장님 첨삭 영역)
| 파일 | 내용 |
|---|---|
| `server/src/cheoneum/cheoneum-interpretation.data.ts` | 신패 12 의미 씨앗(coreImage/semanticField/expressionSeeds/readingBias/spreadBias) |
| `server/src/cheoneum/cheoneum-jinpae-interpretation.data.ts` | 진패 60 의미 씨앗 |
| `server/src/cheoneum/cheoneum-relation-interpretation.data.ts` | 관계 해석(합충형파해/국/결합양태/콤보 + byContext 분야별) — **낙서엔 미적용**(낙서는 전용 엔진) |
| `server/src/cheoneum/cheoneum-ilgi-interpretation.logic.ts` | 일기 전용 십성 해석 |
| `server/src/cheoneum/cheoneum-nakseo.data.ts` | 낙서 궁9 의미(lens/vectorFlow) |
| `server/src/cheoneum/cheoneum-sinpae-attributes.data.ts` | 낙서 중궁 신패 방사(길흉/effect/noClash) **v0 — 첨삭 필요** |
| `server/src/aspects/{hwaseon,hwayeong}/persona.md` | 페르소나 |
| 출력 톤/구성(코드 속 텍스트) | `cheoneum-consultation.service.ts`(스프레드별 출력 지침), `cheoneum-nakseo-engine.ts`(운기 판독 문구) |

## 5. 남은 작업 (TODO)
- **신패 12 길흉·effect 첨삭**(`cheoneum-sinpae-attributes.data.ts` v0 → 정본).
- **진패 60 카드 이미지 연동**: `mookseoli/assets/cheoneum/jinpae/`에 `cheoneum-jinpae-XX-...png`(서버 image 필드명과 일치, 비율 ~2:3, ~600×880) + `App.tsx`의 `CHEONEUM_CARD_IMAGES`에 `require()` 60개 등록(RN 동적 require 불가). 현재 신패12만 연동, 진패는 글자 카드 폴백.
- **포커스(같은 판) 자리 선택을 LLM 위임**으로 업그레이드: 현재 `parseFocusPosition`은 방위 키 기반이라 낙서(궁 키)·자연어("그 사람 쪽")에 약함. 궁 렌즈가 생겼으니 의미 기반/LLM 선택으로.
- **실 구글 OAuth**: 현재 `devLogin`은 wallet 플래그만(스텁). 토큰 발급→미들웨어 토큰 우선→`device:` 세션 머지.
- **실 결제(IAP)**: EAS 빌드 + Google Play 결제 + 서버 영수증 검증으로 스텁 교체.
- **배포**: EAS 빌드, 백엔드 호스팅, **https**(기기 UUID가 세션 증명이라 평문 http 위험), `API_URL` 환경변수화.
- **분류기 보정**: 정보성 질문("이직운 뭐야")이 일기를 뽑는 케이스.
- **상위 4종(통관/천지인/원형이정/순환) 십성 해석 텍스트**: 현재 일기 전용만 존재(계산값+골격 지침만).

## 6. 스프레드 룰 요약
공통: 분류(inputType)→깊이(0~5)→스프레드 매핑. 상위 스프레드(통관/천지인/원형이정/순환)는 **깊이5**에서만, 아니면 일기로. 큰판→낙서구궁.

| 스프레드 | 트리거 | 카드 | 음양 반전 | 엔진 |
|---|---|---|---|---|
| 일기 | 막연·오늘·첫고민 | 신패1 | — | 십성+지지페어(전용) |
| 양의 | choice | 진패2(좌우) | 좌우 미래 반전 | 패별 천간 기준+점사시간 |
| 통관 | 관계갈등+깊이5 | 진패2+신패1 | — | 관계+구조(열쇠) |
| 천지인 | 원인+깊이5 | 신패2+진패1 | 천/지 반전 | 관계+구조(천지인) |
| 원형이정 | 흐름+깊이5 | 진패4+신패1(숨은) | 순서 역순 | 관계+구조(시계열) |
| 순환 | 반복+깊이5 | 중앙1+사방4 | 중앙·사방 반전 | 관계+구조(중앙↔사방) |
| 낙서구궁 | 큰판/인생 | 신패1+진패8 | 배치 고정, 엔진이 양/음 | **전용 운기 엔진** |

## 7. 알아둘 코드 지점
- 채팅 파이프라인: `server/src/controllers/fortune.controller.ts` `getMookAFortuneAPI`.
- 개입 결정/분류/출력지침: `cheoneum-consultation.service.ts`(`decideCheoneumIntervention`, `mapSpread`, `buildCheoneumInsight`, `buildCheoneumResponseGuide`, `parseFocusPosition`, `buildCheoneumFocusInsight`).
- 점사 계산/관계 캡/낙서 라우팅: `cheoneum-divination.service.ts`.
- 세션/영속화: `session.service.ts`(lastReading 포함), `persistent-session.service.ts`(device 소유자 + 인메모리 단락), `middleware/authentication.middleware.ts`(X-Device-Id).
- 프론트 단일 파일: `mookseoli/App.tsx`(분할/연출/요약칩·모달/추천칩/identity/apiFetch).

## 8. 검증 상태
- 서버·앱 타입체크(`tsc --noEmit`) 통과. 낙서 엔진·연속성·분할·분야선택 스모크 통과.
- **폰 실제 테스트 미완**(말풍선 2~3개, 재시작 복원, 같은 판 티키타카, 낙서 마방진 배치는 폰에서 눈으로 확인 필요).

## 9. 최근 커밋
- 스프레드 요약 칩+모달 + 맥락별 추천 칩
- 말풍선 분할·연속성·같은 판 티키타카 + 관계 분야별 해석 + 낙서구궁 운기 엔진 재설계
- 화영 츤데레 톤 + 스프레드 7종 시각화 + 마크다운 제거
- 게스트 일기 1회 맛보기 제한 + 로그인 게이트
- 크레딧/구독 결제(스텁) + 페이월 UI + 성능 개선
