import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BODY, BRAND, FONT, RADIUS, useTheme } from "../theme";
import { LoginRole, SettingsTopic, pentecostLogo, settingsPages, sliderPhotos } from "../data";
import { describeError, useSession } from "../session";
import { listenForCode } from "../../modules/sms-retriever";
import { GH_PREFIX, ghanaDigits, isCompleteGhana, toLocalNumber } from "../phone";
import { ArrowLeftIcon, CheckCircleIcon, ChevronDownIcon, MoonIcon, SunIcon, XCircleIcon } from "../icons";
import { Btn, Card, Txt, shadow } from "../ui";
import BackgroundSlider from "../components/BackgroundSlider";

/** Frosted panel that reads over any of the backdrop photographs. */
const GLASS = {
  backgroundColor: "rgba(12,20,44,0.46)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.14)",
  borderRadius: RADIUS.xl,
} as const;

/** Inset field inside a glass panel. */
const GLASS_FIELD = {
  // Navy-tinted rather than white-tinted: a white veil over a bright photograph
  // turns grey and muddy, while a dark tint keeps the field legible whatever is
  // behind it.
  backgroundColor: "rgba(12,20,44,0.55)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.22)",
} as const;

const COUNTRIES = [
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
];

// ─── Phone entry ──────────────────────────────────────────────────────────────

