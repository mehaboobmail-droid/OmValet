"use client";

import { useState } from "react";
import { ref, set } from "firebase/database";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { clientDb } from "@/firebase/client";
import { dbPaths } from "@/firebase/paths";
import { toast } from "@/hooks/useToast";
import type { SlotConfig } from "@/types/domain";
import { slotConfigSchema } from "@/types/schemas";
import { buildSlots } from "@/utils/slots";

/** Parking grid configuration (rows × slots-per-row) with live preview. */
export function SlotConfigCard({ current }: { current: SlotConfig }) {
  const [rows, setRows] = useState(current.rows);
  const [perRow, setPerRow] = useState(String(current.perRow));
  const [pending, setPending] = useState(false);

  const parsed = slotConfigSchema.safeParse({ rows, perRow });
  const previewSlots = parsed.success ? buildSlots(parsed.data) : [];
  const preview =
    previewSlots.length > 0
      ? `${previewSlots.length} slots (${previewSlots[0]} … ${previewSlots[previewSlots.length - 1]})`
      : "—";

  async function save() {
    if (!parsed.success) {
      toast.warning("Invalid Config", parsed.error.issues[0]?.message);
      return;
    }
    setPending(true);
    try {
      await set(ref(clientDb(), dbPaths.slotConfig), {
        rows: parsed.data.rows
          .split(",")
          .map((r) => r.trim().toUpperCase())
          .filter(Boolean)
          .join(","),
        perRow: parsed.data.perRow,
      });
      toast.success(
        "Slots Updated",
        `${previewSlots.length} slots across ${parsed.data.rows.split(",").filter((r) => r.trim()).length} rows`,
      );
    } catch (error) {
      toast.error("Save Failed", error instanceof Error ? error.message : "");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parking Slot Config</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Row Letters"
            hint="Comma separated, e.g. A, B, C, D"
            placeholder="A, B, C, D"
            value={rows}
            onChange={(e) => setRows(e.target.value)}
            disabled={pending}
          />
          <Input
            label="Slots Per Row"
            type="number"
            min={1}
            max={30}
            placeholder="10"
            value={perRow}
            onChange={(e) => setPerRow(e.target.value)}
            disabled={pending}
          />
        </div>
        <p className="text-[11px] text-ink-dim">Preview: {preview}</p>
        <Button fullWidth loading={pending} onClick={save}>
          Update Slots →
        </Button>
      </CardBody>
    </Card>
  );
}
