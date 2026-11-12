'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import {
  TIKTOK_PIXEL_ID,
  captureAttributionFromUrl,
  trackPageView,
} from '@/lib/tiktok/pixel';

/**
 * Loads TikTok Pixel once and fires page() on route changes.
 * Attribution (ttclid + UTMs) stored in localStorage first-touch.
 */
export function TikTokPixelProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string>('');
  const bootstrapped = useRef(false);

  // Capture attribution on any landing with query params
  useEffect(() => {
    try {
      captureAttributionFromUrl(searchParams?.toString() ? `?${searchParams.toString()}` : undefined);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  // SPA page views (skip first — base script already calls page())
  useEffect(() => {
    if (!pathname) return;
    const key = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
    if (!bootstrapped.current) {
      bootstrapped.current = true;
      lastPath.current = key;
      return;
    }
    if (lastPath.current === key) return;
    lastPath.current = key;
    trackPageView();
  }, [pathname, searchParams]);

  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function (w, d, t) {
  if (w.ttq && w.__busmoTtPixelLoaded) return;
  w.__busmoTtPixelLoaded = true;
  w.TiktokAnalyticsObject = t;
  var ttq = w[t] = w[t] || [];
  ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
  ttq.setAndDefer = function (t, e) {
    t[e] = function () {
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
  ttq.instance = function (t) {
    for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
    return e;
  };
  ttq.load = function (e, n) {
    var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[e] = [];
    ttq._i[e]._u = r;
    ttq._t = ttq._t || {};
    ttq._t[e] = +new Date;
    ttq._o = ttq._o || {};
    ttq._o[e] = n || {};
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = r + "?sdkid=" + e + "&lib=" + t;
    var first = document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(s, first);
  };
  ttq.load("${TIKTOK_PIXEL_ID}");
  ttq.page();
}(window, document, "ttq");
`,
      }}
    />
  );
}
