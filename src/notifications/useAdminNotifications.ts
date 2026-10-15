import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_URL, baseApi } from "@/api/baseApi";
import { authApi } from "@/api/auth";
import { playChime } from "@/lib/chime";
import { runEventStream } from "@/lib/sse";
import { signedFetch } from "@/lib/signedFetch";
import { useAppDispatch, useAppSelector, useCan } from "@/store/hooks";
import { noticeFor, parseOrderEvent } from "./events";
import { noticeStore } from "./store";

const URL = `${API_URL}/admin/notifications/stream`;

/**
 * Listens for live order events while a staff member who can see orders is signed in: each one adds a notice,
 * shows a pop-up, plays a sound, and refreshes the order, customer, stock and sales figures on screen.
 */
export function useAdminNotifications(): void {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const canSee = useCan("order:read");
  const token = useAppSelector((s) => s.auth.accessToken);
  const latest = useRef<string | null>(token);
  latest.current = token;
  const signedIn = !!token;

  useEffect(() => {
    if (!signedIn) {
      noticeStore.clear();
      return;
    }
    if (!canSee) return;
    const ctl = new AbortController();
    void runEventStream({
      url: URL,
      fetchFn: signedFetch,
      signal: ctl.signal,
      token: () => latest.current,
      // An expired access token: asking for the profile makes the API layer rotate it, and the loop reconnects with the new one.
      onUnauthorized: () => void dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })),
      onMessage: (m) => {
        if (m.event !== "order") return;
        const e = parseOrderEvent(m.data);
        if (!e) return;
        dispatch(baseApi.util.invalidateTags(["Order", "Analytics", "Inventory", "Customer"]));
        const n = noticeFor(e);
        noticeStore.add(n);
        playChime(n.tone);
        const show = n.tone === "alert" ? toast.error : toast.success;
        show(n.title, { description: n.body, action: { label: "View", onClick: () => navigate(`/orders?q=${encodeURIComponent(n.number)}`) } });
      },
    });
    return () => ctl.abort();
  }, [signedIn, canSee, dispatch, navigate]);
}
