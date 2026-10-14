import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { loggedOut, setCredentials, type AuthState } from "@/store/authSlice";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000/api/v1";

export const TAGS = ["Me", "Product", "Category", "Colour", "Inventory", "Promotion", "Order", "Block", "Testimonial", "Page", "Settings", "Zone", "Media", "Staff", "Role", "Analytics", "Audit"] as const;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/admin`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: AuthState }).auth.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

let refreshing: Promise<boolean> | null = null;

/** Adds a bearer token, and on a 401 rotates the refresh token once and retries. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  const url = typeof args === "string" ? args : args.url;
  if (result.error?.status === 401 && !url.startsWith("/auth/")) {
    const refreshToken = (api.getState() as { auth: AuthState }).auth.refreshToken;
    if (!refreshToken) {
      api.dispatch(loggedOut());
      return result;
    }
    refreshing ??= (async () => {
      const r = await rawBaseQuery({ url: "/auth/refresh", method: "POST", body: { refreshToken } }, api, extra);
      if (r.data) {
        const d = r.data as { accessToken: string; refreshToken: string };
        api.dispatch(setCredentials({ accessToken: d.accessToken, refreshToken: d.refreshToken }));
        return true;
      }
      api.dispatch(loggedOut());
      return false;
    })().finally(() => {
      refreshing = null;
    });
    if (await refreshing) result = await rawBaseQuery(args, api, extra);
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: TAGS,
  endpoints: () => ({}),
});

/** Human-readable message from the backend's problem+json errors. */
export function errorMessage(err: unknown): string {
  const e = err as { data?: { detail?: string; title?: string; errors?: { field: string; message: string }[] }; error?: string; status?: unknown };
  if (e?.data?.errors?.length) return e.data.errors.map((x) => `${x.field}: ${x.message}`).join(", ");
  return e?.data?.detail ?? e?.data?.title ?? e?.error ?? "Something went wrong";
}
