import React, { useState } from "react";
import { Image, ScrollView, View } from "react-native";

import { RADIUS, TintName, useTheme } from "../theme";
import {
  LANGUAGES,
  Lang,
  StudyText,
  isoDate,
  studyReleased,
  weekStart,
} from "../data";
import { useContent } from "../store";
import {
  BookIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  XCircleIcon,
} from "../icons";
import { Btn, Card, SectionHeading, TintTile, Txt, shadow, tintFg } from "../ui";
import { CoverPicker, Field, SubmitButton } from "../components/AdminForm";

type Section = "schedule" | "events" | "study" | "verse";

const SECTIONS: { id: Section; label: string; tint: TintName }[] = [
  { id: "schedule", label: "Schedule", tint: "blue" },
  { id: "events", label: "Events", tint: "amber" },
  { id: "study", label: "Bible Study", tint: "violet" },
  { id: "verse", label: "Daily Verse", tint: "green" },
];

/** One language column of the study form, before it becomes a `StudyText`. */
interface StudyForm {
  title: string;
  chapter: string;
  aims: string;
  questions: string;
  memoryVerse: string;
  notes: string;
}

const emptyStudyForm = (): StudyForm => ({
  title: "",
  chapter: "",
  aims: "",
  questions: "",
  memoryVerse: "",
  notes: "",
});

/** Aims and questions are typed one per line. */
function splitLines(text: string) {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*\u2022]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

/** The next Sunday, as the default date for a newly published study. */
function nextSunday() {
  const d = weekStart(new Date());
  d.setDate(d.getDate() + 7);
  return isoDate(d);
}

/** "Sunday 6 September" — so an admin can sanity-check the date they typed. */
function readableSunday(iso: string) {
  const [y, m, day] = iso.split("-").map(Number);
  if (!y || !m || !day) return "";
  return new Date(y, m - 1, day).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/** A published row with a delete affordance. */
function PublishedRow({
  tint,
  Icon,
  title,
  subtitle,
  meta,
  onRemove,
  trailing,
  cover,
}: {
  tint: TintName;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle: string;
  meta?: string;
  onRemove?: () => void;
  trailing?: React.ReactNode;
  cover?: string;
}) {
  const { c, isDark } = useTheme();

  return (
    <Card style={{ padding: 11, flexDirection: "row", alignItems: "center", gap: 12 }}>
      {cover ? (
        <Image source={{ uri: cover }} style={{ width: 42, height: 42, borderRadius: RADIUS.md }} resizeMode="cover" />
      ) : (
        <TintTile tint={tint} size={42}>
          <Icon size={18} color={tintFg(tint, isDark)} />
        </TintTile>
      )}

      <View style={{ flex: 1 }}>
        <Txt variant="displayBold" numberOfLines={1} style={{ fontSize: 14, color: c.foreground }}>
          {title}
        </Txt>
        <Txt variant="bodyMedium" numberOfLines={1} style={{ fontSize: 11.5, marginTop: 2, color: c.mutedForeground }}>
          {subtitle}
        </Txt>
        {meta ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
            <ClockIcon size={11} color={c.mutedForeground} />
            <Txt variant="bodyMedium" style={{ fontSize: 11, color: c.mutedForeground }}>
              {meta}
            </Txt>
          </View>
        ) : null}
      </View>

      {trailing}

      {onRemove ? (
        <Btn
          onPress={onRemove}
          style={{ padding: 8, borderRadius: RADIUS.sm, backgroundColor: c.muted }}
        >
          <TrashIcon size={15} color={c.mutedForeground} />
        </Btn>
      ) : null}
    </Card>
  );
}

/**
 * Everything an admin publishes to the congregation. Each save goes into the
 * shared content store, so it is on every member's dashboard immediately and
 * announced in their notifications — no separate "publish" step to forget.
 */
