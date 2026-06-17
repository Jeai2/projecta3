import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Pressable, FlatList, KeyboardAvoidingView, Keyboard, Platform, Animated, Easing, Image, ImageBackground, type ImageSourcePropType } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// 로컬 테스트: PC IP 주소. 배포 후 Railway URL로 교체
const API_URL = 'http://192.168.219.102:3001';

const COLORS = {
  bg: '#0E0C0A',
  splashBg: '#FAF2E9',
  nightBg: '#110F0C',
  bgCard: '#1A1610',
  card: '#1E1A14',
  border: '#2E2518',
  gold: '#C9A96E',
  goldDim: '#7A6040',
  warmText: '#8B6A3F',
  text: '#F0E6D3',
  textSub: '#5C4E3A',
  white: '#F5EFE6',
};

type Aspect = 'hwaseon' | 'hwayeong';
const TEST_ASPECT_OVERRIDE: Aspect | null = null;

const ASPECT_COPY = {
  hwaseon: {
    name: '화선낭자',
    shortName: '화선',
    subtitle: '낮에 열림',
    avatarImage: require('./assets/aspects/hwaseon/avatar.png'),
    appBg: '#F8EBD8',
    splashImage: require('./assets/aspects/hwaseon/splash.png'),
    splashBg: COLORS.splashBg,
    splashTitleColor: COLORS.warmText,
    splashSubColor: COLORS.goldDim,
    entranceImage: require('./assets/aspects/hwaseon/entrance.png'),
    entranceOverlay: 'rgba(255, 238, 205, 0.08)',
    entranceButtonBg: 'rgba(255, 248, 235, 0.72)',
    entranceButtonBorder: 'rgba(139, 106, 63, 0.28)',
    entranceButtonText: '#4F3821',
    statusBar: 'dark' as const,
  },
  hwayeong: {
    name: '화영낭자',
    shortName: '화영',
    subtitle: '밤에 열림',
    avatarImage: require('./assets/aspects/hwayeong/avatar.png'),
    appBg: '#050912',
    splashImage: require('./assets/aspects/hwayeong/splash.png'),
    splashBg: COLORS.nightBg,
    splashTitleColor: COLORS.text,
    splashSubColor: COLORS.gold,
    entranceImage: require('./assets/aspects/hwayeong/entrance.png'),
    entranceOverlay: 'rgba(4, 8, 18, 0.18)',
    entranceButtonBg: 'rgba(10, 12, 18, 0.62)',
    entranceButtonBorder: 'rgba(201, 169, 110, 0.34)',
    entranceButtonText: '#F0E6D3',
    statusBar: 'light' as const,
  },
};

function resolveAspect(now = new Date()): Aspect {
  if (TEST_ASPECT_OVERRIDE) return TEST_ASPECT_OVERRIDE;
  const hour = now.getHours();
  return hour >= 6 && hour < 18 ? 'hwaseon' : 'hwayeong';
}

type Message = {
  id: string;
  role: 'mook' | 'user';
  text: string;
  kind?: 'normal' | 'defense' | 'cheoneum';
  defenseType?: DefenseType;
  defenseLocked?: boolean;
  cheoneum?: CheoneumReading;
};

type DefenseType = 'vague' | 'laugh' | 'test' | 'attack' | 'unsafe' | 'return_intent';

type CheoneumArcana = 'sinpae' | 'jinpae';
type CheoneumOrientation = 'vertical' | 'horizontal' | 'hidden';
type CheoneumSpreadId =
  | 'ilgi'
  | 'yangeui'
  | 'tonggwan'
  | 'cheonjiin'
  | 'wonhyeongijeong'
  | 'sunhwan'
  | 'nakseo-gugung';

type CheoneumCard = {
  id: string;
  arcana: CheoneumArcana;
  number: number;
  name: string;
  hanja?: string;
  ganji?: string;
  image?: string;
  keywords?: string[];
};

type CheoneumPlacedCard = {
  card: CheoneumCard;
  position: string;
  label: string;
  drawIndex: number;
  orientation: CheoneumOrientation;
  row?: number;
  col?: number;
};

type CheoneumHint = {
  title: string;
  description: string;
  question: string;
};

type CheoneumReading = {
  tool: 'cheoneum';
  aspect: Aspect;
  polarity: 'yang' | 'yin';
  spread: CheoneumSpreadId;
  spreadName: string;
  cards: CheoneumPlacedCard[];
  note?: string;
  hint?: CheoneumHint;
};

type ChatResponse = {
  reply?: string;
  defense?: boolean;
  defenseType?: DefenseType;
  defenseLocked?: boolean;
  cheoneum?: CheoneumReading;
};

const CHEONEUM_CARD_IMAGES: Record<string, ImageSourcePropType> = {
  'cheoneum-sinpae-01-cheongeuk.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-01-cheongeuk.png'),
  'cheoneum-sinpae-02-yeompa.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-02-yeompa.png'),
  'cheoneum-sinpae-03-myeongjeon.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-03-myeongjeon.png'),
  'cheoneum-sinpae-04-taehwa.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-04-taehwa.png'),
  'cheoneum-sinpae-05-jieom.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-05-jieom.png'),
  'cheoneum-sinpae-06-bowon.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-06-bowon.png'),
  'cheoneum-sinpae-07-jaeun.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-07-jaeun.png'),
  'cheoneum-sinpae-08-wolyeong.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-08-wolyeong.png'),
  'cheoneum-sinpae-09-amnyu.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-09-amnyu.png'),
  'cheoneum-sinpae-10-gyeongyeon.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-10-gyeongyeon.png'),
  'cheoneum-sinpae-11-hwaldo.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-11-hwaldo.png'),
  'cheoneum-sinpae-12-taeheo.png': require('./assets/cheoneum/sinpae/cheoneum-sinpae-12-taeheo.png'),
};
const CHEONEUM_CARD_BACK = require('./assets/cheoneum/card-back-cheoneum.png');

