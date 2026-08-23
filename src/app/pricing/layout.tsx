import '../welcome/styles/globals.css';
import React from 'react';
import { AnnouncementBar } from '../welcome/components/AnnouncementBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      {children}
    </>
  );
}
