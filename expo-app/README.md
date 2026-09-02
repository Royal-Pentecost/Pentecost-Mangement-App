# Church Attendance — Expo (iOS + Android)

React Native / Expo SDK 57 port of the Figma-generated Vite web UI that lives in `../src/App.tsx`.
Runs on a physical iPhone or Android phone through **Expo Go**, and builds to native iOS/Android apps.

## Run it on your phone

```bash
cd expo-app && npm install && npx expo start
```

Then:

- **Android** — open **Expo Go** and scan the QR code in the terminal.
- **iOS** — open the **Camera** app, scan the QR code, tap the banner (Expo Go opens it).

Your phone and computer must be on the same Wi-Fi. If the QR does not connect, use a tunnel:

```bash
npx expo start --tunnel
```

Other targets:

```bash
npx expo start --web
```

## Demo credentials

The login is simulated — no backend calls are made.

| Role | Phone number | OTP |
| --- | --- | --- |
| Standard member | `20 123 4567` | `1234` |
| Assembly admin | `24 001 0002` or `24 001 0003` | `1234` |
| Super admin | `24 101 0001` | `1234` |

There is no second PIN challenge — signing in with an admin phone number *is* the authorisation, so admins
land straight in the app with the session panel and Master Data Hub already visible. After the code is
verified, a short welcome screen greets the signed-in person by name and profile photo before the app opens.

What each role sees after signing in:

- **Member** — skips the assembly picker entirely and lands on their own dashboard, with their assembly
  taken from their profile. The Home tab *is* that dashboard: attendance score and mark-attendance button,
  weekly schedule, assembly history, presiding elders, upcoming events, and the week's Bible study.
- **Assembly admin** — the assembly Home tab, plus the admin session panel and Master Data Hub.
- **Super admin** — everything above, plus the Super Admin Control Center inside the Master Data Hub.

## Project layout

```
App.tsx                          Root: font loading, theme provider, auth phase, navigation state
src/theme.tsx                    Light/dark palettes, radius scale, soft tints, font names, brand colours
src/data.ts                      All types + seed data (elders, members, admins, assemblies, audit log, …)
src/icons.tsx                    react-native-svg versions of the inline SVG icons
src/ui.tsx                       Shared primitives: Txt, Btn, Card, TintTile, RowCard, SectionHeading, …
src/components/HeaderBlock.tsx   The navy rounded header slab shared by every screen
src/screens/                     One file per screen
```

Screens: `LoginScreen` (phone + OTP), `AssemblyPicker`, `DashboardShell` (header, tab bar, routing),
`HomeTab`, `AttendanceTab`, `LeaderboardTab`, `BibleTab`, `EldersDirectory`, `ElderProfile`,
`MembersDirectory`, `MemberProfile`, `MyDashboard`, `AdminHub`, `SuperAdminHub`.

## How the web build maps onto React Native

| Web | React Native |
| --- | --- |
| Tailwind classes + inline `style` | `StyleSheet`-shaped style objects |
| CSS variables (`var(--card)`) | `useTheme().c.card` from `src/theme.tsx` |
| `div` / `p` / `span` / `button` / `img` / `input` | `View` / `Txt` / `Btn` / `Image` / `TextInput` |
| Inline `<svg>` | `react-native-svg` components in `src/icons.tsx` |
| `linear-gradient(...)` | `expo-linear-gradient` |
| `overflow-y: auto` | `ScrollView` |
| `animate-pulse` / `animate-ping` | `Pulse` / `Ping` (`Animated` loops) |
| `backdrop-filter: blur(...)` | Solid near-opaque header background |
| `position: fixed` bottom bar | Tab bar as a sibling of the content view |
| `pt-12` status-bar padding | `useSafeAreaInsets()` |
| Google Fonts `@import` | `@expo-google-fonts/outfit` + `@expo-google-fonts/inter` |

## Native builds

Expo Go is enough for development. For store builds or custom native code:

```bash
npx eas build --platform android
npx eas build --platform ios
```

`app.json` already sets the bundle identifier / package name (`gh.cop.churchattendance`), the adaptive
icon, and a splash screen using the Pentecost logo.