const QUICK = ['오늘의 운세', '점 봐주세요', '이직 고민'];
const MAX_REPLY_BUBBLES = 5;
const MAX_REPLY_BUBBLE_CHARS = 96;
const MAX_DEFENSE_BUBBLES = 2;

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function splitLongSentence(sentence: string, maxChars: number): string[] {
  const chunks: string[] = [];
  let remaining = sentence.trim();

  while (remaining.length > maxChars) {
    const slice = remaining.slice(0, maxChars + 1);
    const breakAt = Math.max(
      slice.lastIndexOf(' '),
      slice.lastIndexOf(','),
      slice.lastIndexOf('，'),
      slice.lastIndexOf('、')
    );
    const cut = breakAt > 28 ? breakAt + 1 : maxChars;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function splitReplyIntoBubbles(reply: string): string[] {
  const normalized = reply.replace(/\r/g, '').trim();
  if (!normalized) return [];
  if (normalized.length <= MAX_REPLY_BUBBLE_CHARS) return [normalized];

  const sentenceMatches = normalized.match(/[^.!?。！？…\n]+[.!?。！？…]*/g) ?? [normalized];
  const sentences = sentenceMatches
    .map(part => part.trim())
    .filter(Boolean)
    .flatMap(part => splitLongSentence(part, MAX_REPLY_BUBBLE_CHARS));

  const bubbles: string[] = [];
  for (const sentence of sentences) {
    const last = bubbles[bubbles.length - 1];
    if (last && `${last} ${sentence}`.length <= MAX_REPLY_BUBBLE_CHARS) {
      bubbles[bubbles.length - 1] = `${last} ${sentence}`;
    } else {
      bubbles.push(sentence);
    }
  }

  if (bubbles.length <= MAX_REPLY_BUBBLES) return bubbles;

  return [
    ...bubbles.slice(0, MAX_REPLY_BUBBLES - 1),
    bubbles.slice(MAX_REPLY_BUBBLES - 1).join(' '),
  ];
}

function splitDefenseIntoBubbles(reply: string): string[] {
  const chunks = splitReplyIntoBubbles(reply);
  if (chunks.length <= MAX_DEFENSE_BUBBLES) return chunks;

  return [
    ...chunks.slice(0, MAX_DEFENSE_BUBBLES - 1),
    chunks.slice(MAX_DEFENSE_BUBBLES - 1).join(' '),
  ];
}

function getReplyBubbleDelay(aspect: Aspect, index: number): number {
  const base = aspect === 'hwayeong' ? 560 : 380;
  const step = aspect === 'hwayeong' ? 130 : 90;
  return base + index * step;
}

function getDefenseBubbleDelay(aspect: Aspect, index: number, locked?: boolean): number {
  const base = locked ? 720 : aspect === 'hwayeong' ? 620 : 460;
  const step = aspect === 'hwayeong' ? 160 : 110;
  return base + index * step;
}

function getInputPlaceholder(aspect: Aspect, defenseLocked: boolean): string {
  if (defenseLocked) {
    return aspect === 'hwayeong'
      ? '진짜 질문을 정확히 적어주세요'
      : '궁금한 걸 한 문장으로 적어주세요';
  }

  return `${ASPECT_COPY[aspect].shortName}에게 물어보세요`;
}

function getDefenseLabel(type?: DefenseType, locked?: boolean): string {
  if (locked) return '상담 흐름 일시 정지';

  switch (type) {
    case 'laugh':
      return '질문 대기';
    case 'vague':
      return '질문 확인';
    case 'test':
      return '상담 기준';
    case 'attack':
      return '대화 온도 조절';
    case 'unsafe':
      return '안전 경계';
    case 'return_intent':
      return '복귀 확인';
    default:
      return '상담 기준';
  }
}

function getCheoneumPrelude(aspect: Aspect, reading: CheoneumReading): string {
  const ilgiPreludes =
    aspect === 'hwayeong'
      ? [
          '흠... 잠깐만. 카드 하나 뽑아볼게.',
          '오늘... 음. 한 장 먼저 볼게.',
          '가만있어 봐. 패를 하나 열어볼게.',
          '잠깐만. 지금 흐름을 먼저 뽑아볼게.',
          '음... 이건 한 장으로 먼저 봐야겠네.',
        ]
      : [
          '흠... 잠깐만요. 카드 하나 뽑아볼게요.',
          '오늘... 음. 한 장 먼저 열어볼게요.',
          '잠시만요. 지금 흐름을 카드로 볼게요.',
          '잠깐만요. 패를 하나 먼저 뽑아볼게요.',
          '음... 이건 한 장으로 먼저 열어볼게요.',
        ];

  if (reading.spread === 'ilgi') {
    return ilgiPreludes[Math.floor(Math.random() * ilgiPreludes.length)];
  }

  if (aspect === 'hwayeong') {
    switch (reading.spread) {
      case 'yangeui':
        return '두 갈래로 나눠서 볼게. 패를 열어보자.';
      case 'tonggwan':
        return '사이에서 막힌 곳을 볼게. 통하는 패를 뽑아보자.';
      default:
        return '지금은 말보다 패가 먼저야. 내가 펼쳐볼게.';
    }
  }

  switch (reading.spread) {
    case 'yangeui':
      return '좋아요. 두 방향을 나눠서 한 번 알아볼게요.';
    case 'tonggwan':
      return '두 사람 사이의 흐름을 카드로 펼쳐볼게요.';
    default:
      return '좋아요. 지금 걸린 흐름을 카드로 한 번 펼쳐볼게요.';
  }
}


function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.15)).current;
  const dot2 = useRef(new Animated.Value(0.15)).current;
  const dot3 = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const makeAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.15, duration: 280, useNativeDriver: true }),
          Animated.delay(Math.max(0, 560 - delay)),
        ])
      );

    const a1 = makeAnim(dot1, 0);
    const a2 = makeAnim(dot2, 180);
    const a3 = makeAnim(dot3, 360);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 3 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold, opacity: dot }}
        />
      ))}
    </View>
  );
}

