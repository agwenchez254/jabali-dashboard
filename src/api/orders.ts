import { baseApi } from "./baseApi";
import type { OrderDetail, OrderFilters, OrderRow, OrderStatus, Paged } from "./types";

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getOrders: b.query<Paged<OrderRow>, OrderFilters | void>({
      query: (params) => ({ url: "/orders", params: params ?? undefined }),
      providesTags: (r) => [{ type: "Order", id: "LIST" }, ...(r?.items ?? []).map((o) => ({ type: "Order" as const, id: o.id }))],
    }),
    getOrder: b.query<OrderDetail, string>({ query: (id) => `/orders/${id}`, providesTags: (_r, _e, id) => [{ type: "Order", id }] }),
    /** CSV download, fetched lazily from the Export button. */
    exportOrders: b.query<string, OrderFilters | void>({
      query: (params) => ({ url: "/orders/export", params: params ?? undefined, responseHandler: (r) => r.text() }),
      keepUnusedDataFor: 0,
    }),
    transitionOrder: b.mutation<OrderDetail, { id: string; to: OrderStatus; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/transition`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Order", id }, { type: "Order", id: "LIST" }, "Analytics", "Inventory"],
    }),
    refundOrder: b.mutation<OrderDetail, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/refund`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Order", id }, { type: "Order", id: "LIST" }, "Analytics"],
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderQuery, useLazyExportOrdersQuery, useTransitionOrderMutation, useRefundOrderMutation } = ordersApi;
