# church-attendance (Expo)

React Native app on **Expo SDK 54** (React 19.1, React Native 0.81), targeting iOS and Android via Expo Go.
Ported from the Vite + Tailwind web UI in `../src/App.tsx`.

Expo has changed a lot between versions — read the exact versioned docs at
https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Structure

- `App.tsx` — root: font loading, `ThemeProvider`, auth phase, navigation state
- `src/theme.tsx` — light/dark palettes, `RADIUS`, `TINTS`, font family names, `useTheme()`
- `src/data.ts` — all types and seed data; also exports the shared `pentecostLogo` asset
- `src/icons.tsx` — `react-native-svg` icons
- `src/ui.tsx` — shared primitives: `Txt`, `Btn`, `Card`, `TintTile`, `RowCard`, `SectionHeading`, `Avatar`, `ProgressBar`, `Pulse`, `Ping`, `shadow()`
- `src/components/HeaderBlock.tsx` — the navy rounded header slab, plus `HeaderButton` / `HeaderTitle` / `HeaderChip`
- `src/components/BackgroundSlider.tsx` — cross-fading full-bleed photo backdrop used by the login and OTP screens
- `src/screens/` — one file per screen; `DashboardShell.tsx` owns the header, tab bar, and sub-screen routing

## Roles

Privileges come straight from the verified phone number (`PHONE_ROLES` in `src/data.ts`) — there is no
second PIN challenge, and no admin affordance is shown to users who lack the role. Gate by role at the
routing level rather than hiding buttons inside a shared screen.

- **Member** — never sees `AssemblyPicker`. `App.tsx` resolves their assembly from `ME.assemblyId` on OTP
  success and jumps straight to the dashboard; their Home tab renders `MyDashboard`, and because that is
  the root of their session the header shows the logo instead of a back button.
- **Admin / super admin** — pick an assembly first; their Home tab renders `HomeTab`.

Auth phases run `login → otp → welcome → app`. `resolveSessionUser(phone)` matches the verified number
against `adminUsers` (falling back to `ME`) so `WelcomeScreen` greets the right person — which means an
admin's `phone` in `adminUsers` **must** stay in sync with their key in `PHONE_ROLES`.

## Conventions

- **No Tailwind.** Style with plain style objects. Colours come from `useTheme().c`, never hardcoded
  palette values; fixed brand colours live in `BRAND` in `src/theme.tsx`.
- **Cards carry no border in light mode** — `Card` uses a soft shadow there and a hairline border only in
  dark mode. Don't hand-roll `backgroundColor: c.card` surfaces; use `Card`, `RowCard`, or `TintTile`.
- Screen content is padded `SCREEN_PAD` (16) horizontally, and section labels come from `SectionHeading`.
- **One dial controls how large the app reads**: `UI_SCALE` in `src/theme.tsx`, applied through `ms()`.
  `Txt` scales every `fontSize`/`lineHeight` it is given, and `TintTile`, `Avatar`, and every icon scale
  their dimensions the same way. So write sizes at their design values in screens and let the scale do the
  shrinking — never pre-multiply by hand, or that screen will drift when the dial moves.
- **Text goes through `Txt`**, not `Text` — it applies the right Outfit/Inter family per `variant`.
  Custom fonts do not respond to `fontWeight` in RN, so pick the variant, not a weight.
- **Pressables go through `Btn`**, which reproduces the web build's `active:scale-95` feel.
- Gradients use `expo-linear-gradient`; scrolling regions use `ScrollView`; top/bottom padding uses
  `useSafeAreaInsets()` rather than fixed values.
- New font weights must be added to both `src/theme.tsx` and the `useFonts` call in `App.tsx`,
  imported from the package subpath (`@expo-google-fonts/outfit/700Bold`) so only used weights bundle.

## Member directory access

Three rules live in `src/data.ts` — use them rather than re-deriving the checks:

- `canViewMembers(role)` — admins and super admins always; an ordinary member only when
  `ME.dayBornLeader` is true.
- `visibleMembers(role)` — the whole assembly for admins; a day-born leader sees only members whose
  `dayBorn` matches their own.