function getArcanaLabel(arcana: CheoneumArcana): string {
  return arcana === 'sinpae' ? '신패' : '진패';
}

function getCardNumber(card: CheoneumCard): string {
  return String(card.number).padStart(2, '0');
}

function getRomanNumeral(value: number): string {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return roman[value - 1] ?? String(value);
}

function CheoneumCardTile({ item, compact = false }: { item: CheoneumPlacedCard; compact?: boolean }) {
  const { card } = item;
  const isHidden = item.orientation === 'hidden';
  const imageSource = card.image ? CHEONEUM_CARD_IMAGES[card.image] : undefined;
  const displayName = card.hanja ?? card.name;
  const subLabel = card.ganji
    ? `${getArcanaLabel(card.arcana)} · ${card.ganji}`
    : getArcanaLabel(card.arcana);

  if (imageSource && !isHidden) {
    return (
      <View style={[styles.cheoneumImageCardShell, compact && styles.cheoneumImageCardShellCompact]}>
        <ImageBackground source={imageSource} style={styles.cheoneumImageCard} imageStyle={styles.cheoneumImage}>
          <View style={styles.cheoneumImageTop}>
            <Text style={styles.cheoneumRoman}>{getRomanNumeral(card.number)}</Text>
          </View>
          <View style={styles.cheoneumImageBottom}>
            <Text style={styles.cheoneumImageName} numberOfLines={1} adjustsFontSizeToFit>
              {displayName}
            </Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={[
      styles.cheoneumCard,
      card.arcana === 'jinpae' && styles.cheoneumCardJinpae,
      compact && styles.cheoneumCardCompact,
      isHidden && styles.cheoneumCardHidden,
    ]}>
      <View style={styles.cheoneumCardTop}>
        <Text style={styles.cheoneumCardIndex}>{getCardNumber(card)}</Text>
        <Text style={styles.cheoneumCardArcana}>{subLabel}</Text>
      </View>
      <View style={styles.cheoneumGlyph}>
        <Text style={styles.cheoneumGlyphText}>{isHidden ? '封' : displayName.slice(0, 1)}</Text>
      </View>
      <Text style={styles.cheoneumCardName} numberOfLines={1} adjustsFontSizeToFit>
        {isHidden ? '덮은 패' : displayName}
      </Text>
      {!!card.hanja && !isHidden && !imageSource && (
        <Text style={styles.cheoneumCardHanja} numberOfLines={1}>
          {card.hanja}
        </Text>
      )}
    </View>
  );
}

function getCardByPosition(reading: CheoneumReading, position: string): CheoneumPlacedCard | undefined {
  return reading.cards.find(item => item.position === position);
}

function CheoneumSpreadCards({ reading }: { reading: CheoneumReading }) {
  if (reading.spread === 'ilgi') {
    const card = reading.cards[0];
    return (
      <View style={styles.cheoneumSingleLayout}>
        {!!card && <CheoneumCardTile item={card} />}
      </View>
    );
  }

  if (reading.spread === 'yangeui') {
    const left = getCardByPosition(reading, 'left-yin') ?? reading.cards[0];
    const right = getCardByPosition(reading, 'right-yang') ?? reading.cards[1];
    return (
      <View style={styles.cheoneumTwoLayout}>
        {!!left && <CheoneumCardTile item={left} compact />}
        {!!right && <CheoneumCardTile item={right} compact />}
      </View>
    );
  }

  if (reading.spread === 'tonggwan') {
    const subjectA = getCardByPosition(reading, 'subject-a') ?? reading.cards[0];
    const subjectB = getCardByPosition(reading, 'subject-b') ?? reading.cards[1];
    const key = getCardByPosition(reading, 'tonggwan-key') ?? reading.cards[2];
    return (
      <View style={styles.cheoneumTonggwanLayout}>
        <View style={styles.cheoneumKeyWrap}>
          {!!key && <CheoneumCardTile item={key} compact />}
        </View>
        <View style={styles.cheoneumTwoLayout}>
          {!!subjectA && <CheoneumCardTile item={subjectA} compact />}
          {!!subjectB && <CheoneumCardTile item={subjectB} compact />}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cheoneumGridLayout}>
      {reading.cards.map(item => (
        <CheoneumCardTile key={`${item.position}-${item.drawIndex}`} item={item} compact />
      ))}
    </View>
  );
}

function getDrawBackCount(reading: CheoneumReading): number {
  return 12;
}

function getCardSeed(item?: CheoneumPlacedCard): number {
  const value = item ? `${item.card.id}-${item.card.number}-${item.drawIndex}` : 'cheoneum';
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getSelectedBackIndices(count: number, reading: CheoneumReading): number[] {
  if (reading.spread === 'yangeui' && reading.cards.length >= 2) {
    const leftSeed = getCardSeed(getCardByPosition(reading, 'left-yin') ?? reading.cards[0]);
    const rightSeed = getCardSeed(getCardByPosition(reading, 'right-yang') ?? reading.cards[1]);
    const leftIndex = 2 + (leftSeed % 3);
    let rightIndex = Math.min(count - 2, 7 + (rightSeed % 3));

    if (rightIndex === leftIndex) {
      rightIndex = Math.min(count - 1, rightIndex + 1);
    }

    return [leftIndex, rightIndex];
  }

  const seed = getCardSeed(reading.cards[0]);
  return [Math.max(0, Math.min(count - 1, seed % count))];
}

// 카드 뽑기 연출 타이밍 (오버레이 단계 + 채팅 오케스트레이션 공용)
const DRAW_TIMING = {
  overlayIn: 200,
  beforeShuffle: 160,
  shuffle: 900,
  beforeFan: 140,
  fan: 820,
  beforeSelect: 260,
  select: 680,
  beforeReveal: 260,
  reveal: 900,
  hold: 520,
  overlayOut: 260,
  skipFade: 180,
  // send() 안에서 사용하는 말풍선 페이싱
  preludeToOverlay: 360,
  overlayToCard: 140,
  cardToReply: 260,
} as const;

// reveal 단계에서 선택 카드가 실제로 뒤집히는 연출.
// rotateY/backfaceVisibility는 안드로이드에서 불안정하므로 scaleX 플립(앞/뒷면 교체)으로 구현한다.
function CheoneumRevealCard({ reveal, item }: { reveal: Animated.Value; item: CheoneumPlacedCard }) {
  const backScaleX = reveal.interpolate({ inputRange: [0, 0.45, 0.6, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = reveal.interpolate({ inputRange: [0, 0.59, 0.6, 1], outputRange: [1, 1, 0, 0] });
  const frontScaleX = reveal.interpolate({ inputRange: [0, 0.6, 0.78, 1], outputRange: [0, 0, 1, 1] });
  const frontOpacity = reveal.interpolate({ inputRange: [0, 0.6, 0.61, 1], outputRange: [0, 0, 1, 1] });
  return (
    <View style={styles.cheoneumFlipBox}>
      <Animated.View style={[styles.cheoneumFlipFace, { opacity: backOpacity, transform: [{ scaleX: backScaleX }] }]}>
        <Image source={CHEONEUM_CARD_BACK} style={styles.cheoneumFlipBack} />
      </Animated.View>
      <Animated.View style={[styles.cheoneumFlipFace, { opacity: frontOpacity, transform: [{ scaleX: frontScaleX }] }]}>
        <CheoneumCardTile item={item} />
      </Animated.View>
    </View>
  );
}

function CheoneumDrawOverlay({ reading, onDone }: { reading: CheoneumReading; onDone: () => void }) {
  const backCount = getDrawBackCount(reading);
  const selectedIndices = getSelectedBackIndices(backCount, reading);
  const isYangeuiDraw = reading.spread === 'yangeui' && reading.cards.length >= 2;
  const yangeuiLeft = getCardByPosition(reading, 'left-yin') ?? reading.cards[0];
  const yangeuiRight = getCardByPosition(reading, 'right-yang') ?? reading.cards[1];
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const shuffle = useRef(new Animated.Value(0)).current;
  const fan = useRef(new Animated.Value(0)).current;
  const select = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const skip = useCallback(() => {
    if (doneRef.current) return;
    animRef.current?.stop();
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: DRAW_TIMING.skipFade,
      useNativeDriver: true,
    }).start(finish);
  }, [finish, overlayOpacity]);

  useEffect(() => {
    const seq = Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: DRAW_TIMING.overlayIn, useNativeDriver: true }),
      Animated.delay(DRAW_TIMING.beforeShuffle),
      Animated.timing(shuffle, { toValue: 1, duration: DRAW_TIMING.shuffle, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.delay(DRAW_TIMING.beforeFan),
      Animated.timing(fan, { toValue: 1, duration: DRAW_TIMING.fan, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(DRAW_TIMING.beforeSelect),
      Animated.timing(select, { toValue: 1, duration: DRAW_TIMING.select, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(DRAW_TIMING.beforeReveal),
      Animated.timing(reveal, { toValue: 1, duration: DRAW_TIMING.reveal, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(DRAW_TIMING.hold),
      Animated.timing(overlayOpacity, { toValue: 0, duration: DRAW_TIMING.overlayOut, useNativeDriver: true }),
    ]);
    animRef.current = seq;
    seq.start(({ finished }) => {
      if (finished) finish();
    });

    return () => {
      finish();
    };
  }, [fan, finish, overlayOpacity, reveal, select, shuffle]);

  const center = (backCount - 1) / 2;
  const deckOpacity = reveal.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0, 0],
  });
  const revealOpacity = reveal.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0, 1, 1],
  });
  const revealScale = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const hintOpacity = fan.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  return (
    <Animated.View style={[styles.cheoneumOverlay, { opacity: overlayOpacity }]}>
      <Pressable style={styles.cheoneumOverlayScrim} onPress={skip} />
      <View style={styles.cheoneumOverlayStage} pointerEvents="none">
        <Animated.View style={[styles.cheoneumOverlayFan, { opacity: deckOpacity }]}>
        {Array.from({ length: backCount }).map((_, index) => {
          const offset = index - center;
          const selectionOrder = selectedIndices.indexOf(index);
          const isSelected = selectionOrder >= 0;
          const shuffleDirection = index % 2 === 0 ? -1 : 1;
          const shuffleDepth = 1 + (index % 4) * 0.18;
          const shuffleX = shuffle.interpolate({
            inputRange: [0, 0.28, 0.58, 1],
            outputRange: [
              offset * 1.2,
              shuffleDirection * 34 * shuffleDepth,
              -shuffleDirection * 22 * shuffleDepth,
              offset * 2.2,
            ],
          });
          const shuffleY = shuffle.interpolate({
            inputRange: [0, 0.28, 0.58, 1],
            outputRange: [
              0,
              (index % 3 - 1) * 12,
              (1 - index % 3) * 9,
              0,
            ],
          });
          const shuffleRotate = shuffle.interpolate({
            inputRange: [0, 0.28, 0.58, 1],
            outputRange: [
              `${offset * 0.35}deg`,
              `${shuffleDirection * (7 + (index % 3) * 2)}deg`,
              `${-shuffleDirection * (5 + (index % 4))}deg`,
              `${offset * 0.55}deg`,
            ],
          });
          const selectLift = isSelected
            ? select.interpolate({ inputRange: [0, 1], outputRange: [0, isYangeuiDraw ? -46 : -54] })
            : 0;
          const selectX = isSelected
            ? select.interpolate({
                inputRange: [0, 1],
                outputRange: [0, isYangeuiDraw ? (selectionOrder === 0 ? -58 : 58) : 0],
              })
            : 0;
          const selectScale = isSelected
            ? select.interpolate({ inputRange: [0, 1], outputRange: [1, isYangeuiDraw ? 1.12 : 1.18] })
            : 1;
          const ringOpacity = isSelected
            ? select.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] })
            : 0;
          return (
            <Animated.View
              key={index}
              style={[
                styles.cheoneumBackWrap,
                {
                  zIndex: isSelected ? 40 + selectionOrder : index,
                  transform: [
                    { translateX: shuffleX },
                    { translateY: shuffleY },
                    {
                      translateX: fan.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, offset * 20.8],
                      }),
                    },
                    {
                      translateY: fan.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.abs(offset) * 4.4],
                      }),
                    },
                    { translateX: selectX },
                    { translateY: selectLift },
                    {
                      rotate: shuffleRotate,
                    },
                    {
                      rotate: fan.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', `${offset * 5.25}deg`],
                      }),
                    },
                    { scale: selectScale },
                  ],
                },
              ]}
            >
              <Image source={CHEONEUM_CARD_BACK} style={styles.cheoneumBackImage} />
              {isSelected && <Animated.View style={[styles.cheoneumSelectionRing, { opacity: ringOpacity }]} />}
            </Animated.View>
          );
        })}
        </Animated.View>
        <Animated.View
          style={[
            styles.cheoneumOverlayReveal,
            isYangeuiDraw && styles.cheoneumOverlayRevealPair,
            {
              opacity: revealOpacity,
              transform: [{ scale: revealScale }],
            },
          ]}
        >
          {isYangeuiDraw ? (
            <>
              {!!yangeuiLeft && <CheoneumRevealCard reveal={reveal} item={yangeuiLeft} />}
              {!!yangeuiRight && <CheoneumRevealCard reveal={reveal} item={yangeuiRight} />}
            </>
          ) : (
            !!reading.cards[0] && <CheoneumRevealCard reveal={reveal} item={reading.cards[0]} />
          )}
        </Animated.View>
        <Animated.View style={[styles.cheoneumSkipHintWrap, { opacity: hintOpacity }]} pointerEvents="none">
          <Text style={styles.cheoneumSkipHint}>탭하여 건너뛰기</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function CheoneumSpreadView({ reading }: { reading: CheoneumReading }) {
  return (
    <View style={styles.cheoneumPanel}>
      <View style={styles.cheoneumHeader}>
        <View style={styles.cheoneumBadge}>
          <Text style={styles.cheoneumBadgeText}>{reading.spreadName}</Text>
        </View>
      </View>
      <CheoneumSpreadCards reading={reading} />
    </View>
  );
}

