# 천음 도구 설계 Draft v0

## 목적
`천음`은 점점점의 메인 점술 도구다.
이 문서는 천음의 세계관, 카드 구조, 화선/화영별 운용 방식, 기존 도구와의 관계, UX 노출 방식을 정리하기 위한 초안이다.

아직 코드 구현 전 문서이며, 이후 카드 데이터/이미지/추첨 로직/해석 flow 설계의 기준으로 사용한다.

## 한 줄 정의
천음은 12개의 메이저 카드와 60개의 마이너 카드로 구성된, 점점점 고유의 동양타로식 점술 체계다.

## 정체
천음은 사용자가 직접 만든 동양 점술이다.
사용 방식은 타로와 비슷하지만, 서양 타로가 아니라 동양의 점술/토속신앙/무속적 감각을 바탕으로 한다.

천음은 단순 보조 해석기가 아니라, 점점점에서 사용자가 직접 보게 되는 대표 점술 도구다.

## 이름

| 구분 | 값 |
|---|---|
| 사용자 노출명 | 천음 |
| 내부 도구명 | cheoneum 또는 천음 |
| 성격 | 메인 점술 도구 |
| UX 형태 | 카드 이미지 + 말풍선 해석 |

## 카드 구조

천음은 총 72장의 카드로 구성된다.

```text
신패(神牌, 메이저) 12장
진패(塵牌, 마이너) 60장
```

상징, 세부 의미, 양/음 해석은 카드명만 먼저 확정한 뒤 해석 설계 단계에서 한 장씩 확장한다.

### 신패(神牌, 메이저)

역할:
- 큰 흐름
- 운명의 중심축
- 질문의 핵심 장면
- 상담의 주제 선언

개수:

```text
12장
```

#### 신패 12장 목록

| 번호 | ID | 카드명 | 이미지 파일명 |
|---:|---|---|---|
| 01 | `sinpae-01-cheongeuk` | 천극 (天極) | `cheoneum-sinpae-01-cheongeuk.png` |
| 02 | `sinpae-02-yeompa` | 염파 (炎波) | `cheoneum-sinpae-02-yeompa.png` |
| 03 | `sinpae-03-myeongjeon` | 명전 (明典) | `cheoneum-sinpae-03-myeongjeon.png` |
| 04 | `sinpae-04-taehwa` | 태화 (太和) | `cheoneum-sinpae-04-taehwa.png` |
| 05 | `sinpae-05-jieom` | 지엄 (地嚴) | `cheoneum-sinpae-05-jieom.png` |
| 06 | `sinpae-06-bowon` | 보원 (寶源) | `cheoneum-sinpae-06-bowon.png` |
| 07 | `sinpae-07-jaeun` | 자은 (慈恩) | `cheoneum-sinpae-07-jaeun.png` |
| 08 | `sinpae-08-wolyeong` | 월영 (月影) | `cheoneum-sinpae-08-wolyeong.png` |
| 09 | `sinpae-09-amnyu` | 암류 (暗流) | `cheoneum-sinpae-09-amnyu.png` |
| 10 | `sinpae-10-gyeongyeon` | 경연 (慶宴) | `cheoneum-sinpae-10-gyeongyeon.png` |
| 11 | `sinpae-11-hwaldo` | 활도 (活刀) | `cheoneum-sinpae-11-hwaldo.png` |
| 12 | `sinpae-12-taeheo` | 태허 (太虛) | `cheoneum-sinpae-12-taeheo.png` |

### 진패(塵牌, 마이너)

역할:
- 구체적 상황
- 감정의 결
- 사건의 움직임
- 현실적인 선택지

개수:

```text
60장
```

진패는 육십갑자를 기반으로 하며, 각 갑자에 대응하는 장군명을 가진다.

#### 진패 60장 목록

