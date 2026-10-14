import { baseApi } from "./baseApi";
import type { Category, Colour, InventoryMovement, InventoryRow, Paged, ProductBody, ProductDetail, ProductRow, Variant } from "./types";

export interface ProductFilters {
  q?: string;
  status?: string;
  gender?: string;
  categoryId?: string;
  stock?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryFilters {
  q?: string;
  productId?: string;
  low?: boolean;
  page?: number;
  pageSize?: number;
}

export const catalogueApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Products
    getProducts: b.query<Paged<ProductRow>, ProductFilters | void>({
      query: (params) => ({ url: "/products", params: params ?? undefined }),
      providesTags: (r) => [{ type: "Product", id: "LIST" }, ...(r?.items ?? []).map((p) => ({ type: "Product" as const, id: p.id }))],
    }),
    getProduct: b.query<ProductDetail, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    createProduct: b.mutation<ProductDetail, ProductBody>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }, "Inventory", "Category", "Analytics"],
    }),
    updateProduct: b.mutation<ProductDetail, { id: string; body: Partial<ProductBody> }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Product", id }, { type: "Product", id: "LIST" }],
    }),
    deleteProduct: b.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Product", id: "LIST" }, "Inventory", "Category"],
    }),
    bulkUpdateProducts: b.mutation<unknown, { ids: string[]; status?: string }>({
      query: (body) => ({ url: "/products/bulk", method: "PATCH", body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    addVariant: b.mutation<Variant, { productId: string; body: { colourId: string; size: string; sku?: string; priceOverride?: number; initialStock?: number } }>({
      query: ({ productId, body }) => ({ url: `/products/${productId}/variants`, method: "POST", body }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: "Product", id: productId }, "Inventory"],
    }),
    deleteVariant: b.mutation<void, { id: string; productId: string }>({
      query: ({ id }) => ({ url: `/variants/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: "Product", id: productId }, "Inventory"],
    }),
    setProductImages: b.mutation<unknown, { productId: string; images: { mediaId: string; colourId?: string | null; alt?: string }[] }>({
      query: ({ productId, images }) => ({ url: `/products/${productId}/images`, method: "PUT", body: { images } }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: "Product", id: productId }, { type: "Product", id: "LIST" }],
    }),

    // Categories and colours
    getCategories: b.query<Category[], void>({ query: () => "/categories", providesTags: ["Category"] }),
    createCategory: b.mutation<Category, { label: string; gender: string; slug?: string; tagline?: string; sortOrder?: number }>({
      query: (body) => ({ url: "/categories", method: "POST", body }),
      invalidatesTags: ["Category"],
    }),
    deleteCategory: b.mutation<void, string>({
      query: (id) => ({ url: `/categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["Category"],
    }),
    getColours: b.query<Colour[], void>({ query: () => "/colours", providesTags: ["Colour"] }),
    createColour: b.mutation<Colour, { name: string; hex: string }>({
      query: (body) => ({ url: "/colours", method: "POST", body }),
      invalidatesTags: ["Colour"],
    }),
    deleteColour: b.mutation<void, string>({
      query: (id) => ({ url: `/colours/${id}`, method: "DELETE" }),
      invalidatesTags: ["Colour"],
    }),

    // Inventory
    getInventory: b.query<Paged<InventoryRow>, InventoryFilters | void>({
      query: (params) => ({ url: "/inventory", params: params ?? undefined }),
      providesTags: ["Inventory"],
    }),
    getLowStock: b.query<InventoryRow[], void>({ query: () => "/inventory/low-stock", providesTags: ["Inventory"] }),
    getMovements: b.query<InventoryMovement[], string>({
      query: (variantId) => `/inventory/${variantId}/movements`,
      providesTags: ["Inventory"],
    }),
    adjustInventory: b.mutation<unknown, { variantId: string; setTo: number; reason: string; note?: string }>({
      query: (body) => ({ url: "/inventory/adjust", method: "POST", body }),
      invalidatesTags: ["Inventory", { type: "Product", id: "LIST" }, "Analytics"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBulkUpdateProductsMutation,
  useAddVariantMutation,
  useDeleteVariantMutation,
  useSetProductImagesMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetColoursQuery,
  useCreateColourMutation,
  useDeleteColourMutation,
  useGetInventoryQuery,
  useGetLowStockQuery,
  useLazyGetMovementsQuery,
  useAdjustInventoryMutation,
} = catalogueApi;
