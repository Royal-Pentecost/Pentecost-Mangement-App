import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  GestureResponderEvent,
  Image,
  Modal,
  PanResponder,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Btn, Txt } from "../ui";
import { XIcon } from "../icons";

/**
 * A profile photograph, opened full screen.
 *
 * Pinch to zoom, double-tap to zoom in or back out, drag to look around while
 * zoomed. Tapping the dark surround, the close button, or the phone's back
 * button puts it away. Built on PanResponder so it needs no gesture library.
 */
export default function PhotoViewer({
  uri,
  caption,
  visible,
  onClose,
}: {
  uri: string;
  caption?: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  // The values as they stand between gestures; Animated values can't be read.
  const settled = useRef({ scale: 1, x: 0, y: 0 });
  const gesture = useRef({ startDistance: 0, startScale: 1, lastTap: 0 });

  const MAX = 4;

  const reset = () => {
    settled.current = { scale: 1, x: 0, y: 0 };
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }),
    ]).start();
  };

  const distance = (e: GestureResponderEvent) => {
    const [a, b] = e.nativeEvent.touches;
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          gesture.current.startDistance = e.nativeEvent.touches.length === 2 ? distance(e) : 0;
          gesture.current.startScale = settled.current.scale;
        },
        onPanResponderMove: (e, g) => {
          const touches = e.nativeEvent.touches.length;
          if (touches === 2) {
            if (!gesture.current.startDistance) {
              gesture.current.startDistance = distance(e);
              gesture.current.startScale = settled.current.scale;
            }
            const next = Math.min(MAX, Math.max(0.8, (gesture.current.startScale * distance(e)) / gesture.current.startDistance));
            settled.current.scale = next;
            scale.setValue(next);
          } else if (touches === 1 && settled.current.scale > 1) {
            pan.setValue({ x: settled.current.x + g.dx, y: settled.current.y + g.dy });
          }
        },
        onPanResponderRelease: (_e, g) => {
          const moved = Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6;
          if (settled.current.scale <= 1) {
            reset();
          } else if (!gesture.current.startDistance) {
            settled.current.x += g.dx;
            settled.current.y += g.dy;
          }
          gesture.current.startDistance = 0;

          // Double-tap: in to 2.5x, or back out.
          if (!moved) {
            const now = Date.now();
            if (now - gesture.current.lastTap < 280) {
              gesture.current.lastTap = 0;
              if (settled.current.scale > 1) reset();
              else {
                settled.current = { scale: 2.5, x: 0, y: 0 };
                Animated.spring(scale, { toValue: 2.5, useNativeDriver: false }).start();
              }
            } else {
              gesture.current.lastTap = now;
            }
          }
        },
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const close = () => {
    reset();
    onClose();
  };

  const side = Math.min(width, height - insets.top - insets.bottom - 140);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.94)" }}>
        {/* Tapping the surround closes; the photo itself takes the gestures. */}
        <Pressable onPress={close} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />

        <View pointerEvents="box-none" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            {...responder.panHandlers}
            style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }] }}
          >
            <Image source={{ uri }} style={{ width: side, height: side }} resizeMode="contain" />
          </Animated.View>
        </View>

        {caption ? (
          <View pointerEvents="none" style={{ position: "absolute", left: 20, right: 20, bottom: insets.bottom + 36, alignItems: "center" }}>
            <Txt variant="displayBold" style={{ fontSize: 16, color: "#fff", textAlign: "center" }}>
              {caption}
            </Txt>
            <Txt style={{ fontSize: 11.5, marginTop: 4, color: "rgba(255,255,255,0.55)" }}>
              Pinch or double-tap to zoom
            </Txt>
          </View>
        ) : null}

        <Btn
          onPress={close}
          accessibilityLabel="Close photo"
          style={{
            position: "absolute",
            top: insets.top + 12,
            right: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.16)",
          }}
        >
          <XIcon size={16} color="#fff" />
        </Btn>
      </View>
    </Modal>
  );
}

/**
 * An `Avatar` that opens its photograph full screen when tapped. With no photo
 * there is nothing to enlarge, so it stays a plain avatar.
 */
export function ViewableAvatar({ name, ...avatar }: React.ComponentProps<typeof Avatar> & { name: string }) {
  const [open, setOpen] = useState(false);
  if (!avatar.photo) return <Avatar {...avatar} />;
  return (
    <>
      <Btn onPress={() => setOpen(true)} accessibilityLabel={`View ${name}'s photo`}>
        <Avatar {...avatar} />
      </Btn>
      <PhotoViewer uri={avatar.photo} caption={name} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