| 번호 | 간지 | 카드명 | ID | 이미지 파일명 |
|---:|---|---|---|---|
| 01 | 갑자 | 김변장군 | `jinpae-01-gapja-gimbyeon` | `cheoneum-jinpae-01-gapja-gimbyeon.png` |
| 02 | 병자 | 곽가장군 | `jinpae-02-byeongja-gwakga` | `cheoneum-jinpae-02-byeongja-gwakga.png` |
| 03 | 무자 | 추당장군 | `jinpae-03-muja-chudang` | `cheoneum-jinpae-03-muja-chudang.png` |
| 04 | 경자 | 노비장군 | `jinpae-04-gyeongja-nobi` | `cheoneum-jinpae-04-gyeongja-nobi.png` |
| 05 | 임자 | 구덕장군 | `jinpae-05-imja-gudeok` | `cheoneum-jinpae-05-imja-gudeok.png` |
| 06 | 을축 | 진재장군 | `jinpae-06-eulchuk-jinjae` | `cheoneum-jinpae-06-eulchuk-jinjae.png` |
| 07 | 정축 | 탕금장군 | `jinpae-07-jeongchuk-tanggeum` | `cheoneum-jinpae-07-jeongchuk-tanggeum.png` |
| 08 | 기축 | 부우장군 | `jinpae-08-gichuk-buu` | `cheoneum-jinpae-08-gichuk-buu.png` |
| 09 | 신축 | 양신장군 | `jinpae-09-sinchuk-yangsin` | `cheoneum-jinpae-09-sinchuk-yangsin.png` |
| 10 | 계축 | 주득장군 | `jinpae-10-gyechuk-judeuk` | `cheoneum-jinpae-10-gyechuk-judeuk.png` |
| 11 | 갑인 | 장조장군 | `jinpae-11-gabin-jangjo` | `cheoneum-jinpae-11-gabin-jangjo.png` |
| 12 | 병인 | 함장장군 | `jinpae-12-byeongin-hamjang` | `cheoneum-jinpae-12-byeongin-hamjang.png` |
| 13 | 무인 | 노선장군 | `jinpae-13-muin-noseon` | `cheoneum-jinpae-13-muin-noseon.png` |
| 14 | 경인 | 우환장군 | `jinpae-14-gyeongin-uhwan` | `cheoneum-jinpae-14-gyeongin-uhwan.png` |
| 15 | 임인 | 하악장군 | `jinpae-15-imin-haak` | `cheoneum-jinpae-15-imin-haak.png` |
| 16 | 을묘 | 만청장군 | `jinpae-16-eulmyo-mancheong` | `cheoneum-jinpae-16-eulmyo-mancheong.png` |
| 17 | 정묘 | 심흥장군 | `jinpae-17-jeongmyo-simheung` | `cheoneum-jinpae-17-jeongmyo-simheung.png` |
| 18 | 기묘 | 용중장군 | `jinpae-18-gimyo-yongjung` | `cheoneum-jinpae-18-gimyo-yongjung.png` |
| 19 | 신묘 | 펌수장군 | `jinpae-19-sinmyo-peomsu` | `cheoneum-jinpae-19-sinmyo-peomsu.png` |
| 20 | 계묘 | 피시장군 | `jinpae-20-gyemyo-pisi` | `cheoneum-jinpae-20-gyemyo-pisi.png` |
| 21 | 갑진 | 이성장군 | `jinpae-21-gapjin-iseong` | `cheoneum-jinpae-21-gapjin-iseong.png` |
| 22 | 병진 | 신아장군 | `jinpae-22-byeongjin-sina` | `cheoneum-jinpae-22-byeongjin-sina.png` |
| 23 | 무진 | 조달장군 | `jinpae-23-mujin-jodal` | `cheoneum-jinpae-23-mujin-jodal.png` |
| 24 | 경진 | 동덕장군 | `jinpae-24-gyeongjin-dongdeok` | `cheoneum-jinpae-24-gyeongjin-dongdeok.png` |
| 25 | 임진 | 팽태장군 | `jinpae-25-imjin-paengtae` | `cheoneum-jinpae-25-imjin-paengtae.png` |
| 26 | 을사 | 오수장군 | `jinpae-26-eulsa-osu` | `cheoneum-jinpae-26-eulsa-osu.png` |
| 27 | 정사 | 양언장군 | `jinpae-27-jeongsa-yangeon` | `cheoneum-jinpae-27-jeongsa-yangeon.png` |
| 28 | 기사 | 곽찬장군 | `jinpae-28-gisa-gwakchan` | `cheoneum-jinpae-28-gisa-gwakchan.png` |
| 29 | 신사 | 정단장군 | `jinpae-29-sinsa-jeongdan` | `cheoneum-jinpae-29-sinsa-jeongdan.png` |
| 30 | 계사 | 서단장군 | `jinpae-30-gyesa-seodan` | `cheoneum-jinpae-30-gyesa-seodan.png` |
| 31 | 갑오 | 장사장군 | `jinpae-31-gabo-jangsa` | `cheoneum-jinpae-31-gabo-jangsa.png` |
| 32 | 병오 | 문철장군 | `jinpae-32-byeongo-muncheol` | `cheoneum-jinpae-32-byeongo-muncheol.png` |
| 33 | 무오 | 이경장군 | `jinpae-33-muo-igyeong` | `cheoneum-jinpae-33-muo-igyeong.png` |
| 34 | 경오 | 왕제장군 | `jinpae-34-gyeongo-wangje` | `cheoneum-jinpae-34-gyeongo-wangje.png` |
| 35 | 임오 | 육명장군 | `jinpae-35-imo-yukmyeong` | `cheoneum-jinpae-35-imo-yukmyeong.png` |
| 36 | 을미 | 부상장군 | `jinpae-36-eulmi-busang` | `cheoneum-jinpae-36-eulmi-busang.png` |
| 37 | 정미 | 무병장군 | `jinpae-37-jeongmi-mubyeong` | `cheoneum-jinpae-37-jeongmi-mubyeong.png` |
| 38 | 기미 | 양선장군 | `jinpae-38-gimi-yangseon` | `cheoneum-jinpae-38-gimi-yangseon.png` |
| 39 | 신미 | 이소장군 | `jinpae-39-sinmi-iso` | `cheoneum-jinpae-39-sinmi-iso.png` |
| 40 | 계미 | 위인장군 | `jinpae-40-gyemi-wiin` | `cheoneum-jinpae-40-gyemi-wiin.png` |
| 41 | 갑신 | 방사장군 | `jinpae-41-gapsin-bangsa` | `cheoneum-jinpae-41-gapsin-bangsa.png` |
| 42 | 병신 | 관중장군 | `jinpae-42-byeongsin-gwanjung` | `cheoneum-jinpae-42-byeongsin-gwanjung.png` |
| 43 | 무신 | 서호장군 | `jinpae-43-musin-seoho` | `cheoneum-jinpae-43-musin-seoho.png` |
| 44 | 경신 | 모재장군 | `jinpae-44-gyeongsin-mojae` | `cheoneum-jinpae-44-gyeongsin-mojae.png` |
| 45 | 임신 | 유왕장군 | `jinpae-45-imsin-yuwang` | `cheoneum-jinpae-45-imsin-yuwang.png` |
| 46 | 을유 | 장숭장군 | `jinpae-46-euryu-jangsung` | `cheoneum-jinpae-46-euryu-jangsung.png` |
| 47 | 정유 | 당사장군 | `jinpae-47-jeongyu-dangsa` | `cheoneum-jinpae-47-jeongyu-dangsa.png` |
| 48 | 기유 | 정보장군 | `jinpae-48-giyu-jeongbo` | `cheoneum-jinpae-48-giyu-jeongbo.png` |
| 49 | 신유 | 석정장군 | `jinpae-49-sinyu-seokjeong` | `cheoneum-jinpae-49-sinyu-seokjeong.png` |
| 50 | 계유 | 강지장군 | `jinpae-50-gyeyu-gangji` | `cheoneum-jinpae-50-gyeyu-gangji.png` |
| 51 | 갑술 | 시광장군 | `jinpae-51-gapsul-sigwang` | `cheoneum-jinpae-51-gapsul-sigwang.png` |
| 52 | 병술 | 백민장군 | `jinpae-52-byeongsul-baekmin` | `cheoneum-jinpae-52-byeongsul-baekmin.png` |
| 53 | 무술 | 강무장군 | `jinpae-53-musul-gangmu` | `cheoneum-jinpae-53-musul-gangmu.png` |
| 54 | 경술 | '예'화심'장군 | `jinpae-54-gyeongsul-yehwasim` | `cheoneum-jinpae-54-gyeongsul-yehwasim.png` |
| 55 | 임술 | 흥충장군 | `jinpae-55-imsul-heungchung` | `cheoneum-jinpae-55-imsul-heungchung.png` |
| 56 | 을해 | 임보장군 | `jinpae-56-eulhae-imbo` | `cheoneum-jinpae-56-eulhae-imbo.png` |
| 57 | 정해 | 봉제장군 | `jinpae-57-jeonghae-bongje` | `cheoneum-jinpae-57-jeonghae-bongje.png` |
| 58 | 기해 | 사태장군 | `jinpae-58-gihae-satae` | `cheoneum-jinpae-58-gihae-satae.png` |
| 59 | 신해 | 엽견장군 | `jinpae-59-sinhae-yeopgyeon` | `cheoneum-jinpae-59-sinhae-yeopgyeon.png` |
| 60 | 계해 | 우정장군 | `jinpae-60-gyehae-ujeong` | `cheoneum-jinpae-60-gyehae-ujeong.png` |

