import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../ui';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const MIN_MS = 1400;
const EXIT_MS = 420;

type Props = {
  status?: string;
  /** When true, runs exit animation then calls onHidden */
  exiting?: boolean;
  onHidden?: () => void;
};

export function BrandSplash({ status, exiting, onHidden }: Props) {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.92)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(12)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const rootOpacity = useRef(new Animated.Value(1)).current;
  const rootY = useRef(new Animated.Value(0)).current;
  const mountedAt = useRef(Date.now());
  const exitStarted = useRef(false);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 480,
          easing: EASE,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 520,
          easing: EASE,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 420,
          easing: EASE,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 420,
          easing: EASE,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineWidth, {
        toValue: 56,
        duration: 380,
        easing: EASE,
        useNativeDriver: false,
      }),
    ]).start();
  }, [iconOpacity, iconScale, titleOpacity, titleY, lineWidth]);

  useEffect(() => {
    if (!exiting || exitStarted.current) return;
    exitStarted.current = true;
    const wait = Math.max(0, MIN_MS - (Date.now() - mountedAt.current));
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(rootOpacity, {
          toValue: 0,
          duration: EXIT_MS,
          easing: EASE,
          useNativeDriver: true,
        }),
        Animated.timing(rootY, {
          toValue: -16,
          duration: EXIT_MS,
          easing: EASE,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onHidden?.();
      });
    }, wait);
    return () => clearTimeout(t);
  }, [exiting, onHidden, rootOpacity, rootY]);

  return (
    <Animated.View
      style={[
        styles.root,
        { opacity: rootOpacity, transform: [{ translateY: rootY }] },
      ]}
      pointerEvents="auto"
    >
      <View style={styles.glow} />
      <Animated.View
        style={{
          opacity: iconOpacity,
          transform: [{ scale: iconScale }],
          alignItems: 'center',
        }}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleY }],
          alignItems: 'center',
          marginTop: 28,
        }}
      >
        <Text style={styles.kicker}>Specialty coffee</Text>
        <Text style={styles.title}>Kılıç Coffee Roaster</Text>
        <Animated.View style={[styles.line, { width: lineWidth }]} />
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.accent,
    opacity: 0.07,
  },
  icon: {
    width: 88,
    height: 88,
  },
  kicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.4,
  },
  line: {
    height: 2,
    backgroundColor: colors.accent,
    marginTop: 18,
  },
  status: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 20,
    letterSpacing: 0.6,
  },
});
