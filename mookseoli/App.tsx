import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Keyboard, Platform, Animated, Image, ImageBackground } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// 로컬 테스트: PC IP 주소. 배포 후 Railway URL로 교체
const API_URL = 'http://192.168.45.21:3001';

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
  kind?: 'normal' | 'defense';
  defenseType?: DefenseType;
  defenseLocked?: boolean;
};

type DefenseType = 'vague' | 'laugh' | 'test' | 'attack' | 'unsafe' | 'return_intent';

type ChatResponse = {
  reply?: string;
  defense?: boolean;
  defenseType?: DefenseType;
  defenseLocked?: boolean;
};

const QUICK = ['오늘의 운세', '점 봐주세요', '이직 고민'];
const MAX_REPLY_BUBBLES = 4;
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
  const flatListRef = useRef<FlatList>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          renderItem={({ item }) => {
            const isDefense = item.kind === 'defense';
            return (
              <View style={item.role === 'user' ? styles.rowUser : styles.rowMook}>
                {item.role === 'mook' && (
                  <View style={[styles.avatarSm, isDefense && styles.avatarDefense]}>
                    <Image source={aspectCopy.avatarImage} style={styles.avatarSmImage} />
                  </View>
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