export function PhoneInputScreen({ onSubmit }: { onSubmit: (phone: string, devCode: string | null) => void }) {
  const { sendCode } = useSession();
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // The server is the one that knows whether this number is on the roll, so the
  // screen cannot move on until it has answered.
  const submit = async (fullPhone: string) => {
    if (sending) return;
    setSending(true);
    setSendError(null);
    try {
      const devCode = await sendCode(fullPhone);
      onSubmit(fullPhone, devCode);
    } catch (e) {
      setSendError(describeError(e));
    } finally {
      setSending(false);
    }
  };

  const { c, isDark, mode, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [showCountry, setShowCountry] = useState(false);
  const [policy, setPolicy] = useState<SettingsTopic | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  const isGhana = selectedCountry.code === GH_PREFIX;
  // The server stores Ghanaian numbers as 0XXXXXXXXX.
  const fullPhone = isGhana ? toLocalNumber(phone) : `${selectedCountry.code} ${phone}`;
  const ready = isGhana ? isCompleteGhana(phone) : phone.length > 0;


  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Photo slider behind everything */}
      <BackgroundSlider photos={sliderPhotos} />

      <ScrollView
        style={{ flex: 1 }}
        // flexGrow lets the column fill the screen, so the footer can sit at the
        // bottom of it rather than straight under the phone card.
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
      >
       

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 16 }}>
          {/* Logo */}
          <View
            style={[
              { width: 80, height: 80, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginBottom: -9 },
              shadow("lg"),
            ]}
          >
            <Image source={pentecostLogo} style={{ width: 64, height: 64 }} resizeMode="contain" />
          </View>
          
           <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 2.4, textTransform: "uppercase", textAlign: "center", marginTop: 10, color: BRAND.goldLight }}>
            The Church of Pentecost
          </Txt>

          <Txt variant="displayExtraBold" style={{ fontSize: 26,fontFamily:"sans-serif",fontWeight:"900", textAlign: "center", color: "#fff" ,marginTop: 7}}>
             Login Portal
          </Txt>
          <Txt style={{ fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 21, maxWidth: 320, color: "rgba(255,255,255,0.72)" }}>
            Enter your registered phone number to receive a verification code
          </Txt>

          {/* Phone card */}
          <View style={[GLASS, { width: "100%", marginTop: 24, padding: 17, gap: 16 }]}>
            <View>
              <Txt variant="bodySemi" style={{ fontSize: 12, marginBottom: 8, color: "rgba(255,255,255,0.78)" }}>
                Phone Number
              </Txt>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Btn
                  onPress={() => setShowCountry(true)}
                  style={{
                    height: 48,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 92,
                    ...GLASS_FIELD,
                  }}
                >
                  <Txt style={{ fontSize: 18 }}>{selectedCountry.flag}</Txt>
                  <Txt variant="bodySemi" style={{ fontSize: 14, color: "#fff" }}>
                    {selectedCountry.code}
                  </Txt>
                  <ChevronDownIcon size={12} color="rgba(255,255,255,0.7)" />
                </Btn>

                <TextInput
                  value={phone}
                  onChangeText={(t) => setPhone(isGhana ? ghanaDigits(t) : t.replace(/D/g, "").slice(0, 12))}
                  keyboardType="phone-pad"
                  placeholder="537 096 725"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={{
                    flex: 1,
                    // Without this the field keeps its intrinsic width and runs past the card.
                    minWidth: 0,
                    height: 48,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    fontSize: 14,
                    fontFamily: BODY.regular,
                    ...GLASS_FIELD,
                    color: "#fff",
                  }}
                />
              </View>
              <Txt style={{ fontSize: 12, marginTop: 8, color: "rgba(255,255,255,0.6)" }}>
                We will send a 4-digit OTP via SMS to {selectedCountry.code} {phone || "—"}
              </Txt>
            </View>

            {sendError ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, borderRadius: 12, backgroundColor: "rgba(239,68,68,0.18)" }}>
                <XCircleIcon size={16} color="#FCA5A5" />
                <Txt variant="bodySemi" style={{ flex: 1, fontSize: 12, color: "#FCA5A5" }}>
                  {sendError}
                </Txt>
              </View>
            ) : null}

            <Btn onPress={() => ready && !sending && submit(fullPhone)} disabled={!ready || sending} style={{ borderRadius: 16, overflow: "hidden" }}>
              {ready && !sending ? (
                <LinearGradient
                  colors={[BRAND.navy, "#2563EB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 16, alignItems: "center" }}
                >
                  <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>
                    Send Verification Code →
                  </Txt>
                </LinearGradient>
              ) : (
                <View style={{ paddingVertical: 16, alignItems: "center", backgroundColor: "rgba(255,255,255,0.14)" }}>
                  <Txt variant="displayBold" style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
                    {sending ? "Sending code…" : "Send Verification Code →"}
                  </Txt>
                </View>
              )}
            </Btn>
          </View>

          {/* Footer — `marginTop: "auto"` takes up all the spare height above it,
              so it rests at the bottom of the screen. */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginTop: "auto", paddingTop: 24 }}>
            <Txt style={{ fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.6)" }}>
              By continuing you agree to our{" "}
            </Txt>
            <Btn onPress={() => setPolicy("terms")} scale={1}>
              <Txt style={{ fontSize: 12, lineHeight: 18, color: "#FBBF24" }}>Terms of Service</Txt>
            </Btn>
            <Txt style={{ fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.6)" }}> and </Txt>
            <Btn onPress={() => setPolicy("privacy")} scale={1}>
              <Txt style={{ fontSize: 12, lineHeight: 18, color: "#FBBF24" }}>Privacy Policy</Txt>
            </Btn>
          </View>

          <Txt style={{ fontSize: 11, textAlign: "center", marginTop: 8, color: "rgba(255,255,255,0.5)" }}>
            The Church of Pentecost · Royal Assembly
          </Txt>
        </View>
      </ScrollView>

      {/* Country picker */}
      <Modal visible={showCountry} transparent animationType="fade" onRequestClose={() => setShowCountry(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 32 }} onPress={() => setShowCountry(false)}>
          <View style={[{ borderRadius: 20, overflow: "hidden", backgroundColor: c.card, borderWidth: 1, borderColor: c.border }, shadow("lg")]}>
            {COUNTRIES.map((country, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  setSelectedCountry(country);
                  setPhone("");
                  setShowCountry(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: i === COUNTRIES.length - 1 ? 0 : 1,
                  borderBottomColor: c.border,
                  backgroundColor: selectedCountry.code === country.code ? (isDark ? "#1E3A8A22" : "#EFF6FF") : "transparent",
                }}
              >
                <Txt style={{ fontSize: 20 }}>{country.flag}</Txt>
                <Txt variant="bodySemi" style={{ fontSize: 14, color: c.foreground }}>
                  {country.code}
                </Txt>
                <Txt style={{ fontSize: 14, color: c.mutedForeground }}>{country.name}</Txt>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <PolicyModal topic={policy} onClose={() => setPolicy(null)} />
    </KeyboardAvoidingView>
  );
}

function PolicyModal({ topic, onClose }: { topic: SettingsTopic | null; onClose: () => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const page = topic ? settingsPages[topic] : null;

  return (
    <Modal visible={!!page} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: c.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }}>
          <Btn onPress={onClose} style={{ width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: c.muted }}>
            <ArrowLeftIcon color={c.foreground} />
          </Btn>
          <Txt variant="displayBold" style={{ flex: 1, fontSize: 18, color: c.foreground }}>
            {page?.title}
          </Txt>
        </View>

        {page ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
            <Txt style={{ fontSize: 14, lineHeight: 22, color: c.mutedForeground }}>{page.intro}</Txt>
            <View style={{ gap: 10, marginTop: 18 }}>
              {page.sections.map((section, index) => (
                <Card key={index} style={{ padding: 14 }}>
                  <Txt variant="displayBold" style={{ fontSize: 15, color: c.foreground }}>{section.heading}</Txt>
                  <Txt style={{ fontSize: 13.5, lineHeight: 21, marginTop: 6, color: c.mutedForeground }}>{section.body}</Txt>
                </Card>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

// ─── OTP verification ─────────────────────────────────────────────────────────

export function OtpScreen({
  phone,
  devCode,
  onVerified,
  onBack,
}: {
  phone: string;
  /** The code a development server hands back instead of sending an SMS. */
  devCode?: string | null;
  onVerified: (phone: string, role: LoginRole) => void;
  onBack: () => void;
}) {
  const { c, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const { sendCode, signIn } = useSession();
  const [shownDevCode, setShownDevCode] = useState<string | null>(devCode ?? null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (seconds > 0 && !canResend) {
      const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
    if (seconds === 0) setCanResend(true);
  }, [seconds, canResend]);

  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const submitCode = async (code: string) => {
    if (checking) return;
    setChecking(true);
    setError(null);
    try {
      const role = await signIn(phone, code);
      setVerified(true);
      setTimeout(() => onVerified(phone, role), 700);
    } catch (e) {
      // The server distinguishes a wrong code from an expired one and from too
      // many attempts; show what it actually said rather than one blanket line.
      setError(describeError(e));
      setDigits(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setChecking(false);
    }
  };

  /** The whole code at once — read from the SMS, or offered by the keyboard. */
  const fillCode = (code: string) => {
    if (!/^\d{4}$/.test(code) || verified) return;
    setDigits(code.split(""));
    setError(null);
    inputRefs.current[3]?.blur();
    submitCode(code);
  };

  // Android reads the code SMS for us (it ends with this app's hash) and the
  // code verifies without a tap. iOS offers it above the keyboard instead.
  useEffect(() => listenForCode(4, fillCode), []);

  const handleDigit = (val: string, idx: number) => {
    const all = val.replace(/\D/g, "");
    if (all.length === 4) return fillCode(all);
    const ch = all.slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    setError(null);
    if (ch && idx < 3) inputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === 4) submitCode(next.join(""));
  };

  // "0537096725" → "+233 53 *** 6725"; other countries keep their old shape.
  const maskedPhone = /^0\d{9}$/.test(phone)
    ? `+233 ${phone.slice(1, 3)} *** ${phone.slice(6)}`
    : phone.replace(/(\+\d{3}\s\d{2})\s?\d{3}/, "$1 ***").trim();
  const complete = digits.join("").length === 4;

  const boxBg = verified ? "rgba(34,197,94,0.22)" : error ? "rgba(220,38,38,0.22)" : "rgba(255,255,255,0.13)";
  const boxText = verified ? "#86EFAC" : error ? "#FCA5A5" : "#fff";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <BackgroundSlider photos={sliderPhotos} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 24, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: "100%", flexDirection: "row", justifyContent: "flex-start" }}>
          <Btn onPress={onBack} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)" }}>
            <ArrowLeftIcon color="#fff" />
          </Btn>
        </View>

        <View
          style={[
            { width: 64, height: 64, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginTop: 32, marginBottom: 20 },
            shadow("md"),
          ]}
        >
          <Image source={pentecostLogo} style={{ width: 48, height: 48 }} resizeMode="contain" />
        </View>

        <Txt variant="displayExtraBold" style={{ fontSize: 26, textAlign: "center", color: "#fff" }}>
          Verify Your Number
        </Txt>
        <Txt style={{ fontSize: 14, textAlign: "center", marginTop: 8, color: "rgba(255,255,255,0.72)" }}>
          Code sent to <Txt variant="bodySemi" style={{ fontSize: 14, color: "#fff" }}>{maskedPhone}</Txt>
        </Txt>

        <View style={[GLASS, { width: "100%", marginTop: 32, padding: 17, gap: 20 }]}>
          <View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={d}
                keyboardType="number-pad"
                maxLength={4}
                textContentType={i === 0 ? "oneTimeCode" : "none"}
                autoComplete={i === 0 ? "sms-otp" : "off"}
                onChangeText={(v) => handleDigit(v, i)}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === "Backspace" && !d && i > 0) inputRefs.current[i - 1]?.focus();
                }}
                style={{
                  width: 56,
                  height: 56,
                  textAlign: "center",
                  fontSize: 24,
                  fontFamily: FONT.bold,
                  borderRadius: 16,
                  backgroundColor: boxBg,
                  borderWidth: 2,
                  borderColor: verified ? BRAND.green : error ? BRAND.red : d ? "#FBBF24" : "rgba(255,255,255,0.25)",
                  color: boxText,
                }}
              />
            ))}
          </View>

          {__DEV__ && shownDevCode ? (
            <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(240,180,41,0.18)" }}>
              <Txt variant="bodySemi" style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "#FBBF24" }}>
                Development — no SMS sent
              </Txt>
              <Txt variant="displayExtraBold" style={{ fontSize: 24, letterSpacing: 6, marginTop: 4, color: "#FBBF24" }}>
                {shownDevCode}
              </Txt>
            </View>
          ) : null}

          {error ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: isDark ? "#DC262622" : "#FEE2E2" }}>
              <XCircleIcon size={16} color="#FCA5A5" />
              <Txt variant="bodySemi" style={{ flex: 1, fontSize: 12, color: "#EF4444" }}>
                {error}
              </Txt>
            </View>
          ) : null}

          {verified ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: isDark ? "#16A34A22" : "#DCFCE7" }}>
              <CheckCircleIcon size={16} color="#86EFAC" />
              <Txt variant="bodySemi" style={{ fontSize: 12, color: BRAND.greenDark }}>
                Verified! Signing you in…
              </Txt>
            </View>
          ) : null}

          <View style={{ alignItems: "center" }}>
            {canResend ? (
              <Btn
                onPress={async () => {
                  setSeconds(45);
                  setCanResend(false);
                  setError(null);
                  setDigits(["", "", "", ""]);
                  // Resending has to actually issue a new code — the old one is
                  // still valid otherwise, and the member would be typing a
                  // number that was never sent.
                  try {
                    setShownDevCode(await sendCode(phone));
                  } catch (e) {
                    setError(describeError(e));
                  }
                }}
              >
                <Txt variant="bodySemi" style={{ fontSize: 14, color: "#FBBF24" }}>
                  Resend via SMS
                </Txt>
              </Btn>
            ) : (
              <Txt style={{ fontSize: 14, color: "rgba(255,255,255,0.62)" }}>
                Resend Code in{" "}
                <Txt variant="bodySemi" style={{ fontSize: 14, color: "#fff" }}>
                  0:{seconds.toString().padStart(2, "0")}
                </Txt>
              </Txt>
            )}
          </View>

          <Btn
            onPress={() => complete && !verified && submitCode(digits.join(""))}
            disabled={!complete || verified}
            style={{ borderRadius: 16, overflow: "hidden" }}
          >
            {complete && !verified ? (
              <LinearGradient colors={[BRAND.navy, "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 16, alignItems: "center" }}>
                <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>
                  Verify & Continue
                </Txt>
              </LinearGradient>
            ) : (
              <View style={{ paddingVertical: 16, alignItems: "center", backgroundColor: "rgba(255,255,255,0.14)" }}>
                <Txt variant="displayBold" style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
                  {verified ? "Signing In…" : "Verify & Continue"}
                </Txt>
              </View>
            )}
          </Btn>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