export default function PublishScreen({ bottomInset }: { bottomInset: number }) {
  const { c, isDark } = useTheme();
  const {
    schedule,
    events,
    studies,
    addService,
    removeService,
    addEvent,
    removeEvent,
    addStudy,
    removeStudy,
    toggleStudy,
    dailyVerse,
    publishDailyVerse,
    removeDailyVerse,
  } = useContent();

  const [section, setSection] = useState<Section>("schedule");
  const [saved, setSaved] = useState<string | null>(null);

  // Weekly schedule form
  const [sDay, setSDay] = useState("");
  const [sName, setSName] = useState("");
  const [sTime, setSTime] = useState("");
  const [sVenue, setSVenue] = useState("");
  const [sCover, setSCover] = useState<string | undefined>();

  // Upcoming event form
  const [eDate, setEDate] = useState("");
  const [eName, setEName] = useState("");
  const [eTag, setETag] = useState("");
  const [eCover, setECover] = useState<string | undefined>();

  // Bible study form. The pamphlet is taught in both languages, so the form
  // captures both — English first, then the Twi column.
  const [bWeek, setBWeek] = useState("");
  const [bDate, setBDate] = useState(nextSunday());
  const [bPages, setBPages] = useState("");
  const [bCover, setBCover] = useState<string | undefined>();
  const [studyLang, setStudyLang] = useState<Lang>("en");
  const [vEnglish, setVEnglish] = useState("");
  const [vTwi, setVTwi] = useState("");
  const [vReference, setVReference] = useState("");

  const [en, setEn] = useState(emptyStudyForm());
  const [tw, setTw] = useState(emptyStudyForm());
  const form = studyLang === "tw" ? tw : en;
  const setForm = (patch: Partial<StudyForm>) =>
    (studyLang === "tw" ? setTw : setEn)((f) => ({ ...f, ...patch }));

  const flash = (msg: string) => setSaved(msg);

  const saveService = () => {
    addService({ day: sDay.trim(), name: sName.trim(), time: sTime.trim(), venue: sVenue.trim(), cover: sCover });
    setSDay("");
    setSName("");
    setSTime("");
    setSVenue("");
    setSCover(undefined);
    flash(sCover ? "Service published — the photo is now in the dashboard slider" : "Service published to every member's dashboard");
  };

  const saveEvent = () => {
    addEvent({ date: eDate.trim(), name: eName.trim(), tag: eTag.trim() || "Assembly", cover: eCover });
    setEDate("");
    setEName("");
    setETag("");
    setECover(undefined);
    flash(eCover ? "Event published — the photo is now in the dashboard slider" : "Event published to every member's dashboard");
  };

  const saveStudy = () => {
    // The Twi column falls back to the English one, so a half-filled form still
    // publishes something readable rather than blank cards.
    const text = (f: StudyForm, fallback: StudyForm): StudyText => ({
      title: f.title.trim() || fallback.title.trim(),
      chapter: f.chapter.trim() || fallback.chapter.trim(),
      aims: splitLines(f.aims).length > 0 ? splitLines(f.aims) : splitLines(fallback.aims),
      questions: splitLines(f.questions).length > 0 ? splitLines(f.questions) : splitLines(fallback.questions),
      memoryVerse: f.memoryVerse.trim() || fallback.memoryVerse.trim(),
      notes: f.notes.trim() || fallback.notes.trim() || undefined,
    });

    addStudy({
      weekNumber: Number(bWeek.trim()) || studies.length + 1,
      date: bDate.trim(),
      pages: bPages.trim() || "—",
      available: true,
      cover: bCover,
      en: text(en, en),
      tw: text(tw, en),
    });

    setBWeek("");
    setBDate(nextSunday());
    setBPages("");
    setBCover(undefined);
    setEn(emptyStudyForm());
    setTw(emptyStudyForm());
    setStudyLang("en");
    flash(bCover ? "Study released — the photo is now in the dashboard slider" : "Bible study released to every member's dashboard");
  };

  const saveVerse = () => {
    publishDailyVerse({ english: vEnglish.trim(), twi: vTwi.trim(), reference: vReference.trim() });
    setVEnglish("");
    setVTwi("");
    setVReference("");
    flash("Daily verse published — members will see it in their morning popup");
  };

  const scheduleReady = sDay.trim() !== "" && sName.trim() !== "" && sTime.trim() !== "";
  const eventReady = eDate.trim() !== "" && eName.trim() !== "";
  const studyReady = bDate.trim() !== "" && en.title.trim() !== "" && en.chapter.trim() !== "";
  const verseReady = vEnglish.trim() !== "" && vTwi.trim() !== "" && vReference.trim() !== "";

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* What this does */}
      <Card style={{ padding: 14, flexDirection: "row", gap: 13 }}>
        <TintTile tint="green" size={46}>
          <UploadIcon size={20} color={tintFg("green", isDark)} />
        </TintTile>
        <View style={{ flex: 1 }}>
          <Txt variant="displayBold" style={{ fontSize: 15.5, color: c.foreground }}>
            Publish to the congregation
          </Txt>
          <Txt style={{ fontSize: 12.5, lineHeight: 18, marginTop: 3, color: c.mutedForeground }}>
            Anything you add here appears on every member's dashboard straight away, and is
            announced in their notifications.
          </Txt>
        </View>
      </Card>

      {saved ? (
        <Card style={{ marginTop: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <CheckCircleIcon size={20} color={tintFg("green", isDark)} />
          <Txt variant="bodySemi" style={{ flex: 1, fontSize: 12.5, lineHeight: 17, color: c.foreground }}>
            {saved}
          </Txt>
          <Btn onPress={() => setSaved(null)}>
            <XCircleIcon size={18} color={c.mutedForeground} />
          </Btn>
        </Card>
      ) : null}

      {/* Section switcher */}
      <View
        style={{
          marginTop: 16,
          padding: 4,
          borderRadius: RADIUS.lg,
          backgroundColor: c.muted,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 4 }}
        >
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <Btn
                key={s.id}
                onPress={() => setSection(s.id)}
                scale={1}
                style={[
                  {
                    minWidth: 112,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  active ? { backgroundColor: c.card } : null,
                  active && !isDark ? shadow("sm") : null,
                ]}
              >
                <Txt
                  variant="bodySemi"
                  numberOfLines={1}
                  style={{ fontSize: 12.5, color: active ? c.primary : c.mutedForeground }}
                >
                  {s.label}
                </Txt>
              </Btn>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Weekly schedule ───────────────────────────────────────────────── */}
      {section === "schedule" ? (
        <>
          <SectionHeading label="Add a service" />
          <Card style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Field label="Day" value={sDay} onChangeText={setSDay} placeholder="Sunday" style={{ flex: 1 }} />
              <Field label="Time" value={sTime} onChangeText={setSTime} placeholder="9:00 AM" style={{ flex: 1 }} />
            </View>
            <Field label="Service name" value={sName} onChangeText={setSName} placeholder="Divine Service" />
            <Field label="Venue" value={sVenue} onChangeText={setSVenue} placeholder="Royal Assembly" />
            <CoverPicker value={sCover} onChange={setSCover} />
            <SubmitButton label="Publish service" onPress={saveService} disabled={!scheduleReady} Icon={PlusIcon} />
          </Card>

          <SectionHeading
            label="Live schedule"
            trailing={
              <Txt variant="bodySemi" style={{ fontSize: 11.5, color: c.mutedForeground }}>
                {schedule.length} services
              </Txt>
            }
          />
          <View style={{ gap: 10 }}>
            {schedule.map((s) => (
              <PublishedRow
                key={s.id}
                tint="blue"
                Icon={ClockIcon}
                title={s.name}
                subtitle={`${s.day} · ${s.time}`}
                meta={s.venue}
                cover={s.cover}
                onRemove={() => removeService(s.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      {/* ── Upcoming events ───────────────────────────────────────────────── */}
      {section === "events" ? (
        <>
          <SectionHeading label="Add an event" />
          <Card style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Field label="Date" value={eDate} onChangeText={setEDate} placeholder="Sep 14" style={{ flex: 1 }} />
              <Field label="Category" value={eTag} onChangeText={setETag} placeholder="District" style={{ flex: 1 }} />
            </View>
            <Field label="Event name" value={eName} onChangeText={setEName} placeholder="Harvest Festival" />
            <CoverPicker value={eCover} onChange={setECover} />
            <SubmitButton label="Publish event" onPress={saveEvent} disabled={!eventReady} Icon={PlusIcon} />
          </Card>

          <SectionHeading
            label="Live events"
            trailing={
              <Txt variant="bodySemi" style={{ fontSize: 11.5, color: c.mutedForeground }}>
                {events.length} listed
              </Txt>
            }
          />
          <View style={{ gap: 10 }}>
            {events.map((e) => (
              <PublishedRow
                key={e.id}
                tint={e.tint ?? "amber"}
                Icon={CalendarIcon}
                title={e.name}
                subtitle={`${e.tag} event`}
                meta={e.date}
                cover={e.cover}
                onRemove={() => removeEvent(e.id)}
              />
            ))}
          </View>
        </>
      ) : null}

      {/* ── Bible study guide ─────────────────────────────────────────────── */}
      {section === "study" ? (
        <>
          <SectionHeading label="Add a study from the pamphlet" />
          <Card style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Field label="Week number" value={bWeek} onChangeText={setBWeek} placeholder={String(studies.length + 1)} style={{ flex: 1 }} />
              <Field label="Pages" value={bPages} onChangeText={setBPages} placeholder="pp. 69–84" style={{ flex: 1 }} />
            </View>
            <Field
              label="Sunday taught"
              value={bDate}
              onChangeText={setBDate}
              placeholder="2026-09-06"
              autoCapitalize="none"
            />
            <Txt style={{ fontSize: 11.5, lineHeight: 16, marginTop: -6, color: c.mutedForeground }}>
              The app uses this date to work out which study the class is on. {bDate ? readableSunday(bDate) : ""}
            </Txt>

            {/* Which language column is being typed */}
            <View style={{ flexDirection: "row", padding: 2, borderRadius: RADIUS.md, backgroundColor: c.muted, alignItems: "center" }}>
              {LANGUAGES.map((l) => {
                const active = studyLang === l.id;
                const filled = (l.id === "tw" ? tw : en).title.trim() !== "";
                return (
                  <Btn
                    key={l.id}
                    onPress={() => setStudyLang(l.id)}
                    scale={1}
                    style={[
                      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: RADIUS.sm },
                      active ? { backgroundColor: c.card } : null,
                      active && !isDark ? shadow("sm") : null,
                    ]}
                  >
                    <Txt variant="bodySemi" style={{ fontSize: 12.5, color: active ? c.primary : c.mutedForeground }}>
                      {l.label}
                    </Txt>
                    {filled ? <CheckCircleIcon size={13} color={tintFg("green", isDark)} /> : null}
                  </Btn>
                );
              })}
            </View>

            <Field
              label="Title"
              value={form.title}
              onChangeText={(v) => setForm({ title: v })}
              placeholder={studyLang === "tw" ? "Honhom no Aba" : "The Fruit of the Spirit"}
            />
            <Field
              label="Scripture"
              value={form.chapter}
              onChangeText={(v) => setForm({ chapter: v })}
              placeholder={studyLang === "tw" ? "Galatifo 5:22–23" : "Galatians 5:22–23"}
            />
            <Field
              label="What we will learn"
              value={form.aims}
              onChangeText={(v) => setForm({ aims: v })}
              placeholder={"One aim per line"}
              multiline
            />
            <Field
              label="Questions for the class"
              value={form.questions}
              onChangeText={(v) => setForm({ questions: v })}
              placeholder={"One question per line"}
              multiline
            />
            <Field
              label="Memory verse"
              value={form.memoryVerse}
              onChangeText={(v) => setForm({ memoryVerse: v })}
              placeholder={studyLang === "tw" ? "Galatifo 5:25 — ..." : "Galatians 5:25 — ..."}
            />
            <Field
              label="Notes"
              value={form.notes}
              onChangeText={(v) => setForm({ notes: v })}
              placeholder="Any further explanation from the pamphlet"
              multiline
            />

            {studyLang === "en" && tw.title.trim() === "" ? (
              <Txt style={{ fontSize: 11.5, lineHeight: 16, color: c.mutedForeground }}>
                Switch to Twi to add that column. Anything you leave blank there falls back to the English.
              </Txt>
            ) : null}

            <CoverPicker value={bCover} onChange={setBCover} />
            <SubmitButton label="Release study" onPress={saveStudy} disabled={!studyReady} Icon={PlusIcon} />
          </Card>

          <SectionHeading
            label="Study guide"
            trailing={
              <Txt variant="bodySemi" style={{ fontSize: 11.5, color: c.mutedForeground }}>
                {studies.filter((s) => studyReleased(s)).length} of {studies.length} released
              </Txt>
            }
          />
          <View style={{ gap: 10 }}>
            {studies.map((s) => (
              <PublishedRow
                key={s.id}
                tint={studyReleased(s) ? "violet" : "blue"}
                Icon={BookIcon}
                title={s.en.title}
                subtitle={`Week ${s.weekNumber} · ${s.en.chapter}`}
                meta={`${readableSunday(s.date)} · ${s.pages}`}
                cover={s.cover}
                onRemove={() => removeStudy(s.id)}
                trailing={
                  <Btn
                    onPress={() => toggleStudy(s.id)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: RADIUS.sm,
                      backgroundColor: studyReleased(s) ? c.muted : c.primary,
                    }}
                  >
                    <Txt
                      variant="bodySemi"
                      style={{ fontSize: 11, color: studyReleased(s) ? c.mutedForeground : "#fff" }}
                    >
                      {studyReleased(s) ? "Live" : "Release"}
                    </Txt>
                  </Btn>
                }
              />
            ))}
          </View>
        </>
      ) : null}

      {section === "verse" ? (
        <>
          <SectionHeading label="Set today's verse" />
          <Card style={{ padding: 14, gap: 12 }}>
            <Txt style={{ fontSize: 12.5, lineHeight: 18, color: c.mutedForeground }}>
              Publish one verse for the congregation. It opens as a morning message on each member's dashboard and stays visible there for the day.
            </Txt>
            <Field label="Bible reference" value={vReference} onChangeText={setVReference} placeholder="John 3:16" />
            <Field label="English verse" value={vEnglish} onChangeText={setVEnglish} placeholder="For God so loved the world..." multiline />
            <Field label="Twi verse" value={vTwi} onChangeText={setVTwi} placeholder="Na Onyankopon dɔ wiase no saa..." multiline />
            <SubmitButton label="Publish daily verse" onPress={saveVerse} disabled={!verseReady} Icon={BookIcon} />
          </Card>

          {dailyVerse ? (
            <>
              <SectionHeading label="Current daily verse" />
              <PublishedRow
                tint="green"
                Icon={BookIcon}
                title={dailyVerse.reference}
                subtitle={`${dailyVerse.english} · ${dailyVerse.twi}`}
                meta={`Published ${dailyVerse.publishedOn}`}
                onRemove={() => {
                  removeDailyVerse();
                  flash("Daily verse deleted");
                }}
              />
            </>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}
