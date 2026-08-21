import posthog from 'posthog-js'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

if (typeof window !== 'undefined' && token) {
  try {
    posthog.init(token, {
      api_host: '/ingest',
      capture_exceptions: true,
      debug: process.env.NODE_ENV === 'development',
    })
  } catch (err) {
    // Never let analytics take down the app
    console.warn('[posthog] init failed', err)
  }
}