메모:
- `경술 '예'화심'장군`은 원문 표기를 보존했다.
- 구현 전 표시명을 `예화심장군`으로 정리할지, 따옴표를 의도된 표기로 유지할지 한 번 더 확인한다.

## 이미지 파일명 규칙

코드/번들/플랫폼 안정성을 위해 이미지 파일명은 한글이 아니라 ASCII kebab-case를 사용한다.

### 기본 규칙

```text
cheoneum-{deck}-{number}-{slug}.png
```

deck:

```text
sinpae: 신패(메이저)
jinpae: 진패(마이너)
```

number:

```text
신패: 01-12
진패: 01-60
```

slug:

```text
신패: 카드명 romanized slug
진패: 간지 + 장군명 romanized slug
```

예시:

```text
cheoneum-sinpae-01-cheongeuk.png
cheoneum-jinpae-01-gapja-gimbyeon.png
```

### 권장 폴더 구조

```text
mookseoli/assets/cheoneum/sinpae/
mookseoli/assets/cheoneum/jinpae/
```

서버 데이터에는 앱 asset 경로와 매칭할 수 있도록 image key를 저장한다.

예:

```ts
image: "cheoneum-sinpae-01-cheongeuk.png"
```

## 양의 천음 / 음의 천음

천음은 하나의 도구지만, 운용 방식은 `양의 천음`과 `음의 천음`으로 갈린다.

