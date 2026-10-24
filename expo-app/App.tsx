import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
// Imported from subpaths so only these weights are bundled, not the whole family.
import { Outfit_300Light } from "@expo-google-fonts/outfit/300Light";
import { Outfit_400Regular } from "@expo-google-fonts/outfit/400Regular";
import { Outfit_500Medium } from "@expo-google-fonts/outfit/500Medium";
import { Outfit_600SemiBold } from "@expo-google-fonts/outfit/600SemiBold";
import { Outfit_700Bold } from "@expo-google-fonts/outfit/700Bold";
import { Outfit_800ExtraBold } from "@expo-google-fonts/outfit/800ExtraBold";
import { Outfit_900Black } from "@expo-google-fonts/outfit/900Black";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";

import { ThemeProvider, useTheme } from "./src/theme";
import { ContentProvider, useContent } from "./src/store";
import { LocationProvider, useLocation } from "./src/location";
import { SessionProvider, useSession } from "./src/session";
import { TodayAttendanceProvider, useTodayAttendance } from "./src/today";
import { useOnPullToRefresh } from "./src/refresh";
import { DirectoryProvider, useDirectory } from "./src/directory";
import * as Api from "./src/api/resources";
import { describeError } from "./src/session";
import {
  AppPhase,
  Assembly,
  AttendanceScenario,
  Elder,
  LoginRole,
  MainTab,
  NavEntry,
  ME,
  Member,
  PHONE_ROLES,
  SessionUser,
  SettingsTopic,
  SubScreen,
  assemblies,
  resolveSessionUser,
} from "./src/data";
import { OtpScreen, PhoneInputScreen } from "./src/screens/LoginScreen";
import AssemblyPicker from "./src/screens/AssemblyPicker";
import DashboardShell from "./src/screens/DashboardShell";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import StartupScreen, { STARTUP_BG } from "./src/screens/StartupScreen";

SplashScreen.preventAutoHideAsync().catch(() => {});

