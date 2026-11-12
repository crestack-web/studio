export type TikTokStandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'ClickButton'
  | 'Search'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'CompleteRegistration'
  | 'CompletePayment'
  | 'PlaceAnOrder'
  | 'Lead'
  | 'Subscribe'
  | 'Contact';

export type TikTokCustomEvent = 'PaymentFailed' | 'OnboardingComplete';

export type TikTokEventName = TikTokStandardEvent | TikTokCustomEvent;

export type TikTokEventParams = {
  content_id?: string;
  content_type?: string;
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  description?: string;
  query?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
};

export type TikTokAttribution = {
  ttclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  first_touch_at?: string;
  last_touch_at?: string;
};
