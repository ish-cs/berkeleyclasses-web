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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('bc-theme');var t=s==='dark'||s==='light'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <MeshBackground>{children}</MeshBackground>
      </body>
    </html>
  );
}
