import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

/**
 * Android's SMS Retriever, through the local native module in ./android.
 *
 * Absent on iOS, on the web preview and in Expo Go, where every call here is a
 * harmless no-op — iOS offers the code above the keyboard instead.
 */
type SmsEvent = { message: string };
type NativeSmsRetriever = {
  getAppHash(): string | null;
  start(): Promise<boolean>;
  takePending(): string | null;
  stop(): void;
  addListener(event: "onSms", listener: (e: SmsEvent) => void): { remove(): void };
};

const native = Platform.OS === "android" ? requireOptionalNativeModule<NativeSmsRetriever>("SmsRetriever") : null;

/** This build's 11-character hash, which the SMS must end with to be read. */
export function getAppHash(): string | null {
  try {
    return native?.getAppHash() ?? null;
  } catch {
    return null;
  }
}

/**
 * Starts Google's five-minute listening window. Call it just before asking the
 * server for a code, so an SMS that lands before the code screen opens is kept.
 */
export function prepareForCode(): void {
  native?.start().catch(() => {});
}

/** Hands over the code from the SMS — one already received, or the next. Returns a stop function. */
export function listenForCode(length: number, onCode: (code: string) => void): () => void {
  if (!native) return () => {};
  const pick = (message: string | null) => {
    const match = message?.match(new RegExp(`\\b(\\d{${length}})\\b`));
    if (match) onCode(match[1]);
  };
  const sub = native.addListener("onSms", ({ message }) => pick(message));
  try {
    pick(native.takePending());
  } catch {
    /* nothing waiting */
  }
  return () => {
    sub.remove();
    try {
      native.stop();
    } catch {
      /* already stopped */
    }
  };
}
