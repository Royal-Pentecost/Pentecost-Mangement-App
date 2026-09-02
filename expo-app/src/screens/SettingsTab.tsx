import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { BRAND, RADIUS, TintName, useTheme, ms } from "../theme";
import { LANGUAGES, SessionUser, SettingsTopic } from "../data";
import { useContent } from "../store";
import { BellIcon, BookIcon, CameraIcon, ChatIcon, ChevronRightIcon, FileTextIcon, InfoIcon, LockIcon, LogOutIcon, MoonIcon, SunIcon, UserIcon } from "../icons";
import { Avatar, Btn, Card, SectionHeading, TintTile, Txt, shadow, tintFg } from "../ui";
import { FadeIn } from "../motion";

interface Row {
  key: SettingsTopic;
  label: string;
  hint: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  tint: TintName;
}

const ACCOUNT_ROWS: Row[] = [
  { key: "editProfile", label: "Edit Profile", hint: "Name, phone, and assembly", Icon: UserIcon, tint: "blue" },
  { key: "notificationPrefs", label: "Notification Settings", hint: "Choose what you're alerted about", Icon: BellIcon, tint: "amber" },
  { key: "privacy", label: "Privacy & Security", hint: "Data, location, and permissions", Icon: LockIcon, tint: "indigo" },
];

const SUPPORT_ROWS: Row[] = [
  { key: "help", label: "Help & Support", hint: "FAQs and how to reach us", Icon: ChatIcon, tint: "green" },
  { key: "about", label: "About the App", hint: "Version and credits", Icon: InfoIcon, tint: "violet" },
  { key: "terms", label: "Terms & Policies", hint: "Terms of service and privacy policy", Icon: FileTextIcon, tint: "blue" },
];

function SettingsRow({ row, onPress }: { row: Row; onPress: () => void }) {
  const { c, isDark } = useTheme();
  return (
    <Btn onPress={onPress}>
      <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 13 }}>
        <TintTile tint={row.tint} size={42}>
          <row.Icon size={18} color={tintFg(row.tint, isDark)} />
        </TintTile>
        <View style={{ flex: 1 }}>
          <Txt variant="displayBold" style={{ fontSize: 14.5, color: c.foreground }}>
            {row.label}
          </Txt>
          <Txt variant="bodyMedium" numberOfLines={1} style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
            {row.hint}
          </Txt>
        </View>
        <ChevronRightIcon size={16} color={c.mutedForeground} />
      </Card>
    </Btn>
  );
}

