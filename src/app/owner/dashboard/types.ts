export interface NavItem {
  id: string;
  label: string;
  tip: string;
  iconClass: string;
  badge?: number;
}
export type Service = {
    id: string;
    name: string;
    // Add other fields here
};

export interface MOMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
}
export interface NavSection {
  label: string;
  items: NavItem[];
}