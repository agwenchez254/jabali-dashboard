import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/api/baseApi";
import auth from "./authSlice";

export const store = configureStore({
  reducer: { auth, [baseApi.reducerPath]: baseApi.reducer },
  middleware: (gdm) => gdm().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