이 둘은 별개의 카드덱이 아니라, 같은 천음을 해석하고 뽑는 방식의 기울기다.

### 양의 천음

성격:
- 드러나는 흐름
- 선택과 움직임
- 회복, 열림, 방향
- 사용자가 행동할 수 있는 지점

어울리는 표현:
- 열린다
- 움직인다
- 드러난다
- 선택한다
- 회복한다

### 음의 천음

성격:
- 숨은 흐름
- 감춰진 마음
- 반복, 그림자, 직면
- 사용자가 외면한 지점

어울리는 표현:
- 잠긴다
- 가라앉는다
- 숨는다
- 반복된다
- 직면한다

## 화선/화영 운용 비중

화선과 화영은 둘 다 천음을 사용하지만, 양/음의 사용 비중이 다르다.

| 상담자 | 양의 천음 | 음의 천음 | 의미 |
|---|---:|---:|---|
| 화선낭자 | 60% | 40% | 마음을 열고 안정시키는 방향 |
| 화영낭자 | 40% | 60% | 숨은 진실을 드러내고 직면시키는 방향 |

이 비중은 단순 말투가 아니라 실제 로직으로 구현해야 한다.

예상 구현 방식:

```text
화선: 양 카드/양 해석 선택 확률 0.6, 음 카드/음 해석 선택 확률 0.4
화영: 양 카드/양 해석 선택 확률 0.4, 음 카드/음 해석 선택 확률 0.6
```

주의:
- 같은 카드라도 화선이 읽으면 양의 결이 더 강하게 드러난다.
- 같은 카드라도 화영이 읽으면 음의 결이 더 강하게 드러난다.
- 카드 자체의 속성과 상담자의 운용 비중이 함께 작동해야 한다.

## 천음의 위치

천음은 무료/유료 모든 곳에서 쓰인다.

