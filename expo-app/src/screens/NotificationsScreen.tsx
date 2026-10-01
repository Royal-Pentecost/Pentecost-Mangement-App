import React, { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { BRAND, RADIUS, TintName, useTheme } from "../theme";
import { AppNotification } from "../data";
import { useContent } from "../store";
import { BellIcon, BookIcon, CalendarIcon, ClockIcon, PinIcon, ShieldIcon, TrashIcon } from "../icons";
import { Btn, Card, SectionHeading, TintTile, Txt, shadow, tintFg } from "../ui";
import { FadeIn } from "../motion";

const KIND_STYLE: Record<
  AppNotification["kind"],
  { tint: TintName; Icon: React.ComponentType<{ size?: number; color?: string }> }
> = {
  attendance: { tint: "green", Icon: PinIcon },
  event: { tint: "amber", Icon: CalendarIcon },
  study: { tint: "violet", Icon: BookIcon },
  verse: { tint: "green", Icon: BookIcon },
  admin: { tint: "indigo", Icon: ShieldIcon },
};

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const { c, isDark } = useTheme();
  const style = KIND_STYLE[item.kind];

  return (
    <Btn onPress={onPress}>
      <Card style={{ padding: 12, flexDirection: "row", gap: 13 }}>
        <TintTile tint={style.tint} size={44}>
          <style.Icon size={19} color={tintFg(style.tint, isDark)} />
        </TintTile>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <Txt
              variant={item.unread ? "displayBold" : "displaySemi"}
              style={{ flex: 1, fontSize: 14.5, lineHeight: 19, color: c.foreground }}
            >
              {item.title}
            </Txt>
            {item.unread ? (
              <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: c.primary }} />
            ) : null}
          </View>

          <Txt style={{ fontSize: 12.5, lineHeight: 18, marginTop: 4, color: c.mutedForeground }}>
            {item.body}
          </Txt>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }}>
            <ClockIcon size={11} color={c.mutedForeground} />
            <Txt variant="bodyMedium" style={{ fontSize: 11.5, color: c.mutedForeground }}>
              {item.time}
            </Txt>
          </View>
        </View>
      </Card>
    </Btn>
  );
}

export default function NotificationsScreen({ bottomInset }: { bottomInset: number }) {
  const { c, isDark } = useTheme();
  // Notifications live in the shared store so anything an admin publishes
  // shows up here the moment it is saved.
  const {
    notifications: items,
    markNotificationRead: markRead,
    markAllNotificationsRead,
    clearAllNotifications,
  } = useContent();

  // Clearing cannot be undone, so it asks first. Alert.alert is a no-op on
  // react-native-web, so the confirmation is an in-app modal.
  const [confirmingClear, setConfirmingClear] = useState(false);

  const unread = items.filter((n) => n.unread);
  const earlier = items.filter((n) => !n.unread);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary */}
      <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 13 }}>
        <TintTile tint="blue" size={46}>
          <BellIcon size={20} color={tintFg("blue", isDark)} />
        </TintTile>
        <View style={{ flex: 1 }}>
          <Txt variant="displayBold" style={{ fontSize: 16, color: c.foreground }}>
            {unread.length > 0 ? `${unread.length} new notification${unread.length === 1 ? "" : "s"}` : "You're all caught up"}
          </Txt>
          <Txt variant="bodyMedium" style={{ fontSize: 12.5, marginTop: 2, color: c.mutedForeground }}>
            {unread.length > 0 ? "Tap a notification to mark it as read" : "No unread notifications"}
          </Txt>
        </View>
        <View style={{ gap: 6 }}>
          {unread.length > 0 ? (
            <Btn
              onPress={markAllNotificationsRead}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: c.muted }}
            >
              <Txt variant="bodySemi" style={{ fontSize: 11.5, textAlign: "center", color: c.primary }}>
                Mark all
              </Txt>
            </Btn>
          ) : null}

          {items.length > 0 ? (
            <Btn
              onPress={() => setConfirmingClear(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: RADIUS.sm,
                backgroundColor: isDark ? "#DC262622" : "#FEECEC",
              }}
            >
              <TrashIcon size={12} color={isDark ? "#FCA5A5" : BRAND.red} />
              <Txt variant="bodySemi" style={{ fontSize: 11.5, color: isDark ? "#FCA5A5" : BRAND.red }}>
                Clear all
              </Txt>
            </Btn>
          ) : null}
        </View>
      </Card>

      {/* New */}
      {unread.length > 0 ? (
        <>
          <SectionHeading label="New" />
          <View style={{ gap: 10 }}>
            {unread.map((n, i) => (
              <FadeIn key={n.id} index={i}>
                <NotificationRow item={n} onPress={() => markRead(n.id)} />
              </FadeIn>
            ))}
          </View>
        </>
      ) : null}

      {/* Earlier */}
      {earlier.length > 0 ? (
        <>
          <SectionHeading label="Earlier" />
          <View style={{ gap: 10 }}>
            {earlier.map((n, i) => (
              <FadeIn key={n.id} index={i} delay={120}>
                <NotificationRow item={n} onPress={() => markRead(n.id)} />
              </FadeIn>
            ))}
          </View>
        </>
      ) : null}

      {items.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 56 }}>
          <TintTile tint="blue" size={64} radius={32}>
            <BellIcon size={26} color={tintFg("blue", isDark)} />
          </TintTile>
          <Txt variant="displayBold" style={{ fontSize: 16, marginTop: 16, color: c.foreground }}>
            Nothing here yet
          </Txt>
          <Txt style={{ fontSize: 13, marginTop: 4, color: c.mutedForeground }}>
            Announcements from your assembly will appear here
          </Txt>
        </View>
      ) : null}

      {/* Clearing is irreversible, so it asks first. */}
      <Modal visible={confirmingClear} transparent animationType="fade" onRequestClose={() => setConfirmingClear(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(7,12,24,0.6)", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Pressable style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} onPress={() => setConfirmingClear(false)} />

          <View style={[{ width: "100%", maxWidth: 340, borderRadius: RADIUS.xl, padding: 22, backgroundColor: c.card }, shadow("lg")]}>
            <View
              style={{
                alignSelf: "center",
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#DC262622" : "#FEECEC",
              }}
            >
              <TrashIcon size={22} color={isDark ? "#FCA5A5" : BRAND.red} />
            </View>

            <Txt variant="displayExtraBold" style={{ fontSize: 19, textAlign: "center", marginTop: 14, color: c.foreground }}>
              Clear all notifications?
            </Txt>
            <Txt style={{ fontSize: 13.5, lineHeight: 20, textAlign: "center", marginTop: 8, color: c.mutedForeground }}>
              This removes all {items.length} message{items.length === 1 ? "" : "s"} from your list. It cannot be undone.
            </Txt>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <Btn
                onPress={() => setConfirmingClear(false)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: c.muted }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: c.foreground }}>
                  Cancel
                </Txt>
              </Btn>
              <Btn
                onPress={() => {
                  setConfirmingClear(false);
                  clearAllNotifications();
                }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: "center", backgroundColor: BRAND.red }}
              >
                <Txt variant="displayBold" style={{ fontSize: 14, color: "#fff" }}>
                  Clear All
                </Txt>
              </Btn>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
