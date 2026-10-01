import React from "react";
import { Animated, Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BRAND, RADIUS, useTheme, ms } from "../theme";
import {
  Assembly,
  AttendanceScenario,
  Elder,
  LoginRole,
  MainTab,
  ME,
  Member,
  SessionUser,
  SettingsTopic,
  SubScreen,
  elders,
  pentecostLogo,
  settingsPages,
  visibleMembers,
} from "../data";
import { ArrowLeftIcon, BellIcon, CrownIcon, HomeIcon, MapPinIcon, MoonIcon, SettingsIcon, ShieldIcon, SunIcon, TrophyIcon } from "../icons";
import { Btn, Txt } from "../ui";
import { EASE_OUT, SwapFade } from "../motion";
import { HeaderBlock, HeaderButton, HeaderTitle } from "../components/HeaderBlock";

import HomeTab from "./HomeTab";
import AttendanceTab from "./AttendanceTab";
import LeaderboardTab from "./LeaderboardTab";
import EldersDirectory from "./EldersDirectory";
import ElderProfile from "./ElderProfile";
import MembersDirectory from "./MembersDirectory";
import MemberProfile from "./MemberProfile";
import MyDashboard from "./MyDashboard";
import AdminHub from "./AdminHub";
import SuperAdminHub from "./SuperAdminHub";
import NotificationsScreen from "./NotificationsScreen";
import ManualAttendanceScreen from "./ManualAttendanceScreen";
import PublishScreen from "./PublishScreen";
import SettingsTab from "./SettingsTab";
import SettingsDetailScreen from "./SettingsDetailScreen";

const TABS: { id: MainTab; label: string; Icon: React.ComponentType<{ size?: number; color?: string; active?: boolean }> }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "attendance", label: "Attendance", Icon: MapPinIcon },
  { id: "leaderboard", label: "Leaderboard", Icon: TrophyIcon },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
];

const EYEBROW: Record<SubScreen, string> = {
  none: "Local Assembly",
  elders: "Directory",
  elderProfile: "Elder Profile",
  members: "Members",
  memberProfile: "Member Profile",
  myDashboard: "Personal",
  adminHub: "Admin Hub",
  superAdmin: "Restricted",
  notifications: "Inbox",
  settingsDetail: "Settings",
  manualAttendance: "Admin Hub",
  publish: "Admin Hub",
};


