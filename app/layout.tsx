import type { Metadata } from "next";
import "./globals.css";
import { MeshBackground } from "@/components/glass";

export const metadata: Metadata = {
  title: "berkeleyclasses.com — UC Berkeley class schedule, the way it should be",
  description:
    "Search every Berkeley section, build conflict-free schedules, compare classes side-by-side, and get emailed the moment a seat opens. Free, fast, accurate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <MeshBackground>{children}</MeshBackground>
      </body>
    </html>
  );
}
