import React from "react";
import { Image, View } from "react-native";

import { RADIUS, useTheme } from "../theme";
import { useContent } from "../store";
import { PlayIcon } from "../icons";
import { Btn, Card, Txt } from "../ui";

/**
 * The newest published video, on the dashboard. Tapping it opens the Videos
 * page, which is the only way in: there is no tab or header button, so the card
 * appears once something is published and is gone when nothing is.
 */
export default function LatestVideoCard({ onPress }: { onPress: () => void }) {
  const { c } = useTheme();
  const { videos } = useContent();
  const latest = videos[0];
  if (!latest) return null;

  return (
    <Btn onPress={onPress} accessibilityLabel={`Watch ${latest.title}`}>
      <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        {latest.youtube_id ? (
          <Image source={{ uri: `https://img.youtube.com/vi/${latest.youtube_id}/mqdefault.jpg` }} style={{ width: 96, height: 54, borderRadius: RADIUS.sm }} resizeMode="cover" />
        ) : (
          <View style={{ width: 96, height: 54, borderRadius: RADIUS.sm, backgroundColor: "#0D1838", alignItems: "center", justifyContent: "center" }}>
            <PlayIcon size={20} color="#fff" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Txt variant="displayBold" numberOfLines={2} style={{ fontSize: 14, color: c.foreground }}>{latest.title}</Txt>
          <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 3, color: c.primary }}>
            {videos.length > 1 ? `Watch · ${videos.length} videos` : "Watch"}
          </Txt>
        </View>
      </Card>
    </Btn>
  );
}
