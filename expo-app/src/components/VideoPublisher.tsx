import React, { useState } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { RADIUS, useTheme } from "../theme";
import { useContent } from "../store";
import { PlayIcon, TrashIcon, UploadIcon } from "../icons";
import { Btn, Card, SectionHeading, Txt } from "../ui";
import { Field, SubmitButton } from "./AdminForm";

/** Matches the server's limit: about a minute of phone video. */
const MAX_CLIP_MB = 40;
const MAX_CLIP_SECONDS = 60;

type Mode = "youtube" | "clip";

/**
 * Publishes a video for the whole assembly. Long videos — a sermon, a whole
 * service — go on YouTube and are shared here by link; short clips upload
 * straight from the phone. Either way every member is notified.
 */
export default function VideoPublisher() {
  const { c, isDark } = useTheme();
  const { videos, publishVideo, removeVideo, publishError } = useContent();
  const [mode, setMode] = useState<Mode>("youtube");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [clip, setClip] = useState<{ uri: string; seconds: number } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const pickClip = async () => {
    setProblem(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: MAX_CLIP_SECONDS,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const seconds = Math.round((asset.duration ?? 0) / 1000);
    const mb = (asset.fileSize ?? 0) / (1024 * 1024);
    // Said before a long upload over mobile data, not after it fails.
    if (seconds > MAX_CLIP_SECONDS + 1 || mb > MAX_CLIP_MB) {
      setProblem(`That video is ${seconds ? `${seconds}s` : `${Math.round(mb)} MB`}. Clips can be up to a minute (${MAX_CLIP_MB} MB) — put longer videos on YouTube and paste the link.`);
      return;
    }
    setClip({ uri: asset.uri, seconds });
  };

  const ready = title.trim() !== "" && (mode === "youtube" ? link.trim() !== "" : clip !== null);

  const publish = async () => {
    setDone(null);
    const ok = await publishVideo({
      title: title.trim(),
      description: description.trim(),
      ...(mode === "youtube" ? { youtubeUrl: link.trim() } : { clipUri: clip?.uri }),
    });
    if (ok) {
      setDone("Published. Everyone has been notified.");
      setTitle("");
      setDescription("");
      setLink("");
      setClip(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Card style={{ padding: 14, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {([["youtube", "YouTube link"], ["clip", "Upload a clip"]] as [Mode, string][]).map(([id, label]) => {
            const on = mode === id;
            return (
              <Btn
                key={id}
                onPress={() => { setMode(id); setProblem(null); }}
                accessibilityState={{ selected: on }}
                style={{ flex: 1, paddingVertical: 11, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: on ? c.primary : c.muted }}
              >
                <Txt variant="bodySemi" style={{ fontSize: 13, color: on ? "#fff" : c.mutedForeground }}>{label}</Txt>
              </Btn>
            );
          })}
        </View>

        <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Divine Service — 2 Nov" />
        <Field label="Description (optional)" value={description} onChangeText={setDescription} multiline />

        {mode === "youtube" ? (
          <>
            <Field label="YouTube link" value={link} onChangeText={setLink} autoCapitalize="none" placeholder="https://youtu.be/…" />
            <Txt style={{ fontSize: 11.5, lineHeight: 16, color: c.mutedForeground }}>
              For sermons and full services. On YouTube, tap Share → Copy link, then paste it here.
            </Txt>
          </>
        ) : (
          <>
            <Btn onPress={pickClip} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: c.muted }}>
              <PlayIcon size={15} color={c.foreground} />
              <Txt variant="bodySemi" style={{ fontSize: 13, color: c.foreground }}>
                {clip ? `Clip chosen · ${clip.seconds}s — choose another` : "Choose a video clip"}
              </Txt>
            </Btn>
            <Txt style={{ fontSize: 11.5, lineHeight: 16, color: c.mutedForeground }}>
              Up to a minute. Uploading uses your data — Wi-Fi is best.
            </Txt>
          </>
        )}

        <SubmitButton label="Publish video" Icon={UploadIcon} onPress={publish} disabled={!ready} />

        {done ? <Txt variant="bodySemi" style={{ fontSize: 12.5, color: isDark ? "#6EE7B7" : "#15803D" }}>{done}</Txt> : null}
        {problem ?? publishError ? (
          <Txt variant="bodySemi" style={{ fontSize: 12.5, lineHeight: 18, color: isDark ? "#FCA5A5" : "#B91C1C" }}>{problem ?? publishError}</Txt>
        ) : null}
      </Card>

      <SectionHeading label={`Published videos · ${videos.length}`} />
      {videos.map((v) => {
        const confirming = confirmId === v.id;
        return (
          <Card key={v.id} style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodySemi" numberOfLines={1} style={{ fontSize: 13.5, color: c.foreground }}>{v.title}</Txt>
              <Txt style={{ fontSize: 11.5, marginTop: 2, color: c.mutedForeground }}>{v.youtube_id ? "YouTube" : "Uploaded clip"}</Txt>
            </View>
            <Btn
              onPress={confirming ? () => removeVideo(v.id).finally(() => setConfirmId(null)) : () => setConfirmId(v.id)}
              accessibilityLabel={confirming ? `Confirm removing ${v.title}` : `Remove ${v.title}`}
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
