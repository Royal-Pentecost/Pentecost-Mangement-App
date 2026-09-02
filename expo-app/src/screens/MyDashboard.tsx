import React, { useEffect, useRef, useState } from "react";
import { Image, Linking, Modal, ScrollView, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BRAND, RADIUS, SCREEN_PAD, TintName, useTheme } from "../theme";
import {
  Assembly,
  AttendanceScenario,
  BibleStudy,
  Elder,
  LANGUAGES,
  LoginRole,
  ME,
  Member,
  SessionUser,
  StudyText,
  canViewMembers,
  classForDayBorn,
  imageSource,
  isSunday,
  pentecostLogo,
  serviceFallbackPhoto,
  studyForWeek,
  studyReleased,
  studyText,
  visibleMembers,
} from "../data";
import { useContent } from "../store";
import { exportPdf, stampedName } from "../files";
import {
  BookIcon,
  UsersIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  DownloadIcon,
  XIcon,
  FlameIcon,
  GmailIcon,
  WhatsappIcon,
  PhoneIcon,
  PinIcon,
} from "../icons";
import { Avatar, Btn, Card, ProgressBar, SectionHeading, StatusDot, TintTile, Txt, shadow, tintFg } from "../ui";
import { Collapsible, FadeIn, PopIn, useCountUp } from "../motion";

const CARD_GAP = 12;

/**
 * Assembly-life carousel. Draws from `homeSlides`, a deliberately different set
 * of photographs from the login screen's backdrop.
 */
/** Escape text before it goes into the PDF's HTML. */
function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Lay a study out as a printable page. Both languages go into the one PDF —
 * the class is mixed, and a member should be able to follow either column.
 */