export default function SettingsTab({
  user,
  onChangePhoto,
  onOpenTopic,
  onLogout,
  bottomInset,
}: {
  user: SessionUser;
  onChangePhoto: (uri: string) => void;
  onOpenTopic: (topic: SettingsTopic) => void;
  onLogout: () => void;
  bottomInset: number;
}) {
  const { c, isDark, mode, toggle } = useTheme();
  const { language, setLanguage } = useContent();

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access so you can choose a new profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) onChangePhoto(result.assets[0].uri);
  };

  const [confirming, setConfirming] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile */}
      <Card style={{ padding: 17, alignItems: "center" }}>
        <View style={{ marginBottom: 14 }}>
          <Avatar
            photo={user.photo}
            initials={user.avatar}
            color={user.avatarColor}
            size={104}
            radius={52}
            borderWidth={3}
            borderColor={isDark ? BRAND.goldLight : BRAND.gold}
            fontSize={34}
          />

          {/* Camera badge — tap to replace the picture */}
          <Btn
            onPress={pickPhoto}
            scale={0.9}
            style={[
              {
                position: "absolute",
                bottom: -2,
                right: -2,
                width: ms(36),
                height: ms(36),
                borderRadius: ms(36) / 2,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? BRAND.blue : BRAND.navy,
                borderWidth: 3,
                borderColor: c.card,
              },
              shadow("md"),
            ]}
          >
            <CameraIcon size={16} color={isDark ? "#0A1020" : "#fff"} />
          </Btn>
        </View>

        <Txt variant="displayExtraBold" style={{ fontSize: 20, color: c.foreground, textAlign: "center" }}>
          {user.name}
        </Txt>
        <Txt variant="bodyMedium" style={{ fontSize: 13, marginTop: 4, color: c.mutedForeground, textAlign: "center" }}>
          {user.subtitle}
        </Txt>

        <Btn
          onPress={pickPhoto}
          style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.pill, backgroundColor: c.muted }}
        >
          <Txt variant="bodySemi" style={{ fontSize: 12.5, color: c.primary }}>
            Change profile picture
          </Txt>
        </Btn>
      </Card>

      {/* Appearance */}
      <SectionHeading label="Appearance" />
      <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 13 }}>
        <TintTile tint="violet" size={42}>
          {mode === "light" ? <SunIcon size={18} color={tintFg("violet", isDark)} /> : <MoonIcon size={18} color={tintFg("violet", isDark)} />}
        </TintTile>
        <View style={{ flex: 1 }}>
          <Txt variant="displayBold" style={{ fontSize: 14.5, color: c.foreground }}>
            Dark Mode
          </Txt>
          <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
            {mode === "dark" ? "On" : "Off"}
          </Txt>
        </View>
        <Btn
          onPress={toggle}
          scale={1}
          style={{
            width: 50,
            height: 28,
            borderRadius: 14,
            padding: 3,
            justifyContent: "center",
            alignItems: mode === "dark" ? "flex-end" : "flex-start",
            backgroundColor: mode === "dark" ? (isDark ? BRAND.blue : BRAND.navy) : c.border,
          }}
        >
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" }} />
        </Btn>
      </Card>

      {/* The pamphlet is taught in both languages, so reading follows the same choice. */}
      <Card style={{ marginTop: 10, padding: 12, flexDirection: "row", alignItems: "center", gap: 13 }}>
        <TintTile tint="blue" size={42}>
          <BookIcon size={18} color={tintFg("blue", isDark)} />
        </TintTile>
        <View style={{ flex: 1 }}>
          <Txt variant="displayBold" style={{ fontSize: 14.5, color: c.foreground }}>
            Bible Study Language
          </Txt>
          <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
            {LANGUAGES.find((l) => l.id === language)?.label}
          </Txt>
        </View>
        <View style={{ flexDirection: "row", padding: 2, borderRadius: RADIUS.pill, backgroundColor: c.muted }}>
          {LANGUAGES.map((l) => {
            const active = language === l.id;
            return (
              <Btn
                key={l.id}
                onPress={() => setLanguage(l.id)}
                scale={1}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                  borderRadius: RADIUS.pill,
                  backgroundColor: active ? c.card : "transparent",
                }}
              >
                <Txt variant="bodySemi" style={{ fontSize: 11, color: active ? c.primary : c.mutedForeground }}>
                  {l.short}
                </Txt>
              </Btn>
            );
          })}
        </View>
      </Card>

      {/* Account */}
      <SectionHeading label="Account" />
      <View style={{ gap: 10 }}>
        {ACCOUNT_ROWS.map((row, i) => (
          <FadeIn key={row.key} index={i}>
            <SettingsRow row={row} onPress={() => onOpenTopic(row.key)} />
          </FadeIn>
        ))}
      </View>

      {/* Support */}
      <SectionHeading label="Support" />
      <View style={{ gap: 10 }}>
        {SUPPORT_ROWS.map((row, i) => (
          <FadeIn key={row.key} index={i} delay={110}>
            <SettingsRow row={row} onPress={() => onOpenTopic(row.key)} />
          </FadeIn>
        ))}
      </View>

      {/* Log out */}
      <View style={{ marginTop: 22 }}>
        <Btn onPress={() => setConfirming(true)}>
          <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 13 }} borderColor={isDark ? "#7F1D1D" : "#FBD5D5"}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: RADIUS.md,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#DC262622" : "#FEECEC",
              }}
            >
              <LogOutIcon size={19} color={isDark ? "#FCA5A5" : BRAND.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="displayBold" style={{ fontSize: 15, color: isDark ? "#FCA5A5" : BRAND.red }}>
                Log Out
              </Txt>
              <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
                Sign out of this device
              </Txt>
            </View>
            <ChevronRightIcon size={16} color={isDark ? "#FCA5A5" : BRAND.red} />
          </Card>
        </Btn>
      </View>

      <Txt variant="bodyMedium" style={{ fontSize: 11.5, textAlign: "center", marginTop: 22, color: c.mutedForeground }}>
        The Church of Pentecost · Ayigya District{"\n"}Version 1.0.0
      </Txt>

      {/* Confirm sheet — an in-app modal rather than Alert, which react-native-web ignores */}
      <Modal visible={confirming} transparent animationType="fade" onRequestClose={() => setConfirming(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(7,12,24,0.6)", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Pressable style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} onPress={() => setConfirming(false)} />

          <View style={[{ width: "100%", maxWidth: 340, borderRadius: RADIUS.xl, padding: 22, backgroundColor: c.card }, shadow("lg")]}>
            <View
              style={{
                alignSelf: "center",
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#DC262622" : "#FEECEC",
              }}
            >
              <LogOutIcon size={22} color={isDark ? "#FCA5A5" : BRAND.red} />
            </View>

            <Txt variant="displayExtraBold" style={{ fontSize: 19, textAlign: "center", marginTop: 14, color: c.foreground }}>
              Log out?
            </Txt>
            <Txt style={{ fontSize: 13.5, lineHeight: 20, textAlign: "center", marginTop: 8, color: c.mutedForeground }}>
              You'll need to verify your phone number again to sign back in.
            </Txt>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <Btn
                onPress={() => setConfirming(false)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: c.muted }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                  Cancel
                </Txt>
              </Btn>
              <Btn
                onPress={() => {
                  setConfirming(false);
                  onLogout();
                }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: BRAND.red }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>
                  Log Out
                </Txt>
              </Btn>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
