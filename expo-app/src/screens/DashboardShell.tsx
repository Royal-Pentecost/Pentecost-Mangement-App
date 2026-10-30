import React from "react";
import { Animated, Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BRAND, ICON_TILE, RADIUS, useTheme, ms } from "../theme";
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
  pentecostLogo,
  settingsPages,
  visibleMembers,
} from "../data";
import { ArrowLeftIcon, BellIcon, CrownIcon, HomeIcon, MapPinIcon, MoonIcon, SettingsIcon, ShieldIcon, SunIcon, TrophyIcon } from "../icons";
import { Btn, Txt } from "../ui";
import { EASE_OUT, SwapFade } from "../motion";
import { HeaderBlock, HeaderButton, HeaderTitle } from "../components/HeaderBlock";
import { useDirectory } from "../directory";
import { useContent } from "../store";

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
import VideosScreen from "./VideosScreen";
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
  dayBorn: "My Group",
  memberProfile: "Member Profile",
  myDashboard: "Personal",
  adminHub: "Admin Hub",
  superAdmin: "Restricted",
  notifications: "Inbox",
  settingsDetail: "Settings",
  manualAttendance: "Admin Hub",
  publish: "Admin Hub",
  videos: "Watch",
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

/**
 * The solid tile behind the selected tab's icon — the same `ICON_TILE` colour as
 * every icon tile in the app, with the icon in white on top of it.
 */
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
        top: -6,
        width: 50,
        height: 34,
        borderRadius: 12,
        backgroundColor: color,
        opacity: t,
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
  /** Why the last attempt to open, close or sign attendance failed. */
  attendanceError: string | null;
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
  /** The dashboard's day-born card — the viewer's own group, not the roll. */
  onOpenDayBorn: () => void;
  onSelectMember: (m: Member) => void;
  onOpenMyDashboard: () => void;
  onOpenAdminHub: () => void;
  onOpenManualAttendance: () => void;
  onOpenPublish: () => void;
  onOpenNotifications: () => void;
  onOpenVideos: () => void;
  sessionUser: SessionUser;
  onChangePhoto: (uri: string) => void;
  photoStatus: { state: "uploading" | "done" | "failed"; message: string } | null;
  /** Why this phone cannot receive push notifications, or null when it can. */
  pushNote: string | null;
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
  const { notifications } = useContent();
  const unreadCount = notifications.filter((n) => n.unread).length;
  const insets = useSafeAreaInsets();

  const { assembly, mainTab, subScreen, selectedElder, selectedMember, isAdmin, loginRole } = props;
  // The leaders the server holds — every elder, deacon and deaconess on the
  // roll. The seeded list in `data.ts` was nine invented people.
  const { elders } = useDirectory();

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
          : subScreen === "dayBorn"
            ? "My Day Born Members"
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
                  : subScreen === "videos"
                    ? "Videos"
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
          <View>
            {atMemberRoot ? (
              // Members land here directly, so there is nowhere to go back to —
              // the logo keeps the header balanced without a dead control.
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
                <Image source={pentecostLogo} style={{ width: 32, height: 32 }} resizeMode="contain" />
              </View>
            ) : (
              <HeaderButton onPress={props.onBack} label="Go back">
                <ArrowLeftIcon color="#fff" />
              </HeaderButton>
            )}

            {/* Role badge, pinned to the corner of the control beside it. On a
                row of its own it made the header taller and pushed the title
                and the page down, on every screen an admin opened. */}
            {loginRole !== "member" ? <RoleBadge superAdmin={loginRole === "superAdmin"} /> : null}
          </View>

          <HeaderTitle eyebrow={eyebrow} title={title.toUpperCase()} />

          <HeaderButton onPress={toggle} label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
            {mode === "light" ? <MoonIcon color="#fff" /> : <SunIcon color="#fff" />}
          </HeaderButton>

          <HeaderButton
            onPress={props.onOpenNotifications}
            label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          >
            <BellIcon color="#fff" />
            {/* How many are unread, not a dot that was always there. Gone at zero. */}
            {unreadCount > 0 ? (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal: 5,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#DC2626",
                  borderWidth: 2,
                  borderColor: isDark ? "#132050" : "#1E3A8A",
                }}
              >
                <Txt variant="bodySemi" style={{ fontSize: 10.5, lineHeight: 13, color: "#fff" }}>
                  {unreadCount > 99 ? "99+" : String(unreadCount)}
                </Txt>
              </View>
            ) : null}
          </HeaderButton>
        </View>
      </HeaderBlock>

      {/* Content — cross-fades so switching destination reads as a transition */}
      <SwapFade trigger={`${subScreen}:${mainTab}:${selectedElder?.id ?? ""}${selectedMember?.id ?? ""}`} style={{ flex: 1 }}>
        {subScreen === "elders" ? <EldersDirectory onSelectElder={props.onSelectElder} bottomInset={contentBottomInset} /> : null}

        {subScreen === "elderProfile" && selectedElder ? <ElderProfile elder={selectedElder} bottomInset={contentBottomInset} /> : null}

        {subScreen === "members" ? <MembersDirectory onSelectMember={props.onSelectMember} loginRole={loginRole} bottomInset={contentBottomInset} /> : null}

        {subScreen === "dayBorn" ? (
          <MembersDirectory onSelectMember={props.onSelectMember} loginRole={loginRole} scope="dayBorn" bottomInset={contentBottomInset} />
        ) : null}

        {subScreen === "memberProfile" && selectedMember ? (
          <MemberProfile member={selectedMember} elders={elders} bottomInset={contentBottomInset} />
        ) : null}

        {subScreen === "myDashboard" ? (
          <MyDashboard
            assembly={assembly}
            scenario={props.scenario}
            attendanceError={props.attendanceError}
            sessionActive={props.sessionActive}
            attendanceMarked={props.attendanceMarked}
            onMarkAttendance={props.onMarkAttendance}
            elders={elders}
            onOpenElders={props.onOpenElders}
            onOpenMembers={props.onOpenDayBorn}
            onOpenVideos={props.onOpenVideos}
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

        {subScreen === "videos" ? <VideosScreen bottomInset={contentBottomInset} /> : null}

        {subScreen === "manualAttendance" ? (
          <ManualAttendanceScreen signedBy={props.sessionUser} bottomInset={contentBottomInset} />
        ) : null}

        {subScreen === "publish" ? <PublishScreen bottomInset={contentBottomInset} /> : null}

        {subScreen === "none" && mainTab === "home" ? (
          isMember ? (
            <MyDashboard
              assembly={assembly}
              scenario={props.scenario}
              attendanceError={props.attendanceError}
              sessionActive={props.sessionActive}
              attendanceMarked={props.attendanceMarked}
              onMarkAttendance={props.onMarkAttendance}
              elders={elders}
              onOpenElders={props.onOpenElders}
              onOpenMembers={props.onOpenDayBorn}
              onOpenVideos={props.onOpenVideos}
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
              onOpenVideos={props.onOpenVideos}
              onOpenMyDashboard={props.onOpenMyDashboard}
              sessionStartTime={props.sessionStartTime}
              attendanceError={props.attendanceError}
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
            attendanceError={props.attendanceError}
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
            photoStatus={props.photoStatus}
            pushNote={props.pushNote}
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
            paddingTop: 10,
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
                shadowColor: "#1E2A55",
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.08,
                shadowRadius: 18,
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
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                scale={0.92}
                style={{ flex: 1, alignItems: "center", gap: 4, paddingVertical: 2, minHeight: 44 }}
              >
                {/* Active pill grows behind the icon as the tab is selected. */}
                <TabGlow active={active} color={isDark ? ICON_TILE.dark.bg : ICON_TILE.light.bg} />
                <TabIcon active={active}>
                  <Icon active={active} size={21} color={active ? (isDark ? ICON_TILE.dark.fg : ICON_TILE.light.fg) : c.mutedForeground} />
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
                  style={{ fontSize: 10.5, letterSpacing: 0.1, color: active ? c.primary : c.mutedForeground }}
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

/**
 * Admin or super admin, as an icon on the corner of the header's left control.
 * Absolutely positioned, so it takes no room and never moves the title.
 */
function RoleBadge({ superAdmin }: { superAdmin: boolean }) {
  const size = ms(18);
  return (
    <View
      pointerEvents="none"
      accessibilityLabel={superAdmin ? "Super admin" : "Admin"}
      style={{
        position: "absolute",
        right: -5,
        bottom: -5,
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#1B2C6B",
        backgroundColor: superAdmin ? "#DC2626" : "#16A34A",
      }}
    >
      {superAdmin ? <CrownIcon size={9} color="#fff" /> : <ShieldIcon size={9} color="#fff" />}
    </View>
  );
}
