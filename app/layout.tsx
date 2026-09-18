import type { Metadata } from "next";
import { MotionProvider } from "@/components/ui";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/space-grotesk/500.css";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Folio — Make room for what matters",
    template: "%s · Folio",
  },
  description:
    "Turn your statements into a clear picture. Categorize transactions, build an Excel budget, and create a practical savings plan.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
