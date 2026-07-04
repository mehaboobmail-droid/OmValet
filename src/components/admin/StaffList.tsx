"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import type { CarsMap } from "@/hooks/useCars";
import type { StaffMap } from "@/hooks/useStaff";
import { toast } from "@/hooks/useToast";
import { deleteStaff, updateStaff } from "@/services/staff";
import type { StaffProfile } from "@/types/domain";
import { MIN_PASSWORD_LENGTH } from "@/constants";

interface StaffListProps {
  staff: StaffMap;
  cars: CarsMap;
}

export function StaffList({ staff, cars }: StaffListProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState<{ uid: string; profile: StaffProfile } | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const entries = Object.entries(staff);

  // Live cars-per-valet counts (legacy column).
  const carCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const car of Object.values(cars)) {
      if (car.valetUid) counts[car.valetUid] = (counts[car.valetUid] ?? 0) + 1;
    }
    return counts;
  }, [cars]);

  async function handleDelete(uid: string, profile: StaffProfile) {
    if (!window.confirm(`Delete account for ${profile.name || "this valet"}?`)) return;
    setBusyUid(uid);
    const result = await deleteStaff(uid);
    setBusyUid(null);
    if (result.ok) {
      toast.success("Account Deleted", `${profile.name || uid} removed`);
      if (result.warning) toast.warning("Note", result.warning);
    } else {
      toast.error("Delete Failed", result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Accounts</CardTitle>
        <Badge tone="gold">{entries.length} Valets</Badge>
      </CardHeader>

      {entries.length === 0 ? (
        <div className="p-5 text-center text-xs text-ink-dim">No valets yet</div>
      ) : (
        <div>
          {entries.map(([uid, profile]) => (
            <div
              key={uid}
              className="flex items-center gap-3 border-b border-edge px-4 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/15 text-[13px] font-semibold text-gold">
                {(profile.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">
                  {profile.name || "—"}{" "}
                  {profile.empId && (
                    <span className="text-[10px] text-ink-dim">({profile.empId})</span>
                  )}
                </div>
                <div className="truncate text-[10px] text-ink-muted">
                  {profile.email || "—"}
                  {profile.phone && ` · 📱 ${profile.phone}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-medium text-gold">
                  {carCounts[uid] ?? 0}
                </div>
                <div className="text-[9px] tracking-[0.08em] text-ink-dim">Cars</div>
              </div>
              <button
                type="button"
                title="Edit"
                aria-label={`Edit ${profile.name}`}
                disabled={busyUid === uid}
                onClick={() => setEditing({ uid, profile })}
                className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-gold-dim text-xs text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
              >
                ✎
              </button>
              {uid !== user?.uid ? (
                <button
                  type="button"
                  title="Delete"
                  aria-label={`Delete ${profile.name}`}
                  disabled={busyUid === uid}
                  onClick={() => handleDelete(uid, profile)}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-edge text-xs text-ink-dim transition-colors hover:border-danger hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                >
                  ✕
                </button>
              ) : (
                <div className="size-7" />
              )}
            </div>
          ))}
        </div>
      )}

      <EditStaffModal
        editing={editing}
        cars={cars}
        onClose={() => setEditing(null)}
      />
    </Card>
  );
}

function EditStaffModal({
  editing,
  cars,
  onClose,
}: {
  editing: { uid: string; profile: StaffProfile } | null;
  cars: CarsMap;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", empId: "", phone: "", notes: "", password: "" });
  const [pending, setPending] = useState(false);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  // Sync form when a new staff member is opened (render-time state sync).
  if (editing && editing.uid !== loadedUid) {
    setLoadedUid(editing.uid);
    setForm({
      name: editing.profile.name ?? "",
      empId: editing.profile.empId ?? "",
      phone: editing.profile.phone ?? "",
      notes: editing.profile.notes ?? "",
      password: "",
    });
  }

  function setField(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function save() {
    if (!editing) return;
    if (!form.name.trim()) {
      toast.warning("Missing Name", "Name is required");
      return;
    }
    if (form.password && form.password.length < MIN_PASSWORD_LENGTH) {
      toast.warning("Weak Password", `Minimum ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setPending(true);
    const result = await updateStaff(
      editing.uid,
      {
        name: form.name.trim(),
        empId: form.empId.trim(),
        phone: form.phone.replace(/[^\d]/g, "").slice(-10),
        notes: form.notes.trim(),
        password: form.password || undefined,
      },
      cars,
    );
    setPending(false);

    if (result.ok) {
      toast.success("Updated", `${form.name.trim()} profile saved`);
      if (result.warning) toast.warning("Note", result.warning);
      setLoadedUid(null);
      onClose();
    } else {
      toast.error("Save Failed", result.error);
    }
  }

  return (
    <Modal
      open={editing !== null}
      onClose={() => {
        setLoadedUid(null);
        onClose();
      }}
      title="Edit Staff Account"
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={setField("name")}
            disabled={pending}
          />
          <Input
            label="Employee ID"
            placeholder="V001"
            value={form.empId}
            onChange={setField("empId")}
            disabled={pending}
          />
        </div>
        <Input
          label="Email"
          value={editing?.profile.email ?? ""}
          disabled
          hint="Email cannot be changed"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="10-digit number"
            value={form.phone}
            onChange={setField("phone")}
            disabled={pending}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Leave blank to keep"
            value={form.password}
            onChange={setField("password")}
            disabled={pending}
          />
        </div>
        <Input
          label="Notes / Role"
          placeholder="e.g. Senior Valet, Night Shift Lead"
          value={form.notes}
          onChange={setField("notes")}
          disabled={pending}
        />
        <Button fullWidth loading={pending} onClick={save} className="mt-1">
          {pending ? "Saving…" : "Save Changes →"}
        </Button>
      </div>
    </Modal>
  );
}
