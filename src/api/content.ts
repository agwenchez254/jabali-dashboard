import { baseApi } from "./baseApi";
import type { BlockKind, BlockVersion, ContentBlock, Gender, Testimonial } from "./types";

export interface BlockFilters {
  kind?: string;
  gender?: string;
  status?: string;
}

export const contentApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getBlocks: b.query<ContentBlock[], BlockFilters | void>({
      query: (params) => ({ url: "/content/blocks", params: params ?? undefined }),
      providesTags: (r) => [{ type: "Block", id: "LIST" }, ...(r ?? []).map((x) => ({ type: "Block" as const, id: x.id }))],
    }),
    getBlockVersions: b.query<BlockVersion[], string>({ query: (id) => `/content/blocks/${id}/versions` }),
    getBlockPreview: b.query<unknown, string>({ query: (id) => `/content/blocks/${id}/preview` }),
    createBlock: b.mutation<ContentBlock, { key: string; kind: BlockKind; gender?: Gender; data: Record<string, unknown> }>({
      query: (body) => ({ url: "/content/blocks", method: "POST", body }),
      invalidatesTags: [{ type: "Block", id: "LIST" }],
    }),
    updateBlock: b.mutation<ContentBlock, { id: string; body: { data?: Record<string, unknown>; publishAt?: string | null; unpublishAt?: string | null } }>({
      query: ({ id, body }) => ({ url: `/content/blocks/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Block", id }, { type: "Block", id: "LIST" }],
    }),
    deleteBlock: b.mutation<void, string>({
      query: (id) => ({ url: `/content/blocks/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Block", id: "LIST" }],
    }),
    publishBlock: b.mutation<ContentBlock, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/content/blocks/${id}/publish`, method: "POST", body }),
      invalidatesTags: [{ type: "Block", id: "LIST" }],
    }),
    unpublishBlock: b.mutation<ContentBlock, string>({
      query: (id) => ({ url: `/content/blocks/${id}/unpublish`, method: "POST" }),
      invalidatesTags: [{ type: "Block", id: "LIST" }],
    }),
    scheduleBlock: b.mutation<ContentBlock, { id: string; publishAt: string; unpublishAt?: string }>({
      query: ({ id, ...body }) => ({ url: `/content/blocks/${id}/schedule`, method: "POST", body }),
      invalidatesTags: [{ type: "Block", id: "LIST" }],
    }),
    rollbackBlock: b.mutation<ContentBlock, { id: string; version: number }>({
      query: ({ id, ...body }) => ({ url: `/content/blocks/${id}/rollback`, method: "POST", body }),
      invalidatesTags: [{ type: "Block", id: "LIST" }],
    }),

    getTestimonials: b.query<Testimonial[], void>({ query: () => "/testimonials", providesTags: ["Testimonial"] }),
    createTestimonial: b.mutation<Testimonial, Partial<Testimonial> & { name: string; quote: string }>({
      query: (body) => ({ url: "/testimonials", method: "POST", body }),
      invalidatesTags: ["Testimonial"],
    }),
    updateTestimonial: b.mutation<Testimonial, { id: string; body: Partial<Testimonial> }>({
      query: ({ id, body }) => ({ url: `/testimonials/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Testimonial"],
    }),
    deleteTestimonial: b.mutation<void, string>({
      query: (id) => ({ url: `/testimonials/${id}`, method: "DELETE" }),
      invalidatesTags: ["Testimonial"],
    }),

    getSettings: b.query<Record<string, unknown>, void>({ query: () => "/settings", providesTags: ["Settings"] }),
    setSetting: b.mutation<unknown, { key: string; value: unknown }>({
      query: ({ key, value }) => ({ url: `/settings/${key}`, method: "PUT", body: { value } }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetBlocksQuery,
  useLazyGetBlockVersionsQuery,
  useLazyGetBlockPreviewQuery,
  useCreateBlockMutation,
  useUpdateBlockMutation,
  useDeleteBlockMutation,
  usePublishBlockMutation,
  useUnpublishBlockMutation,
  useScheduleBlockMutation,
  useRollbackBlockMutation,
  useGetTestimonialsQuery,
  useCreateTestimonialMutation,
  useUpdateTestimonialMutation,
  useDeleteTestimonialMutation,
  useGetSettingsQuery,
  useSetSettingMutation,
} = contentApi;
