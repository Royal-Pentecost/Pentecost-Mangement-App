import React, { useEffect, useRef } from "react";
import { Animated, Easing, ImageSourcePropType, StyleProp, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Full-bleed photo slider that cross-fades between images, with a slow zoom on
 * the active frame. Sits behind the login screen's content.
 */
export default function BackgroundSlider({
  photos,
  interval = 5000,
  fadeDuration = 1000,
  scrim = ["rgba(10,16,32,0.55)", "rgba(10,16,32,0.92)"],
  style,
}: {
  photos: { source: ImageSourcePropType }[];
  interval?: number;
  fadeDuration?: number;
  scrim?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}) {
  const indexRef = useRef(0);
  const opacities = useRef(photos.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const zoom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (photos.length < 2) return;

    const runZoom = () => {
      zoom.setValue(0);
      Animated.timing(zoom, {
        toValue: 1,
        duration: interval + fadeDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    };

    runZoom();

    const timer = setInterval(() => {
      const current = indexRef.current;
      const next = (current + 1) % photos.length;

      Animated.parallel([
        Animated.timing(opacities[current], { toValue: 0, duration: fadeDuration, useNativeDriver: true }),
        Animated.timing(opacities[next], { toValue: 1, duration: fadeDuration, useNativeDriver: true }),
      ]).start();

      indexRef.current = next;
      runZoom();
    }, interval);

    return () => clearInterval(timer);
  }, [photos.length, interval, fadeDuration, opacities, zoom]);

  const scale = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });

  return (
    <View style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "#0A1020" }, style]}>
      {photos.map((photo, i) => (
        <Animated.Image
          key={i}
          source={photo.source}
          resizeMode="cover"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            opacity: opacities[i],
            transform: [{ scale }],
          }}
        />
      ))}

      {/* Scrim keeps foreground text legible over any photo */}
      <LinearGradient
        colors={scrim}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />
    </View>
  );
}
