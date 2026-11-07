import {
  LayoutDashboard,
  BarChart3,
  Award,
  CreditCard,
  Users,
  Settings,
  LifeBuoy,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
}

/**
 * EXACT sidebar navigation order as mandated by Suprilo specifications:
 * 1. Home
 * 2. Analytics
 * 3. Badges
 * 4. Billing & Usage
 * 5. Referral
 * 6. Account Settings
 * 7. Support Tickets (MUST remain the final sidebar item, directly after Account Settings)
 */
export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/profile",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/profile/analytics",
    icon: BarChart3,
  },
  {
    id: "badges",
    label: "Badges",
    href: "/profile/badges",
    icon: Award,
  },
  {
    id: "billing",
    label: "Billing & Usage",
    href: "/profile/billing",
    icon: CreditCard,
  },
  {
    id: "referral",
    label: "Referral",
    href: "/profile/referral",
    icon: Users,
  },
  {
    id: "settings",
    label: "Account Settings",
    href: "/profile/settings",
    icon: Settings,
  },
  {
    id: "support",
    label: "Support Tickets",
    href: "/profile/support",
    icon: LifeBuoy,
  },
];
