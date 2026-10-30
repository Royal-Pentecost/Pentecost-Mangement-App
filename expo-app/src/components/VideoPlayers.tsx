import React from "react";
import { Linking, View } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { VideoView, useVideoPlayer } from "expo-video";

import { RADIUS, useTheme } from "../theme";
import { PlayIcon } from "../icons";
import { Btn, Txt } from "../ui";

/**
 * A YouTube video played inside the app. Embedded playback depends on the
 * uploader allowing it, so "Open in YouTube" is always offered underneath —
 * a sermon a member can't watch here, they can still watch there.
 */
export function YouTubePlayer({ videoId, width }: { videoId: string; width: number }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ borderRadius: RADIUS.md, overflow: "hidden", backgroundColor: "#000" }}>
        <YoutubePlayer height={Math.round((width * 9) / 16)} width={width} videoId={videoId} />
      </View>
      <Btn
        onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}
        style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 }}
      >
        <PlayIcon size={13} color={c.primary} />
        <Txt variant="bodySemi" style={{ fontSize: 12.5, color: c.primary }}>Open in YouTube</Txt>
      </Btn>
    </View>
  );
}

/** A clip uploaded from a phone, with the platform's own play, pause and full-screen controls. */
export function ClipPlayer({ uri, width }: { uri: string; width: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return (
    <View style={{ borderRadius: RADIUS.md, overflow: "hidden", backgroundColor: "#000" }}>
      <VideoView
        player={player}
        style={{ width, height: Math.round((width * 9) / 16) }}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />
    </View>
  );
}