function studyHtml(study: BibleStudy) {
  const section = (t: StudyText, heading: string) => {
    const list = (items: string[]) => items.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
    const prose = t.notes
      ? escapeHtml(t.notes).split(/\n{2,}/).map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`).join("")
      : "";

    return `<section>
      <div class="lang">${escapeHtml(heading)}</div>
      <h2>${escapeHtml(t.title)}</h2>
      <div class="ref">${escapeHtml(t.chapter)}</div>
      ${prose}
      <h3>${heading === "Twi" ? "Nea yɛbesua" : "What we will learn"}</h3>
      <ul>${list(t.aims)}</ul>
      <h3>${heading === "Twi" ? "Nsemmisa" : "Questions"}</h3>
      <ol>${list(t.questions)}</ol>
      <div class="verse">${escapeHtml(t.memoryVerse)}</div>
    </section>`;
  };

  return `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>
    body{font-family:-apple-system,Roboto,Helvetica,sans-serif;padding:40px;color:#0F172A;line-height:1.6}
    .eyebrow{font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#64748B}
    h1{font-size:24px;margin:6px 0 2px;color:#1E3A8A}
    .pages{font-size:12px;color:#94A3B8;margin-bottom:8px}
    section{border-top:1px solid #E2E8F0;padding-top:18px;margin-top:22px}
    .lang{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B45309;font-weight:700}
    h2{font-size:19px;margin:4px 0 2px;color:#1E3A8A}
    h3{font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#64748B;margin:18px 0 6px}
    .ref{font-size:13px;color:#B45309;margin-bottom:10px}
    p,li{font-size:13.5px;margin:0 0 8px}
    ul,ol{margin:0 0 4px;padding-left:20px}
    .verse{margin-top:14px;padding:12px 14px;background:#F8FAFC;border-left:3px solid #1E3A8A;font-size:13px}
    footer{margin-top:32px;font-size:11px;color:#94A3B8}
  </style></head><body>
    <div class="eyebrow">Week ${study.weekNumber} &middot; Bible Study Guide</div>
    <h1>${escapeHtml(study.en.title)}</h1>
    <div class="pages">${escapeHtml(study.pages)} &middot; ${escapeHtml(study.date)}</div>
    ${section(study.en, "English")}
    ${section(study.tw, "Twi")}
    <footer>The Church of Pentecost &middot; Royal Assembly, Ayigya District</footer>
  </body></html>`;
}

/** The English / Twi switch. The pamphlet is taught in both, so both are one tap apart. */
function LanguageToggle({ compact }: { compact?: boolean }) {
  const { c, isDark } = useTheme();
  const { language, setLanguage } = useContent();

  return (
    <View style={{ flexDirection: "row", padding: 2, borderRadius: RADIUS.pill, backgroundColor: compact ? "rgba(255,255,255,0.16)" : c.muted }}>
      {LANGUAGES.map((l) => {
        const active = language === l.id;
        return (
          <Btn
            key={l.id}
            onPress={() => setLanguage(l.id)}
            scale={1}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: RADIUS.pill,
              backgroundColor: active ? (compact ? "#fff" : c.card) : "transparent",
            }}
          >
            <Txt
              variant="bodySemi"
              style={{
                fontSize: 10.5,
                letterSpacing: 0.6,
                color: active ? (compact ? BRAND.navy : c.primary) : compact ? "rgba(255,255,255,0.8)" : c.mutedForeground,
              }}
            >
              {l.short}
            </Txt>
          </Btn>
        );
      })}
    </View>
  );
}

/** A titled list of the pamphlet's aims or questions. */
function StudyList({ label, items, ordered }: { label: string; items: string[]; ordered?: boolean }) {
  const { c, isDark } = useTheme();
  if (items.length === 0) return null;

  return (
    <View style={{ marginTop: 20 }}>
      <Txt variant="bodySemi" style={{ fontSize: 10.5, letterSpacing: 1.3, textTransform: "uppercase", color: c.mutedForeground }}>
        {label}
      </Txt>
      <View style={{ gap: 9, marginTop: 10 }}>
        {items.map((item, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 10 }}>
            {ordered ? (
              <Txt variant="displayBold" style={{ fontSize: 13, lineHeight: 21, width: 16, color: isDark ? BRAND.goldLight : BRAND.gold }}>
                {i + 1}.
              </Txt>
            ) : (
              <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 8, backgroundColor: isDark ? BRAND.goldLight : BRAND.gold }} />
            )}
            <Txt style={{ flex: 1, fontSize: 14, lineHeight: 21, color: c.foreground }}>{item}</Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

/** A full-screen reader for one study, with a button to save it as a PDF. */
function StudyReader({ study, onClose }: { study: BibleStudy | null; onClose: () => void }) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useContent();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const savePdf = async () => {
    if (!study || busy) return;
    setBusy(true);
    const result = await exportPdf(
      stampedName(study.en.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), "pdf"),
      studyHtml(study),
    );
    setStatus(result.message);
    setBusy(false);
  };

  const t = study ? studyText(study, language) : null;
  const twi = language === "tw";

  return (
    <Modal visible={!!study} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
        {study && t ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <Btn onPress={onClose} style={{ width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: c.muted }}>
                <XIcon size={17} color={c.foreground} />
              </Btn>
              <View style={{ flex: 1 }}>
                <Txt variant="bodySemi" style={{ fontSize: 10.5, letterSpacing: 1.4, textTransform: "uppercase", color: c.mutedForeground }}>
                  Week {study.weekNumber} · Bible Study
                </Txt>
                <Txt variant="displayBold" numberOfLines={1} style={{ fontSize: 16, color: c.foreground }}>
                  {t.title}
                </Txt>
              </View>
              <LanguageToggle />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
              showsVerticalScrollIndicator={false}
            >
              {study.cover ? (
                <Image
                  source={{ uri: study.cover }}
                  style={{ width: "100%", height: 180, borderRadius: RADIUS.xl, marginBottom: 16 }}
                  resizeMode="cover"
                />
              ) : null}

              <Txt variant="displayBold" style={{ fontSize: 15, color: isDark ? BRAND.goldLight : BRAND.gold }}>
                {t.chapter}
              </Txt>
              <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 3, color: c.mutedForeground }}>
                {study.pages} · {formatSunday(study.date)}
              </Txt>

              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 16 }} />

              {t.notes ? (
                <Txt style={{ fontSize: 14.5, lineHeight: 24, color: c.foreground }}>{t.notes}</Txt>
              ) : null}

              <StudyList label={twi ? "Nea yɛbesua" : "What we will learn"} items={t.aims} />
              <StudyList label={twi ? "Nsemmisa" : "Questions for the class"} items={t.questions} ordered />

              <Card style={{ marginTop: 22, padding: 14, borderLeftWidth: 3, borderLeftColor: isDark ? BRAND.goldLight : BRAND.gold }}>
                <Txt variant="bodySemi" style={{ fontSize: 10.5, letterSpacing: 1.3, textTransform: "uppercase", color: c.mutedForeground }}>
                  {twi ? "Nkyerɛwee a wɔkae" : "Memory verse"}
                </Txt>
                <Txt style={{ fontSize: 14.5, lineHeight: 22, marginTop: 7, color: c.foreground }}>{t.memoryVerse}</Txt>
              </Card>

              {status ? (
                <Card style={{ marginTop: 16, padding: 12 }}>
                  <Txt variant="bodySemi" style={{ fontSize: 12.5, lineHeight: 17, color: c.foreground }}>
                    {status}
                  </Txt>
                </Card>
              ) : null}
            </ScrollView>

            <View style={{ position: "absolute", left: 18, right: 18, bottom: insets.bottom + 16 }}>
              <Btn
                onPress={savePdf}
                disabled={busy}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 15,
                  borderRadius: RADIUS.md,
                  backgroundColor: isDark ? BRAND.blue : BRAND.navy,
                }}
              >
                <DownloadIcon color={isDark ? "#0A1020" : "#fff"} />
                <Txt variant="displayBold" style={{ fontSize: 14, color: isDark ? "#0A1020" : "#fff" }}>
                  {busy ? "Preparing PDF…" : "Save as PDF"}
                </Txt>
              </Btn>
            </View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

/**
 * The Bible study class the member is due at. Classes meet on Sunday in
 * day-born groups, so this names the week's study from the pamphlet and the
 * room that member's group uses. On Sunday it reads as "today"; the rest of the
 * week it is the study to prepare.
 */
function BibleStudyClassCard({
  me,
  onOpen,
}: {
  me: Member;
  onOpen: (study: BibleStudy) => void;
}) {
  const { c, isDark } = useTheme();
  const { studies, language } = useContent();

  const study = studyForWeek(studies);
  if (!study) return null;

  const t = studyText(study, language);
  const klass = classForDayBorn(me.dayBorn);
  const today = isSunday();
  const twi = language === "tw";

  return (
    <>
      <SectionHeading
        label={today ? "Today's Bible Study" : "This Week's Bible Study"}
        trailing={<LanguageToggle />}
      />

      <Btn onPress={() => onOpen(study)}>
        <LinearGradient
          colors={isDark ? ["#3730A3", "#1B2437"] : [BRAND.navy, "#2563EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: RADIUS.xl, padding: 15 }, shadow("md")]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: RADIUS.pill,
                backgroundColor: today ? "rgba(134,239,172,0.24)" : "rgba(255,255,255,0.16)",
              }}
            >
              <Txt variant="bodySemi" style={{ fontSize: 10, letterSpacing: 0.8, color: today ? "#BBF7D0" : "rgba(255,255,255,0.9)" }}>
                {today ? "TODAY" : formatSunday(study.date).toUpperCase()}
              </Txt>
            </View>
            <Txt variant="bodySemi" style={{ fontSize: 10.5, letterSpacing: 1.2, color: "rgba(255,255,255,0.7)" }}>
              WEEK {study.weekNumber}
            </Txt>
          </View>

          <Txt variant="displayExtraBold" style={{ fontSize: 22, lineHeight: 28, marginTop: 12, color: "#fff" }}>
            {t.title}
          </Txt>
          <Txt variant="bodySemi" style={{ fontSize: 13.5, marginTop: 4, color: "#FCD34D" }}>
            {t.chapter} · {study.pages}
          </Txt>

          {/* Which class this member sits in */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 11,
              marginTop: 16,
              padding: 12,
              borderRadius: RADIUS.md,
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)" }}>
              <UsersIcon size={19} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="displayBold" style={{ fontSize: 13.5, color: "#fff" }}>
                {klass.akan} · {me.dayBorn}-born class
              </Txt>
              <Txt variant="bodyMedium" style={{ fontSize: 11.5, marginTop: 2, color: "rgba(255,255,255,0.75)" }}>
                {klass.venue} · {klass.time}
              </Txt>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}>
            <BookIcon size={14} color="rgba(255,255,255,0.85)" />
            <Txt variant="bodySemi" style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>
              {twi ? "Bue nhwehwɛmu no" : "Open the study guide"}
            </Txt>
            <ChevronRightIcon color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>
      </Btn>
    </>
  );
}

/** "Sunday 30 August" — the day the class meets. */
function formatSunday(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function PhotoCarousel() {
  const { c } = useTheme();
  // Seeded photographs plus every cover an admin has attached while publishing.
  const { slides } = useContent();
  const { width } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);

  // Cards leave a sliver of the next photo visible.
  const cardWidth = width - SCREEN_PAD * 2 - 28;
  const step = cardWidth + CARD_GAP;

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % slides.length;
      indexRef.current = next;
      setSlideIndex(next);
      scrollRef.current?.scrollTo({ x: next * step, animated: true });
    }, 4000);
    return () => clearInterval(timer);
  }, [step, slides.length]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={step}
        snapToAlignment="start"
        contentContainerStyle={{ gap: CARD_GAP, paddingRight: 28 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / step);
          indexRef.current = i;
          setSlideIndex(i);
        }}
      >
        {slides.map((photo) => (
          <View key={photo.id} style={[{ width: cardWidth, height: 190, borderRadius: RADIUS.xl, overflow: "hidden", backgroundColor: "#172554" }, shadow("md")]}>
            <Image source={photo.source} style={{ width: cardWidth, height: 190 }} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(8,15,40,0.8)"]}
              locations={[0.4, 1]}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <View style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
              <Txt variant="displayExtraBold" numberOfLines={1} style={{ color: "#fff", fontSize: 17 }}>
                {photo.label}
              </Txt>
              {photo.caption ? (
                <Txt variant="bodyMedium" numberOfLines={1} style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 2 }}>
                  {photo.caption}
                </Txt>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 }}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === slideIndex ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === slideIndex ? c.primary : "#CBD5E1",
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function MyDashboard({
  assembly,
  scenario,
  sessionActive,
  attendanceMarked,
  onMarkAttendance,
  elders,
  onOpenElders,
  onOpenMembers,
  loginRole,
  user,
  bottomInset,
}: {
  assembly: Assembly;
  scenario: AttendanceScenario;
  sessionActive: boolean;
  attendanceMarked: boolean;
  onMarkAttendance: () => void;
  elders: Elder[];
  onOpenElders: () => void;
  onOpenMembers: () => void;
  loginRole: LoginRole;
  user: SessionUser;
  bottomInset: number;
}) {
  const { c, isDark } = useTheme();
  // Live content — whatever an admin has published in the Admin Hub.
  const { schedule: weeklySchedule, events, studies: bibleStudies, language } = useContent();
  // Which study the app is on — the pamphlet week containing today.
  const thisWeek = studyForWeek(bibleStudies);
  const [reading, setReading] = useState<BibleStudy | null>(null);
  const [savingPdf, setSavingPdf] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

  const savePdf = async (study: BibleStudy) => {
    setSavingPdf(study.id);
    setPdfStatus(null);
    const result = await exportPdf(
      stampedName(study.en.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), "pdf"),
      studyHtml(study),
    );
    setPdfStatus(result.message);
    setSavingPdf(null);
  };
  const [historyOpen, setHistoryOpen] = useState(false);

  // Headline figures tick up rather than snapping into place.
  const attendanceCount = useCountUp(ME.attendancePct);
  const streakCount = useCountUp(ME.streak, 700, 260);

  const { width } = useWindowDimensions();
  const serviceTile = (width - SCREEN_PAD * 2 - 12) / 2;

  const me = ME;
  const myElder = elders.find((e) => e.id === me.elderId);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const canMark = scenario === "inside-active" && !attendanceMarked;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
    >
      {/* Personal welcome */}
      <LinearGradient
        colors={isDark ? ["#1B2C6B", "#0F1B44"] : ["#22357F", "#1B2C6B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: RADIUS.xl, padding: 17, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", right: 18, top: "50%", marginTop: -34 }}>
          <Avatar
            photo={user.photo}
            initials={user.avatar}
            color={user.avatarColor}
            size={68}
            radius={34}
            borderWidth={2.5}
            borderColor="rgba(255,255,255,0.45)"
            fontSize={24}
          />
        </View>
        <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
          {today}
        </Txt>
        <Txt variant="displayExtraBold" style={{ fontSize: 24, marginTop: 6, color: "#fff", lineHeight: 30 }}>
          Welcome back,{"\n"}
          {me.name.split(" ")[0]}
        </Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
          <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Image source={pentecostLogo} style={{ width: 17, height: 17 }} resizeMode="contain" />
          </View>
          <Txt variant="bodyMedium" style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
            {me.assembly} · {me.memberId}
          </Txt>
        </View>
      </LinearGradient>

      {/* Assembly life carousel */}
      <View style={{ marginTop: 18 }}>
        <PhotoCarousel />
      </View>

      {/* Attendance */}
      <SectionHeading label="My Attendance" />

      <Card style={{ padding: 15 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
          <View>
            <Txt variant="displayExtraBold" style={{ fontSize: 34, lineHeight: 38, color: isDark ? BRAND.blue : BRAND.navy }}>
              {attendanceCount}%
            </Txt>
            <Txt variant="bodyMedium" style={{ fontSize: 12.5, color: c.mutedForeground }}>
              Annual score
            </Txt>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <FlameIcon size={16} color={c.accent} />
              <Txt variant="displayBold" style={{ fontSize: 16, color: c.accent }}>
                {streakCount} weeks
              </Txt>
            </View>
            <Txt variant="bodyMedium" style={{ fontSize: 12.5, color: c.mutedForeground }}>
              Current streak
            </Txt>
          </View>
        </View>

        <ProgressBar pct={me.attendancePct} height={8} fillColor={isDark ? BRAND.blue : BRAND.navy} />

        {/* Live session state */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 16,
            padding: 12,
            borderRadius: RADIUS.md,
            backgroundColor: c.muted,
          }}
        >
          {sessionActive ? (
            <StatusDot size={9} color={BRAND.green} ping />
          ) : (
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: "#94A3B8" }} />
          )}
          <Txt variant="bodyMedium" style={{ flex: 1, fontSize: 12.5, color: c.mutedForeground }}>
            {sessionActive ? "Session is open at your assembly" : "No attendance session is open right now"}
          </Txt>
        </View>

        {attendanceMarked ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginTop: 10,
              padding: 12,
              borderRadius: RADIUS.md,
              backgroundColor: isDark ? "#16A34A22" : "#E7F8EF",
            }}
          >
            <CheckCircleIcon size={17} color={BRAND.green} />
            <Txt variant="bodySemi" style={{ fontSize: 13, color: isDark ? BRAND.greenLight : "#15803D" }}>
              Attendance marked for today
            </Txt>
          </View>
        ) : (
          <Btn
            onPress={canMark ? onMarkAttendance : undefined}
            disabled={!canMark}
            style={{
              marginTop: 10,
              paddingVertical: 15,
              borderRadius: RADIUS.md,
              alignItems: "center",
              backgroundColor: canMark ? (isDark ? BRAND.blue : BRAND.navy) : c.muted,
            }}
          >
            <Txt variant="displayBold" style={{ fontSize: 14, textAlign: "center", color: canMark ? "#fff" : c.mutedForeground }}>
              {!sessionActive
                ? "Attendance Session Not Active"
                : scenario === "outside-active"
                  ? "You are Outside the Geofence"
                  : "Mark My Attendance Now"}
            </Txt>
          </Btn>
        )}
      </Card>

      {/* Weekly schedule */}
      <SectionHeading label="Weekly Schedule" />

      {/* Square photo tiles, one per service */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {weeklySchedule.map((s, i) => (
          <PopIn key={s.id} delay={i * 80} style={{ width: serviceTile, height: serviceTile }}>
          <Btn style={{ width: serviceTile, height: serviceTile }}>
            <View style={[{ width: serviceTile, height: serviceTile, borderRadius: RADIUS.xl, overflow: "hidden", backgroundColor: "#172554" }, shadow("md")]}>
              <Image source={imageSource(s.cover, s.photo) ?? serviceFallbackPhoto} style={{ width: serviceTile, height: serviceTile }} resizeMode="cover" />
              <LinearGradient
                colors={["rgba(8,15,40,0.15)", "rgba(8,15,40,0.88)"]}
                locations={[0.3, 1]}
                style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
              />

              {/* Day chip */}
              <View
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: RADIUS.pill,
                  backgroundColor: "rgba(255,255,255,0.92)",
                }}
              >
                <Txt variant="displayExtraBold" style={{ fontSize: 10, letterSpacing: 0.8, color: BRAND.navy }}>
                  {s.day.toUpperCase()}
                </Txt>
              </View>

              <View style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
                <Txt variant="displayExtraBold" numberOfLines={2} style={{ fontSize: 13.5, lineHeight: 17, color: "#fff" }}>
                  {s.name}
                </Txt>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <ClockIcon size={11} color="#FBBF24" />
                  <Txt variant="bodySemi" style={{ fontSize: 11, color: "#FBBF24" }}>
                    {s.time}
                  </Txt>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <PinIcon size={11} color="rgba(255,255,255,0.75)" />
                  <Txt variant="bodyMedium" numberOfLines={1} style={{ flex: 1, fontSize: 10.5, color: "rgba(255,255,255,0.75)" }}>
                    {s.venue}
                  </Txt>
                </View>
              </View>
            </View>
          </Btn>
          </PopIn>
        ))}
      </View>

      {/* Assembly history */}
      <SectionHeading label="My Assembly" />

      <Card style={{ overflow: "hidden" }}>
        <Btn onPress={() => setHistoryOpen((o) => !o)} scale={1} style={{ flexDirection: "row", alignItems: "center", gap: 13, padding: 12 }}>
          <TintTile tint="violet" size={44}>
            <BookIcon size={19} color={tintFg("violet", isDark)} />
          </TintTile>
          <View style={{ flex: 1 }}>
            <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>
              History of {assembly.name}
            </Txt>
            <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
              Est. {assembly.founded} · Ayigya District
            </Txt>
          </View>
          <ChevronDownIcon open={historyOpen} color={c.mutedForeground} />
        </Btn>

        <Collapsible open={historyOpen}>
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
            <Txt style={{ fontSize: 13.5, lineHeight: 21, color: c.mutedForeground }}>{assembly.history}</Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[
                ["District Pastor", assembly.pastor],
                ["Presiding Elder", assembly.elder],
                ["Founded", assembly.founded],
                ["Members", String(assembly.members)],
              ].map(([label, value], i) => (
                <View key={i} style={{ width: "48%", flexGrow: 1, borderRadius: RADIUS.md, padding: 12, backgroundColor: c.muted }}>
                  <Txt style={{ fontSize: 11.5, color: c.mutedForeground }}>{label}</Txt>
                  <Txt variant="bodySemi" style={{ fontSize: 13.5, marginTop: 3, color: c.foreground }}>
                    {value}
                  </Txt>
                </View>
              ))}
            </View>
          </View>
        </Collapsible>
      </Card>

      {/* Presiding elders */}
      <Btn onPress={onOpenElders} style={{ marginTop: 10 }}>
        <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 13 }}>
          <View style={{ width: 66, height: 40, justifyContent: "center" }}>
            {elders.slice(0, 3).map((e, i) => (
              <View key={e.id} style={{ position: "absolute", left: i * 17, zIndex: 3 - i }}>
                <Avatar
                  photo={e.photo}
                  initials={e.avatar}
                  color={e.avatarColor}
                  size={38}
                  radius={19}
                  borderWidth={2.5}
                  borderColor={c.card}
                  fontSize={12}
                />
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>
              Church Leaders
            </Txt>
            <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
              {elders.length} leaders · Ayigya District
            </Txt>
          </View>
          <View style={{ width: 34, height: 34, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center", backgroundColor: c.primary }}>
            <ChevronRightIcon size={16} color={isDark ? "#0A1020" : "#fff"} />
          </View>
        </Card>
      </Btn>

      

      {/* Day-born group — only a group leader sees this */}
      {canViewMembers(loginRole, me) ? (
        <Btn onPress={onOpenMembers} style={{ marginTop: 10 }}>
          <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 13 }}>
            <TintTile tint="green" size={44}>
              <UsersIcon size={19} color={tintFg("green", isDark)} />
            </TintTile>
            <View style={{ flex: 1 }}>
              <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>
                My Day Born Members
              </Txt>
              <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
                {me.dayBorn}-born group · you lead this group
              </Txt>
            </View>
            <ChevronRightIcon size={16} color={c.mutedForeground} />
          </Card>
        </Btn>
      ) : null}

      {/* My presiding elder */}
      {myElder ? (
        <>
          <SectionHeading label="My Presiding Elder" />
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
              <Avatar
                photo={myElder.photo}
                initials={myElder.avatar}
                color={myElder.avatarColor}
                size={56}
                radius={RADIUS.md}
                borderWidth={2.5}
                borderColor={isDark ? BRAND.goldLight : BRAND.gold}
                fontSize={16}
              />
              <View style={{ flex: 1 }}>
                <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>
                  {myElder.name}
                </Txt>
                <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
                  {myElder.title}
                </Txt>
                <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
                  {myElder.officeHours.split("\n")[0]}
                </Txt>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              {[
                {
                  key: "call",
                  render: () => <PhoneIcon size={15} color={c.foreground} />,
                  label: "Call",
                  url: `tel:${myElder.phone.replace(/\s/g, "")}`,
                },
                {
                  key: "email",
                  render: () => <GmailIcon size={15} />,
                  label: "Email",
                  url: `mailto:${myElder.email}`,
                },
                {
                  // wa.me wants the number in international form with no punctuation.
                  key: "whatsapp",
                  render: () => <WhatsappIcon size={15} />,
                  label: "WhatsApp",
                  url: `https://wa.me/${myElder.phone.replace(/[^0-9]/g, "")}`,
                },
              ].map(({ key, render, label, url }) => (
                <Btn
                  key={key}
                  onPress={() => Linking.openURL(url).catch(() => {})}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 11,
                    borderRadius: RADIUS.md,
                    backgroundColor: c.muted,
                  }}
                >
                  {render()}
                  <Txt variant="bodySemi" style={{ fontSize: 12.5, color: c.foreground }}>
                    {label}
                  </Txt>
                </Btn>
              ))}
            </View>
          </Card>
        </>
      ) : null}

      {/* Upcoming events */}
      <SectionHeading label="Upcoming Events" />

      <View style={{ gap: 10 }}>
        {events.map((e, i) => {
          const ev = { ...e, tint: (e.tint ?? "blue") as TintName };
          return (
          <FadeIn key={ev.id} index={i}>
          <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 13 }}>
            <TintTile tint={ev.tint} size={48}>
              <Txt variant="bodySemi" style={{ fontSize: 10, color: tintFg(ev.tint, isDark) }}>
                {ev.date.split(" ")[0].toUpperCase()}
              </Txt>
              <Txt variant="displayBlack" style={{ fontSize: 17, lineHeight: 19, color: tintFg(ev.tint, isDark) }}>
                {ev.date.split(" ")[1]}
              </Txt>
            </TintTile>
            <View style={{ flex: 1 }}>
              <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>
                {ev.name}
              </Txt>
              <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
                {ev.tag} event
              </Txt>
            </View>
          </Card>
          </FadeIn>
          );
        })}
      </View>

      {/* The class this member is due at, for the week the app is in */}
      <BibleStudyClassCard me={me} onOpen={setReading} />

      {/* The whole term's guide */}
      <SectionHeading label="Bible Study Guide" />

      <LinearGradient
        colors={isDark ? ["#78350F", "#1B2437"] : ["#FEF3C7", "#FDE68A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: RADIUS.xl, padding: 17 }}
      >
        <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: isDark ? BRAND.goldLight : "#92400E" }}>
          August Theme
        </Txt>
        <Txt variant="displayExtraBold" style={{ fontSize: 21, marginTop: 8, lineHeight: 27, color: isDark ? "#FDE68A" : "#78350F" }}>
          Growing in Grace &amp; Knowledge
        </Txt>
        <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 8, color: isDark ? "#FCD34D" : "#92400E" }}>
          2 Peter 3:18 · August Series
        </Txt>
      </LinearGradient>

      {pdfStatus ? (
        <Card style={{ marginTop: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <Txt variant="bodySemi" style={{ flex: 1, fontSize: 12.5, lineHeight: 17, color: c.foreground }}>
            {pdfStatus}
          </Txt>
          <Btn onPress={() => setPdfStatus(null)}>
            <XIcon size={15} color={c.mutedForeground} />
          </Btn>
        </Card>
      ) : null}

      <View style={{ gap: 10, marginTop: 12 }}>
        {bibleStudies.map((study, studyIndex) => {
          const t = studyText(study, language);
          const released = studyReleased(study);
          const isThisWeek = thisWeek?.id === study.id;

          return (
          <FadeIn key={study.id} index={studyIndex}>
          <Card
            style={[
              { padding: 12, opacity: released ? 1 : 0.55 },
              isThisWeek ? { borderWidth: 1.5, borderColor: isDark ? BRAND.goldLight : BRAND.gold } : null,
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
              <TintTile tint={released ? "amber" : "blue"} size={44}>
                <Txt variant="displayExtraBold" style={{ fontSize: 16, color: released ? tintFg("amber", isDark) : c.mutedForeground }}>
                  {study.weekNumber}
                </Txt>
              </TintTile>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Txt variant="displayBold" style={{ flex: 1, fontSize: 15, color: c.foreground }}>
                    {t.title}
                  </Txt>
                  {isThisWeek ? (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: isDark ? "#D9770622" : "#FEF3C7" }}>
                      <Txt variant="bodySemi" style={{ fontSize: 9.5, letterSpacing: 0.6, color: isDark ? BRAND.goldLight : "#92400E" }}>
                        THIS WEEK
                      </Txt>
                    </View>
                  ) : null}
                </View>
                <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 3, color: c.mutedForeground }}>
                  {t.chapter}
                </Txt>
                <Txt variant="bodyMedium" style={{ fontSize: 11.5, marginTop: 2, color: c.mutedForeground }}>
                  {formatSunday(study.date)} · {study.pages}
                </Txt>
              </View>

              {!released ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill, backgroundColor: c.muted }}>
                  <Txt variant="bodySemi" style={{ fontSize: 11, color: c.mutedForeground }}>
                    Soon
                  </Txt>
                </View>
              ) : null}
            </View>

            {released ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 13 }}>
                <Btn
                  onPress={() => setReading(study)}
                  style={{ flex: 1, paddingVertical: 11, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: isDark ? BRAND.blue : BRAND.navy }}
                >
                  <Txt variant="displayBold" style={{ fontSize: 13, color: isDark ? "#0A1020" : "#fff" }}>
                    Read Study
                  </Txt>
                </Btn>
                <Btn
                  onPress={() => savingPdf === study.id ? undefined : savePdf(study)}
                  disabled={savingPdf === study.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    borderRadius: RADIUS.md,
                    backgroundColor: c.muted,
                  }}
                >
                  <DownloadIcon color={c.mutedForeground} />
                  <Txt variant="bodySemi" style={{ fontSize: 13, color: c.mutedForeground }}>
                    {savingPdf === study.id ? "…" : "PDF"}
                  </Txt>
                </Btn>
              </View>
            ) : null}
          </Card>
          </FadeIn>
          );
        })}
      </View>

      <StudyReader study={reading} onClose={() => setReading(null)} />
    </ScrollView>
  );
}