- **The app keeps no financial records.** Tithe, welfare, pledges, receipts and the whole Financial
  Records category were removed deliberately — a member profile carries attendance, roles, and milestones
  and nothing about giving. Don't reintroduce a money field without being asked for one.
- `visibleRecordSections(role)` — the Admin Hub's record categories. A section marked `superAdminOnly`
  (currently the Leadership & District Roster, which changes who holds office and where district lines
  fall) is filtered out for everyone below super admin. Add the flag to the section rather than
  branching in `AdminHub`.

## Church leaders

`EldersDirectory` is the **Church Leaders** directory (the header title in `DashboardShell`), and it
filters by office, not by assembly. Every `Elder` carries an `office: LeaderOffice`
(`"Elder" | "Deacon" | "Deaconess"`) alongside its display `title`, so filtering compares a field rather
than parsing the title string. The pills come from `leaderFilters` in `src/data.ts` — add an office there
and tag the people with it rather than branching in the screen.

## Published content

Anything the congregation sees on a schedule — the weekly services, upcoming events, and the Bible
study guide — lives in `src/store.tsx` (`ContentProvider` / `useContent()`), **not** in module
constants. `data.ts` only seeds it. `MyDashboard` and `NotificationsScreen` read from the store, and
`PublishScreen` writes to it, so an admin's change is on every member's dashboard on the next render.
Adding a service, event, or study also pushes a notification, so members are told without being
asked to go looking. Swap the seeds for a fetch when the backend lands and the screens do not change.

**Published content expires on its own.** The server deletes a daily verse when its day ends, an event after
its date, and a weekly-schedule entry once its day has come round in the week it was published
(`content/expiry.py` on the backend). The app shows only a verse whose `published_on` is today, and only
events dated today or later. So a phone that hasn't refreshed since midnight still never shows yesterday's
content.

Every published item can carry a `cover` — a photograph the admin attaches in `CoverPicker`. It is
uploaded to the server after the item is created and shown with that item: a service's schedule tile, an
event's card, the top of a study guide. Covers do **not** go into the dashboard slider — that is the five
ministries in `homeSlides`, fixed, and publishing must never change it. Bundled art is a `require()`
number and a picked photo is a `{ uri }`, so resolve the two through `imageSource(cover, fallback)`
rather than branching inline.

Two admin tools hang off `AdminHub`, both reached through `SubScreen` (`manualAttendance`, `publish`):

- **`ManualAttendanceScreen`** — signs attendance on a member's behalf for members with no phone or
  no signal. Every record keeps the reason and the signing admin, so the override is auditable.
- **`PublishScreen`** — the three publishing forms above.

Every control inside a **Record Categories** card does real work — no placeholder rows and no dead
buttons. The three inline forms (members, geofence, milestones) write into the store
(`directory`, `geofence`, `milestoneLog`) and report through the hub's status banner. The
action buttons above each form either perform the operation, focus the field that does it, or open the
tool that owns it (`onOpenPublish`, `onOpenManualAttendance`, `onOpenSuperAdmin`). Records are stamped
with `signedInAs`, so keep passing the session user down.

Form fields, chips, and the save button come from `src/components/AdminForm.tsx`; don't hand-roll
`TextInput`s in admin screens.

## Bible study

The church teaches from a pamphlet: one study per week, taught on Sunday, with the assembly split into
day-born classes. Three things follow from that, all in `src/data.ts`:

- **Bilingual by construction.** `BibleStudy` holds no title or text of its own — it carries an `en` and a
  `tw` `StudyText` block, each with `title`, `chapter`, `aims` (what the class should learn), `questions`,
  `memoryVerse`, and optional `notes`. Read one with `studyText(study, lang)`; never reach into `.en`
  directly outside the PDF, which prints both columns. The reader's language comes from
  `useContent().language`, switched from the dashboard card, the reader, or Settings.
- **The app works out the week.** Each study has a `date` — the Sunday it is taught. `studyForWeek(studies)`
  returns the study whose Sunday falls in the week containing today (weeks run Sunday→Saturday), falling
  back to the most recent past study so the card is never empty. `isSunday()` flips the card's wording to
  "Today's Bible Study". `studyReleased(study)` is the availability test: a study is live once its Sunday
  arrives, or earlier if an admin released it — use it rather than reading `available` directly.