```text
공통: 천음
무료: 천음 + 육임 단시점
유료: 천음 + 육임정단 + 귀장술
```

즉 천음은 모든 상담의 기본 시각적/점술적 중심이고, 기존 도구들은 천음 위에 결합되는 보조 또는 심화 도구다.

## 기존 도구와의 관계

| 도구 | 현재 역할 | 천음 도입 후 역할 |
|---|---|---|
| 천음 | 신규 메인 도구 | 모든 상담의 기본 카드/해석 |
| 육임 단시점 | 가벼운 흐름 읽기 | 무료 상담 보조 도구 |
| 육임정단 | 심층 판단 | 유료 심층 도구 |
| 귀장술 | 신규/예정 심층 도구 | 유료 심층 도구 |
| 선봉문 | 말문 열기/첫 흐름 | 무응답/막연함 대응 보조 |
| 천음래정 | 신규/예정 | 말하지 않는 고민을 짚는 천음 기반 래정 |
| 귀장래정 | 신규/예정 | 말하지 않는 고민을 짚는 귀장 기반 래정 |

## 고민 알아맞추기 flow

사용자가 말을 아끼거나, 반응이 없거나, 말하기를 거부할 때 사용하는 흐름.

```text
천음래정 + 선봉문 + 귀장래정
```

적합한 입력:

```text
몰라
그냥
말하기 싫어
알아서 봐줘
뭐가 문제인지 모르겠어
```

현재 판단:
- 독립 기능으로 빼기보다 방어모드/무응답 대응/말문 열기 flow에 녹이는 것이 자연스럽다.
- 사용자를 몰아붙이기보다, 카드와 짧은 해석으로 말문을 열게 한다.

예시:

```text
사용자: 몰라
화선: 그럼 제가 먼저 흐름을 하나 열어볼게요. 말하지 않아도 살짝 드러나는 게 있어요.
-> 천음래정 카드 노출
```

```text
사용자: 말하기 싫어
화영: 좋아요. 말하지 않아도 남는 흔적은 있어요. 그걸 먼저 볼게.
-> 천음래정 + 귀장래정 후보
```

## 천음 UX

천음 결과는 말풍선 해석만으로 끝나지 않는다.

기본 노출:

```text
카드 이미지
+
말풍선 해석
```

### 카드 이미지

역할:
- 시각적 몰입
- 점술 도구가 실제로 작동한다는 느낌
- 화선/화영의 세계관 강화

필요한 UI 요소:

- 카드 이미지 영역
- 카드 이름
- 신패/진패 구분
- 양/음 기울기 표시 여부
- 카드 등장 애니메이션

### 말풍선 해석

역할:
- 카드가 의미하는 흐름을 상담 말투로 전달
- 카드 용어를 과하게 설명하지 않고, 사용자 질문에 연결

예상 구조:

```text
1. 카드가 드러낸 장면
2. 사용자 질문과 연결
3. 지금 볼 지점
4. 다음 질문 또는 선택지
```

## 첫 구현 v0 제안

처음부터 완성형 점술 엔진으로 만들지 않는다.
먼저 카드 구조와 응답 surface를 만든다.

### v0 목표

```text
사용자 입력
-> aspect 확인
-> 양/음 비중에 따라 reading polarity 선택
-> 카드 1장 선택
-> 카드 이미지 + 짧은 해석 반환
```

### v0 결과 예시

```ts
{
  tool: "cheoneum",
  spread: "single",
  aspect: "hwayeong",
  polarity: "yin",
  card: {
    id: "sinpae-01-cheongeuk",
    arcana: "sinpae",
    name: "천극",
    imageUrl: "/assets/cheoneum/sinpae/cheoneum-sinpae-01-cheongeuk.png"
  },
  interpretation: "지금은 질문의 가장 높은 축이 먼저 드러나요. 작은 감정보다, 무엇을 중심에 둘지 봐야 해요."
}
```

## 카드 추첨 방식 후보

### 1장 뽑기

용도:
- 첫 질문
- 가벼운 무료 상담
- 말문 열기

구조:

```text
현재 흐름 1장
```

### 3장 뽑기

용도:
- 무료 상담의 기본 spread
- 연애/직업/재물 일반 질문

구조 후보:

