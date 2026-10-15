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
    uploadMediaBatch: b.mutation<{ items: MediaItem[]; failed: { index: number; filename: string; status: number; message: string }[] }, { files: File[] }>({
      query: ({ files }) => {
        const body = new FormData();
        // An alt text sent right after a file belongs to that file.
        for (const file of files) {
          body.append("files", file);
          body.append("alt", file.name.replace(/\.[^.]+$/, ""));
        }
        return { url: "/media/batch", method: "POST", body };
      },
      invalidatesTags: ["Media"],
    }),
    deleteMediaBatch: b.mutation<{ deleted: string[]; failed: { id: string; status: number; message: string }[] }, { ids: string[] }>({
      query: (body) => ({ url: "/media/batch/delete", method: "POST", body }),
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
    getPermissionCatalogue: b.query<string[], void>({
      query: () => "/roles/permissions",
      transformResponse: (r: { permissions: string[] }) => r.permissions,
    }),
    createRole: b.mutation<Role, { name: string; description?: string; permissions: string[] }>({
      query: (body) => ({ url: "/roles", method: "POST", body }),
      invalidatesTags: ["Role"],
    }),
    updateRole: b.mutation<Role, { id: string; body: { name?: string; description?: string; permissions?: string[] } }>({
      query: ({ id, body }) => ({ url: `/roles/${id}`, method: "PATCH", body }),
      // Staff rows show the role name, and people on this role get the new permissions at their next sign-in.
      invalidatesTags: ["Role", "Staff"],
    }),
    deleteRole: b.mutation<void, string>({
      query: (id) => ({ url: `/roles/${id}`, method: "DELETE" }),
      invalidatesTags: ["Role"],
    }),

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
  useUploadMediaBatchMutation,
  useDeleteMediaBatchMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useGetRolesQuery,
  useGetPermissionCatalogueQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetAnalyticsSummaryQuery,
  useGetTopProductsQuery,
  useGetAuditQuery,
} = operationsApi;
