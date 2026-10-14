import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetMeQuery } from "@/api/auth";
import { useAppSelector } from "@/store/hooks";
import { dateTime, initials } from "@/lib/format";
import { PageHeader } from "@/components/shared";

const themes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export default function Profile() {
  const stored = useAppSelector((s) => s.auth.user);
  const { data } = useGetMeQuery();
  const { theme, setTheme } = useTheme();
  const user = data ?? stored;
  if (!user) return null;

  return (
    <>
      <PageHeader title="Profile" description="Your account and preferences." />
      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">Last sign-in {dateTime(user.lastLoginAt)}</p>
            </div>
            <Badge className="ml-auto capitalize">{user.role.replace("_", " ")}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Choose how the dashboard looks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {themes.map((t) => (
              <Button key={t.id} variant={theme === t.id ? "default" : "outline"} onClick={() => setTheme(t.id)}>
                <t.icon /> {t.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissions</CardTitle>
            <CardDescription>What your role allows you to do.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {user.permissions.map((p) => (
              <Badge key={p} variant="secondary" className="font-mono text-[11px] font-normal">{p}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
