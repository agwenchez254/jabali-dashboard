import { baseApi } from "./baseApi";
import type { Paged } from "./types";

export type PostStatus = "draft" | "published";

/** The editor's rich-text document (ProseMirror JSON). The server cleans it on save. */
export type PostDoc = Record<string, unknown>;

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  /** What lists show: the cover, else the first image in the body. */
  thumbnailUrl: string | null;
  publishedAt: string | null;
  status: PostStatus;
  updatedAt: string;
}

export interface PostDetail extends Omit<PostRow, "updatedAt"> {
  content: PostDoc;
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  /** Empty string removes the cover. */
  coverUrl?: string;
  content?: PostDoc;
}

export const blogApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getPosts: b.query<Paged<PostRow>, { q?: string; status?: PostStatus; page?: number; pageSize?: number } | void>({
      query: (params) => ({ url: "/blog", params: params ?? undefined }),
      providesTags: [{ type: "Post", id: "LIST" }],
    }),
    getPost: b.query<PostDetail, string>({
      query: (id) => `/blog/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Post", id }],
    }),
    createPost: b.mutation<PostDetail, PostInput & { title: string }>({
      query: (body) => ({ url: "/blog", method: "POST", body }),
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),
    updatePost: b.mutation<PostDetail, { id: string; body: PostInput }>({
      query: ({ id, body }) => ({ url: `/blog/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Post", id }, { type: "Post", id: "LIST" }],
    }),
    publishPost: b.mutation<PostDetail, string>({
      query: (id) => ({ url: `/blog/${id}/publish`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Post", id }, { type: "Post", id: "LIST" }],
    }),
    unpublishPost: b.mutation<PostDetail, string>({
      query: (id) => ({ url: `/blog/${id}/unpublish`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Post", id }, { type: "Post", id: "LIST" }],
    }),
    deletePost: b.mutation<void, string>({
      query: (id) => ({ url: `/blog/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),
  }),
});

export const { useGetPostsQuery, useGetPostQuery, useCreatePostMutation, useUpdatePostMutation, usePublishPostMutation, useUnpublishPostMutation, useDeletePostMutation } = blogApi;
