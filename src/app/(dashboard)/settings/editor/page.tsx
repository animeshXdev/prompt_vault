import React from "react";
import prisma from "@/lib/db";
import { EditorSettingsForm } from "./editor-settings-form";

export default async function EditorSettingsPage() {
  const settings = await prisma.applicationSettings.findUnique({
    where: { id: "default" },
  });

  return (
    <EditorSettingsForm
      settings={{
        editorFontSize: settings?.editorFontSize || 14,
        autosaveInterval: settings?.autosaveInterval || 1000,
        defaultEditorMode: settings?.defaultEditorMode || "split",
        markdownPreviewTheme: settings?.markdownPreviewTheme || "github",
      }}
    />
  );
}
