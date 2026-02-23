import { NavSection } from './types';

// ═══════════════════════════════════════════
//  BUSMO — Navigation Configuration
// ═══════════════════════════════════════════

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Main',
    items: [
      { id: 'home',      label: 'Home',        tip: 'Home',        iconClass: 'ni-home'  },
      { id: 'sale',      label: 'Record Sale',  tip: 'Record Sale', iconClass: 'ni-sale'  },
      { id: 'sales',     label: 'Sales',        tip: 'Sales',       iconClass: 'ni-chart' },
      { id: 'inventory', label: 'Inventory',    tip: 'Inventory',   iconClass: 'ni-box'   },
      { id: 'expenses',  label: 'Expenses',     tip: 'Expenses',    iconClass: 'ni-spend' },
      { id: 'cashflow',  label: 'Cashflow',     tip: 'Cashflow',    iconClass: 'ni-cash'  },
    ],
  },
  {
    label: 'Growth',
    items: [
      { id: 'market',    label: 'My Market',       tip: 'My Market',       iconClass: 'ni-store', badge: 3  },
      { id: 'pay',       label: 'BusmoPay',         tip: 'BusmoPay',        iconClass: 'ni-pay'   },
      { id: 'go',        label: 'BusmoGo',          tip: 'BusmoGo',         iconClass: 'ni-truck' },
      { id: 'capital',   label: 'Access Capital',   tip: 'Access Capital',  iconClass: 'ni-fund'  },
      { id: 'referrals', label: 'Referrals',        tip: 'Referrals',       iconClass: 'ni-gift'  },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'mo',       label: 'Ask MO',            tip: 'Ask MO',             iconClass: 'ni-mo'    },
      { id: 'services', label: 'Business Services', tip: 'Business Services',  iconClass: 'ni-svc'   },
      { id: 'staff',    label: 'Staff',              tip: 'Staff',              iconClass: 'ni-staff' },
      { id: 'settings', label: 'Settings',           tip: 'Settings',           iconClass: 'ni-set'   },
    ],
  },
];

// Pages shown in mobile bottom nav
export const MOBILE_NAV_ITEMS = ['home', 'sale', 'mo', 'staff', 'services'] as const;
