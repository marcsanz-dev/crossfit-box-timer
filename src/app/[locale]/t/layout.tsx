import type { Viewport } from "next";

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
      {children}
    </div>
  );
}
