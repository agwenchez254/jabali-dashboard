import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/api/baseApi";
import { useCreateRoleMutation, useDeleteRoleMutation, useGetPermissionCatalogueQuery, useUpdateRoleMutation } from "@/api/operations";
import { groupPermissions, isOwnerRole, roleLabel, samePermissions } from "@/lib/permissions";
import { ConfirmButton, run } from "@/components/shared";
import type { Role } from "@/components/RoleCard";

interface Props {
  /** The role to show or edit. Null opens the form for a new role. */
  role: Role | null;
  open: boolean;
  onClose: () => void;
  /** Holds staff:write. Without it the dialog only shows the role. */
  canWrite: boolean;
}

/** Details of a role with a switch for every permission. Also creates, renames and deletes roles. */
export function RoleDialog({ role, open, onClose, canWrite }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">{open && <RoleForm role={role} canWrite={canWrite} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function RoleForm({ role, canWrite, onClose }: Omit<Props, "open">) {
  const isNew = !role;
  const owner = !!role && isOwnerRole(role.name);
  const editable = canWrite && !owner;
  const { data: catalogue = [] } = useGetPermissionCatalogueQuery();
  const [create, { isLoading: creating }] = useCreateRoleMutation();
  const [update, { isLoading: saving }] = useUpdateRoleMutation();
  const [remove, { isLoading: removing }] = useDeleteRoleMutation();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [granted, setGranted] = useState<string[]>(role?.permissions ?? []);

  // The owner always holds everything the server knows about, even permissions added after it was seeded.
  useEffect(() => {
    if (owner && catalogue.length) setGranted(catalogue);
  }, [owner, catalogue]);

  const groups = useMemo(() => groupPermissions(catalogue.length ? catalogue : (role?.permissions ?? [])), [catalogue, role]);
  const staffCount = role?.staffCount ?? 0;
  const nameOk = name.trim().length >= 2;
  const dirty = !role || name.trim() !== role.name || (description ?? "").trim() !== (role.description ?? "") || !samePermissions(granted, role.permissions);

  const toggle = (id: string, on: boolean) => setGranted((g) => (on ? [...g, id] : g.filter((p) => p !== id)));
  const setGroup = (ids: string[], on: boolean) => setGranted((g) => (on ? [...new Set([...g, ...ids])] : g.filter((p) => !ids.includes(p))));

  const save = async () => {
    const body = { name: name.trim(), description: (description ?? "").trim(), permissions: granted };
    const ok = !role ? await run(create(body), "Role created") : await run(update({ id: role.id, body }), "Role saved");
    if (ok) onClose();
  };

  const del = async () => {
    if (!role) return;
    try {
      await remove(role.id).unwrap();
      toast.success("Role deleted");
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="capitalize">{!role ? "New role" : roleLabel(role.name)}</DialogTitle>
        <DialogDescription>
          {!role
            ? "Choose what people with this role can do. You can change it later."
            : owner
              ? "The owner role always has full access and cannot be changed or deleted."
              : `${granted.length} of ${catalogue.length || granted.length} permissions on. ${staffCount} ${staffCount === 1 ? "person has" : "people have"} this role. Changes reach them when their session refreshes.`}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" value={name} maxLength={60} readOnly={!editable} onChange={(e) => setName(e.target.value)} placeholder="e.g. support_agent" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea id="role-desc" rows={1} value={description ?? ""} maxLength={200} readOnly={!editable} onChange={(e) => setDescription(e.target.value)} placeholder="What this role is for" />
          </div>
        </div>

        <div className="max-h-[48vh] space-y-4 overflow-y-auto rounded-xl border p-4">
          {groups.map((g) => {
            const ids = g.permissions.map((p) => p.id);
            const allOn = ids.every((id) => granted.includes(id));
            return (
              <section key={g.resource} aria-label={g.label}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{g.label}</h4>
                  {editable && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setGroup(ids, !allOn)}>
                      {allOn ? "Turn all off" : "Turn all on"}
                    </Button>
                  )}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {g.permissions.map((p) => (
                    <label key={p.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                      <span>
                        {p.label}
                        <span className="block font-mono text-[11px] text-muted-foreground">{p.id}</span>
                      </span>
                      <Switch checked={granted.includes(p.id)} disabled={!editable} onCheckedChange={(on) => toggle(p.id, on)} aria-label={`${p.label} ${g.label}`} />
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <DialogFooter className="items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {owner && (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" /> Read only
            </span>
          )}
          {role && editable && staffCount > 0 && <span>Reassign its {staffCount} {staffCount === 1 ? "person" : "people"} before deleting this role.</span>}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {role && editable && (
            <ConfirmButton
              title={`Delete the ${roleLabel(role.name)} role?`}
              description="The role is removed for good. This only works when nobody has it."
              onConfirm={() => void del()}
              trigger={
                <Button variant="outline" className="text-destructive" disabled={staffCount > 0 || removing} title={staffCount > 0 ? "People still have this role" : undefined}>
                  <Trash2 /> Delete
                </Button>
              }
            />
          )}
          <Button variant="outline" onClick={onClose}>
            {editable ? "Cancel" : "Close"}
          </Button>
          {editable && (
            <Button disabled={!nameOk || !dirty || creating || saving} onClick={() => void save()}>
              {creating || saving ? "Saving..." : isNew ? "Create role" : "Save changes"}
            </Button>
          )}
        </div>
      </DialogFooter>
    </>
  );
}
