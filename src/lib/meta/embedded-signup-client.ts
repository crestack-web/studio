/**
 * Browser-only Meta WhatsApp Embedded Signup helpers.
 * Based on Meta Embedded Signup implementation docs (FB.login + config_id).
 * Never include Infobip keys or Meta system-user secrets here.
 */

export type EmbeddedSignupPublicConfig = {
  configured: boolean;
  metaAppId: string | null;
  metaConfigId: string | null;
  infobipSolutionId: string | null;
  graphVersion: string;
};

export type EmbeddedSignupSession = {
  wabaId?: string;
  phoneNumberId?: string;
  metaBusinessId?: string;
  displayPhoneNumber?: string;
  event?: string;
  rawType?: string;
};

export type FbLoginResult = {
  status?: string;
  authResponse?: {
    code?: string;
    accessToken?: string;
    userID?: string;
    expiresIn?: number;
  };
};

declare global {
  interface Window {
    FB?: {
      init: (opts: Record<string, unknown>) => void;
      login: (
        cb: (response: FbLoginResult) => void,
        opts: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const FB_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';

export function loadFacebookSdk(appId: string, graphVersion: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Facebook SDK can only load in the browser'));
  }
  if (window.FB) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${FB_SDK_SRC}"]`);
    if (existing) {
      const start = Date.now();
      const wait = () => {
        if (window.FB) return resolve();
        if (Date.now() - start > 15000) return reject(new Error('Facebook SDK load timeout'));
        setTimeout(wait, 100);
      };
      wait();
      return;
    }

    window.fbAsyncInit = function () {
      try {
        window.FB?.init({
          appId,
          autoLogAppEvents: true,
          xfbml: true,
          version: graphVersion.startsWith('v') ? graphVersion : `v${graphVersion}`,
        });
        resolve();
      } catch (e: any) {
        reject(e);
      }
    };

    const script = document.createElement('script');
    script.src = FB_SDK_SRC;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.body.appendChild(script);

    setTimeout(() => {
      if (!window.FB) reject(new Error('Facebook SDK load timeout'));
    }, 15000);
  });
}

/**
 * Listen for WA_EMBEDDED_SIGNUP session info messages from Meta.
 * sessionInfoVersion 3 provides waba_id / phone_number_id / business_id.
 */
export function attachEmbeddedSignupSessionListener(
  onSession: (session: EmbeddedSignupSession) => void
): () => void {
  const handler = (event: MessageEvent) => {
    if (
      event.origin !== 'https://www.facebook.com' &&
      event.origin !== 'https://web.facebook.com'
    ) {
      return;
    }
    let data: any = event.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }
    if (!data || data.type !== 'WA_EMBEDDED_SIGNUP') return;

    const payload = data.data || data;
    onSession({
      rawType: data.type,
      event: String(payload.event || data.event || ''),
      wabaId: payload.waba_id || payload.wabaId || undefined,
      phoneNumberId: payload.phone_number_id || payload.phoneNumberId || undefined,
      metaBusinessId: payload.business_id || payload.businessId || undefined,
      displayPhoneNumber:
        payload.phone_number ||
        payload.display_phone_number ||
        payload.displayPhoneNumber ||
        undefined,
    });
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

/**
 * Launch Meta WhatsApp Embedded Signup via FB.login.
 * Requires a Facebook Login for Business configuration ID (public).
 */
export function launchWhatsAppEmbeddedSignup(
  config: EmbeddedSignupPublicConfig
): Promise<{ login: FbLoginResult; session: EmbeddedSignupSession | null }> {
  return new Promise(async (resolve, reject) => {
    if (!config.metaAppId || !config.metaConfigId) {
      reject(new Error('embedded_signup_not_configured'));
      return;
    }

    try {
      await loadFacebookSdk(config.metaAppId, config.graphVersion || 'v21.0');
    } catch (e: any) {
      reject(new Error(e?.message || 'Facebook SDK failed to load'));
      return;
    }

    if (!window.FB) {
      reject(new Error('Facebook SDK unavailable'));
      return;
    }

    let session: EmbeddedSignupSession | null = null;
    const detach = attachEmbeddedSignupSessionListener((s) => {
      session = { ...session, ...s };
    });

    const extras: Record<string, unknown> = {
      // Meta docs: sessionInfoVersion 3 returns WABA / phone number IDs via postMessage
      sessionInfoVersion: 3,
      setup: {} as Record<string, unknown>,
    };
    // Partner solution ID when provided by Infobip Tech Provider setup
    if (config.infobipSolutionId) {
      (extras.setup as Record<string, unknown>).solutionID = config.infobipSolutionId;
    }

    try {
      window.FB.login(
        (response) => {
          // Allow a brief moment for session info postMessage
          setTimeout(() => {
            detach();
            if (!response || response.status === 'unknown') {
              reject(new Error('popup_blocked_or_closed'));
              return;
            }
            if (response.status === 'not_authorized') {
              reject(new Error('meta_not_authorized'));
              return;
            }
            resolve({ login: response, session });
          }, 800);
        },
        {
          config_id: config.metaConfigId,
          response_type: 'code',
          override_default_response_type: true,
          // Avoid "already logged in" friction on re-clicks
          auth_type: 'rerequest',
          extras,
        }
      );
    } catch (e: any) {
      detach();
      reject(e);
    }
  });
}

export function mapEmbeddedSignupError(err: unknown): string {
  const msg = String((err as any)?.message || err || '');
  if (msg.includes('embedded_signup_not_configured')) {
    return 'Meta Embedded Signup is not configured for Busmo yet. Use manual beta setup or contact support.';
  }
  if (msg.includes('popup_blocked') || msg.includes('closed')) {
    return 'The Meta signup window was blocked or closed. Allow popups for Busmo and try again.';
  }
  if (msg.includes('not_authorized') || msg.includes('meta_not_authorized')) {
    return 'Meta login was not authorized. Please try again and accept the required permissions.';
  }
  if (msg.includes('SDK')) {
    return 'Could not load Meta signup. Check your network and try again.';
  }
  return msg || 'WhatsApp connection failed. Please try again.';
}
