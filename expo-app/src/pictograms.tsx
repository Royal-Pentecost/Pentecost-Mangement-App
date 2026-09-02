import React from "react";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polygon, Polyline, Rect, Stop } from "react-native-svg";

import { ms } from "./theme";

/**
 * Line-drawn replacements for the emoji the screens used to render, so the
 * iconography stays consistent across platforms, themes, and font settings.
 */

interface IconProps {
  size?: number;
  color?: string;
}

const stroke = {
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function UserIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

export function UsersIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

export function LockIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

export function ChatIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </Svg>
  );
}

export function InfoIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  );
}

export function FileTextIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Polyline points="14 2 14 8 20 8" />
      <Line x1="16" y1="13" x2="8" y2="13" />
      <Line x1="16" y1="17" x2="8" y2="17" />
    </Svg>
  );
}

export function PhoneIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
}

export function MailIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <Polyline points="22,6 12,13 2,6" />
    </Svg>
  );
}

export function CalendarIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  );
}

export function IdCardIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Circle cx="8.5" cy="11" r="2.5" />
      <Path d="M4.5 17.5a4.2 4.2 0 0 1 8 0" />
      <Line x1="15" y1="10" x2="19" y2="10" />
      <Line x1="15" y1="14" x2="19" y2="14" />
    </Svg>
  );
}

export function FlameIcon({ size = 16, color = "#F59E0B" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1.2} strokeLinejoin="round">
      <Path d="M12 2c1.5 3.5.5 5.5-1 7-1.8 1.8-3 3.3-3 5.7A6.3 6.3 0 0 0 14.3 21c3.2 0 5.7-2.6 5.7-5.9 0-4.2-3.2-6.4-4.5-9.1-.6 1.3-1.5 2-2.4 2.4.6-2.2.3-4.5-1.1-6.4z" />
    </Svg>
  );
}

export function CrownIcon({ size = 16, color = "#F59E0B" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1.2} strokeLinejoin="round">
      <Path d="M3 18h18l-1.4-9-4.3 3.4L12 5.5 8.7 12.4 4.4 9z" />
    </Svg>
  );
}

export function ChurchIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Line x1="12" y1="2" x2="12" y2="8" />
      <Line x1="9.5" y1="4.5" x2="14.5" y2="4.5" />
      <Path d="M12 8 5 12v9h14v-9z" />
      <Path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    </Svg>
  );
}

export function AlertTriangleIcon({ size = 20, color = "#D97706" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <Line x1="12" y1="9" x2="12" y2="13" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  );
}

export function SignalIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
      <Path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
      <Path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
      <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
}

export function FolderIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export function UploadIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Polyline points="17 8 12 3 7 8" />
      <Line x1="12" y1="3" x2="12" y2="15" />
    </Svg>
  );
}

export function WalletIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
      <Path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <Path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </Svg>
  );
}

export function AwardIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Circle cx="12" cy="8" r="6" />
      <Polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </Svg>
  );
}

export function CrossIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Line x1="12" y1="3" x2="12" y2="21" />
      <Line x1="7" y1="8.5" x2="17" y2="8.5" />
    </Svg>
  );
}

export function MusicIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M9 18V5l12-2v13" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="18" cy="16" r="3" />
    </Svg>
  );
}

export function HandshakeIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <Path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 1 0-2.8l.8-.8a2 2 0 0 1 2.8 0L21 8" />
      <Path d="M3 8l2.8-2.8a2 2 0 0 1 2.8 0l.8.8a2 2 0 0 1 0 2.8L7 12l4 4" />
      <Path d="M8 20 5 17" />
    </Svg>
  );
}

export function PrayIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M12 12c0-3 1.5-5 3.5-6.5S19 4 19 6c0 3-2 6-4 8l-3 3-3-3c-2-2-4-5-4-8 0-2 1.5-2 3.5-.5S12 9 12 12z" />
      <Line x1="7" y1="21" x2="17" y2="21" />
    </Svg>
  );
}