function SplashScreen({ aspect, onDone }: { aspect: Aspect; onDone: () => void }) {
  const aspectCopy = ASPECT_COPY[aspect];
  const r1Scale = useRef(new Animated.Value(0.05)).current;
  const r1Opacity = useRef(new Animated.Value(0)).current;
  const r2Scale = useRef(new Animated.Value(0.05)).current;
  const r2Opacity = useRef(new Animated.Value(0)).current;
  const r3Scale = useRef(new Animated.Value(0.05)).current;
  const r3Opacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(16)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const nightOverlayOpacity = useRef(new Animated.Value(aspect === 'hwayeong' ? 0 : 1)).current;

  const makeRipple = (scale: Animated.Value, opacity: Animated.Value, delay: number) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 160, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 840, useNativeDriver: true }),
        ]),
      ]),
    ]);

  useEffect(() => {
    Animated.sequence([
      aspect === 'hwayeong'
        ? Animated.timing(nightOverlayOpacity, { toValue: 1, duration: 620, useNativeDriver: true })
        : Animated.delay(0),
      Animated.parallel([
        makeRipple(r1Scale, r1Opacity, 0),
        makeRipple(r2Scale, r2Opacity, 340),
        makeRipple(r3Scale, r3Opacity, 680),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
      Animated.delay(900),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[styles.splash, { backgroundColor: COLORS.splashBg, opacity: exitOpacity }]}>
      <StatusBar style={aspectCopy.statusBar} />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: aspectCopy.splashBg, opacity: nightOverlayOpacity },
        ]}
      />
      <View style={styles.rippleContainer}>
        <Animated.View style={[styles.ripple, { opacity: r1Opacity, transform: [{ scale: r1Scale }] }]} />
        <Animated.View style={[styles.ripple, { opacity: r2Opacity, transform: [{ scale: r2Scale }] }]} />
        <Animated.View style={[styles.ripple, { opacity: r3Opacity, transform: [{ scale: r3Scale }] }]} />
      </View>
      <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentY }], alignItems: 'center' }}>
        <Image source={aspectCopy.splashImage} style={styles.splashLogo} />
        <Text style={[styles.splashTitle, { color: aspectCopy.splashTitleColor }]}>점점점</Text>
        <Text style={[styles.splashSub, { color: aspectCopy.splashSubColor }]}>{aspectCopy.shortName}</Text>
      </Animated.View>
    </Animated.View>
  );
}

