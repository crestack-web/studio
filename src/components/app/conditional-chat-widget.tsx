"use client";
import React from "react";
import { ChatWidget } from "./chat-widget";

export function ConditionalChatWidget() {
  // Only render on client
  if (typeof window === "undefined") return null;
  return <ChatWidget />;
}