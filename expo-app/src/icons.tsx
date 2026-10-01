import React from "react";
import Svg, { Path, Polyline, Line, Circle, G } from "react-native-svg";

import { ms } from "./theme";

// Emoji replacements live alongside these and are re-exported for one import site.
export * from "./pictograms";

interface IconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

const common = {
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ size = 20, color = "#000", active = false }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} {...common}>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" fill="none" />
    </Svg>
  );
}

export function MapPinIcon({ size = 20, color = "#000", active = false }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} {...common}>
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <Circle cx="12" cy="10" r="3" fill={active ? "#fff" : "none"} />
    </Svg>
  );
}

export function TrophyIcon({ size = 20, color = "#000", active = false }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} {...common}>
      <Polyline points="6 9 6 2 18 2 18 9" />
      <Path d="M6 9a6 6 0 0 0 12 0" />
      <Line x1="12" y1="15" x2="12" y2="22" />
      <Line x1="8" y1="22" x2="16" y2="22" />
      <Path d="M6 2H3a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4" />
      <Path d="M18 2h3a2 2 0 0 1 2 2v2a4 4 0 0 1-4 4" />
    </Svg>
  );
}

export function BookIcon({ size = 20, color = "#000", active = false }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} {...common}>
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </Svg>
  );
}

/** Checkmark badge supplied for member-record corrections. */
export function CorrectMemberIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 100 125" fill={color}>
      <Path d="m46.598 5.9531c-9.7305 0.078125-19.453 3.3789-27.457 9.9141-16.523 13.484-21.016 36.902-10.648 55.551 10.367 18.645 32.633 27.18 52.793 20.234 20.16-6.9453 32.453-27.379 29.156-48.461-0.058594-0.38672-0.26953-0.73047-0.58594-0.96094-0.31641-0.23047-0.71094-0.32422-1.0938-0.26562-0.38672 0.0625-0.73438 0.27344-0.96484 0.58594-0.23047 0.31641-0.32422 0.71094-0.26172 1.0977 3.0781 19.695-8.3867 38.738-27.219 45.227-18.832 6.4883-39.566-1.4609-49.25-18.879-9.6836-17.418-5.5039-39.262 9.9336-51.859 15.434-12.598 37.652-12.293 52.75 0.707h-0.003906c0.61719 0.52734 1.5469 0.45312 2.0703-0.164 0.25391-0.2969 0.38281-0.6797 0.35156-1.07-0.03125-0.3867-0.21484-0.75-0.5117-1.0039-8.082-6.957-18.07-10.516-28.117-10.648-0.3125-0.003906-0.62891-0.003906-0.94141 0zm42.07 9.4297c-1.9805 0.023438-3.9492 0.7969-5.5 2.2734-0.03125 0.015625-0.066407 0.035156-0.097657 0.054688l-33.5 32.883-13.43-13.145c-3.3281-3.2266-8.6484-3.0234-11.734 0.445-3.0859 3.4648-2.9375 8.8477 0.3555 12.105l0.011719 0.011719 19.074 18.695c3.1641 3.1016 8.2109 3.1016 11.379 0l39.223-38.445c3.3125-3.2422 3.4961-8.6211 0.4258-12.105-1.5469-1.7539-3.6641-2.6836-5.8125-2.7656-0.13281-0.003907-0.26172-0.003907-0.39453-0.003907zm0.035156 2.8906c0.085937 0 0.17188 0 0.25391 0.003906 1.3555 0.050781 2.6914 0.66406 3.7109 1.824 2.0273 2.3008 1.8945 5.9258-0.281 8.058l-39.219 38.434c-2.078 2.035-5.175 2.035-7.253 0l-19.086-18.691c-2.156-2.144-2.261-5.773-0.226-8.058 2.039-2.289 5.304-2.414 7.492-0.292l14.449 14.145c0.57 0.554 1.48 0.554 2.05 0l34.543-33.895c1.027-1.007 2.296-1.515 3.566-1.535z" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 16, color = "#000", open = false }: IconProps & { open?: boolean }) {
  return (
    <Svg
      width={ms(size)}
      height={ms(size)}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
    >
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 16, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="9 18 15 12 9 6" />
    </Svg>
  );
}

export function BellIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 20, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Polyline points="12 19 5 12 12 5" />
    </Svg>
  );
}

export function ShieldIcon({ size = 16, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

export function ShieldAlertIcon({ size = 20, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <Line x1="12" y1="8" x2="12" y2="12" />
      <Line x1="12" y1="16" x2="12.01" y2="16" />
    </Svg>
  );
}

export function DownloadIcon({ size = 14, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Polyline points="7 10 12 15 17 10" />
      <Line x1="12" y1="15" x2="12" y2="3" />
    </Svg>
  );
}

export function ClockIcon({ size = 13, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="12 6 12 12 16 14" />
    </Svg>
  );
}

export function PinIcon({ size = 13, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <Circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

export function SettingsIcon({ size = 20, color = "#000", active = false }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} {...common}>
      <Circle cx="12" cy="12" r="3" fill={active ? "#fff" : "none"} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

export function CameraIcon({ size = 16, color = "#fff" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

export function LogOutIcon({ size = 18, color = "#DC2626" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );
}

export function SearchIcon({ size = 16, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  );
}

export function CheckIcon({ size = 20, color = "#16A34A", strokeWidth = 2.5 }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function CircleIcon({ size = 20, color = "#999" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Circle cx="12" cy="12" r="10" />
    </Svg>
  );
}

export function SunIcon({ size = 16, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Circle cx="12" cy="12" r="5" />
      <Line x1="12" y1="1" x2="12" y2="3" />
      <Line x1="12" y1="21" x2="12" y2="23" />
      <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <Line x1="1" y1="12" x2="3" y2="12" />
      <Line x1="21" y1="12" x2="23" y2="12" />
      <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </Svg>
  );
}

export function MoonIcon({ size = 16, color = "#000" }: IconProps) {
  return (
    <Svg width={ms(size)} height={ms(size)} viewBox="0 0 24 24" fill="none" stroke={color} {...common}>
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}

/** Faint grid backdrop used behind the geofence map. */
export function MapGrid({ width, height, color }: { width: number; height: number; color: string }) {
  const rows = [40, 80, 120, 160, 200, 240];
  const cols = [40, 80, 120, 160, 200, 240, 280, 320, 360];
  return (
    <Svg width={width} height={height} viewBox="0 0 400 280" style={{ opacity: 0.2 }}>
      <G>
        {rows.map((y) => (
          <Line key={`r${y}`} x1="0" y1={y} x2="400" y2={y} stroke={color} strokeWidth="0.5" />
        ))}
        {cols.map((x) => (
          <Line key={`c${x}`} x1={x} y1="0" x2={x} y2="280" stroke={color} strokeWidth="0.5" />
        ))}
      </G>
    </Svg>
  );
}
