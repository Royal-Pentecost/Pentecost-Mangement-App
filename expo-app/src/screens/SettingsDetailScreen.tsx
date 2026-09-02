import React from "react";
import { ScrollView, View } from "react-native";

import { RADIUS, useTheme } from "../theme";
import { SettingsTopic, settingsPages } from "../data";
import { Card, SectionHeading, Txt } from "../ui";
import { ClockIcon, GmailIcon, PhoneIcon } from "../icons";

/** The contact rows carry a kind marker; map it to a line icon. */
function ContactIcon({ kind, color }: { kind: string; color: string }) {
  if (kind === "phone") return <PhoneIcon size={18} color={color} />;
  if (kind === "mail") return <GmailIcon size={18} />;
  return <ClockIcon size={18} color={color} />;
}

export default function SettingsDetailScreen({
  topic,
  bottomInset,
}: {
  topic: SettingsTopic;
  bottomInset: number;
}) {
  const { c } = useTheme();
  const page = settingsPages[topic];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: bottomInset }}
      showsVerticalScrollIndicator={false}
    >
      <Txt style={{ fontSize: 14, lineHeight: 21, color: c.mutedForeground }}>{page.intro}</Txt>

      <View style={{ gap: 10, marginTop: 18 }}>
        {page.sections.map((section, i) => (
          <Card key={i} style={{ padding: 14 }}>
            <Txt variant="displayBold" style={{ fontSize: 14.5, color: c.foreground }}>
              {section.heading}
            </Txt>
            <Txt style={{ fontSize: 13.5, lineHeight: 20, marginTop: 6, color: c.mutedForeground }}>
              {section.body}
            </Txt>
          </Card>
        ))}
      </View>

      {page.contact ? (
        <>
          <SectionHeading label="Get in touch" />
          <Card style={{ overflow: "hidden" }}>
            {page.contact.map((item, i, arr) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                  borderBottomColor: c.border,
                }}
              >
                <ContactIcon kind={item.emoji} color={c.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyMedium" style={{ fontSize: 11.5, color: c.mutedForeground }}>
                    {item.label}
                  </Txt>
                  <Txt variant="displayBold" style={{ fontSize: 14, marginTop: 2, color: c.foreground }}>
                    {item.value}
                  </Txt>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <View style={{ marginTop: 20, padding: 12, borderRadius: RADIUS.md, backgroundColor: c.muted }}>
        <Txt variant="bodyMedium" style={{ fontSize: 12, lineHeight: 18, color: c.mutedForeground }}>
          Need something else? Speak to your presiding elder or the assembly office.
        </Txt>
      </View>
    </ScrollView>
  );
}