export function WaveIcon({ size = 18, color = "#F59E0B" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M18 11V6.5a1.5 1.5 0 0 0-3 0V11" />
      <Path d="M15 10V4.5a1.5 1.5 0 0 0-3 0V10" />
      <Path d="M12 10V5.5a1.5 1.5 0 0 0-3 0V13" />
      <Path d="M9 12V8.5a1.5 1.5 0 0 0-3 0V14c0 4 2.5 7 6 7s6-3 6-7v-3" />
    </Svg>
  );
}

/** Ranked medal — colour distinguishes gold, silver and bronze. */
export function MedalIcon({ size = 20, color = "#F0B429" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M7.2 3h3.2l3 5.6" />
      <Path d="M16.8 3h-3.2l-3 5.6" />
      <Circle cx="12" cy="15.5" r="5.5" fill={color} stroke={color} />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 20, color = "#16A34A" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <Polyline points="22 4 12 14.01 9 11.01" />
    </Svg>
  );
}

export function TrashIcon({ size = 16, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <Line x1="10" y1="11" x2="10" y2="17" />
      <Line x1="14" y1="11" x2="14" y2="17" />
    </Svg>
  );
}

export function PlusIcon({ size = 16, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
  );
}

export function XIcon({ size = 14, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

export function XCircleIcon({ size = 20, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...stroke}>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="15" y1="9" x2="9" y2="15" />
      <Line x1="9" y1="9" x2="15" y2="15" />
    </Svg>
  );
}

export function PlayIcon({ size = 16, color = "#fff" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Polygon points="6 4 20 12 6 20" />
    </Svg>
  );
}

export function StopIcon({ size = 16, color = "#fff" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round">
      <Rect x="6" y="6" width="12" height="12" rx="2" />
    </Svg>
  );
}

// ─── Brand marks ──────────────────────────────────────────────────────────────
// Unlike the line icons above these carry their own brand colours, so they take
// a size but no `color` — recolouring a logo would misrepresent it.

export function WhatsappIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="wa" x1="26.5" y1="7" x2="4" y2="28" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#5BD066" />
          <Stop offset="1" stopColor="#27B43E" />
        </LinearGradient>
      </Defs>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 31C23.732 31 30 24.732 30 17C30 9.26801 23.732 3 16 3C8.26801 3 2 9.26801 2 17C2 19.5109 2.661 21.8674 3.81847 23.905L2 31L9.31486 29.3038C11.3014 30.3854 13.5789 31 16 31ZM16 28.8462C22.5425 28.8462 27.8462 23.5425 27.8462 17C27.8462 10.4576 22.5425 5.15385 16 5.15385C9.45755 5.15385 4.15385 10.4576 4.15385 17C4.15385 19.5261 4.9445 21.8675 6.29184 23.7902L5.23077 27.7692L9.27993 26.7569C11.1894 28.0746 13.5046 28.8462 16 28.8462Z"
        fill="#BFC8D0"
      />
      <Path
        d="M28 16C28 22.6274 22.6274 28 16 28C13.4722 28 11.1269 27.2184 9.19266 25.8837L5.09091 26.9091L6.16576 22.8784C4.80092 20.9307 4 18.5589 4 16C4 9.37258 9.37258 4 16 4C22.6274 4 28 9.37258 28 16Z"
        fill="url(#wa)"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 30C23.732 30 30 23.732 30 16C30 8.26801 23.732 2 16 2C8.26801 2 2 8.26801 2 16C2 18.5109 2.661 20.8674 3.81847 22.905L2 30L9.31486 28.3038C11.3014 29.3854 13.5789 30 16 30ZM16 27.8462C22.5425 27.8462 27.8462 22.5425 27.8462 16C27.8462 9.45755 22.5425 4.15385 16 4.15385C9.45755 4.15385 4.15385 9.45755 4.15385 16C4.15385 18.5261 4.9445 20.8675 6.29184 22.7902L5.23077 26.7692L9.27993 25.7569C11.1894 27.0746 13.5046 27.8462 16 27.8462Z"
        fill="white"
      />
      <Path
        d="M12.5 9.49989C12.1672 8.83131 11.6565 8.8905 11.1407 8.8905C10.2188 8.8905 8.78125 9.99478 8.78125 12.05C8.78125 13.7343 9.52345 15.578 12.0244 18.3361C14.438 20.9979 17.6094 22.3748 20.2422 22.3279C22.875 22.2811 23.4167 20.0154 23.4167 19.2503C23.4167 18.9112 23.2062 18.742 23.0613 18.696C22.1641 18.2654 20.5093 17.4631 20.1328 17.3124C19.7563 17.1617 19.5597 17.3656 19.4375 17.4765C19.0961 17.8018 18.4193 18.7608 18.1875 18.9765C17.9558 19.1922 17.6103 19.083 17.4665 19.0015C16.9374 18.7892 15.5029 18.1511 14.3595 17.0426C12.9453 15.6718 12.8623 15.2001 12.5959 14.7803C12.3828 14.4444 12.5392 14.2384 12.6172 14.1483C12.9219 13.7968 13.3426 13.254 13.5313 12.9843C13.7199 12.7145 13.5702 12.305 13.4803 12.05C13.0938 10.953 12.7663 10.0347 12.5 9.49989Z"
        fill="white"
      />
    </Svg>
  );
}

