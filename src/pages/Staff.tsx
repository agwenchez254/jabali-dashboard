import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateStaffMutation, useGetRolesQuery, useGetStaffQuery, useUpdateStaffMutation } from "@/api/operations";
import { useCan } from "@/store/hooks";
import { dateTime } from "@/lib/format";
import { PageHeader, StatusBadge, TableSkeleton, run } from "@/components/shared";

interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  staffCount?: number;
}

const SHOWN = 8;

function RoleCard({ role: r }: { role: Role }) {
  const name = r.name.replace("_", " ");
  const resources = new Set(r.permissions.map((p) => p.split(":")[0])).size;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-chart-1/40 hover:shadow-xl hover:shadow-chart-1/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-4 bg-linear-to-b from-chart-1/10 to-transparent p-6 pb-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-base font-medium uppercase text-primary-foreground">{name.charAt(0)}</span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-medium capitalize tracking-tight">{name}</h3>
            <p className="text-sm text-muted-foreground">{resources} {resources === 1 ? "area" : "areas"} of access</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-3xl font-medium leading-none tracking-tight tabular-nums">{r.staffCount ?? 0}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">staff</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 pb-6">
        {r.description && <p className="text-sm leading-relaxed text-muted-foreground">{r.description}</p>}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {r.permissions.slice(0, SHOWN).map((p) => (
            <Badge key={p} variant="secondary" className="font-mono text-[11px] font-normal">{p}</Badge>
          ))}
          {r.permissions.length > SHOWN && (
            <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground" title={r.permissions.slice(SHOWN).join(", ")}>+{r.permissions.length - SHOWN} more</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Staff() {
  const canWrite = useCan("staff:write");
  const { data: staff, isFetching } = useGetStaffQuery();
  const { data: roles = [] } = useGetRolesQuery();
  const [update] = useUpdateStaffMutation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader title="Staff and roles" description="Who can sign in, and what they can do.">
        {canWrite && (
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add staff
          </Button>
        )}
      </PageHeader>

      {isFetching && !staff ? (
        <TableSkeleton rows={4} />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Last sign-in</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">{s.email}</span>
                  </TableCell>
                  <TableCell>
                    {canWrite ? (
                      <Select value={s.role.id} onValueChange={(roleId) => run(update({ id: s.id, body: { roleId } }), "Role updated")}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id} className="capitalize">{r.name.replace("_", " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <span className="capitalize">{s.role.name.replace("_", " ")}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{dateTime(s.lastLoginAt)}</TableCell>
                  <TableCell>
                    {canWrite ? (
                      <Button variant="ghost" size="sm" className="h-auto p-0" onClick={() => run(update({ id: s.id, body: { status: s.status === "active" ? "disabled" : "active" } }), "Status updated")}>
                        <StatusBadge value={s.status} />
                      </Button>
                    ) : (
                      <StatusBadge value={s.status} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <h2 className="mb-4 mt-12 text-lg font-medium tracking-tight">Roles</h2>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((r) => (
          <RoleCard key={r.id} role={r} />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>{open && <AddStaff roles={roles} onClose={() => setOpen(false)} />}</DialogContent>
      </Dialog>
    </>
  );
}

function AddStaff({ roles, onClose }: { roles: { id: string; name: string }[]; onClose: () => void }) {
  const [create, { isLoading }] = useCreateStaffMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  return (
    <>
      <DialogHeader>
        <DialogTitle>Add staff member</DialogTitle>
        <DialogDescription>They can change their password after signing in.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="space-y-2"><Label htmlFor="sname">Name</Label><Input id="sname" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="semail">Email</Label><Input id="semail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="spass">Temporary password</Label><Input id="spass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a role" /></SelectTrigger>
            <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id} className="capitalize">{r.name.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={isLoading || !name.trim() || !email.trim() || password.length < 8 || !roleId} onClick={async () => { if (await run(create({ name: name.trim(), email: email.trim(), password, roleId }), "Staff member added")) onClose(); }}>
          {isLoading ? "Adding..." : "Add"}
        </Button>
      </DialogFooter>
    </>
  );
}
