"use client";

import { useEffect } from "react";
import { isInAppShell } from "@/lib/downloads";

export function AppShellMark() {
  useEffect(() => {
    if (isInAppShell()) {
      document.documentElement.classList.add("kilic-native-app");
    }
  }, []);
  return null;
}
