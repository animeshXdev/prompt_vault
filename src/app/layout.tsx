import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const appUrl = process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "PromptVault — Private AI Prompt Management System",
    template: "%s | PromptVault",
  },
  description: "Private, single-user AI prompt management system. Create, organize, version, test, compose, and reuse AI prompts in a secure developer workspace.",
  applicationName: "PromptVault",
  keywords: [
    "AI Prompts",
    "Prompt Engineering",
    "Prompt Management",
    "LLM Workspace",
    "Developer Tools",
    "CodeMirror 6",
    "PromptVault",
  ],
  authors: [{ name: "PromptVault" }],
  creator: "PromptVault",
  openGraph: {
    title: "PromptVault — Private AI Prompt Management System",
    description: "Private, single-user AI prompt management system. Create, organize, version, test, compose, and reuse AI prompts in a secure developer workspace.",
    url: appUrl,
    siteName: "PromptVault",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PromptVault — Private AI Prompt Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptVault — Private AI Prompt Management System",
    description: "Private, single-user AI prompt management system. Create, organize, version, test, compose, and reuse AI prompts in a secure developer workspace.",
    images: ["/opengraph-image"],
    creator: "@promptvault",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