function ChurchApp() {
  const { c, isDark } = useTheme();

  // Continues the native splash, then fades into the app.
  const [booting, setBooting] = useState(true);

  // Auth
  // The signed-in profile comes from the session, never a copy: `onVerified`
  // fires from a timer after sign-in resolves, and a copied value would be the
  // stale pre-sign-in one — which rendered the dashboard with a null user.
  // A locally chosen photograph overlays it until the upload lands.
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<{ state: "uploading" | "done" | "failed"; message: string } | null>(null);

  // Who the server says is signed in, and what it lets them do. Privileges come
  // with the verified profile rather than from a table of numbers in the app.
  const { role: sessionRole, status: sessionStatus, user: verifiedUser, member: verifiedMember, setPhoto: uploadPhoto, signOut: endSession } = useSession();
  const { refresh: refreshDirectory, refreshStats } = useDirectory();

  /** Privileges for this session, straight from the verified profile. */
  const loginRole: LoginRole = sessionRole;

  const sessionUser: SessionUser | null = verifiedUser
    ? { ...verifiedUser, photo: localPhoto ?? verifiedUser.photo }
    : null;

  const [appPhase, setAppPhase] = useState<AppPhase>("login");
  const [loginPhone, setLoginPhone] = useState("");
  /** Development only: the code a console-backend server returns instead of texting it. */
  const [loginDevCode, setLoginDevCode] = useState<string | null>(null);
  const [settingsTopic, setSettingsTopic] = useState<SettingsTopic>("help");

  // Navigation
  const [screen, setScreen] = useState<"home" | "dashboard">("home");
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  // Navigation history. The header's back arrow pops this, so it always returns
  // to the page the user actually came from — including across tab switches —
  // rather than following a fixed parent-child hierarchy.
  const [history, setHistory] = useState<NavEntry[]>([{ tab: "home", sub: "none" }]);
  // Never undefined, even if something empties the trail.
  const here = history[history.length - 1] ?? { tab: "home" as const, sub: "none" as const };
  const mainTab = here.tab;
  const subScreen = here.sub;

  /** Push a new page. Re-tapping the page you are on is a no-op, not a new entry. */
  const go = (next: Partial<NavEntry>) =>
    setHistory((h) => {
      const cur: NavEntry = h[h.length - 1] ?? { tab: "home", sub: "none" };
      const entry: NavEntry = { tab: next.tab ?? cur.tab, sub: next.sub ?? "none" };
      if (entry.tab === cur.tab && entry.sub === cur.sub) return h;
      // Keep the trail bounded; nobody needs to walk back a hundred pages.
      return [...h, entry].slice(-30);
    });

  const resetHistory = () => setHistory([{ tab: "home", sub: "none" }]);
  const canGoBack = history.length > 1 || loginRole !== "member";
  const [selectedElder, setSelectedElder] = useState<Elder | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Privileges come straight from the verified phone number — signing in as an
  // admin *is* the authorisation, so there is no second PIN challenge.
  const isAdmin = appPhase === "app" && (loginRole === "admin" || loginRole === "superAdmin");
  const isSuperAdmin = appPhase === "app" && loginRole === "superAdmin";

  // Attendance session
  const [sessionActive, setSessionActive] = useState(false);
  // Where the member actually is. `certainty` guards against a fix too coarse
  // to place them on one side of the boundary or the other.
  const { inside: userInside, certainty, fix: adminFix, distance: distanceFromCentre, startWatching } = useLocation();
  const adminCertainty = certainty;
  const { geofence, openSessionAt, closeSession } = useContent();

  // Keep the dashboard's geofence status current even when the Attendance tab
  // has not been opened yet. The watcher is reference-counted with the map.
  useEffect(() => {
    if (appPhase !== "app") return;
    return startWatching();
  }, [appPhase, startWatching]);
  const locationTrusted = userInside && certainty !== "poor";
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  /** The server-side session this device is signing against. */
  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  // Counted by the server for the session that is open now — these were the
  // literals 89 and 7, shown before anyone had signed anything.
  const today = useTodayAttendance();
  const { present: membersPresent, firstTimers } = today.countsFor(remoteSessionId);

  const scenario: AttendanceScenario =
    locationTrusted && sessionActive
      ? "inside-active"
      : !locationTrusted && sessionActive
        ? "outside-active"
        : locationTrusted && !sessionActive
          ? "inside-closed"
          : "outside-closed";

  const handleSelectAssembly = (a: Assembly) => {
    setSelectedAssembly(a);
    setScreen("dashboard");
    resetHistory();
    setAttendanceMarked(false);
  };

  const handleActivateSession = async () => {
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    setAttendanceError(null);

    // The server owns the session, because every member's phone has to be
    // checked against the same centre.
    const assemblyId = verifiedMember?.assembly?.id;
    if (!assemblyId) {
      setAttendanceError("Your account is not attached to an assembly, so a session cannot be opened.");
      return;
    }

    // Anchor the session where the admin actually is. Without a usable fix the
    // centre is left out and the server uses the assembly's own fence — never
    // the app's local default, which is a placeholder in another town and
    // would have put the whole congregation "outside".
    const trustedFix = adminFix && adminCertainty !== "poor" ? adminFix : null;

    let created;
    try {
      created = await Api.openSession({
        assembly: assemblyId,
        service_name: "Service",
        centre: trustedFix ? { lat: trustedFix.lat, lng: trustedFix.lng } : undefined,
      });
    } catch (e) {
      // Not open anywhere, so not open here either. Showing "Attendance Open"
      // on this phone alone was the bug: members saw a closed session and a
      // dark button while the admin believed attendance was running.
      setAttendanceError(describeError(e));
      return;
    }

    // Measure against the centre the server actually stored, so this phone and
    // every member's agree to the metre.
    openSessionAt({
      lat: created.geofence_center_lat,
      lng: created.geofence_center_lng,
      radius: String(created.geofence_radius_meters),
    });
    setRemoteSessionId(created.id);
    setSessionActive(true);
    setSessionStartTime(timeStr);
    void today.refresh();
  };

  const handleTerminateSession = async () => {
    setAttendanceError(null);

    // Closed on the server first. Closing locally regardless left the admin
    // believing the service had ended while members could still sign in.
    if (remoteSessionId) {
      try {
        await Api.closeSession(remoteSessionId);
      } catch (e) {
        setAttendanceError(describeError(e));
        return;
      }
    }

    closeSession();
    setRemoteSessionId(null);
    setSessionActive(false);
    setSessionStartTime(null);
    void today.refresh();
  };

  /**
   * Walk straight in when a previous sign-in is still valid.
   *
   * Without this the app would restore the token and then still show the login
   * screen, which is the same as not restoring it at all. A member goes to their
   * own dashboard; an admin to the assembly picker, because they may work in
   * more than one.
   */
  useEffect(() => {
    if (sessionStatus !== "signedIn" || appPhase !== "login") return;

    if (sessionRole === "member") {
      setSelectedAssembly(assemblies.find((a) => a.id === ME.assemblyId) ?? assemblies[0]);
      setScreen("dashboard");
      resetHistory();
    }
    // Straight to the app: the welcome splash belongs to a fresh sign-in, not
    // to every launch for the next four weeks.
    setAppPhase("app");
  }, [sessionStatus, sessionRole, appPhase]);

  /**
   * Adopt whatever session the server says is open.
   *
   * The admin opens attendance on their own device; every other phone has to
   * find out some other way. Without this a member would sit looking at
   * "Attendance Session Closed" through the whole service.
   */
  // Bumped by pull-to-refresh: re-running the effect checks the server now
  // instead of waiting up to 30 seconds for the next poll.
  const [sessionCheck, setSessionCheck] = useState(0);
  useOnPullToRefresh(() => setSessionCheck((n) => n + 1));

  useEffect(() => {
    if (appPhase !== "app") return;

    let stopped = false;
    const sync = async () => {
      try {
        const open = await Api.fetchOpenSession();
        if (stopped) return;

        if (open) {
          setRemoteSessionId(open.id);
          setSessionActive(true);
          // Measure against the session's own centre, not the stored fence.
          openSessionAt({
            lat: open.geofence_center_lat,
            lng: open.geofence_center_lng,
            radius: String(open.geofence_radius_meters),
          });
        } else {
          setRemoteSessionId(null);
          setSessionActive(false);
          closeSession();
        }
      } catch {
        // A failed poll leaves the last known state alone — a dropped request
        // is not evidence that the service ended.
      }
    };

    void sync();
    const timer = setInterval(sync, 30_000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [appPhase, openSessionAt, closeSession, sessionCheck]);

  const handleBack = () => {
    if (history.length > 1) {
      // Checked again against the live value: `history` here can be a render
      // behind, and two quick presses of the phone's back button both passed
      // the outer check, popped twice, and emptied the trail — the next render
      // then read `.tab` of nothing and the app crashed.
      setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
    } else if (loginRole !== "member") {
      // Nothing left in the trail — admins fall back to the assembly picker.
      // Members have no picker, so their root is the end of the line.
      setScreen("home");
    }
  };

  // Android's hardware/gesture back must walk the same trail as the header
  // arrow. Returning false hands the press back to the OS, which closes the app —
  // that is only correct once the user is genuinely at the root of their session.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (appPhase === "otp") {
        setAppPhase("login");
        return true;
      }
      // The startup and welcome screens are timed hand-offs; swallow the press
      // rather than dumping the user out mid-animation.
      if (booting || appPhase === "welcome") return true;
      if (appPhase !== "app") return false;

      if (screen === "dashboard" && canGoBack) {
        handleBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [appPhase, booting, screen, canGoBack, history.length, loginRole]);

  const handleLogout = () => {
    // Drop the token from the keystore too, or the next launch would restore a
    // session the member thought they had ended.
    void endSession();

    setAppPhase("login");
    setLoginPhone("");
    setLocalPhoto(null);
    setScreen("home");
    setSelectedAssembly(null);
    resetHistory();
    setSelectedElder(null);
    setSelectedMember(null);
    setSessionActive(false);
    setSessionStartTime(null);
    setAttendanceMarked(false);
  };

  const markAttendance = async () => {
    if (!remoteSessionId) {
      setAttendanceError("No open session on the server yet. Ask an admin to start attendance.");
      return;
    }
    if (!adminFix) {
      setAttendanceError("Still finding your location.");
      return;
    }

    setAttendanceError(null);
    try {
      // Where the phone is, not how far it believes it is: the server measures
      // the distance against the session's centre and decides for itself.
      await Api.markAttendance({
        session: remoteSessionId,
        method: "gps",
        lat: adminFix.lat,
        lng: adminFix.lng,
      });
      setAttendanceMarked(true);
      // Re-read rather than add one: a second tap, or the same member on two
      // phones, is one person present — the server's count already knows that.
      void today.refresh();
      // The server has already moved their score and Sunday streak; show it.
      void refreshStats();
    } catch (e) {
      setAttendanceError(describeError(e));
    }
  };

  // ─── Startup ────────────────────────────────────────────────────────────────

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: STARTUP_BG }}>
        <StatusBar style="light" />
        <StartupScreen onDone={() => setBooting(false)} />
      </View>
    );
  }

  // ─── Login / OTP ────────────────────────────────────────────────────────────

  if (appPhase === "login") {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <PhoneInputScreen
          onSubmit={(phone, devCode) => {
            setLoginPhone(phone);
            setLoginDevCode(devCode);
            setAppPhase("otp");
          }}
        />
      </View>
    );
  }

  if (appPhase === "otp") {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <OtpScreen
          phone={loginPhone}
          devCode={loginDevCode}
          onBack={() => setAppPhase("login")}
          onVerified={(_phone, role) => {
            // `signIn` has already run inside OtpScreen; the role is handed in
            // from there rather than read here, because this callback fires
            // from a timer and would otherwise capture the pre-sign-in value.

            // A member belongs to exactly one assembly, so the picker would be a
            // dead end for them — drop them straight onto their own dashboard.
            if (role === "member") {
              setSelectedAssembly(assemblies.find((a) => a.id === ME.assemblyId) ?? assemblies[0]);
              setScreen("dashboard");
              resetHistory();
            }

            setAppPhase("welcome");
          }}
        />
      </View>
    );
  }

  if (appPhase === "welcome" && sessionUser) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <StatusBar style="light" />
        <WelcomeScreen user={sessionUser} onDone={() => setAppPhase("app")} />
      </View>
    );
  }

  // ─── Main app ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar style="light" />

      {screen === "home" || !selectedAssembly ? (
        <AssemblyPicker onSelectAssembly={handleSelectAssembly} />
      ) : (
        <DashboardShell
          assembly={selectedAssembly}
          mainTab={mainTab}
          onChangeTab={(t) => go({ tab: t, sub: "none" })}
          onBack={handleBack}
          scenario={scenario}
          attendanceError={attendanceError}
          sessionActive={sessionActive}
          sessionStartTime={sessionStartTime}
          membersPresent={membersPresent}
          firstTimers={firstTimers}
          isAdmin={isAdmin}
          onActivateSession={handleActivateSession}
          onTerminateSession={handleTerminateSession}
          attendanceMarked={attendanceMarked}
          onMarkAttendance={markAttendance}
          subScreen={subScreen}
          selectedElder={selectedElder}
          onOpenElders={() => go({ sub: "elders" })}
          onSelectElder={(e) => {
            setSelectedElder(e);
            go({ sub: "elderProfile" });
          }}
          selectedMember={selectedMember}
          onOpenMembers={() => go({ sub: "members" })}
          onOpenDayBorn={() => go({ sub: "dayBorn" })}
          onSelectMember={(m) => {
            setSelectedMember(m);
            go({ sub: "memberProfile" });
          }}
          onOpenMyDashboard={() => go({ sub: "myDashboard" })}
          onOpenAdminHub={() => go({ sub: "adminHub" })}
          onOpenManualAttendance={() => go({ sub: "manualAttendance" })}
          onOpenPublish={() => go({ sub: "publish" })}
          onOpenNotifications={() => go({ sub: "notifications" })}
          sessionUser={sessionUser!}
          onChangePhoto={async (uri) => {
            // Show it straight away so the tap feels answered, then upload. If
            // the upload fails the preview is dropped rather than left looking
            // saved — a photo that only exists on this phone is a lie — and the
            // reason is shown, where it used to be swallowed.
            setLocalPhoto(uri);
            setPhotoStatus({ state: "uploading", message: "" });
            try {
              await uploadPhoto(uri);
              setLocalPhoto(null);
              setPhotoStatus({ state: "done", message: "Profile photo updated." });
              await refreshDirectory();
            } catch (e) {
              setLocalPhoto(null);
              setPhotoStatus({ state: "failed", message: `Your photo was not saved: ${describeError(e)}` });
            }
          }}
          photoStatus={photoStatus}
          settingsTopic={settingsTopic}
          onOpenSettingsTopic={(t) => {
            setSettingsTopic(t);
            go({ sub: "settingsDetail" });
          }}
          onLogout={handleLogout}
          isSuperAdmin={isSuperAdmin}
          onOpenSuperAdmin={() => go({ sub: "superAdmin" })}
          loginRole={loginRole}
          canGoBack={canGoBack}
        />
      )}
    </View>
  );
}

/** Feeds the admin's geofence into the location layer. */
function LocationBridge({ children }: { children: React.ReactNode }) {
  const { geofence, sessionOrigin } = useContent();
  return <LocationProvider geofence={sessionOrigin ?? geofence}>{children}</LocationProvider>;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <ThemeProvider>
          <SessionProvider>
            <DirectoryProvider>
              <ContentProvider>
                <TodayAttendanceProvider>
                <LocationBridge>
                  <ChurchApp />
                </LocationBridge>
                </TodayAttendanceProvider>
              </ContentProvider>
            </DirectoryProvider>
          </SessionProvider>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}
