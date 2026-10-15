import { baseApi } from "./baseApi";
import { setCredentials, setUser, type AuthState, type AuthUser } from "@/store/authSlice";

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
    /**
     * Role changes made while someone is signed in (new sections, new permissions) only reach them through a new
     * token. Compare the saved permissions with the server's and, when they differ, rotate the token and update the menu.
     */
    syncSession: b.mutation<boolean, void>({
      async queryFn(_arg, api, _extra, baseQuery) {
        const auth = (api.getState() as { auth: AuthState }).auth;
        if (!auth.accessToken || !auth.refreshToken) return { data: false };
        const me = await baseQuery("/me");
        if (me.error) return { data: false };
        const fresh = me.data as AuthUser;
        const same = auth.user && auth.user.permissions.length === fresh.permissions.length && auth.user.permissions.every((p, i) => p === fresh.permissions[i]);
        if (same) return { data: false };
        const r = await baseQuery({ url: "/auth/refresh", method: "POST", body: { refreshToken: auth.refreshToken } });
        if (r.error) return { data: false };
        const t = r.data as { accessToken: string; refreshToken: string };
        api.dispatch(setCredentials({ accessToken: t.accessToken, refreshToken: t.refreshToken }));
        api.dispatch(setUser(fresh));
        return { data: true };
      },
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery, useSyncSessionMutation } = authApi;
