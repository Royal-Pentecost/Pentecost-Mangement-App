import React, { useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import { BODY, RADIUS, useTheme } from "../theme";
import {
  MANUAL_REASONS,
  ManualAttendanceReason,
  Member,
  SessionUser,
  members as allMembers,
} from "../data";
import { useContent } from "../store";
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
import { Avatar, Btn, Card, SectionHeading, TintTile, Txt, tintFg } from "../ui";
import { ChipRow, ChoiceList, SubmitButton } from "../components/AdminForm";

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
  const { c, isDark } = useTheme();
  const { schedule, manualAttendance, signAttendance, undoAttendance } = useContent();

  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Member | null>(null);
  const [service, setService] = useState(schedule[0]?.name ?? "Sunday Service");
  const [status, setStatus] = useState<"present" | "late">("present");
  const [reason, setReason] = useState<ManualAttendanceReason>("no-phone");
  const [justSigned, setJustSigned] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const exportLog = async () => {
    if (exporting) return;
    setExporting(true);
    const result = await exportTextFile(
      stampedName("manual-attendance", "csv"),
      "text/csv",
      toCsv(
        ["Member ID", "Name", "Service", "Status", "Reason", "Signed By", "Time"],
        manualAttendance.map((r) => [
          r.memberId,
          r.memberName,
          r.service,
          r.status,
          MANUAL_REASONS.find((x) => x.id === r.reason)?.label ?? r.reason,
          r.signedBy,
          r.at,
        ]),
      ),
    );
    setExportStatus(result.message);
    setExporting(false);
  };

  const signedIds = useMemo(
    () => new Set(manualAttendance.map((r) => `${r.memberId}:${r.service}`)),
    [manualAttendance],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allMembers
      .filter((m) => m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query]);

  const alreadySigned = picked ? signedIds.has(`${picked.id}:${service}`) : false;

  const submit = () => {
    if (!picked) return;
    signAttendance({
      memberId: picked.id,
      memberName: picked.name,
      service,
      status,
      reason,
      signedBy: signedBy.name,
    });
    setJustSigned(picked.name);
    setPicked(null);
    setQuery("");
    setStatus("present");
    setReason("no-phone");
  };

  return (
    <ScrollView
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

      {/* Confirmation of the last signature */}
      {justSigned ? (
        <Card style={{ marginTop: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }}>
          <CheckCircleIcon size={20} color={tintFg("green", isDark)} />
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
          No member matches "{query.trim()}"
        </Txt>
      ) : null}

      {/* Step 2 — which service */}
      <SectionHeading label="2. Service" />
      <ChipRow
        options={[
          ...schedule.map((s) => ({ id: s.name, label: s.name })),
          { id: "Sunday Divine Service", label: "Sunday Divine Service" },
        ].filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i)}
        value={service}
        onChange={setService}
      />

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
        <Txt style={{ fontSize: 12.5, textAlign: "center", marginBottom: 10, color: tintFg("amber", isDark) }}>
          {picked?.name.split(" ")[0]} is already signed in for {service}.
        </Txt>
      ) : null}
      <SubmitButton
        label={picked ? `Sign in ${picked.name.split(" ")[0]}` : "Select a member first"}
        onPress={submit}
        disabled={!picked || alreadySigned}
        Icon={CheckCircleIcon}
      />

      {/* The audit trail */}
      <SectionHeading
        label="Signed by admins"
        trailing={
          manualAttendance.length > 0 ? (
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
                {exporting ? "Preparing…" : `Export ${manualAttendance.length}`}
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

      {manualAttendance.length === 0 ? (
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
          {manualAttendance.map((r) => {
            const tint = r.status === "present" ? "green" : "amber";
            const reasonLabel = MANUAL_REASONS.find((x) => x.id === r.reason)?.label ?? r.reason;

            return (
              <Card key={r.id} style={{ padding: 11, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <TintTile tint={tint} size={42}>
                  <CheckCircleIcon size={18} color={tintFg(tint, isDark)} />
                </TintTile>

                <View style={{ flex: 1 }}>
                  <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                    {r.memberName}
                  </Txt>
                  <Txt variant="bodyMedium" style={{ fontSize: 11.5, marginTop: 2, color: c.mutedForeground }}>
                    {r.service} · {reasonLabel}
                  </Txt>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
                    <ClockIcon size={11} color={c.mutedForeground} />
                    <Txt variant="bodyMedium" style={{ fontSize: 11, color: c.mutedForeground }}>
                      {r.at} · by {r.signedBy}
                    </Txt>
                  </View>
                </View>

                <Btn
                  onPress={() => undoAttendance(r.id)}
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
