import type { Role } from "./session";

export const PERMISSIONS = [
  "BOOKING_VIEW",
  "BOOKING_CREATE",
  "BOOKING_UPDATE",
  "BOOKING_CANCEL",
  "CUSTOMER_VIEW",
  "CUSTOMER_CREATE",
  "CUSTOMER_UPDATE",
  "SERVICE_VIEW",
  "SERVICE_CREATE",
  "SERVICE_UPDATE",
  "WORKORDER_VIEW",
  "WORKORDER_CREATE",
  "WORKORDER_UPDATE",
  "WORKORDER_COMPLETE",
  "POS_VIEW",
  "POS_CREATE",
  "POS_PAYMENT",
  "INVENTORY_VIEW",
  "INVENTORY_CREATE",
  "INVENTORY_UPDATE",
  "INVENTORY_STOCK_IN",
  "INVENTORY_STOCK_OUT",
  "SUPPLIER_VIEW",
  "SUPPLIER_MANAGE",
  "REPORT_VIEW",
  "FINANCE_VIEW",
  "EXPENSE_MANAGE",
  "USER_MANAGE",
  "SETTING_MANAGE",
  "AUDIT_VIEW",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [...PERMISSIONS],
  ADMIN: [
    "BOOKING_VIEW",
    "BOOKING_CREATE",
    "BOOKING_UPDATE",
    "BOOKING_CANCEL",
    "CUSTOMER_VIEW",
    "CUSTOMER_CREATE",
    "CUSTOMER_UPDATE",
    "SERVICE_VIEW",
    "SERVICE_CREATE",
    "SERVICE_UPDATE",
    "WORKORDER_VIEW",
    "WORKORDER_CREATE",
    "WORKORDER_UPDATE",
    "WORKORDER_COMPLETE",
    "POS_VIEW",
    "POS_CREATE",
    "POS_PAYMENT",
    "INVENTORY_VIEW",
    "INVENTORY_CREATE",
    "INVENTORY_UPDATE",
    "INVENTORY_STOCK_IN",
    "INVENTORY_STOCK_OUT",
    "SUPPLIER_VIEW",
    "SUPPLIER_MANAGE",
    "REPORT_VIEW",
    "SETTING_MANAGE",
  ],
  KASIR: [
    "BOOKING_VIEW",
    "BOOKING_CREATE",
    "BOOKING_UPDATE",
    "BOOKING_CANCEL",
    "CUSTOMER_VIEW",
    "CUSTOMER_CREATE",
    "CUSTOMER_UPDATE",
    "SERVICE_VIEW",
    "WORKORDER_VIEW",
    "POS_VIEW",
    "POS_CREATE",
    "POS_PAYMENT",
    "INVENTORY_VIEW",
  ],
  TEKNISI: [
    "WORKORDER_VIEW",
    "WORKORDER_UPDATE",
    "WORKORDER_COMPLETE",
    "SERVICE_VIEW",
    "INVENTORY_VIEW",
    "INVENTORY_STOCK_OUT",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  KASIR: "Kasir",
  TEKNISI: "Teknisi",
};

export function roleHome(role: Role): string {
  if (role === "TEKNISI") return "/tech";
  return "/admin";
}
