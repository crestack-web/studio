"use client";
import React from "react";

export interface ToastProps {
  children?: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}

export type ToastActionElement = React.ReactElement;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Toast({ children, variant = "default", className = "" }: ToastProps) {
  return <div className={`toast toast-${variant} ${className}`}>{children}</div>;
}

export function ToastTitle({ children }: { children: React.ReactNode }) {
  return <div className="toast-title">{children}</div>;
}

export function ToastDescription({ children }: { children: React.ReactNode }) {
  return <div className="toast-desc">{children}</div>;
}

export function ToastClose({ onClick }: { onClick?: () => void }) {
  return <button className="toast-close" onClick={onClick}>×</button>;
}

export function ToastViewport() {
  return <div className="toast-viewport" />;
}