- **Day-born classes.** `dayBornClasses` maps each `DayBorn` to its Akan name, venue, leader, and time;
  `classForDayBorn(me.dayBorn)` gives a member theirs, which is what `BibleStudyClassCard` names so they
  know which room to walk to.

Seed dates are computed from the current week (`seedSunday`) so the demo always lands on a live week.
A real term gets its dates typed in when an admin publishes; the Twi column falls back to the English one
when left blank, so a half-filled form still publishes something readable.

## Navigation

`App.tsx` holds a `NavEntry[]` history — `{ tab, sub }` per page — and the header's back arrow pops it, so
back returns to where the user actually came from, tab switches included. Navigate with `go({ sub })` or
`go({ tab })`; never set the tab and sub-screen separately. `resetHistory()` starts a fresh trail (sign-in,
assembly choice, logout). `canGoBack` drives whether the header shows the arrow or the logo — when the trail
is empty a member is at their root and an admin falls back to the assembly picker.

## Files in and out

All import and export goes through `src/files.ts`, never through a screen's own filesystem calls:
`exportTextFile`, `exportPdf`, `importTextFile`, plus `toCsv` / `fromCsv` / `stampedName`. It branches on
platform once — share sheet on device, Blob download in the web preview — so screens just `await` it and
show the returned `message`. `Alert.alert` is a no-op on react-native-web, so report results in an in-app
banner, not an alert.

## Icons

No emoji in the UI. Every pictogram is an SVG in `src/pictograms.tsx`, re-exported through
`src/icons.tsx` so screens import from one place. Add new ones there rather than reaching for a glyph.