/** Lifts and slightly enlarges the icon of the selected tab. */
function TabIcon({ active, children }: { active: boolean; children: React.ReactNode }) {
  const t = React.useRef(new Animated.Value(active ? 1 : 0)).current;

  React.useEffect(() => {
    const a = Animated.spring(t, { toValue: active ? 1 : 0, friction: 7, tension: 90, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [active, t]);

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Soft tinted halo that fades in behind the selected tab. */
function TabGlow({ active, color }: { active: boolean; color: string }) {
  const t = React.useRef(new Animated.Value(active ? 1 : 0)).current;

  React.useEffect(() => {
    const a = Animated.timing(t, { toValue: active ? 1 : 0, duration: 240, easing: EASE_OUT, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [active, t]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -4,
        width: 46,
        height: 30,
        borderRadius: 15,
        backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
      }}
    />
  );
}

export default function DashboardShell(props: {
  assembly: Assembly;
  mainTab: MainTab;
  onChangeTab: (t: MainTab) => void;
  onBack: () => void;
  scenario: AttendanceScenario;
  sessionActive: boolean;
  sessionStartTime: string | null;
  membersPresent: number;
  firstTimers: number;
  isAdmin: boolean;
  onActivateSession: () => void;
  onTerminateSession: () => void;
  attendanceMarked: boolean;
  onMarkAttendance: () => void;
  subScreen: SubScreen;
  selectedElder: Elder | null;
  onOpenElders: () => void;
  onSelectElder: (e: Elder) => void;
  selectedMember: Member | null;
  onOpenMembers: () => void;
  onSelectMember: (m: Member) => void;
  onOpenMyDashboard: () => void;
  onOpenAdminHub: () => void;
  onOpenManualAttendance: () => void;
  onOpenPublish: () => void;
  onOpenNotifications: () => void;
  sessionUser: SessionUser;
  onChangePhoto: (uri: string) => void;
  settingsTopic: SettingsTopic;
  onOpenSettingsTopic: (t: SettingsTopic) => void;
  onLogout: () => void;
  isSuperAdmin: boolean;
  onOpenSuperAdmin: () => void;
  loginRole: LoginRole;
  /** False only when the trail is empty and there is nothing behind this screen. */
  canGoBack: boolean;
}) {
  const { c, isDark, mode, toggle } = useTheme();
  const insets = useSafeAreaInsets();

  const { assembly, mainTab, subScreen, selectedElder, selectedMember, isAdmin, loginRole } = props;

  // Members have no assembly-admin view, so their Home tab *is* their personal
  // dashboard rather than a separate destination.
  const isMember = loginRole === "member";

  const contentBottomInset = 24;

  const title =
    subScreen === "elders"
      ? "Church Leaders"
      : subScreen === "elderProfile"
        ? selectedElder?.name.replace("Elder ", "") ?? ""
        : subScreen === "members"
          ? "All Members"
          : subScreen === "memberProfile"
            ? selectedMember?.name ?? ""
            : subScreen === "myDashboard"
              ? "My Dashboard"
              : subScreen === "adminHub"
                ? "Master Data Management"
                : subScreen === "superAdmin"
                  ? "Super Admin Control"
                  : subScreen === "notifications"
                    ? "Notifications"
                  : subScreen === "manualAttendance"
                    ? "Manual Attendance"
                  : subScreen === "publish"
                    ? "Publish Content"
                  : subScreen === "settingsDetail"
                    ? settingsPages[props.settingsTopic].title
                  : mainTab === "settings"
                    ? "Settings"
                  : isMember && mainTab === "home"
                    ? "My Dashboard"
                    : assembly.name;

  const eyebrow =
    subScreen === "none" && mainTab === "settings"
      ? "Account"
      : subScreen === "none" && isMember && mainTab === "home"
        ? assembly.name
        : EYEBROW[subScreen];

  // With nothing behind them, members see the logo rather than a dead control.
  const atMemberRoot = !props.canGoBack;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <HeaderBlock paddingBottom={18}>
        <View style={{ minHeight: 42, flexDirection: "row", alignItems: "center", gap: 8 }}>
          {atMemberRoot ? (
            // Members land here directly, so there is nowhere to go back to —
            // the logo keeps the header balanced without a dead control.
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
              <Image source={pentecostLogo} style={{ width: 32, height: 32 }} resizeMode="contain" />
            </View>
          ) : (
            <HeaderButton onPress={props.onBack}>
              <ArrowLeftIcon color="#fff" />
            </HeaderButton>
          )}

          <HeaderTitle eyebrow={eyebrow} title={title.toUpperCase()} />

          <HeaderButton onPress={toggle} size={36}>
            {mode === "light" ? <MoonIcon color="#fff" /> : <SunIcon color="#fff" />}
          </HeaderButton>

          <HeaderButton size={36} onPress={props.onOpenNotifications}>
            <BellIcon color="#fff" />
            <View style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: "#F87171" }} />
          </HeaderButton>
        </View>

        {/* Role badge — the icon alone carries the role; the label was noise. */}
        {loginRole !== "member" ? (
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <View
              style={{
                width: ms(26),
                height: ms(26),
                borderRadius: ms(26) / 2,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: loginRole === "superAdmin" ? "rgba(248,113,113,0.22)" : "rgba(134,239,172,0.2)",
              }}
            >
              {loginRole === "superAdmin" ? (
                <CrownIcon size={14} color="#FECACA" />
              ) : (
                <ShieldIcon size={13} color="#BBF7D0" />
              )}
            </View>
          </View>
        ) : null}
      </HeaderBlock>

      {/* Content — cross-fades so switching destination reads as a transition */}
      <SwapFade trigger={`${subScreen}:${mainTab}:${selectedElder?.id ?? ""}${selectedMember?.id ?? ""}`} style={{ flex: 1 }}>
        {subScreen === "elders" ? <EldersDirectory onSelectElder={props.onSelectElder} bottomInset={contentBottomInset} /> : null}

        {subScreen === "elderProfile" && selectedElder ? <ElderProfile elder={selectedElder} bottomInset={contentBottomInset} /> : null}

        {subScreen === "members" ? <MembersDirectory onSelectMember={props.onSelectMember} loginRole={loginRole} bottomInset={contentBottomInset} /> : null}

        {subScreen === "memberProfile" && selectedMember ? (
          <MemberProfile member={selectedMember} elders={elders} bottomInset={contentBottomInset} />
        ) : null}

        {subScreen === "myDashboard" ? (
          <MyDashboard
            assembly={assembly}
            scenario={props.scenario}
            sessionActive={props.sessionActive}
            attendanceMarked={props.attendanceMarked}
            onMarkAttendance={props.onMarkAttendance}
            elders={elders}
            onOpenElders={props.onOpenElders}
            onOpenMembers={props.onOpenMembers}
            loginRole={loginRole}
            user={props.sessionUser}
            bottomInset={contentBottomInset}
          />
        ) : null}

        {subScreen === "adminHub" ? (
          <AdminHub
            sessionActive={props.sessionActive}
            onOpenSuperAdmin={props.onOpenSuperAdmin}
            onOpenManualAttendance={props.onOpenManualAttendance}
            onOpenPublish={props.onOpenPublish}
            signedInAs={props.sessionUser.name}
            isSuperAdmin={props.isSuperAdmin}
            loginRole={loginRole}
            bottomInset={contentBottomInset}
          />
        ) : null}

        {subScreen === "superAdmin" ? <SuperAdminHub bottomInset={contentBottomInset} /> : null}

        {subScreen === "notifications" ? <NotificationsScreen bottomInset={contentBottomInset} /> : null}

        {subScreen === "manualAttendance" ? (
          <ManualAttendanceScreen signedBy={props.sessionUser} bottomInset={contentBottomInset} />
        ) : null}

        {subScreen === "publish" ? <PublishScreen bottomInset={contentBottomInset} /> : null}

        {subScreen === "none" && mainTab === "home" ? (
          isMember ? (
            <MyDashboard
              assembly={assembly}
              scenario={props.scenario}
              sessionActive={props.sessionActive}
              attendanceMarked={props.attendanceMarked}
              onMarkAttendance={props.onMarkAttendance}
              elders={elders}
              onOpenElders={props.onOpenElders}
              onOpenMembers={props.onOpenMembers}
              loginRole={loginRole}
              user={props.sessionUser}
              bottomInset={contentBottomInset}
            />
          ) : (
            <HomeTab
              assembly={assembly}
              sessionActive={props.sessionActive}
              isAdmin={isAdmin}
              loginRole={loginRole}
              onOpenElders={props.onOpenElders}
              onOpenMembers={props.onOpenMembers}
              onOpenMyDashboard={props.onOpenMyDashboard}
              sessionStartTime={props.sessionStartTime}
              membersPresent={props.membersPresent}
              firstTimers={props.firstTimers}
              onActivateSession={props.onActivateSession}
              onTerminateSession={props.onTerminateSession}
              onOpenAdminHub={props.onOpenAdminHub}
              bottomInset={contentBottomInset}
            />
          )
        ) : null}

        {subScreen === "none" && mainTab === "attendance" ? (
          <AttendanceTab
            sessionActive={props.sessionActive}
            attendanceMarked={props.attendanceMarked}
            onMarkAttendance={props.onMarkAttendance}
            bottomInset={contentBottomInset}
          />
        ) : null}

        {subScreen === "none" && mainTab === "leaderboard" ? (
          <LeaderboardTab user={props.sessionUser} bottomInset={contentBottomInset} />
        ) : null}

        {subScreen === "none" && mainTab === "settings" ? (
          <SettingsTab
            user={props.sessionUser}
            onChangePhoto={props.onChangePhoto}
            onOpenTopic={props.onOpenSettingsTopic}
            onLogout={props.onLogout}
            bottomInset={contentBottomInset}
          />
        ) : null}

        {subScreen === "settingsDetail" ? (
          <SettingsDetailScreen topic={props.settingsTopic} bottomInset={contentBottomInset} />
        ) : null}
      </SwapFade>

      {/* Tab bar */}
      <View
        style={[
          {
            paddingBottom: insets.bottom + 6,
            paddingTop: 9,
            paddingHorizontal: 6,
            backgroundColor: c.card,
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            borderTopWidth: isDark ? 1 : 0,
            borderTopColor: c.border,
          },
          // Shadow cast upward, so the bar lifts off the content it overlaps.
          !isDark
            ? {
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.06,
                shadowRadius: 14,
                elevation: 12,
              }
            : null,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-around" }}>
          {TABS.map(({ id, label, Icon }, tabIndex) => {
            const active = mainTab === id && subScreen === "none";
            return (
              <Btn
                key={id}
                onPress={() => props.onChangeTab(id)}
                scale={0.92}
                style={{ flex: 1, alignItems: "center", gap: 3, paddingVertical: 2 }}
              >
                {/* Active pill grows behind the icon as the tab is selected. */}
                <TabGlow active={active} color={c.primary} />
                <TabIcon active={active}>
                  <Icon active={active} size={21} color={active ? c.primary : c.mutedForeground} />
                  {id === "attendance" && !active ? (
                    <View
                      style={{
                        position: "absolute",
                        top: -1,
                        right: -4,
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: props.sessionActive ? BRAND.green : "#9CA3AF",
                        borderWidth: 1.5,
                        borderColor: c.card,
                      }}
                    />
                  ) : null}
                </TabIcon>
                <Txt
                  variant={active ? "bodySemi" : "bodyMedium"}
                  numberOfLines={1}
                  style={{ fontSize: 10, letterSpacing: 0.1, color: active ? c.primary : c.mutedForeground }}
                >
                  {label}
                </Txt>
              </Btn>
            );
          })}
        </View>
      </View>
    </View>
  );
}
