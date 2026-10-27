"use client";
import { useEffect } from "react";
import { offlineManager } from "@/lib/offline/offline-manager";
import { captureInstallPrompt } from "@/lib/pwa-install";

export function PwaRegister() {
  useEffect(() => {
    offlineManager.init();
    captureInstallPrompt();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => {
          setInterval(() => {
            reg.update().catch(() => {});
          }, 60 * 60 * 1000);
        })
        .catch(() => {});
    }
  }, []);
  return null;
}
