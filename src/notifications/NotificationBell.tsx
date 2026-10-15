import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isMuted, setMuted } from "@/lib/chime";
import { useCan } from "@/store/hooks";
import { noticeStore, useNotices } from "./store";

const ago = (at: number): string => {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86_400)} d ago`;
};

/** Bell in the top bar with live order notices and a sound switch. */
export function NotificationBell() {
  const canSee = useCan("order:read");
  const navigate = useNavigate();
  const notices = useNotices();
  const [muted, setMutedState] = useState(isMuted);
  const unread = notices.filter((n) => !n.read).length;
  if (!canSee) return null;

  return (
    <DropdownMenu onOpenChange={(open) => !open && noticeStore.markAllRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}>
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">{unread > 9 ? "9+" : unread}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between pr-1">
          <DropdownMenuLabel>Order notifications</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={muted ? "Turn notification sound on" : "Turn notification sound off"}
            onClick={(e) => {
              e.preventDefault();
              setMuted(!muted);
              setMutedState(!muted);
            }}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
        </div>
        <DropdownMenuSeparator />
        {notices.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet. New orders and status changes appear here live.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notices.map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5" onSelect={() => navigate(`/orders?q=${encodeURIComponent(n.number)}`)}>
                <span className="font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.body}</span>
                <span className="text-[11px] text-muted-foreground">{ago(n.at)}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
