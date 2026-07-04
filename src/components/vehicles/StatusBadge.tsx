import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { CarStatus } from "@/types/domain";

const STATUS_CONFIG: Record<CarStatus, { label: string; tone: BadgeTone; pulse?: boolean }> = {
  parked: { label: "Parked", tone: "gold" },
  requesting: { label: "Retrieval Req", tone: "warning", pulse: true },
  ready: { label: "Ready", tone: "success" },
  scheduled: { label: "Scheduled", tone: "info" },
};

export function StatusBadge({ status }: { status: CarStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.parked;
  return (
    <Badge tone={config.tone} pulse={config.pulse}>
      {config.label}
    </Badge>
  );
}