**Brand marks** — `GmailIcon` and `WhatsappIcon` sit alongside the line icons but take only a `size`,
never a `color`: recolouring a logo misrepresents it. Use them wherever the app offers to email or
message someone (`ElderProfile`, the dashboard's presiding-elder card, the Settings contact rows) so a
member recognises the destination before tapping. Every one of those buttons opens the real thing through
`Linking` — `mailto:`, `tel:`, `sms:`, or `https://wa.me/<digits>` — so none of them is decoration.

## Photographs

`assets/slider/*` backs the login/OTP backdrop via `sliderPhotos`; `assets/ministry/*` backs the dashboard
carousel via `homeSlides` — Men's, Women's, Youth, Children's and Evangelism Ministry, in that order. Those five are crops
cut to the carousel card's ~1.75:1 so `cover` frames the people; a replacement keeps the file name and that
shape. All five are the church's own photographs. Youth is the Royal Assembly Youth Ministry frame shot, and
the church asked for it to be kept. Men's, Women's, Children's and Evangelism are from the assembly's youth-cloth day,
cropped to show faces and upper bodies, compressed to about 110–155 KB. Also
`assets/service/*` for the weekly-service tiles, `assets/assembly/*` for the picker cards, and
`assets/welcome-bg.jpg` for the post-login splash — that one is drawn `cover` behind a full-screen
scrim, so it **must be portrait**: a landscape photo loses ~70% of its width to the crop on any phone.
Target 1290 × 2796 (9:19.5), and keep faces inside the middle 80% — the screen zooms 8% on entry.
The backdrop must be sized in **real pixels** from `useWindowDimensions()` — `width`/`height`, not
percentages and not insets alone. Two ways of writing it fail only on a device, never in the web preview:
`height: "100%"` resolves against the parent's *content box*, so inside a view with
`paddingBottom: insets.bottom` it renders short and leaves a dark band along the bottom; and stretching by
`left/right/top/bottom: 0` with no dimensions lets Android fall back to the asset's intrinsic size, which
is wider than the screen and shows as a magnified crop. Keep the scrim in the same unpadded container with
the padded content as a sibling below, and don't animate a scale on the photograph — the screen closes
after 2.4s, so any longer zoom never settles and the picture is only ever seen enlarged. They are bundled, not fetched. **Keep them compressed** — re-encode any replacement to roughly 1200px on the long
edge at JPEG q74 (~150–240 KB). Dropping a 4–6 MB camera original straight in inflates the bundle by an
order of magnitude.

## Assemblies

`Assembly.live` decides whether a card in `AssemblyPicker` is selectable. Only Royal Assembly is live;
the rest render frosted (`expo-blur`) with a COMING SOON pill and are `disabled`. Flip `live` in
`src/data.ts` as each assembly is onboarded.

## Startup

The native splash's `imageWidth` (176) must equal `SEAL` in `StartupScreen.tsx`, so the seal is picked up at
the same size and place. It must also stay under 192. Android 12+ crops the splash icon to a 192dp circle, and
at 200 the seal's outer rings were visibly sliced off. The startup column is centred on the whole window, with
no inset padding, as the native splash is.

The in-app startup runs roughly four seconds with pulsing loading dots, then fades out; a 7.5s failsafe
guarantees it never strands the user. `app.json`'s splash `backgroundColor` must match `STARTUP_BG` / `STARTUP_BG_DARK` in `StartupScreen.tsx`,
or the native splash visibly flashes when it hands over. The theme seeds from `useColorScheme()`, so both
follow the phone. Keep every animation in that screen on the native driver — mixing drivers inside one
`Animated.parallel` stalled the sequence and stranded the app on the splash.

## Location and the attendance geofence

Attendance is signed against the phone's real GPS. Everything that decides whether a member may sign
lives in `src/location.tsx` (`LocationProvider` / `useLocation()`), so no screen re-derives it:

- **One reading on entry, a live stream only where it is shown.** The provider takes a fix as soon as the
  app opens, so the attendance screen already knows where the member stands. `startWatching()` is
  reference-counted — the map subscribes while it is on screen and the OS subscription stops when the last
  caller lets go, because a continuous GPS stream is the most expensive thing the app does to a battery.
- **`certainty`, not just `inside`.** `certainty` grades each fix `confident` / `borderline` / `poor`, and a
  `poor` fix never signs attendance. Gate on `inside && certainty !== "poor"`, never on `inside` alone. `poor`
  means coarser than `max(150m, 1.5 × radius)`. A borderline fix still signs, because the server measures the
  same point.
- **A precise reading outranks a vaguer one for 30s** (`KEEP_PRECISE_FOR`). Indoors a phone alternates
  between satellite fixes and Wi-Fi/cell ones every few seconds. Taking each as it came flipped the Mark
  button off under the member's finger, and the tap did nothing.
- **`approximate`** is true when the member granted only approximate location (Android 12+ "Approximate", iOS
  Precise off). Those readings are kilometres wide. `blockedReason` tells them to choose Precise, and
  `refresh()` asks again, which is how Android offers the upgrade. `refresh()` also offers Google Location
  Accuracy on Android.
- **`blockedReason`** is the single place that phrases why the button is dark. Read it; don't write a
  second explanation in a screen.

**Every session is measured from the church's fixed location, never from the admin.** The church's
centre and radius are set once in the Admin Hub (Geofence Config) and stored on the assembly. Opening a
session sends no coordinates. The server copies the assembly's fence onto the session and ignores any
centre in the request, and it refuses to open a session for an assembly with no fence. The app then calls
`openSessionAt()` with the centre the server returned, so `sessionOrigin ?? geofence` in `LocationBridge`
always resolves to the church. A member may sign only while their own fix is within that radius. The server
checks the distance again when the mark arrives, so a phone cannot sign from outside.

### The map

`AttendanceMap` picks the renderer. Both renderers plot the boundary and the member from the same
coordinates, so the distance, and which side of the line the member is on, stay truthful either way.

1. **`GoogleAttendanceMap` is the device renderer** (`react-native-maps`, `PROVIDER_GOOGLE`). The blue dot is
   Google's own (`showsUserLocation`): it follows the phone in real time, turns with it, and draws its own
   accuracy circle. The church boundary is a `Circle`, which `react-native-maps` sizes in metres on the
   ground, and it turns green while the member is inside. The camera frames the church and the member once,
   then leaves the map to the member after they pan (`onPanDrag`). A pill toggles Map ↔ Satellite.
2. **`StylisedMap`** is the map we draw ourselves. It's used for the web preview, for a build made without a
   key, and when there is no boundary to centre on.

**The Google key never goes in git.** This repository is public. `app.config.js` reads
`GOOGLE_MAPS_API_KEY` from the environment, which is an EAS secret for cloud builds. It hands the key to the
`react-native-maps` plugin and sets `extra.googleMapsConfigured`. `AttendanceMap` shows Google only when
that flag is true, or in Expo Go, which carries Google's own key. A build without a key would otherwise show
grey "for development purposes only" tiles. Restrict the key in Google Cloud to the Maps SDK for Android, the
package `gh.cop.churchattendance` and the signing certificate's SHA-1.

Tiles need a connection, and a church hall may not have one. The geofence check is GPS-only and keeps working
without them, so losing the map must never read as the check having failed.

MapLibre was removed when Google landed, along with its plugin and the `MapLibreMap` component. Don't leave a
second renderer lying in the code.

## Motion

Every animation comes from `src/motion.tsx`, so the app moves with one vocabulary rather than a different
easing per screen. Compose these; don't hand-roll `Animated` in a screen.

- `FadeIn` — the list primitive. Give it `index={i}` inside a `.map()` and rows cascade (55ms apart);
  `delay` offsets a whole group so a second list starts after the first.
- `PopIn` — for things that land rather than arrive: grid tiles, stat cards, a confirmation.
- `SwapFade` — cross-fades whenever `trigger` changes. Wraps the shell's content area and the profile
  tab bodies, so changing destination dissolves instead of snapping.
- `Collapsible` — animates its measured height; used by the dashboard's history accordion.
- `Breathe` / `Sheen` / `Burst` — draw the eye to one control. The attendance CTA breathes and carries a
  sheen only while it is actually pressable, and `Burst` fires out of the tick once attendance is marked.
- `useCountUp` — returns a climbing number so the caller keeps its own typography.

`DUR`, `EASE_OUT`, and `EASE_BACK` are the shared timings — reach for those before inventing a curve.

**Never write `setValue()` to a native-driven value mid-flight.** `SwapFade` did, to reset itself to
transparent before fading back in. The write is not honoured reliably: when it landed but the fade did not,
the whole content area was stranded at opacity 0 and the app looked like a blank white page. Reset through
a zero-duration `Animated.timing` inside the same sequence, and have the teardown land the view back at
opaque, so an interrupted transition can never leave content invisible.

**Two rules that only bite on a device.** Transform and opacity run on the native driver; `width` and
`height` cannot, so `ProgressBar` and the leaderboard's `GrowBar` pass `useNativeDriver: false`, and
mixing the two inside one `Animated.parallel` stalls the whole sequence. And anything driven by
`requestAnimationFrame` stops when the app is backgrounded — `useCountUp` therefore also sets a timer that
lands the final figure, so a number can never be stranded at zero.

## Building the APK

Build from a **short path** — `C:\cca`, not the Downloads folder — or ninja hits Windows' 260-character
limit and the native build dies. Gradle needs its own JDK 17, not whatever `java -version` reports.

```bash
cd /c/cca/android
JAVA_HOME=".../eclipse_adoptium-17-amd64-windows.2" ./gradlew.bat assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a --console=plain
```

**Always pass `reactNativeArchitectures`.** A universal APK carries native libraries for four ABIs, and
`x86`/`x86_64` are emulator-only. Measured on the MapLibre build: **113 MB universal, 56.5 MB with the two
ARM ABIs every real phone actually uses** — more than half the download, for a congregation paying for its
own mobile data.

Two build failures that look like code problems and are not:

- **`Gradle build daemon disappeared unexpectedly`** — the command was killed (a tool timeout moving it to
  the background will do it). Re-run it as a background job from the start.
- **`Could not GET .../maven2/...`** while `curl` reaches the same URL — a stale daemon is holding a failed
  DNS result. `./gradlew.bat --stop`, then build again. Prefer plain `expo prebuild` over `--clean`: the
  clean variant discards a warm dependency cache and turns a network blip into a 20-minute failure.

## Checks

```bash
npx tsc --noEmit
npx expo export --platform android --output-dir /tmp/export-check
```
