import React, { useState } from "react";
import { Image, ScrollView, View, useWindowDimensions } from "react-native";

import { RADIUS, SCREEN_PAD, useTheme } from "../theme";
import { useContent } from "../store";
import { PlayIcon } from "../icons";
import { Btn, Card, Txt } from "../ui";
import { FadeIn } from "../motion";
import { usePullToRefresh } from "../refresh";
import { ClipPlayer, YouTubePlayer } from "../components/VideoPlayers";

function when(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Every video the assembly has published, newest first. A card shows its
 * thumbnail; tapping it opens the player in place, and only one plays at a
 * time so two sermons never talk over each other.
 */
export default function VideosScreen({ bottomInset }: { bottomInset: number }) {
  const pullToRefresh = usePullToRefresh();
  const { c } = useTheme();
  const { videos } = useContent();
  const { width } = useWindowDimensions();
  const [openId, setOpenId] = useState<string | null>(videos[0]?.id ?? null);
  const playerWidth = width - SCREEN_PAD * 2 - 24;

  return (
    <ScrollView refreshControl={pullToRefresh} style={{ flex: 1 }} contentContainerStyle={{ padding: SCREEN_PAD, gap: 12, paddingBottom: bottomInset }}>
      {videos.length === 0 ? (
        <Card style={{ padding: 24, alignItems: "center", gap: 8 }}>
          <PlayIcon size={28} color={c.mutedForeground} />
          <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>No videos yet</Txt>
          <Txt style={{ fontSize: 12.5, textAlign: "center", color: c.mutedForeground }}>
            Sermons and clips from Royal Assembly will appear here.
          </Txt>
        </Card>
      ) : null}

      {videos.map((v, i) => {
        const open = openId === v.id;
        const clip = !v.youtube_id && v.video_file;
        return (
          <FadeIn key={v.id} index={i}>
            <Card style={{ padding: 12, gap: 10 }}>
              {open ? (
                v.youtube_id ? (
                  <YouTubePlayer videoId={v.youtube_id} width={playerWidth} />
                ) : clip ? (
                  <ClipPlayer uri={v.video_file as string} width={playerWidth} />
                ) : null
              ) : (
                <Btn
                  onPress={() => setOpenId(v.id)}
                  accessibilityLabel={`Play ${v.title}`}
                  style={{ borderRadius: RADIUS.md, overflow: "hidden", backgroundColor: "#0D1838" }}
                >
                  {v.youtube_id ? (
                    <Image
                      source={{ uri: `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg` }}
                      style={{ width: playerWidth, height: Math.round((playerWidth * 9) / 16) }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: playerWidth, height: Math.round((playerWidth * 9) / 16) }} />
                  )}
                  <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.55)" }}>
                      <PlayIcon size={26} color="#fff" />
                    </View>
                  </View>
                </Btn>
              )}

              <View>
                <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>{v.title}</Txt>
                <Txt style={{ fontSize: 11.5, marginTop: 2, color: c.mutedForeground }}>
                  {when(v.created_at)}{v.youtube_id ? " · YouTube" : " · Clip"}
                </Txt>
                {v.description ? (
                  <Txt style={{ fontSize: 13, lineHeight: 19, marginTop: 6, color: c.foreground }}>{v.description}</Txt>
                ) : null}
              </View>
            </Card>
          </FadeIn>
        );
      })}
    </ScrollView>
  );
}
