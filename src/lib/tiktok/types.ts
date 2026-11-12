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

/** Single line item for Shopping Ads / catalog matching */
export type TikTokContentItem = {
  content_id: string;
  content_name?: string;
  content_type?: string;
  quantity?: number;
  price?: number;
};

export type TikTokEventParams = {
  content_id?: string;
  content_type?: string;
  content_name?: string;
  content_category?: string;
  contents?: TikTokContentItem[];
  value?: number;
  currency?: string;
  description?: string;
  query?: string;
  status?: string;
  quantity?: number;
  [key: string]: string | number | boolean | TikTokContentItem[] | undefined;
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
