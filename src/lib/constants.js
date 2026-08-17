import {
  BarChart3,
  BriefcaseBusiness,
  CalendarRange,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  MapPinned,
  Settings,
  UserSquare2
} from "lucide-react";

export const ROLES = ["admin", "sales", "inspector", "client"];

export const APP_BASENAME = "/app";

export const ROLE_HOME = {
  admin: "/dashboard",
  sales: "/dashboard",
  inspector: "/billboards",
  client: "/portal"
};

export const BILLBOARD_STATUSES = [
  "available",
  "occupied",
  "maintenance",
  "retired"
];

export const BILLBOARD_TYPES = ["traditional", "digital"];

export const CONTRACT_STATUSES = ["draft", "active", "expired", "cancelled"];

export const CONTRACT_FORM_STATUSES = ["draft", "active", "cancelled"];

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid"];

export const CONDITIONS = ["excellent", "good", "fair", "poor", "critical"];

export const PAYMENT_METHODS = [
  "bank_transfer",
  "cash",
  "cheque",
  "mobile_money"
];

export const INTERNAL_NAV = [
  {
    roles: ["admin", "sales"],
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Billboards", to: "/billboards", icon: MapPinned },
      { label: "Clients", to: "/clients", icon: UserSquare2 },
      { label: "Contracts", to: "/contracts", icon: BriefcaseBusiness },
      { label: "Timeline", to: "/contracts/calendar", icon: CalendarRange },
      { label: "Inspections", to: "/inspections", icon: ClipboardList },
      { label: "Payments", to: "/payments", icon: CreditCard }
    ]
  },
  {
    roles: ["inspector"],
    items: [
      { label: "Billboards", to: "/billboards", icon: MapPinned },
      { label: "Inspections", to: "/inspections", icon: ClipboardList }
    ]
  }
];

export const ADMIN_NAV_ITEM = {
  label: "Settings",
  to: "/settings",
  icon: Settings
};

export const CLIENT_PORTAL_NAV = [
  { label: "Overview", to: "/portal", icon: LayoutDashboard },
  { label: "My Boards", to: "/portal/boards", icon: MapPinned },
  { label: "My Contracts", to: "/portal/contracts", icon: BarChart3 }
];
