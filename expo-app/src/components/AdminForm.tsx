import React from "react";
import { Image, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { BODY, RADIUS, useTheme } from "../theme";
import { Btn, Txt } from "../ui";
import { CameraIcon, CheckIcon, XIcon } from "../icons";

/** A labelled text field, styled like the rest of the app's surfaces. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "sentences",
  multiline,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  style?: { flex?: number };
}) {
  const { c } = useTheme();

  return (
    <View style={[{ gap: 6 }, style]}>
      <Txt
        variant="bodySemi"
        style={{ fontSize: 10.5, letterSpacing: 0.9, textTransform: "uppercase", color: c.mutedForeground }}
      >
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          paddingHorizontal: 13,
          paddingVertical: 11,
          borderRadius: RADIUS.sm,
          fontSize: 14,
          lineHeight: multiline ? 20 : undefined,
          minHeight: multiline ? 120 : undefined,
          fontFamily: BODY.medium,
          color: c.foreground,
          backgroundColor: c.muted,
        }}
      />
    </View>
  );
}

/** A row of mutually exclusive pills. */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Btn
            key={o.id}
            onPress={() => onChange(o.id)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: RADIUS.pill,
              backgroundColor: active ? c.primary : c.muted,
            }}
          >
            <Txt variant="bodySemi" style={{ fontSize: 12.5, color: active ? "#fff" : c.mutedForeground }}>
              {o.label}
            </Txt>
          </Btn>
        );
      })}
    </View>
  );
}

/** A stacked list of options with a check on the selected one. */
export function ChoiceList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();

  return (
    <View style={{ gap: 8 }}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Btn
            key={o.id}
            onPress={() => onChange(o.id)}
            scale={1}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 11,
              paddingHorizontal: 13,
              paddingVertical: 11,
              borderRadius: RADIUS.sm,
              backgroundColor: c.muted,
              borderWidth: 1.5,
              borderColor: active ? c.primary : "transparent",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: active ? c.primary : c.border,
                backgroundColor: active ? c.primary : "transparent",
              }}
            >
              {active ? <CheckIcon size={11} color="#fff" strokeWidth={3} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="displaySemi" style={{ fontSize: 13.5, color: c.foreground }}>
                {o.label}
              </Txt>
              {o.hint ? (
                <Txt style={{ fontSize: 11.5, marginTop: 1, color: c.mutedForeground }}>{o.hint}</Txt>
              ) : null}
            </View>
          </Btn>
        );
      })}
    </View>
  );
}

/** The primary save action shared by both admin tools. */
export function SubmitButton({
  label,
  onPress,
  disabled,
  Icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  Icon?: React.ComponentType<{ size?: number; color?: string }>;
}) {
  const { c } = useTheme();

  return (
    <Btn
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        backgroundColor: disabled ? c.muted : c.primary,
      }}
    >
      {Icon ? <Icon size={16} color={disabled ? c.mutedForeground : "#fff"} /> : null}
      <Txt variant="displayBold" style={{ fontSize: 14, color: disabled ? c.mutedForeground : "#fff" }}>
        {label}
      </Txt>
    </Btn>
  );
}

/**
 * Attach a cover photograph to whatever is being published. The picked image
 * goes onto the item *and* into the dashboard carousel, so the congregation
 * sees the picture, not just the words.
 */
export function CoverPicker({
  value,
  onChange,
  hint = "Shown on the dashboard slider",
}: {
  value?: string;
  onChange: (uri?: string) => void;
  hint?: string;
}) {
  const { c } = useTheme();

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) onChange(result.assets[0].uri);
  };

  if (value) {
    return (
      <View style={{ gap: 6 }}>
        <Txt
          variant="bodySemi"
          style={{ fontSize: 10.5, letterSpacing: 0.9, textTransform: "uppercase", color: c.mutedForeground }}
        >
          Cover photo
        </Txt>
        <View style={{ borderRadius: RADIUS.md, overflow: "hidden", backgroundColor: c.muted }}>
          <Image source={{ uri: value }} style={{ width: "100%", height: 132 }} resizeMode="cover" />
          <Btn
            onPress={() => onChange(undefined)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(8,15,40,0.66)",
            }}
          >
            <XIcon size={15} color="#fff" />
          </Btn>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Txt
        variant="bodySemi"
        style={{ fontSize: 10.5, letterSpacing: 0.9, textTransform: "uppercase", color: c.mutedForeground }}
      >
        Cover photo
      </Txt>
      <Btn
        onPress={pick}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 11,
          paddingHorizontal: 13,
          paddingVertical: 14,
          borderRadius: RADIUS.md,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: c.border,
          backgroundColor: c.muted,
        }}
      >
        <CameraIcon size={19} color={c.mutedForeground} />
        <View style={{ flex: 1 }}>
          <Txt variant="displaySemi" style={{ fontSize: 13.5, color: c.foreground }}>
            Add a photo
          </Txt>
          <Txt style={{ fontSize: 11.5, marginTop: 1, color: c.mutedForeground }}>{hint}</Txt>
        </View>
      </Btn>
    </View>
  );
}
