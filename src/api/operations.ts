import { baseApi } from "./baseApi";
import type { AnalyticsSummary, AuditEntry, MediaItem, Paged, Role, Staff, TopProduct, Zone } from "./types";

export const operationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // Delivery zones
    getZones: b.query<Zone[], void>({ query: () => "/delivery/zones", providesTags: ["Zone"] }),
    createZone: b.mutation<Zone, Omit<Zone, "id">>({
      query: (body) => ({ url: "/delivery/zones", method: "POST", body }),
      invalidatesTags: ["Zone"],
    }),
    updateZone: b.mutation<Zone, { id: string; body: Partial<Omit<Zone, "id">> }>({
      query: ({ id, body }) => ({ url: `/delivery/zones/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Zone"],
    }),
    deleteZone: b.mutation<void, string>({
      query: (id) => ({ url: `/delivery/zones/${id}`, method: "DELETE" }),
      invalidatesTags: ["Zone"],
    }),

    // Media
    getMedia: b.query<Paged<MediaItem>, { q?: string; page?: number; pageSize?: number } | void>({
      query: (params) => ({ url: "/media", params: params ?? undefined }),
      providesTags: ["Media"],
    }),
    uploadMedia: b.mutation<MediaItem, { file: File; alt?: string }>({
      query: ({ file, alt }) => {
        const body = new FormData();
        body.append("file", file);
        if (alt) body.append("alt", alt);
        return { url: "/media", method: "POST", body };
      },
      invalidatesTags: ["Media"],
    }),
    updateMedia: b.mutation<MediaItem, { id: string; alt: string }>({
      query: ({ id, ...body }) => ({ url: `/media/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Media"],
    }),
    deleteMedia: b.mutation<void, string>({
      query: (id) => ({ url: `/media/${id}`, method: "DELETE" }),
      invalidatesTags: ["Media"],
    }),

    // Staff and roles
    getStaff: b.query<Staff[], void>({ query: () => "/staff", providesTags: ["Staff"] }),
    createStaff: b.mutation<Staff, { name: string; email: string; password: string; roleId: string }>({
      query: (body) => ({ url: "/staff", method: "POST", body }),
      invalidatesTags: ["Staff", "Role"],
    }),
    updateStaff: b.mutation<Staff, { id: string; body: { name?: string; roleId?: string; status?: string; password?: string } }>({
      query: ({ id, body }) => ({ url: `/staff/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Staff", "Role"],
    }),
    getRoles: b.query<Role[], void>({ query: () => "/roles", providesTags: ["Role"] }),

    // Analytics and audit
    getAnalyticsSummary: b.query<AnalyticsSummary, void>({ query: () => "/analytics/summary", providesTags: ["Analytics"] }),
    getTopProducts: b.query<TopProduct[], void>({ query: () => "/analytics/top-products", providesTags: ["Analytics"] }),
    getAudit: b.query<Paged<AuditEntry>, { page?: number; pageSize?: number } | void>({
      query: (params) => ({ url: "/audit", params: params ?? undefined }),
      providesTags: ["Audit"],
    }),
  }),
});

export const {
  useGetZonesQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
  useGetMediaQuery,
  useLazyGetMediaQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useGetRolesQuery,
  useGetAnalyticsSummaryQuery,
  useGetTopProductsQuery,
  useGetAuditQuery,
} = operationsApi;
