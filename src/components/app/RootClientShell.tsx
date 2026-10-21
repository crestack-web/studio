'use client';

import { ReactNode } from 'react';
import Script from 'next/script';
import { PwaRegister } from '@/components/app/pwa-register';

const TIKTOK_PIXEL = `
!function (w, d, t) {
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
  ttq.load("D9C1NKBC77UBS5FSD660");
  ttq.page();
}(window, document, "ttq");
`;

export function RootClientShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Script id="tiktok-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: TIKTOK_PIXEL }} />
      <PwaRegister />
      {children}
    </>
  );
}