function EntranceScreen({ aspect, onEnter }: { aspect: Aspect; onEnter: () => void }) {
  const aspectCopy = ASPECT_COPY[aspect];
  const insets = useSafeAreaInsets();
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(buttonOpacity, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(buttonY, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.entrance, { backgroundColor: aspectCopy.appBg }]}>
      <StatusBar style={aspectCopy.statusBar} />
      <ImageBackground source={aspectCopy.entranceImage} style={styles.entranceImage} resizeMode="cover">
        <View style={[styles.entranceOverlay, { backgroundColor: aspectCopy.entranceOverlay }]} />
        <Animated.View
          style={[
            styles.entranceActionWrap,
            {
              paddingBottom: Math.max(insets.bottom + 28, 42),
              opacity: buttonOpacity,
              transform: [{ translateY: buttonY }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={onEnter}
            style={[
              styles.entranceButton,
              {
                backgroundColor: aspectCopy.entranceButtonBg,
                borderColor: aspectCopy.entranceButtonBorder,
              },
            ]}
          >
            <Text style={[styles.entranceButtonText, { color: aspectCopy.entranceButtonText }]}>들어간다</Text>
          </TouchableOpacity>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const NUDGE_POLL_MS = 60_000; // 60초마다 넛지 확인

function createConversationId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function ChatScreen({ aspect }: { aspect: Aspect }) {
  const aspectCopy = ASPECT_COPY[aspect];
  const insets = useSafeAreaInsets();
  const [conversationId] = useState(createConversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [defenseLocked, setDefenseLocked] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [drawOverlay, setDrawOverlay] = useState<CheoneumReading | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawResolveRef = useRef<(() => void) | null>(null);

  const playCheoneumDraw = useCallback((reading: CheoneumReading): Promise<void> => {
    return new Promise(resolve => {
      drawResolveRef.current = resolve;
      setDrawOverlay(reading);
    });
  }, []);

  const finishCheoneumDraw = useCallback(() => {
    setDrawOverlay(null);
    const resolve = drawResolveRef.current;
    drawResolveRef.current = null;
    resolve?.();
  }, []);

  const checkNudge = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/session/nudge?conversationId=${encodeURIComponent(conversationId)}`);
      const data = await res.json();
      if (data.nudge && data.message) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '_nudge',
          role: 'mook',
          text: data.message,
        }]);
      }
    } catch { /* 무시 */ }
  }, [conversationId]);

  // 넛지 폴링 시작/정지
  useEffect(() => {
    nudgeTimerRef.current = setInterval(checkNudge, NUDGE_POLL_MS);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkNudge();
        if (!nudgeTimerRef.current) {
          nudgeTimerRef.current = setInterval(checkNudge, NUDGE_POLL_MS);
        }
      } else {
        if (nudgeTimerRef.current) {
          clearInterval(nudgeTimerRef.current);
          nudgeTimerRef.current = null;
        }
      }
    });

    return () => {
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
      sub.remove();
    };
  }, [checkNudge]);

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/greeting?aspect=${aspect}`);
        const data = await res.json();
        const text = data.greeting ?? '오셨어요?';
        setMessages([{ id: '0', role: 'mook', text }]);
      } catch {
        setMessages([{ id: '0', role: 'mook', text: '오셨어요?' }]);
      } finally {
        setIsLoadingGreeting(false);
      }
    };
    fetchGreeting();
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text, aspect }),
      });
      const data = await res.json() as ChatResponse;
      const reply = data.reply ?? '잠깐 자리를 비웠어요. 다시 말해봐요.';
      const isDefense = !!data.defense;
      const chunks = isDefense ? splitDefenseIntoBubbles(reply) : splitReplyIntoBubbles(reply);
      if (isDefense) {
        setDefenseLocked(!!data.defenseLocked);
        await wait(data.defenseLocked ? 380 : 220);
      } else {
        setDefenseLocked(false);
      }

      const cheoneum = !isDefense ? data.cheoneum : undefined;
      if (cheoneum) {
        setMessages(prev => [...prev, {
          id: `${Date.now()}_cheoneum_prelude`,
          role: 'mook',
          text: getCheoneumPrelude(aspect, cheoneum),
          kind: 'normal',
        }]);
        await wait(DRAW_TIMING.preludeToOverlay);
        await playCheoneumDraw(cheoneum);
        await wait(DRAW_TIMING.overlayToCard);
        setMessages(prev => [...prev, {
          id: `${Date.now()}_cheoneum`,
          role: 'mook',
          text: '',
          kind: 'cheoneum',
          cheoneum,
        }]);
        await wait(DRAW_TIMING.cardToReply);
      }

      for (let i = 0; i < chunks.length; i += 1) {
        if (i > 0) {
          await wait(
            isDefense
              ? getDefenseBubbleDelay(aspect, i, data.defenseLocked)
              : getReplyBubbleDelay(aspect, i)
          );
        }
        setMessages(prev => [...prev, {
          id: `${Date.now()}m${i}`,
          role: 'mook',
          text: chunks[i],
          kind: isDefense ? 'defense' : 'normal',
          defenseType: data.defenseType,
          defenseLocked: data.defenseLocked,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'm', role: 'mook', text: '서버 연결이 안 돼요. 잠시 후 다시 시도해봐요!' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Image source={aspectCopy.avatarImage} style={styles.headerAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{aspectCopy.name}</Text>
          <Text style={styles.headerSub}>{aspectCopy.subtitle}</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.chatArea}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            (isTyping || isLoadingGreeting) ? (
              <View style={styles.rowMook}>
                <View style={styles.avatarSm}>
                  <Image source={aspectCopy.avatarImage} style={styles.avatarSmImage} />
                </View>
                <View style={[styles.bubble, styles.bubbleMook]}>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isFirstMook = index === 0 || messages[index - 1]?.role !== 'mook';
            if (item.kind === 'cheoneum' && item.cheoneum) {
              return (
                <View style={styles.rowMook}>
                  {isFirstMook ? (
                    <View style={styles.avatarSm}>
                      <Image source={aspectCopy.avatarImage} style={styles.avatarSmImage} />
                    </View>
                  ) : (
                    <View style={styles.avatarSpacer} />
                  )}
                  <CheoneumSpreadView reading={item.cheoneum} />
                </View>
              );
            }

            const isDefense = item.kind === 'defense';
            return (
              <View style={item.role === 'user' ? styles.rowUser : styles.rowMook}>
                {item.role === 'mook' && (
                  isFirstMook ? (
                    <View style={[styles.avatarSm, isDefense && styles.avatarDefense]}>
                      <Image source={aspectCopy.avatarImage} style={styles.avatarSmImage} />
                    </View>
                  ) : (
                    <View style={styles.avatarSpacer} />
                  )
                )}
                <View
                  style={[
                    styles.bubble,
                    item.role === 'user'
                      ? styles.bubbleUser
                      : isDefense
                        ? styles.bubbleDefense
                        : styles.bubbleMook,
                    item.defenseLocked && styles.bubbleDefenseLocked,
                  ]}
                >
                  {isDefense && (
                    <Text style={styles.defenseLabel}>
                      {getDefenseLabel(item.defenseType, item.defenseLocked)}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.bubbleText,
                      item.role === 'user' && { color: COLORS.bg },
                      isDefense && styles.bubbleDefenseText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.quickWrap}>
          {QUICK.map(q => (
            <TouchableOpacity key={q} style={styles.chip} onPress={() => send(q)}>
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.inputRow, { paddingBottom: isKeyboardVisible ? 11 : Math.max(insets.bottom, 11) }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={getInputPlaceholder(aspect, defenseLocked)}
            placeholderTextColor={COLORS.textSub}
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, isTyping && { opacity: 0.35 }]}
            onPress={() => send(input)}
            disabled={isTyping}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {drawOverlay && <CheoneumDrawOverlay reading={drawOverlay} onDone={finishCheoneumDraw} />}
    </View>
  );
}

export default function App() {
  const [phase, setPhase] = useState<'splash' | 'entrance' | 'chat'>('splash');
  const [aspect] = useState(resolveAspect);
  const aspectCopy = ASPECT_COPY[aspect];
  return (
    <SafeAreaProvider>
      <View style={[styles.appRoot, { backgroundColor: aspectCopy.appBg }]}>
        {phase === 'splash' && <SplashScreen aspect={aspect} onDone={() => setPhase('entrance')} />}
        {phase === 'entrance' && <EntranceScreen aspect={aspect} onEnter={() => setPhase('chat')} />}
        {phase === 'chat' && <ChatScreen aspect={aspect} />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },

  // Splash
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  ripple: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.45)',
  },
  splashLogo: {
    width: 132,
    height: 132,
    marginBottom: 18,
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.warmText,
    marginBottom: 8,
    letterSpacing: 4,
  },
  splashSub: {
    fontSize: 11,
    color: COLORS.goldDim,
    letterSpacing: 1.5,
  },
  entrance: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  entranceImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  entranceOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  entranceActionWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  entranceButton: {
    minWidth: 132,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  entranceButtonText: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.5,
  },

  // Chat
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.goldDim,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.gold,
    opacity: 0.6,
  },

  chatArea: {
    padding: 16,
    gap: 8,
  },
  rowMook: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 6,
  },
  rowUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  avatarSm: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: COLORS.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarDefense: {
    borderColor: COLORS.gold,
  },
  avatarSmImage: {
    width: '100%',
    height: '100%',
  },
  avatarSpacer: {
    width: 36,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 0.6,
    borderColor: COLORS.goldDim,
    marginRight: 12,
  },
  bubble: {
    maxWidth: '76%',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  bubbleMook: {
    backgroundColor: COLORS.card,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 3,
  },
  bubbleDefense: {
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    borderWidth: 0.8,
    borderColor: 'rgba(201, 169, 110, 0.5)',
    borderBottomLeftRadius: 3,
  },
  bubbleDefenseLocked: {
    backgroundColor: 'rgba(122, 96, 64, 0.14)',
    borderColor: 'rgba(201, 169, 110, 0.72)',
  },
  bubbleUser: {
    backgroundColor: COLORS.gold,
    borderBottomRightRadius: 3,
  },
  bubbleText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
  },
  bubbleDefenseText: {
    color: '#F5E7C8',
  },
  defenseLabel: {
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  cheoneumPanel: {
    width: '78%',
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: 'rgba(201, 169, 110, 0.42)',
    backgroundColor: 'rgba(18, 15, 11, 0.94)',
    padding: 12,
  },
  cheoneumHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  cheoneumBadge: {
    minWidth: 42,
    minHeight: 24,
    borderRadius: 12,
    borderWidth: 0.6,
    borderColor: 'rgba(201, 169, 110, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cheoneumBadgeText: {
    fontSize: 10,
    color: COLORS.gold,
  },
  cheoneumSingleLayout: {
    alignItems: 'center',
  },
  cheoneumTwoLayout: {
    flexDirection: 'row',
    gap: 8,
  },
  cheoneumTonggwanLayout: {
    gap: 8,
  },
  cheoneumKeyWrap: {
    alignItems: 'center',
  },
  cheoneumGridLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cheoneumOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheoneumOverlayScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 5, 3, 0.56)',
  },
  cheoneumOverlayStage: {
    width: '100%',
    minHeight: 330,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cheoneumOverlayFan: {
    width: '100%',
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheoneumOverlayReveal: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheoneumOverlayRevealPair: {
    width: '76%',
    maxWidth: 280,
    flexDirection: 'row',
    gap: 10,
  },
  cheoneumBackWrap: {
    position: 'absolute',
    width: 96,
    aspectRatio: 0.68,
    borderRadius: 10,
    borderWidth: 0.9,
    borderColor: 'rgba(229, 194, 117, 0.62)',
    backgroundColor: '#0B0907',
    overflow: 'hidden',
  },
  cheoneumBackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  cheoneumSelectionRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(245, 213, 141, 0.95)',
    backgroundColor: 'rgba(245, 213, 141, 0.08)',
  },
  cheoneumFlipBox: {
    width: 116,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheoneumFlipFace: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheoneumFlipBack: {
    width: 96,
    height: 141,
    borderRadius: 10,
    borderWidth: 0.9,
    borderColor: 'rgba(229, 194, 117, 0.62)',
  },
  cheoneumSkipHintWrap: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
  },
  cheoneumSkipHint: {
    color: 'rgba(245, 235, 215, 0.72)',
    fontSize: 12,
    letterSpacing: 1,
  },
  cheoneumCard: {
    width: 112,
    minHeight: 158,
    borderRadius: 8,
    borderWidth: 0.7,
    borderColor: 'rgba(201, 169, 110, 0.5)',
    backgroundColor: '#241B12',
    padding: 9,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cheoneumCardCompact: {
    flex: 1,
    width: undefined,
    minWidth: 0,
    minHeight: 142,
  },
  cheoneumCardJinpae: {
    borderColor: 'rgba(139, 150, 135, 0.58)',
    backgroundColor: '#1A1D17',
  },
  cheoneumCardHidden: {
    backgroundColor: '#161410',
    borderColor: 'rgba(122, 96, 64, 0.62)',
  },
  cheoneumImageCardShell: {
    width: 118,
    aspectRatio: 0.68,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: 'rgba(229, 194, 117, 0.85)',
    backgroundColor: '#0B0907',
    overflow: 'hidden',
  },
  cheoneumImageCardShellCompact: {
    flex: 1,
    width: undefined,
    minWidth: 0,
  },
  cheoneumImageCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cheoneumImage: {
    borderRadius: 7,
  },
  cheoneumImageTop: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 4, 3, 0.38)',
    borderBottomWidth: 0.5,
    borderColor: 'rgba(229, 194, 117, 0.45)',
  },
  cheoneumRoman: {
    color: '#F3D58D',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  cheoneumImageBottom: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    backgroundColor: 'rgba(5, 4, 3, 0.56)',
    borderTopWidth: 0.5,
    borderColor: 'rgba(229, 194, 117, 0.45)',
  },
  cheoneumImageName: {
    width: '100%',
    color: '#F5E8C6',
    fontSize: 15,
    textAlign: 'center',
  },
  cheoneumCardTop: {
    width: '100%',
    minHeight: 28,
    alignItems: 'center',
  },
  cheoneumCardIndex: {
    fontSize: 10,
    color: COLORS.gold,
  },
  cheoneumCardArcana: {
    fontSize: 9,
    color: '#9D8358',
    marginTop: 1,
  },
  cheoneumGlyph: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0.7,
    borderColor: 'rgba(201, 169, 110, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    marginVertical: 6,
  },
  cheoneumGlyphText: {
    fontSize: 22,
    color: COLORS.text,
  },
  cheoneumCardName: {
    width: '100%',
    minHeight: 20,
    fontSize: 13,
    color: COLORS.white,
    textAlign: 'center',
  },
  cheoneumCardHanja: {
    width: '100%',
    minHeight: 15,
    fontSize: 10,
    color: '#B89C6D',
    textAlign: 'center',
  },

  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chip: {
    borderWidth: 0.5,
    borderColor: COLORS.goldDim,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.goldDim,
    letterSpacing: 0.3,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 11,
    borderTopWidth: 0.5,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: COLORS.gold,
    fontSize: 16,
  },
});
