import React from "react";
import { View } from "react-native";

import { RADIUS } from "../theme";

/**
 * The web preview has no WebView module, so YouTube plays in a plain iframe
 * and clips in a <video> element — same props as the phone versions.
 */
export function YouTubePlayer({ videoId, width }: { videoId: string; width: number }) {
  return (
    <View style={{ borderRadius: RADIUS.md, overflow: "hidden", backgroundColor: "#000" }}>
      {React.createElement("iframe", {
        src: `https://www.youtube.com/embed/${videoId}`,
        width,
        height: Math.round((width * 9) / 16),
        style: { border: 0 },
        allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
        allowFullScreen: true,
        title: "YouTube video",
      })}
    </View>
  );
}

export function ClipPlayer({ uri, width }: { uri: string; width: number }) {
  return (
    <View style={{ borderRadius: RADIUS.md, overflow: "hidden", backgroundColor: "#000" }}>
      {React.createElement("video", {
        src: uri,
        controls: true,
        style: { width, height: Math.round((width * 9) / 16), display: "block" },
      })}
    </View>
  );
}
