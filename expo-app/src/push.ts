import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { rememberPushToken, storedPushToken } from "./api/auth";
import { registerPushDevice, removePushDevice } from "./api/resources";

/**
 * Push notifications — the ones that arrive with the app closed.
 *
 * The server sends them through Expo when attendance opens, an event is
 * published, or the daily verse goes out (core/push.py). For a phone to get
 * them it needs a token, and the token needs two things this code cannot
 * supply on its own:
 *
 * - an EAS project ID in app.json (`extra.eas.projectId`), from `eas init`;
 * - on Android, Firebase credentials in the build (`google-services.json`).
 *
 * Without them `registerForPush` reports why and the rest of the app carries
 * on — the in-app inbox still fills from the server either way. Expo Go on
 * Android cannot receive pushes at all since SDK 53; a real build can.
 */

/** Android groups a notification under a channel; the name shows in system settings. */
const CHANNEL = "default";

if (Platform.OS !== "web") {
  // Shown even while the app is open — "attendance is open" matters most to
  // the member who has the app in front of them.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export type PushResult = { ok: true; token: string } | { ok: false; reason: string };

function projectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/** Asks permission, gets this phone's token and registers it. Safe to call on every launch. */
export async function registerForPush(): Promise<PushResult> {
  if (Platform.OS === "web") return { ok: false, reason: "Push notifications need the phone app." };
  if (!Device.isDevice) return { ok: false, reason: "Emulators cannot receive push notifications." };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Church announcements",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1E3A8A",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return { ok: false, reason: "Notifications are turned off for this app." };

  const id = projectId();
  if (!id) return { ok: false, reason: "This build has no EAS project ID, so it cannot get a push token." };

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  } catch (e) {
    // Expo Go on Android, or a build without Firebase credentials.
    return { ok: false, reason: `Could not get a push token: ${(e as Error)?.message ?? e}` };
  }

  try {
    await registerPushDevice(token, Platform.OS === "ios" ? "ios" : "android");
    await rememberPushToken(token);
  } catch (e) {
    return { ok: false, reason: `Could not register this phone: ${(e as Error)?.message ?? e}` };
  }
  return { ok: true, token };
}

/**
 * Stops pushes to this phone. Call before signing out — afterwards there is no
 * session to tell the server with, and the next person on this phone would
 * get the last person's notifications.
 */
export async function unregisterPush(): Promise<void> {
  const token = await storedPushToken();
  if (!token) return;
  await removePushDevice(token).catch(() => {});
  await rememberPushToken(null);
}

/** What a tapped notification is about, from the data the server attached. */
export function notificationKind(n: Notifications.Notification | undefined): string | null {
  const kind = (n?.request.content.data as { kind?: unknown } | undefined)?.kind;
  return typeof kind === "string" ? kind : null;
}

export { Notifications };
