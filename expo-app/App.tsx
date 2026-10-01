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
  const [appPhase, setAppPhase] = useState<AppPhase>("login");
  const [loginRole, setLoginRole] = useState<LoginRole>("member");
  const [loginPhone, setLoginPhone] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [settingsTopic, setSettingsTopic] = useState<SettingsTopic>("help");

  // Navigation
  const [screen, setScreen] = useState<"home" | "dashboard">("home");
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  // Navigation history. The header's back arrow pops this, so it always returns
  // to the page the user actually came from — including across tab switches —
  // rather than following a fixed parent-child hierarchy.
  const [history, setHistory] = useState<NavEntry[]>([{ tab: "home", sub: "none" }]);
  const here = history[history.length - 1];
  const mainTab = here.tab;
  const subScreen = here.sub;

  /** Push a new page. Re-tapping the page you are on is a no-op, not a new entry. */
  const go = (next: Partial<NavEntry>) =>
    setHistory((h) => {
      const cur = h[h.length - 1];
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
  const { inside: userInside, certainty, fix: adminFix, startWatching } = useLocation();
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
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [membersPresent, setMembersPresent] = useState(89);
  const [firstTimers, setFirstTimers] = useState(7);

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

  const handleActivateSession = () => {
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    // Anchor the session where the admin actually is. Without a usable fix we
    // fall back to the configured geofence rather than pinning the service to a
    // guess — a wrong centre would lock out the whole congregation.
    openSessionAt(
      adminFix && adminCertainty !== "poor"
        ? { lat: String(adminFix.lat), lng: String(adminFix.lng), radius: geofence.radius }
        : null,
    );

    setSessionActive(true);
    setSessionStartTime(timeStr);
    setMembersPresent(89);
    setFirstTimers(7);
  };

  const handleTerminateSession = () => {
    closeSession();
    setSessionActive(false);
    setSessionStartTime(null);
  };

  const handleBack = () => {
    if (history.length > 1) {
      setHistory((h) => h.slice(0, -1));
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
    setAppPhase("login");
    setLoginRole("member");
    setLoginPhone("");
    setSessionUser(null);
    setScreen("home");
    setSelectedAssembly(null);
    resetHistory();
    setSelectedElder(null);
    setSelectedMember(null);
    setSessionActive(false);
    setSessionStartTime(null);
    setAttendanceMarked(false);
  };

  const markAttendance = () => {
    setAttendanceMarked(true);
    setMembersPresent((p) => p + 1);
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
          onSubmit={(phone) => {
            setLoginPhone(phone);
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
          onBack={() => setAppPhase("login")}
          onVerified={(phone) => {
            const stripped = phone.replace(/\s/g, "").replace("+233", "0");
            const role = PHONE_ROLES[stripped] ?? "member";
            setLoginRole(role);

            // A member belongs to exactly one assembly, so the picker would be a
            // dead end for them — drop them straight onto their own dashboard.
            if (role === "member") {
              setSelectedAssembly(assemblies.find((a) => a.id === ME.assemblyId) ?? assemblies[0]);
              setScreen("dashboard");
              resetHistory();
            }

            setSessionUser(resolveSessionUser(phone));
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
          onChangePhoto={(uri) => setSessionUser((u) => (u ? { ...u, photo: uri } : u))}
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
          <ContentProvider>
            <LocationBridge>
              <ChurchApp />
            </LocationBridge>
          </ContentProvider>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}
