import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';

// 로컬 테스트: PC IP 주소. 배포 후 Railway URL로 교체
const API_URL = 'http://192.168.219.101:3001';

const COLORS = {
  bg: '#0E0C0A',
  bgCard: '#1A1610',
  card: '#1E1A14',
  border: '#2E2518',
  gold: '#C9A96E',
  goldDim: '#7A6040',
  text: '#F0E6D3',
  textSub: '#5C4E3A',
  white: '#F5EFE6',
};

type Message = {
  id: string;
  role: 'mook' | 'user';
  text: string;
};


const QUICK = ['오늘의 운세', '점 봐주세요', '이직 고민'];


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

function SplashScreen({ onDone }: { onDone: () => void }) {
  const r1Scale = useRef(new Animated.Value(0.05)).current;
  const r1Opacity = useRef(new Animated.Value(0)).current;
  const r2Scale = useRef(new Animated.Value(0.05)).current;
  const r2Opacity = useRef(new Animated.Value(0)).current;
  const r3Scale = useRef(new Animated.Value(0.05)).current;
  const r3Opacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(16)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

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
      Animated.parallel([
        makeRipple(r1Scale, r1Opacity, 0),
        makeRipple(r2Scale, r2Opacity, 340),
        makeRipple(r3Scale, r3Opacity, 680),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
      Animated.delay(1500),
      Animated.timing(exitOpacity, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[styles.splash, { opacity: exitOpacity }]}>
      <View style={styles.rippleContainer}>
        <Animated.View style={[styles.ripple, { opacity: r1Opacity, transform: [{ scale: r1Scale }] }]} />
        <Animated.View style={[styles.ripple, { opacity: r2Opacity, transform: [{ scale: r2Scale }] }]} />
        <Animated.View style={[styles.ripple, { opacity: r3Opacity, transform: [{ scale: r3Scale }] }]} />
      </View>
      <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentY }], alignItems: 'center' }}>
        <View style={styles.splashAvatar}>
          <Text style={styles.splashAvatarText}>묵</Text>
        </View>
        <Text style={styles.splashTitle}>오늘의 점</Text>
        <Text style={styles.splashSub}>묵설이와 함께하는 육임 점술</Text>
      </Animated.View>
    </Animated.View>
  );
}

function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/greeting`);
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
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data.reply ?? '묵설이가 잠깐 자리를 비웠어요. 다시 말해봐요!';
      setMessages(prev => [...prev, { id: Date.now().toString() + 'm', role: 'mook', text: reply }]);
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>묵</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>묵설이</Text>
          <Text style={styles.headerSub}>육임 점술</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.chatArea}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            (isTyping || isLoadingGreeting) ? (
              <View style={styles.rowMook}>
                <View style={styles.avatarSm}>
                  <Text style={styles.avatarSmText}>묵</Text>
                </View>
                <View style={[styles.bubble, styles.bubbleMook]}>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={item.role === 'user' ? styles.rowUser : styles.rowMook}>
              {item.role === 'mook' && (
                <View style={styles.avatarSm}>
                  <Text style={styles.avatarSmText}>묵</Text>
                </View>
              )}
              <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleMook]}>
                <Text style={[styles.bubbleText, item.role === 'user' && { color: COLORS.bg }]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={styles.quickWrap}>
          {QUICK.map(q => (
            <TouchableOpacity key={q} style={styles.chip} onPress={() => send(q)}>
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="묵설이에게 물어보세요"
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
  const [showSplash, setShowSplash] = useState(true);
  return showSplash ? <SplashScreen onDone={() => setShowSplash(false)} /> : <ChatScreen />;
}

const styles = StyleSheet.create({
  // Splash
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    borderColor: COLORS.gold,
  },
  splashAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  splashAvatarText: {
    color: COLORS.gold,
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 1,
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 4,
  },
  splashSub: {
    fontSize: 11,
    color: COLORS.textSub,
    letterSpacing: 1.5,
  },

  // Chat
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '300',
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
    gap: 8,
    marginBottom: 6,
  },
  rowUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  avatarSm: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmText: {
    color: COLORS.goldDim,
    fontSize: 8,
    fontWeight: '300',
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
  bubbleUser: {
    backgroundColor: COLORS.gold,
    borderBottomRightRadius: 3,
  },
  bubbleText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
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
    paddingVertical: 11,
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
