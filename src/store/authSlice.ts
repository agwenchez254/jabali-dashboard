import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastLoginAt?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const STORAGE_KEY = "jabali-admin-auth";

function load(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {
    /* storage unavailable */
  }
  return { user: null, accessToken: null, refreshToken: null };
}

function persist(state: AuthState) {
  try {
    if (state.accessToken) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: load(),
  reducers: {
    setCredentials(state, a: PayloadAction<{ user?: AuthUser; accessToken: string; refreshToken: string }>) {
      if (a.payload.user) state.user = a.payload.user;
      state.accessToken = a.payload.accessToken;
      state.refreshToken = a.payload.refreshToken;
      persist(state);
    },
    setUser(state, a: PayloadAction<AuthUser>) {
      state.user = a.payload;
      persist(state);
    },
    loggedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      persist(state);
    },
  },
});

export const { setCredentials, setUser, loggedOut } = authSlice.actions;
export default authSlice.reducer;
