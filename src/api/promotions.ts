import { baseApi } from "./baseApi";
import type { Paged, Promotion, PromotionBody } from "./types";

export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getPromotions: b.query<Paged<Promotion>, { q?: string; status?: string; page?: number; pageSize?: number } | void>({
      query: (params) => ({ url: "/promotions", params: params ?? undefined }),
      providesTags: (r) => [{ type: "Promotion", id: "LIST" }, ...(r?.items ?? []).map((p) => ({ type: "Promotion" as const, id: p.id }))],
    }),
    getRedemptions: b.query<{ items?: Record<string, unknown>[] } | Record<string, unknown>[], string>({
      query: (id) => `/promotions/${id}/redemptions`,
    }),
    createPromotion: b.mutation<Promotion, PromotionBody>({
      query: (body) => ({ url: "/promotions", method: "POST", body }),
      invalidatesTags: [{ type: "Promotion", id: "LIST" }],
    }),
    updatePromotion: b.mutation<Promotion, { id: string; body: Partial<PromotionBody> }>({
      query: ({ id, body }) => ({ url: `/promotions/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Promotion", id }, { type: "Promotion", id: "LIST" }],
    }),
    deletePromotion: b.mutation<void, string>({
      query: (id) => ({ url: `/promotions/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Promotion", id: "LIST" }],
    }),
    activatePromotion: b.mutation<Promotion, string>({
      query: (id) => ({ url: `/promotions/${id}/activate`, method: "POST" }),
      invalidatesTags: [{ type: "Promotion", id: "LIST" }],
    }),
    pausePromotion: b.mutation<Promotion, string>({
      query: (id) => ({ url: `/promotions/${id}/pause`, method: "POST" }),
      invalidatesTags: [{ type: "Promotion", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPromotionsQuery,
  useLazyGetRedemptionsQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useActivatePromotionMutation,
  usePausePromotionMutation,
} = promotionsApi;
