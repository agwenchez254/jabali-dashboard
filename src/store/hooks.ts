import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** True when the signed-in staff member holds the permission. */
export function useCan(permission: string): boolean {
  return useAppSelector((s) => s.auth.user?.permissions.includes(permission) ?? false);
}
