import { useSyncExternalStore } from "react";
import type { Notice } from "./events";

const KEY = "jabali-admin-notices";
const MAX = 50;

function load(): Notice[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Notice[]) : [];
  } catch {
    return [];
  }
}

let notices: Notice[] = load();
const listeners = new Set<() => void>();

function set(next: Notice[]) {
  notices = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: notices last until reload */
  }
  listeners.forEach((l) => l());
}

export const noticeStore = {
  add(n: Notice) {
    if (notices.some((x) => x.id === n.id)) return;
    set([n, ...notices].slice(0, MAX));
  },
  markAllRead() {
    if (notices.some((n) => !n.read)) set(notices.map((n) => (n.read ? n : { ...n, read: true })));
  },
  clear() {
    set([]);
  },
};

/** Notices for this browser session, newest first. */
export function useNotices(): Notice[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => notices,
  );
}