```text
겉흐름 / 속흐름 / 다음 선택
```

또는:

```text
지금 / 가려진 것 / 움직일 방향
```

### 심층 spread

용도:
- 유료 상담
- 육임정단/귀장술 결합

구조 후보:

```text
질문 핵심
상대/외부 변수
숨은 반복
위험 지점
선택 방향
```

## 화선식 천음

화선은 양의 천음을 더 많이 사용한다.

톤:
- 부드럽게 열어줌
- 마음을 안정시킴
- 선택 가능성을 보여줌
- 현실적 작은 행동을 제안

예시:

```text
이 카드는 아직 닫힌 문이 아니라, 천천히 열리는 문에 가까워요.
지금은 결론보다 마음의 방향을 먼저 보는 게 좋아요.
```

## 화영식 천음

화영은 음의 천음을 더 많이 사용한다.

톤:
- 숨은 반복을 짚음
- 회피를 멈추게 함
- 기준을 세움
- 필요한 선택을 분명히 말함

예시:

```text
이 카드는 이미 알고도 미룬 장면이에요.
답이 없는 게 아니라, 보기 싫었던 거예요.
이제는 그걸 봐야 해요.
```

## 무료/유료 적용 구상

### 무료

```text
천음 1장 또는 3장
+
육임 단시점
```

목표:
- 빠르게 몰입
- 카드 이미지로 시각적 만족
- 단시점으로 실제 점술감 보강

### 유료

```text
천음 심층 spread
+
육임정단
+
귀장술
```

목표:
- 깊은 해석
- 반복 패턴/상대 마음/선택 결과를 구조적으로 제시
- 카드 이미지와 심층 도구를 결합해 유료 경험 강화

## 데이터 모델 초안

```ts
type CheoneumArcana = "sinpae" | "jinpae";
type CheoneumPolarity = "yang" | "yin";

interface CheoneumCard {
  id: string;
  arcana: CheoneumArcana;
  number: number;
  ganji?: string;
  name: string;
  image: string;
  keywords: string[];
  yangMeaning: string;
  yinMeaning: string;
}

interface CheoneumReading {
  tool: "cheoneum";
  aspect: "hwaseon" | "hwayeong";
  polarity: CheoneumPolarity;
  spread: "single" | "three" | "deep";
  cards: CheoneumCard[];
  interpretation: string;
}
```

## 파일 구조 후보

```text
server/src/cheoneum/cheoneum.types.ts
server/src/cheoneum/cheoneum.cards.ts
server/src/cheoneum/cheoneum.service.ts
server/src/cheoneum/cheoneum.prompt.ts

mookseoli/assets/cheoneum/sinpae/
mookseoli/assets/cheoneum/jinpae/
```

## 구현 전 결정할 것

1. 신패 12장의 상징/핵심 의미
2. 신패 12장의 양/음 해석
3. 진패 60장의 상징/핵심 의미
4. 진패 60장의 양/음 해석
5. 카드가 양/음 해석을 모두 갖는지, 카드 자체에 기본 polarity도 둘지
6. 양/음이 카드 선택 확률에 영향을 주는지, 해석 선택에만 영향을 주는지
7. 무료는 1장인지 3장인지
8. 채팅에서 카드 이미지를 한 장씩 보여줄지, 묶어서 보여줄지
9. 천음래정은 기존 방어모드와 어떻게 연결할지
10. 귀장술/귀장래정과 천음의 관계를 어떻게 분리할지

## 다음 추천 작업

### 1. 신패 12장 해석 정의

가장 먼저 할 일:

```text
각 카드의 핵심 상징
양의 의미
음의 의미
이미지 콘셉트
```

### 2. 카드 데이터 v0 작성

신패 12장만 먼저 데이터화.

### 3. 천음 1장 뽑기 v0 구현

카드 이미지 없이도 먼저 서버 결과 구조를 만든다.

### 4. 프론트 카드 메시지 타입 추가

채팅에 카드 이미지가 들어갈 수 있도록 message type 확장.

## 메모
천음은 점점점의 중심 도구가 될 가능성이 크다.
따라서 상담 flow를 더 구체화하기 전에 천음의 카드 구조와 UX를 먼저 잡는 것이 좋다.
