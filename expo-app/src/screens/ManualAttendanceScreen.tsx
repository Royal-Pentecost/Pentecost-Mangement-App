import React, { useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import { BODY, BRAND, RADIUS, useTheme } from "../theme";
import {
  MANUAL_REASONS,
  ManualAttendanceReason,
  Member,
  SessionUser,
  othersOnly,
} from "../data";
import { useDirectory, useMe } from "../directory";
import { useLocation } from "../location";
import { useTodayAttendance } from "../today";
import * as Api from "../api/resources";
import { describeError } from "../session";
import { exportTextFile, stampedName, toCsv } from "../files";
import {
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  SearchIcon,
  SignalIcon,
  UsersIcon,
  XIcon,
} from "../icons";
import { Avatar, Btn, Card, SectionHeading, TintTile, Txt, tintFg, tintText } from "../ui";
import { ChipRow, ChoiceList, SubmitButton } from "../components/AdminForm";
import { usePullToRefresh } from "../refresh";

/** "07:01" from an ISO timestamp, in the phone's own clock. */
function timeOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Signing on behalf of a member. Some members carry no smartphone, and the
 * auditorium's signal is unreliable — without this, their attendance record
 * silently rots. Every entry keeps the reason and the admin who signed it, so
 * the override is auditable rather than invisible.
 */
export default function ManualAttendanceScreen({
  signedBy,
  bottomInset,
}: {
  signedBy: SessionUser;
  bottomInset: number;
}) {
  // Pull down anywhere on this page to reload everything the app shows.
  const pullToRefresh = usePullToRefresh();
  const { c, isDark } = useTheme();
  // The roll as the server holds it. There is no seeded fallback: a sample
  // member's id does not exist on the server, so picking one could only fail.
  const { members: roll, loading: rollLoading, refreshStats } = useDirectory();
  const me = useMe();
  const today = useTodayAttendance();
  // Signing for others is for people in the hall, so the admin must be there
  // too. The server checks the same coordinates and refuses from outside.
  const location = useLocation();
  const atChurch = location.inside && location.certainty !== "poor" && !!location.fix;
  const awayReason = atChurch
    ? null
    : location.blockedReason ?? "You must be at the church to sign members in.";

  // Everything here is the server's record of today, not this phone's memory.
  // The log used to live in local state — gone on reload, invisible to the
  // other admins, and "Undo" removed the line while the mark stayed on the
  // server.
  const openSession = today.sessions.find((s) => s.is_active && !s.closed_at) ?? null;
  const sessionRecords = openSession ? today.records.filter((r) => r.session === openSession.id) : [];
  const manualEntries = sessionRecords.filter((r) => r.method === "manual");

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Member | null>(null);
  const [status, setStatus] = useState<"present" | "late">("present");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<ManualAttendanceReason>("no-phone");
  const [justSigned, setJustSigned] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const exportLog = async () => {
    if (exporting) return;
    setExporting(true);
    const result = await exportTextFile(
      stampedName("manual-attendance", "csv"),
      "text/csv",
      toCsv(
        ["Member ID", "Name", "Service", "Status", "Note", "Signed By", "Time"],
        manualEntries.map((r) => [
          r.member?.member_id ?? "",
          r.member?.full_name ?? "",
          openSession?.service_name ?? "",
          (r.note ?? "").toLowerCase().startsWith("late") ? "late" : "present",
          r.note ?? "",
          r.recorded_by?.full_name ?? "",
          timeOf(r.marked_at),
        ]),
      ),
    );
    setExportStatus(result.message);
    setExporting(false);
  };

  // Anyone already marked for this service, by GPS or by hand — signing them
  // again would only be refused by the server.
  const signedIds = useMemo(
    () => new Set(sessionRecords.map((r) => r.member?.id).filter(Boolean) as string[]),
    [sessionRecords],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Not the admin themselves: they sign in by GPS like everyone else.
    return othersOnly(roll, me?.id)
      .filter((m) => m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, roll, me?.id]);

  const alreadySigned = picked ? signedIds.has(picked.id) : false;

  const submit = async () => {
    if (!picked || busy) return;

    setSubmitError(null);
    setJustSigned(null);
    if (!openSession) {
      setSubmitError("No attendance session is open. Start one from the home screen first.");
      return;
    }
    if (!atChurch || !location.fix) {
      setSubmitError(awayReason);
      return;
    }

    // The server has no "late" field, so lateness travels in the note along
    // with the reason — the part of the record an auditor will actually read.
    const reasonLabel = MANUAL_REASONS.find((x) => x.id === reason)?.label ?? reason;
    setBusy(true);
    try {
      await Api.markAttendance({
        session: openSession.id,
        member: picked.id,
        method: "manual",
        note: `${status === "late" ? "Late — " : ""}${reasonLabel} — signed by ${signedBy.name}`,
        lat: location.fix.lat,
        lng: location.fix.lng,
        accuracy: location.fix.accuracy,
      });
      await today.refresh();
      void refreshStats();
    } catch (e) {
      setSubmitError(describeError(e));
      return;
    } finally {
      setBusy(false);
    }

    setJustSigned(picked.name);
    setPicked(null);
    setQuery("");
    setStatus("present");
    setReason("no-phone");
  };

  const undo = async (recordId: string, name: string) => {
    setSubmitError(null);
    try {
      await Api.undoAttendance(recordId);
      await today.refresh();
      void refreshStats();
      setJustSigned(null);
    } catch (e) {
      setSubmitError(`Could not undo ${name}: ${describeError(e)}`);
    }
  };

  return (
    <ScrollView refreshControl={pullToRefresh}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* What this is for */}
      <Card style={{ padding: 14, flexDirection: "row", gap: 13 }}>
        <TintTile tint="violet" size={46}>
          <SignalIcon size={20} color={tintFg("violet", isDark)} />
        </TintTile>
        <View style={{ flex: 1 }}>
          <Txt variant="displayBold" style={{ fontSize: 15.5, color: c.foreground }}>
            Sign on a member's behalf
          </Txt>
          <Txt style={{ fontSize: 12.5, lineHeight: 18, marginTop: 3, color: c.mutedForeground }}>
            For members without a phone, or when the network is down. Each entry records your name
            and the reason.
          </Txt>
        </View>
      </Card>

      {submitError ? (
        <Card style={{ marginTop: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }} borderColor={isDark ? "#7F1D1D" : "#FBD5D5"}>
          <XIcon size={16} color={isDark ? "#FCA5A5" : BRAND.red} />
          <Txt variant="bodySemi" style={{ flex: 1, fontSize: 13, color: isDark ? "#FCA5A5" : BRAND.red }}>
            {submitError}
          </Txt>
          <Btn onPress={() => setSubmitError(null)}>
            <XIcon size={16} color={c.mutedForeground} />
          </Btn>
        </Card>
      ) : null}

      {/* Confirmation of the last signature */}
      {justSigned ? (
        <Card style={{ marginTop: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <CheckCircleIcon size={20} color={tintText("green", isDark)} />
          <Txt variant="bodySemi" style={{ flex: 1, fontSize: 13, color: c.foreground }}>
            {justSigned} has been signed in.
          </Txt>
          <Btn onPress={() => setJustSigned(null)}>
            <XIcon size={16} color={c.mutedForeground} />
          </Btn>
        </Card>
      ) : null}

      {/* Step 1 — who */}
      <SectionHeading label="1. Find the member" />

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 4 }}>
        <SearchIcon size={17} color={c.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setPicked(null);
          }}
          placeholder="Search by name or member ID"
          placeholderTextColor={c.mutedForeground}
          style={{ flex: 1, paddingVertical: 12, fontSize: 14, fontFamily: BODY.medium, color: c.foreground }}
        />
        {query.length > 0 ? (
          <Btn
            onPress={() => {
              setQuery("");
              setPicked(null);
            }}
          >
            <XIcon size={16} color={c.mutedForeground} />
          </Btn>
        ) : null}
      </Card>

      {picked ? (
        <Card style={{ marginTop: 10, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar initials={picked.avatar} color={picked.avatarColor} size={44} fontSize={15} />
          <View style={{ flex: 1 }}>
            <Txt variant="displayBold" style={{ fontSize: 14.5, color: c.foreground }}>
              {picked.name}
            </Txt>
            <Txt variant="bodyMedium" style={{ fontSize: 12, marginTop: 2, color: c.mutedForeground }}>
              {picked.memberId} · {picked.dayBorn} born
            </Txt>
          </View>
          <CheckIcon size={18} color={c.primary} strokeWidth={3} />
        </Card>
      ) : results.length > 0 ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          {results.map((m) => (
            <Btn key={m.id} onPress={() => setPicked(m)}>
              <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }}>
                <Avatar initials={m.avatar} color={m.avatarColor} size={38} fontSize={13} />
                <View style={{ flex: 1 }}>
                  <Txt variant="displaySemi" style={{ fontSize: 13.5, color: c.foreground }}>
                    {m.name}
                  </Txt>
                  <Txt variant="bodyMedium" style={{ fontSize: 11.5, marginTop: 1, color: c.mutedForeground }}>
                    {m.memberId}
                  </Txt>
                </View>
              </Card>
            </Btn>
          ))}
        </View>
      ) : query.trim().length > 0 ? (
        <Txt style={{ fontSize: 12.5, textAlign: "center", paddingVertical: 16, color: c.mutedForeground }}>
          {rollLoading && roll.length === 0 ? "Loading the roll…" : `No member matches "${query.trim()}"`}
        </Txt>
      ) : null}

      {/* Step 2 — the service. Not a choice: the server records every mark
          against the session that is open, so offering a list of services
          let an admin pick one the mark would never be filed under. */}
      <SectionHeading label="2. Service" />
      <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: openSession ? BRAND.green : "#94A3B8" }} />
        <Txt variant="bodySemi" style={{ flex: 1, fontSize: 13, color: openSession ? c.foreground : c.mutedForeground }}>
          {openSession
            ? `${openSession.service_name} \u00b7 opened ${timeOf(openSession.opened_at)}${openSession.opened_by ? ` by ${openSession.opened_by.full_name}` : ""}`
            : today.loaded
              ? "No session is open \u2014 start one from the home screen"
              : "Checking for an open session\u2026"}
        </Txt>
      </Card>

      <View style={{ height: 14 }} />
      <ChipRow
        options={[
          { id: "present" as const, label: "Present" },
          { id: "late" as const, label: "Late" },
        ]}
        value={status}
        onChange={setStatus}
      />

      {/* Step 3 — why the override */}
      <SectionHeading label="3. Reason for the override" />
      <ChoiceList options={MANUAL_REASONS} value={reason} onChange={setReason} />

      <View style={{ height: 18 }} />
      {alreadySigned ? (
        <Txt style={{ fontSize: 12.5, textAlign: "center", marginBottom: 10, color: tintText("amber", isDark) }}>
          {picked?.name.split(" ")[0]} is already signed in for this service.
        </Txt>
      ) : null}
      {openSession && awayReason ? (
        <Txt variant="bodySemi" style={{ fontSize: 12.5, lineHeight: 18, textAlign: "center", marginBottom: 10, color: tintText("amber", isDark) }}>
          {awayReason}
        </Txt>
      ) : null}
      <SubmitButton
        label={busy ? "Signing in\u2026" : picked ? `Sign in ${picked.name.split(" ")[0]}` : "Select a member first"}
        onPress={submit}
        disabled={!picked || alreadySigned || busy || !openSession || !atChurch}
        Icon={CheckCircleIcon}
      />

      {/* Repeated beside the button: the card at the top of the page is a
          long scroll away from here, so a refusal looked like nothing at all. */}
      {submitError ? (
        <Txt variant="bodySemi" style={{ fontSize: 12.5, lineHeight: 18, marginTop: 10, textAlign: "center", color: isDark ? "#FCA5A5" : BRAND.red }}>
          {submitError}
        </Txt>
      ) : justSigned ? (
        <Txt variant="bodySemi" style={{ fontSize: 12.5, marginTop: 10, textAlign: "center", color: tintText("green", isDark) }}>
          {justSigned} has been signed in.
        </Txt>
      ) : null}

      {/* The audit trail */}
      <SectionHeading
        label="Signed by admins"
        trailing={
          manualEntries.length > 0 ? (
            <Btn
              onPress={exportLog}
              disabled={exporting}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: RADIUS.pill,
                backgroundColor: c.muted,
              }}
            >
              <DownloadIcon size={13} color={c.mutedForeground} />
              <Txt variant="bodySemi" style={{ fontSize: 11.5, color: c.mutedForeground }}>
                {exporting ? "Preparing…" : `Export ${manualEntries.length}`}
              </Txt>
            </Btn>
          ) : (
            <Txt variant="bodySemi" style={{ fontSize: 11.5, color: c.mutedForeground }}>
              None today
            </Txt>
          )
        }
      />

      {exportStatus ? (
        <Card style={{ padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <Txt variant="bodySemi" style={{ flex: 1, fontSize: 12.5, lineHeight: 17, color: c.foreground }}>
            {exportStatus}
          </Txt>
          <Btn onPress={() => setExportStatus(null)}>
            <XIcon size={15} color={c.mutedForeground} />
          </Btn>
        </Card>
      ) : null}

      {manualEntries.length === 0 ? (
        <Card style={{ padding: 24, alignItems: "center" }}>
          <TintTile tint="blue" size={52} radius={26}>
            <UsersIcon size={22} color={tintFg("blue", isDark)} />
          </TintTile>
          <Txt variant="displaySemi" style={{ fontSize: 14, marginTop: 12, color: c.foreground }}>
            No manual entries yet
          </Txt>
          <Txt style={{ fontSize: 12.5, marginTop: 3, textAlign: "center", color: c.mutedForeground }}>
            Members you sign in on behalf of will be listed here
          </Txt>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {manualEntries.map((r) => {
            const late = (r.note ?? "").toLowerCase().startsWith("late");
            const tint = late ? "amber" : "green";
            const name = r.member?.full_name ?? "Member";

            return (
              <Card key={r.id} style={{ padding: 11, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TintTile tint={tint} size={42}>
                  <CheckCircleIcon size={18} color={tintFg(tint, isDark)} />
                </TintTile>

                <View style={{ flex: 1 }}>
                  <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                    {name}
                  </Txt>
                  <Txt variant="bodyMedium" style={{ fontSize: 11.5, marginTop: 2, color: c.mutedForeground }}>
                    {r.note || openSession?.service_name}
                  </Txt>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
                    <ClockIcon size={11} color={c.mutedForeground} />
                    <Txt variant="bodyMedium" style={{ fontSize: 11, color: c.mutedForeground }}>
                      {timeOf(r.marked_at)}{r.recorded_by ? ` \u00b7 by ${r.recorded_by.full_name}` : ""}
                    </Txt>
                  </View>
                </View>

                <Btn
                  onPress={() => undo(r.id, name)}
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    borderRadius: RADIUS.sm,
                    backgroundColor: c.muted,
                  }}
                >
                  <Txt variant="bodySemi" style={{ fontSize: 11.5, color: c.mutedForeground }}>
                    Undo
                  </Txt>
                </Btn>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
