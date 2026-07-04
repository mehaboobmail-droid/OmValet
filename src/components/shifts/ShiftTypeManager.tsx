"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SHIFT_COLORS } from "@/constants";
import type { ShiftTypesMap } from "@/hooks/useShiftTypes";
import { toast } from "@/hooks/useToast";
import { deleteShiftType, saveShiftType } from "@/services/shifts";
import { shiftTypeSchema } from "@/types/schemas";
import { cn } from "@/utils/cn";

const DEFAULT_FORM = {
  name: "",
  start: "06:00",
  end: "14:00",
  color: SHIFT_COLORS[0] as string,
};

/** Admin: define shift templates (name, hours, calendar colour). */
export function ShiftTypeManager({ shiftTypes }: { shiftTypes: ShiftTypesMap }) {
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function startEdit(id: string) {
    const st = shiftTypes[id];
    if (!st) return;
    setEditingId(id);
    setForm({
      name: st.name,
      start: st.start,
      end: st.end,
      color: st.color || DEFAULT_FORM.color,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
  }

  async function handleSave() {
    const parsed = shiftTypeSchema.safeParse(form);
    if (!parsed.success) {
      toast.warning(
        "Invalid Shift",
        z.flattenError(parsed.error).fieldErrors.name?.[0] ?? "Fill all fields",
      );
      return;
    }
    setPending(true);
    try {
      await saveShiftType(parsed.data, editingId ?? undefined);
      toast.success("Shift Saved", `${parsed.data.name} ${editingId ? "updated" : "created"}`);
      resetForm();
    } catch (error) {
      toast.error("Save Failed", error instanceof Error ? error.message : "");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this shift type?")) return;
    try {
      await deleteShiftType(id);
      toast.success("Deleted", "Shift type removed");
      if (editingId === id) resetForm();
    } catch (error) {
      toast.error("Delete Failed", error instanceof Error ? error.message : "");
    }
  }

  const entries = Object.entries(shiftTypes);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Shift Types</CardTitle>
          <Button size="sm" onClick={resetForm}>
            + Add
          </Button>
        </CardHeader>
        {entries.length === 0 ? (
          <div className="p-5 text-center text-xs text-ink-dim">
            No shift types yet — add one →
          </div>
        ) : (
          <div>
            {entries.map(([id, st]) => (
              <div
                key={id}
                className="flex items-center gap-2.5 border-b border-edge px-4 py-2.5 last:border-b-0"
              >
                <span
                  className="size-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: st.color || SHIFT_COLORS[0] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{st.name}</div>
                  <div className="text-[10px] text-ink-muted">
                    {st.start} – {st.end}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(id)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(id)}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Shift Type" : "New Shift Type"}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <Input
            label="Shift Name"
            required
            placeholder="e.g. Morning, Evening"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            disabled={pending}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              required
              type="time"
              value={form.start}
              onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
              disabled={pending}
            />
            <Input
              label="End Time"
              required
              type="time"
              value={form.end}
              onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
              disabled={pending}
            />
          </div>
          <div>
            <div className="text-label mb-2">Colour</div>
            <div className="flex flex-wrap gap-2">
              {SHIFT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Colour ${color}`}
                  aria-pressed={form.color === color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={cn(
                    "size-6 cursor-pointer rounded-md border-2 transition-transform",
                    form.color === color
                      ? "scale-115 border-white"
                      : "border-transparent hover:scale-110",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <Button fullWidth loading={pending} onClick={handleSave} className="mt-1">
            {editingId ? "Update Shift Type →" : "Save Shift Type →"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
