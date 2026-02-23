"use client";
import React from "react";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Toast({ children }: { children: React.ReactNode }) {
  return <div className="toast">{children}</div>;
}

export function ToastTitle({ children }: { children: React.ReactNode }) {
  return <div className="toast-title">{children}</div>;
}

export function ToastDescription({ children }: { children: React.ReactNode }) {
  return <div className="toast-desc">{children}</div>;
}

export function ToastClose() {
  return <button className="toast-close">×</button>;
}

export function ToastViewport() {
  return <div className="toast-viewport" />;
}