"use client";
import { useEffect } from "react";
import { offlineManager } from "@/lib/offline/offline-manager";

export function PwaRegister() {
  useEffect(() => {
    offlineManager.init();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => {
          // Check for updates periodically
          setInterval(() => {
            reg.update().catch(() => {});
          }, 60 * 60 * 1000);
        })
        .catch(() => {});
    }
  }, []);
  return null;
}
