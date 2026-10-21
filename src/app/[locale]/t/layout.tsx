import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  // Draw under the notch and home indicator; content uses safe-area insets.
  viewportFit: "cover",
};

/** Phone area: always dark, edge to edge, no bounce scrolling. */
export default function PhoneLayout({ children }: LayoutProps<"/[locale]/t">) {
  return (
    <div className="min-h-dvh overscroll-none bg-phone-bg pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] text-phone-fg">
      {children}
    </div>
  );
}
