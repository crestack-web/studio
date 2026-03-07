export type Page =
  | 'home'
  | 'pricing'
  | 'login'
  | 'login-form'
  | 'signup'
  | 'seller'
  | 'invest'
  | 'invest-signup'
  | 'invest-login'
  | 'busmogo';

export interface NavLink {
  id: Page;
  label: string;
}
