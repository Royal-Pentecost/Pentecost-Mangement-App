import React, { useState } from "react";
import { Image, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { RADIUS, useTheme } from "../theme";
import { useContent } from "../store";
import { CameraIcon, TrashIcon, UploadIcon } from "../icons";
import { Btn, Card, SectionHeading, Txt } from "../ui";
import { Field, SubmitButton } from "./AdminForm";

/** The slider card's shape (3:2) — the preview shows the photo exactly as the card will. */
const SLIDE_ASPECT: [number, number] = [3, 2];

/**
 * Pushes a photograph onto every member's dashboard slider — and only there.
 * It does not create an event, a service or a notification; the four ministry
 * slides stay, and pushed photos are shown before them, newest first.
 */
export default function SliderPublisher() {
  const { c, isDark } = useTheme();
  const { sliderImages, pushSlide, removeSlide, publishError } = useContent();
  const [uri, setUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      // Free crop, starting from the whole photo: a fixed shape left only a small box
      // to crop with on a tall phone photo. The display fills its frame either way.
      allowsEditing: true,
      // Full quality: this is the largest image in the app.
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setUri(result.assets[0].uri);
      setDone(null);
    }
  };

  const push = async () => {
    if (!uri) return;
    const ok = await pushSlide(uri, caption);
    if (ok) {
      setDone("Pushed to the slider. It is on every member's dashboard now.");
      setUri(null);
      setCaption("");
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ padding: 14, gap: 12 }}>
        <Txt style={{ fontSize: 12.5, lineHeight: 18, color: c.mutedForeground }}>
          Push a photo onto the dashboard slider. It shows only there — before the ministry photos — until you remove it.
        </Txt>

        <Btn onPress={pick} style={{ borderRadius: RADIUS.lg, overflow: "hidden", backgroundColor: c.muted }}>
          {uri ? (
            <Image source={{ uri }} style={{ width: "100%", aspectRatio: SLIDE_ASPECT[0] / SLIDE_ASPECT[1] }} resizeMode="cover" />
          ) : (
            <View style={{ width: "100%", aspectRatio: SLIDE_ASPECT[0] / SLIDE_ASPECT[1], alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CameraIcon size={28} color={c.mutedForeground} />
              <Txt variant="bodySemi" style={{ fontSize: 13, color: c.mutedForeground }}>Choose a photo</Txt>
              <Txt style={{ fontSize: 11.5, color: c.mutedForeground }}>Crop as much as you like, full quality</Txt>
            </View>
          )}
        </Btn>
        {uri ? (
          <Btn onPress={pick} style={{ alignSelf: "center", paddingVertical: 4 }}>
            <Txt variant="bodySemi" style={{ fontSize: 12.5, color: c.primary }}>Choose a different photo</Txt>
          </Btn>
        ) : null}

        <Field label="Caption (optional)" value={caption} onChangeText={setCaption} placeholder="e.g. Harvest Thanksgiving 2026" />
        <SubmitButton label="Push to slider" Icon={UploadIcon} onPress={push} disabled={!uri} />

        {done ? <Txt variant="bodySemi" style={{ fontSize: 12.5, color: isDark ? "#6EE7B7" : "#15803D" }}>{done}</Txt> : null}
        {publishError ? (
          <Txt variant="bodySemi" style={{ fontSize: 12.5, lineHeight: 18, color: isDark ? "#FCA5A5" : "#B91C1C" }}>{publishError}</Txt>
        ) : null}
      </Card>

      <SectionHeading label={`On the slider now · ${sliderImages.length}`} />
      {sliderImages.length === 0 ? (
        <Txt style={{ fontSize: 12.5, color: c.mutedForeground }}>Nothing pushed yet — the slider shows the four ministries.</Txt>
      ) : null}
      {sliderImages.map((img) => {
        const confirming = confirmId === img.id;
        return (
          <Card key={img.id} style={{ padding: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Image source={{ uri: img.image }} style={{ width: 80, height: 48, borderRadius: RADIUS.sm }} resizeMode="cover" />
            <Txt variant="bodySemi" numberOfLines={1} style={{ flex: 1, fontSize: 13, color: c.foreground }}>
              {img.caption || "No caption"}
            </Txt>
            {/* First tap asks, second removes it from every phone. */}
            <Btn
              onPress={confirming ? () => removeSlide(img.id).finally(() => setConfirmId(null)) : () => setConfirmId(img.id)}
              accessibilityLabel={confirming ? "Confirm removing this photo" : "Remove this photo from the slider"}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: confirming ? "#DC2626" : c.muted }}
            >
              <TrashIcon size={14} color={confirming ? "#fff" : c.mutedForeground} />
              {confirming ? <Txt variant="bodySemi" style={{ fontSize: 12, color: "#fff" }}>Remove</Txt> : null}
            </Btn>
          </Card>
        );
      })}
    </View>
  );
}
