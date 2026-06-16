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
  isPWA?: boolean;
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
      id: 'android',
      name: 'Android',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M17.523 15.3414C17.523 16.7269 16.4082 17.8414 15.023 17.8414C13.6378 17.8414 12.523 16.7269 12.523 15.3414C12.523 13.9562 13.6378 12.8414 15.023 12.8414C16.4082 12.8414 17.523 13.9562 17.523 15.3414ZM6.523 15.3414C6.523 16.7269 5.40825 17.8414 4.023 17.8414C2.63775 17.8414 1.523 16.7269 1.523 15.3414C1.523 13.9562 2.63775 12.8414 4.023 12.8414C5.40825 12.8414 6.523 13.9562 6.523 15.3414ZM19.523 9.3414C19.523 8.7914 19.073 8.3414 18.523 8.3414H17.223L17.223 6.3414C17.223 3.5814 14.983 1.3414 12.223 1.3414C9.463 1.3414 7.223 3.5814 7.223 6.3414V8.3414H5.923C5.373 8.3414 4.923 8.7914 4.923 9.3414V17.3414C4.923 18.9914 6.273 20.3414 7.923 20.3414H16.523C18.173 20.3414 19.523 18.9914 19.523 17.3414V9.3414ZM9.223 6.3414C9.223 4.6914 10.573 3.3414 12.223 3.3414C13.873 3.3414 15.223 4.6914 15.223 6.3414V8.3414H9.223V6.3414Z"/>
        </svg>
      ),
      downloadUrl: 'https://storage.googleapis.com/bizassistant2-62305643-adad7.appspot.com/apps/android/Busmo-2.1.0.apk',
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
      isPWA: true,
    },
  ];

  const handleDownload = (platform: Platform) => {
    if (platform.downloadUrl && platform.downloadUrl !== '#') {
      if (platform.id === 'web') {
        // For PWA, try to trigger install prompt
        if (platform.isPWA && 'serviceWorker' in navigator) {
          // Register service worker for PWA
          navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('Service Worker registered');
            // Navigate to login
            window.location.href = platform.downloadUrl;
          }).catch((error) => {
            console.error('Service Worker registration failed:', error);
            window.location.href = platform.downloadUrl;
          });
        } else {
          window.location.href = platform.downloadUrl;
        }
      } else if (platform.id === 'ios') {
        // For iOS, open App Store link
        window.open(platform.downloadUrl, '_blank');
      } else {
        // For Windows, macOS, Android - open download link in new tab
        window.open(platform.downloadUrl, '_blank');
      }
    } else {
      alert(`Download for ${platform.name} is not available yet.`);
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
