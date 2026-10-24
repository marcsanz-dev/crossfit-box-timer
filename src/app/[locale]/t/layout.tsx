import type { Metadata, Viewport } from "next";
import { OfflineSupport } from "@/components/timer/offline-support";

// iPhone: the Home Screen app draws under the status bar; PhoneFrame keeps
// content clear of it with safe-area padding.
export const metadata: Metadata = {
  appleWebApp: { title: "Box Timer", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  // Draw under the notch and home indicator; screens apply safe-area insets themselves.
  viewportFit: "cover",
};

/** Phone area: always dark, edge to edge, no bounce scrolling. */
export default function PhoneLayout({ children }: LayoutProps<"/[locale]/t">) {
  return (
    <div className="min-h-dvh overscroll-none bg-phone-bg text-phone-fg">
      <OfflineSupport />
      {children}
    </div>
  );
}