export function GmailIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 32 32" fill="none">
      <Path
        d="M2 11.9556C2 8.47078 2 6.7284 2.67818 5.39739C3.27473 4.22661 4.22661 3.27473 5.39739 2.67818C6.7284 2 8.47078 2 11.9556 2H20.0444C23.5292 2 25.2716 2 26.6026 2.67818C27.7734 3.27473 28.7253 4.22661 29.3218 5.39739C30 6.7284 30 8.47078 30 11.9556V20.0444C30 23.5292 30 25.2716 29.3218 26.6026C28.7253 27.7734 27.7734 28.7253 26.6026 29.3218C25.2716 30 23.5292 30 20.0444 30H11.9556C8.47078 30 6.7284 30 5.39739 29.3218C4.22661 28.7253 3.27473 27.7734 2.67818 26.6026C2 25.2716 2 23.5292 2 20.0444V11.9556Z"
        fill="white"
      />
      <Path d="M22.0515 8.52295L16.0644 13.1954L9.94043 8.52295V8.52421L9.94783 8.53053V15.0732L15.9954 19.8466L22.0515 15.2575V8.52295Z" fill="#EA4335" />
      <Path d="M23.6231 7.38639L22.0508 8.52292V15.2575L26.9983 11.459V9.17074C26.9983 9.17074 26.3978 5.90258 23.6231 7.38639Z" fill="#FBBC05" />
      <Path d="M22.0508 15.2575V23.9924H25.8428C25.8428 23.9924 26.9219 23.8813 26.9995 22.6513V11.459L22.0508 15.2575Z" fill="#34A853" />
      <Path d="M9.94811 24.0001V15.0732L9.94043 15.0669L9.94811 24.0001Z" fill="#C5221F" />
      <Path d="M9.94014 8.52404L8.37646 7.39382C5.60179 5.91001 5 9.17692 5 9.17692V11.4651L9.94014 15.0667V8.52404Z" fill="#C5221F" />
      <Path d="M9.94043 8.52441V15.0671L9.94811 15.0734V8.53073L9.94043 8.52441Z" fill="#C5221F" />
      <Path d="M5 11.4668V22.6591C5.07646 23.8904 6.15673 24.0003 6.15673 24.0003H9.94877L9.94014 15.0671L5 11.4668Z" fill="#4285F4" />
    </Svg>
  );
}
