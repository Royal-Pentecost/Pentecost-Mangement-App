import React from "react";
import { Image, Linking, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BRAND, RADIUS, useTheme } from "../theme";
import { Elder, pentecostLogo } from "../data";
import { Avatar, Btn, Card, Pulse, Txt, shadow } from "../ui";
import { ChatIcon, ClockIcon, GmailIcon, PhoneIcon, WhatsappIcon } from "../icons";
import { PopIn } from "../motion";

export default function ElderProfile({ elder, bottomInset }: { elder: Elder; bottomInset: number }) {
  const { c, isDark } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset + 80 }}>
        {/* Hero */}
        <LinearGradient
          colors={isDark ? ["#1B2C6B", "#0F1B44"] : ["#22357F", "#1B2C6B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.35, y: 1 }}
          style={{ marginHorizontal: 18, marginTop: 18, borderRadius: RADIUS.xl, overflow: "hidden" }}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 26, paddingBottom: 24, alignItems: "center" }}>
            <View style={{ marginBottom: 16 }}>
              <Avatar
                photo={elder.photo}
                initials={elder.avatar}
                color={elder.avatarColor}
                size={112}
                radius={24}
                borderWidth={3}
                borderColor={isDark ? BRAND.goldLight : BRAND.gold}
                fontSize={30}
              />
              <View style={[{ position: "absolute", bottom: -8, right: -8, width: 32, height: 32, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }, shadow("md")]}>
                <Image source={pentecostLogo} style={{ width: 24, height: 24 }} resizeMode="contain" />
              </View>
            </View>

            <Txt variant="displayBold" style={{ fontSize: 20, color: "#fff", textAlign: "center" }}>
              {elder.name}
            </Txt>

            <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: isDark ? "#F59E0B33" : "rgba(255,255,255,0.2)" }}>
              <Txt variant="displayBold" style={{ fontSize: 12, color: isDark ? BRAND.goldLight : "#fff" }}>
                {elder.title}
              </Txt>
            </View>

            <View style={{ marginTop: 6, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }}>
              <Txt variant="bodySemi" style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                {elder.assembly}
              </Txt>
            </View>

            <Txt style={{ fontSize: 12, marginTop: 8, color: "#BFDBFE" }}>In service since {elder.since}</Txt>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14 }}>
          {[
            {
              key: "call",
              render: () => <PhoneIcon size={20} color={c.foreground} />,
              label: "Call Office",
              url: `tel:${elder.phone.replace(/\s/g, "")}`,
            },
            {
              key: "email",
              render: () => <GmailIcon size={20} />,
              label: "Send Email",
              url: `mailto:${elder.email}`,
            },
            {
              // wa.me wants the number in international form with no punctuation.
              key: "whatsapp",
              render: () => <WhatsappIcon size={20} />,
              label: "WhatsApp",
              url: `https://wa.me/${elder.phone.replace(/[^0-9]/g, "")}`,
            },
          ].map(({ key, render, label, url }, contactIndex) => (
            <PopIn key={key} delay={contactIndex * 80} style={{ flex: 1 }}>
            <Btn style={{ flex: 1 }} onPress={() => Linking.openURL(url).catch(() => {})}>
              <Card style={{ alignItems: "center", gap: 7, paddingVertical: 14 }}>
                {render()}
                <Txt variant="bodySemi" style={{ fontSize: 11, color: c.foreground }}>
                  {label}
                </Txt>
              </Card>
            </Btn>
            </PopIn>
          ))}
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 12 }}>
          {/* Biography */}
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: isDark ? BRAND.goldLight : BRAND.gold }} />
              <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                Biography
              </Txt>
            </View>
            <Txt style={{ fontSize: 14, lineHeight: 21, color: c.mutedForeground }}>{elder.bio}</Txt>
          </Card>

          {/* Ministry roles */}
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: isDark ? BRAND.blue : BRAND.navy }} />
              <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                Ministry Roles
              </Txt>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {elder.roles.map((role, i) => (
                <PopIn key={i} delay={i * 70}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: isDark ? "#1E3A8A33" : "#EFF6FF",
                    borderWidth: 1,
                    borderColor: isDark ? "#3B82F644" : "#BFDBFE",
                  }}
                >
                  <Txt variant="bodySemi" style={{ fontSize: 12, color: isDark ? BRAND.blueLight : BRAND.navy }}>
                    {role}
                  </Txt>
                </View>
                </PopIn>
              ))}
            </View>
          </Card>

          {/* Office hours */}
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: isDark ? BRAND.green : BRAND.greenDark }} />
              <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                Office Hours &amp; Counselling
              </Txt>
            </View>

            {elder.officeHours.split("\n").map((line, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8 }}>
                <View style={{ marginTop: 3 }}>
                  <ClockIcon size={14} color={c.mutedForeground} />
                </View>
                <Txt style={{ flex: 1, fontSize: 14, color: c.mutedForeground }}>{line}</Txt>
              </View>
            ))}

            <View style={{ marginTop: 12, paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: c.border }}>
              <Pulse>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.green }} />
              </Pulse>
              <Txt variant="bodyMedium" style={{ flex: 1, fontSize: 12, color: isDark ? BRAND.greenLight : BRAND.greenDark }}>
                Currently accepting pastoral care appointments
              </Txt>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Floating CTA */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 12, paddingHorizontal: 16 }}>
        <Btn style={[{ borderRadius: 16, overflow: "hidden" }, shadow("lg")]}>
          <LinearGradient
            colors={isDark ? [BRAND.navy, BRAND.blue] : [BRAND.navy, "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }}
          >
            <ChatIcon size={17} color="#fff" />
            <Txt variant="displayBold" style={{ fontSize: 14, textAlign: "center", color: "#fff" }}>
              Send Direct Message / Request Counselling
            </Txt>
          </LinearGradient>
        </Btn>
      </View>
    </View>
  );
}
