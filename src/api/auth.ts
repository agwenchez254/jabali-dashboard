import { baseApi } from "./baseApi";
import type { AuthUser } from "@/store/authSlice";

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    logout: b.mutation<void, { refreshToken?: string }>({
      query: (body) => ({ url: "/auth/logout", method: "POST", body }),
    }),
    getMe: b.query<AuthUser, void>({ query: () => "/me", providesTags: ["Me"] }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
