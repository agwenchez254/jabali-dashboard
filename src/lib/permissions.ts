export interface PermissionGroup {
  resource: string;
  label: string;
  permissions: { id: string; label: string }[];
}

const RESOURCE_LABELS: Record<string, string> = {
  product: "Products",
  inventory: "Inventory",
  promotion: "Promotions",
  order: "Orders",
  customer: "Customers",
  blog: "Blog",
  content: "Site content",
  media: "Media library",
  delivery: "Delivery zones",
  settings: "Site settings",
  staff: "Staff and roles",
  audit: "Audit log",
  analytics: "Analytics",
};

const ACTION_LABELS: Record<string, string> = {
  read: "View",
  write: "Create and edit",
  publish: "Publish and unpublish",
  refund: "Refund",
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Groups permission ids like `order:read` by resource, in the order the server lists them, with readable labels. */
export function groupPermissions(ids: string[]): PermissionGroup[] {
  const groups = new Map<string, PermissionGroup>();
  for (const id of ids) {
    const [resource, action = ""] = id.split(":");
    let g = groups.get(resource);
    if (!g) {
      g = { resource, label: RESOURCE_LABELS[resource] ?? titleCase(resource), permissions: [] };
      groups.set(resource, g);
    }
    g.permissions.push({ id, label: ACTION_LABELS[action] ?? titleCase(action) });
  }
  return [...groups.values()];
}

/** Role names are stored like `content_editor`. */
export const roleLabel = (name: string): string => name.replace(/_/g, " ");

/** The owner role is fixed by the server: it always has every permission and cannot be edited or deleted. */
export const isOwnerRole = (name: string): boolean => name === "owner";

/** Same set, ignoring order. */
export function samePermissions(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((p) => b.includes(p));
}
