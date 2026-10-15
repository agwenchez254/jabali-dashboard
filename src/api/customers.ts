import { baseApi } from "./baseApi";
import type { Paged } from "./types";

export type CustomerStatus = "active" | "disabled" | "unverified" | "guest";

export interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: CustomerStatus;
  hasAccount: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  orders: number;
  activeOrders: number;
  totalSpent: number;
}

export interface CustomerAddress {
  id: string;
  label: string;
  county: string;
  area: string;
  street: string;
  recipient: string | null;
  phone: string | null;
  isDefault: boolean;
}

export interface CustomerDetail extends CustomerRow {
  /** Saved delivery places. */
  addresses: CustomerAddress[];
  orderList: { id: string; number: string | null; status: string; total: number; createdAt: string; active: boolean }[];
}

export interface CustomerFilters {
  q?: string;
  status?: CustomerStatus;
  page?: number;
  pageSize?: number;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCustomers: b.query<Paged<CustomerRow>, CustomerFilters | void>({
      query: (params) => ({ url: "/customers", params: params ?? undefined }),
      providesTags: [{ type: "Customer", id: "LIST" }],
    }),
    getCustomer: b.query<CustomerDetail, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Customer", id }],
    }),
    /** Fails with 409 `active_orders` (and the orders listed) until every active order is cancelled or completed. */
    deactivateCustomer: b.mutation<CustomerDetail, string>({
      query: (id) => ({ url: `/customers/${id}/deactivate`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Customer", id }, { type: "Customer", id: "LIST" }],
    }),
    activateCustomer: b.mutation<CustomerDetail, string>({
      query: (id) => ({ url: `/customers/${id}/activate`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Customer", id }, { type: "Customer", id: "LIST" }],
    }),
  }),
});

export const { useGetCustomersQuery, useGetCustomerQuery, useDeactivateCustomerMutation, useActivateCustomerMutation } = customersApi;
