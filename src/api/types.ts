export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export type Gender = "men" | "women";

export interface Category {
  id: string;
  gender: Gender;
  slug: string;
  label: string;
  tagline?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  parentId?: string | null;
  productCount?: number;
}

export interface Colour {
  id: string;
  name: string;
  hex: string;
}

export type ProductStatus = "draft" | "active" | "archived";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  gender: Gender;
  category: { id: string; slug: string; label: string };
  basePrice: number;
  compareAtPrice: number | null;
  status: ProductStatus;
  isNew: boolean;
  isBestseller: boolean;
  soldCount: number;
  image: string | null;
  variantCount: number;
  stock: { onHand: number; available: number; lowStock: boolean };
  updatedAt: string;
}

export interface ProductDetail extends Omit<ProductRow, "category" | "stock" | "image"> {
  blurb?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryId?: string;
  category?: { id: string; slug: string; label: string };
  colours?: Colour[];
  variants?: Variant[];
  images?: { id?: string; mediaId: string; url?: string; colourId: string | null; alt?: string | null; position?: number }[];
  [key: string]: unknown;
}

export interface Variant {
  id: string;
  sku: string;
  size: string;
  colour?: Colour;
  colourId?: string;
  colourName?: string;
  priceOverride?: number | null;
  reserved?: number;
  onHand?: number;
  available?: number;
}

export interface ProductBody {
  name: string;
  slug?: string;
  gender: Gender;
  categoryId: string;
  blurb?: string;
  basePrice: number;
  compareAtPrice?: number | null;
  status?: ProductStatus;
  isNew?: boolean;
  isBestseller?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  colourIds?: string[];
  sizes?: string[];
  initialStock?: number;
}

export interface InventoryRow {
  variantId: string;
  sku: string;
  productId: string;
  productName: string;
  productSlug: string;
  colour: string;
  size: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  low: boolean;
}

export interface InventoryMovement {
  id: string;
  delta: number;
  reason: string;
  ref?: string | null;
  note?: string | null;
  createdAt: string;
  actor?: { name: string } | null;
}

export type PromotionType = "percent" | "fixed" | "free_delivery" | "bogo";

export interface Promotion {
  id: string;
  name: string;
  code: string | null;
  type: PromotionType;
  value: number;
  status: string;
  state: string;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  minSubtotal: number;
  stackable: boolean;
  priority: number;
  targets: { targetType: "category" | "product" | "all"; targetId?: string | null }[];
  createdAt: string;
  updatedAt: string;
}

export interface PromotionBody {
  name: string;
  code?: string;
  type: PromotionType;
  value: number;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  minSubtotal?: number;
  stackable?: boolean;
  priority?: number;
  targets?: { targetType: "category" | "product" | "all"; targetId?: string }[];
}

export type OrderStatus = "pending" | "paid" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface OrderRow {
  id: string;
  number: string;
  status: OrderStatus;
  method: string;
  paymentMethod: string;
  customer: { name: string; phone: string } | null;
  lineCount: number;
  total: number;
  county: string | null;
  createdAt: string;
}

export interface OrderDetail extends OrderRow {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  address?: string | null;
  eta?: string | null;
  lines: {
    id: string;
    name: string;
    colour: string;
    size: string;
    unitPrice: number;
    qty: number;
    gift?: unknown;
  }[];
  payments?: { id: string; provider: string; status: string; amount: number; providerRef?: string | null }[];
  events?: { id: string; type: string; note?: string | null; at?: string; createdAt?: string }[];
  [key: string]: unknown;
}

export interface OrderFilters {
  status?: string;
  q?: string;
  method?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export type BlockKind = "hero" | "banner" | "testimonial_set" | "category_tiles" | "rich_text" | "faq" | "gift_promo";

export interface ContentBlock {
  id: string;
  key: string;
  kind: BlockKind;
  gender: Gender | null;
  status: string;
  live: boolean;
  version: number;
  data: Record<string, unknown>;
  draftData: Record<string, unknown> | null;
  effective: Record<string, unknown>;
  hasUnpublishedChanges: boolean;
  publishAt: string | null;
  unpublishAt: string | null;
  scheduled: boolean;
  updatedAt: string;
}

export interface BlockVersion {
  id: string;
  version: number;
  data: Record<string, unknown>;
  note?: string | null;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location?: string | null;
  quote: string;
  rating: number;
  gender: Gender | null;
  isLead: boolean;
  isPublished: boolean;
  sortOrder: number;
  avatarMediaId?: string | null;
  avatar?: { url: string } | null;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  counties: string[];
  fee: number;
  etaDays?: number | null;
  eta?: string | null;
  freeOver: number | null;
  sortOrder: number;
  active: boolean;
}

export interface MediaItem {
  id: string;
  url: string;
  mime: string;
  width: number | null;
  height: number | null;
  bytes: number;
  alt: string | null;
  external: boolean;
  inUse: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  staffCount?: number;
  permissions: string[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: string; name: string };
}

export interface AnalyticsSummary {
  sales: Record<"today" | "last7Days" | "last30Days", { revenue: number; orders: number }>;
  ordersByStatus: Record<OrderStatus, number>;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts?: { name?: string; productName?: string; units?: number; revenue?: number }[];
  lowStock?: { count: number; items: InventoryRow[] };
  [key: string]: unknown;
}

export interface TopProduct {
  productId?: string;
  name: string;
  units?: number;
  revenue?: number;
  [key: string]: unknown;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  ip?: string | null;
  at: string;
  actor?: { name: string; email?: string } | null;
}
