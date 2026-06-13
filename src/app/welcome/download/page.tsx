"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LangProvider } from '../../owner/dashboard/LangContext';
import styles from './DownloadPage.module.css';

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  downloadUrl: string;
  version: string;
}

export default function DownloadPage() {
  const [detectedPlatform, setDetectedPlatform] = useState<string>('web');

  // Device detection
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) {
      setDetectedPlatform('windows');
    } else if (userAgent.includes('mac')) {
      setDetectedPlatform('macos');
    } else if (userAgent.includes('android')) {
      setDetectedPlatform('android');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setDetectedPlatform('ios');
    } else {
      setDetectedPlatform('web');
    }
  }, []);

  const platforms: Platform[] = [
    {
      id: 'windows',
      name: 'Windows',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M0 3.449L9.75 2.1v9.451H0V3.449zm10.949-1.603L24 0v11.4h-13.051V1.846zm0 12.654H24V24l-13.051-1.846V14.5zM0 13.449h9.75V21.9L0 20.551V13.449z"/>
        </svg>
      ),
      downloadUrl: '#',
      version: '2.1.0',
    },
    {
      id: 'macos',
      name: 'macOS',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      downloadUrl: '#',
      version: '2.1.0',
    },
    {
      id: 'android',
      name: 'Android',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M17.523 15.3414C17.523 16.7269 16.4082 17.8414 15.023 17.8414C13.6378 17.8414 12.523 16.7269 12.523 15.3414C12.523 13.9562 13.6378 12.8414 15.023 12.8414C16.4082 12.8414 17.523 13.9562 17.523 15.3414ZM6.523 15.3414C6.523 16.7269 5.40825 17.8414 4.023 17.8414C2.63775 17.8414 1.523 16.7269 1.523 15.3414C1.523 13.9562 2.63775 12.8414 4.023 12.8414C5.40825 12.8414 6.523 13.9562 6.523 15.3414ZM19.523 9.3414C19.523 8.7914 19.073 8.3414 18.523 8.3414H17.223L17.223 6.3414C17.223 3.5814 14.983 1.3414 12.223 1.3414C9.463 1.3414 7.223 3.5814 7.223 6.3414V8.3414H5.923C5.373 8.3414 4.923 8.7914 4.923 9.3414V17.3414C4.923 18.9914 6.273 20.3414 7.923 20.3414H16.523C18.173 20.3414 19.523 18.9914 19.523 17.3414V9.3414ZM9.223 6.3414C9.223 4.6914 10.573 3.3414 12.223 3.3414C13.873 3.3414 15.223 4.6914 15.223 6.3414V8.3414H9.223V6.3414Z"/>
        </svg>
      ),
      downloadUrl: '#',
      version: '2.1.0',
    },
    {
      id: 'ios',
      name: 'iPhone/iPad',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M16 1H8C6.34 1 5 2.34 5 4V20C5 21.66 6.34 23 8 23H16C17.66 23 19 21.66 19 20V4C19 2.34 17.66 1 16 1ZM12 22C10.9 22 10 21.1 10 20C10 18.9 10.9 18 12 18C13.1 18 14 18.9 14 20C14 21.1 13.1 22 12 22ZM16 17H8V4H16V17Z"/>
        </svg>
      ),
      downloadUrl: '#',
      version: '2.1.0',
    },
    {
      id: 'web',
      name: 'Web App',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 11.38 4.08 10.79 4.21 10.21L9 15V16C9 17.1 9.9 18 11 18V19.93ZM17.9 17.39C17.64 16.58 16.9 16 16 16H15V13C15 12.45 14.55 12 14 12H8V10H10C10.55 10 11 9.55 11 9V7H13C14.1 7 15 7.9 15 9V10.19L17.9 17.39Z"/>
        </svg>
      ),
      downloadUrl: '/login',
      version: '2.1.0',
    },
  ];

  const handleDownload = (platform: Platform) => {
    if (platform.id === 'web') {
      window.location.href = platform.downloadUrl;
    } else if (platform.id === 'ios') {
      alert('Add Busmo to your home screen from Safari');
    } else {
      alert(`Downloading Busmo for ${platform.name}...`);
    }
  };

  return (
    <LangProvider>
      <Navbar currentPage="download" onNavigate={(page) => {
        if (page === 'home') window.location.href = '/';
        else if (page === 'signup') window.location.href = '/welcome/signup';
        else if (page === 'login') window.location.href = '/login';
      }} />

      <section className={styles.minimalHero}>
        <div className={styles.minimalContent}>
          <h1 className={styles.minimalTitle}>Download Busmo</h1>
          <p className={styles.minimalSubtitle}>Run your business from any device</p>
          <div className={styles.platformsGrid}>
            {platforms.map((platform) => (
              <button
                key={platform.id}
                className={`${styles.platformCard} ${detectedPlatform === platform.id ? styles.platformCardActive : ''}`}
                onClick={() => handleDownload(platform)}
              >
                <div className={styles.platformIcon}>{platform.icon}</div>
                <h3 className={styles.platformName}>{platform.name}</h3>
                <div className={styles.platformVersion}>v{platform.version}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Footer onNavigate={(page) => {
        if (page === 'home') window.location.href = '/';
        else if (page === 'signup') window.location.href = '/welcome/signup';
        else if (page === 'login') window.location.href = '/login';
      }} />
    </LangProvider>
  );
}
