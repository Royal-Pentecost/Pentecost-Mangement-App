import React from "react";
import { Image, ScrollView, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SCREEN_PAD, useTheme } from "../theme";
import { Assembly, assemblies, pentecostLogo } from "../data";
import { ChevronRightIcon, MoonIcon, SunIcon } from "../icons";
import { Btn, Card, Txt, shadow } from "../ui";
import { PopIn } from "../motion";
import { HeaderBlock, HeaderChip } from "../components/HeaderBlock";

export default function AssemblyPicker({ onSelectAssembly }: { onSelectAssembly: (a: Assembly) => void }) {
  const { c, isDark, mode, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = (width - SCREEN_PAD * 2 - 12) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <HeaderBlock paddingBottom={22}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Image source={pentecostLogo} style={{ width: 36, height: 36 }} resizeMode="contain" />
          </View>

          <View style={{ flex: 1 }}>
            <Txt variant="bodySemi" style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
              The Church of Pentecost
            </Txt>
            <Txt variant="displayExtraBold" style={{ fontSize: 20, marginTop: 2, color: "#fff" }}>
              Local Assemblies
            </Txt>
          </View>

          {/* Theme toggle, styled as a switch track */}
          <Btn
            onPress={toggle}
            style={{
              width: 56,
              height: 30,
              borderRadius: RADIUS.pill,
              backgroundColor: "rgba(255,255,255,0.16)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: mode === "light" ? "flex-end" : "flex-start",
              paddingHorizontal: 3,
            }}
          >
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center" }}>
              {mode === "light" ? <SunIcon size={14} color="#fff" /> : <MoonIcon size={14} color="#fff" />}
            </View>
          </Btn>
        </View>

        <View style={{ marginTop: 14 }}>
          <HeaderChip label="Ayigya District" />
        </View>
      </HeaderBlock>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Prompt card */}
        <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={[{ width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }, shadow("sm")]}>
            <Image source={pentecostLogo} style={{ width: 38, height: 38 }} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="displayBold" style={{ fontSize: 16, color: c.foreground }}>
              Select Your Local Assembly
            </Txt>
            <Txt variant="bodyMedium" style={{ fontSize: 13, marginTop: 3, color: c.accent }}>
              Choose your assembly to proceed
            </Txt>
          </View>
        </Card>

        {/* Section heading */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 }}>
          <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: c.mutedForeground }}>
            Assemblies
          </Txt>
          <Txt variant="bodySemi" style={{ fontSize: 12, color: isDark ? "#93C5FD" : c.primary }}>
            {assemblies.filter((a) => a.live).length} active
          </Txt>
        </View>

        {/* Assembly grid — each card is a photograph of that assembly */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {assemblies.map((a, i) => (
            <PopIn key={a.id} delay={i * 90} style={{ width: cardWidth }}>
            <Btn
              onPress={a.live ? () => onSelectAssembly(a) : undefined}
              disabled={!a.live}
              style={{ width: cardWidth }}
            >
              <View style={[{ width: cardWidth, height: 186, borderRadius: RADIUS.lg, overflow: "hidden", backgroundColor: "#172554" }, shadow("md")]}>
                <Image source={a.photo} style={{ width: cardWidth, height: 186 }} resizeMode="cover" />
                <LinearGradient
                  colors={["rgba(10,16,32,0.20)", "rgba(10,16,32,0.90)"]}
                  locations={[0.25, 1]}
                  style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
                />

                {/* Assemblies not yet onboarded are frosted over and unselectable */}
                {!a.live ? (
                  <>
                    <BlurView
                      intensity={38}
                      tint="dark"
                      experimentalBlurMethod="dimezisBlurView"
                      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
                    />
                    {/* Standing scrim, so the card still reads as inactive if blur is unavailable */}
                    <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(10,16,32,0.45)" }} />
                  </>
                ) : null}

                {/* Church mark */}
                <View
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 34,
                    height: 34,
                    borderRadius: RADIUS.sm,
                    backgroundColor: a.live ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.5)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image source={pentecostLogo} style={{ width: 26, height: 26, opacity: a.live ? 1 : 0.75 }} resizeMode="contain" />
                </View>

                <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
                  <Txt
                    variant="displayExtraBold"
                    numberOfLines={2}
                    style={{ fontSize: 13, letterSpacing: 0.4, lineHeight: 17, color: a.live ? "#fff" : "rgba(255,255,255,0.82)" }}
                  >
                    {a.name.toUpperCase()}
                  </Txt>

                  {a.live ? (
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      <Txt variant="bodySemi" style={{ fontSize: 11.5, color: "#FBBF24" }}>
                        {a.members} members
                      </Txt>
                      <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.22)" }}>
                        <ChevronRightIcon size={13} color="#fff" />
                      </View>
                    </View>
                  ) : (
                    <View
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: RADIUS.pill,
                        backgroundColor: "rgba(255,255,255,0.18)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <Txt variant="displayBold" style={{ fontSize: 10, letterSpacing: 1.1, color: "#fff" }}>
                        COMING SOON
                      </Txt>
                    </View>
                  )}
                </View>
              </View>
            </Btn>
            </PopIn>
          ))}
        </View>

        <Txt variant="bodyMedium" style={{ fontSize: 12, textAlign: "center", marginTop: 28, color: c.mutedForeground }}>
          The Church of Pentecost · Ayigya District
        </Txt>
      </ScrollView>
    </View>
  );
}
