export type CriticalAlertType =
  | "unsafe_output_blocked"
  | "photo_policy_violation"
  | "provider_failure_spike"
  | "stuck_worker"
  | "spend_cap_breach"
  | "deletion_failure"
  | "private_asset_access_anomaly";

export type CriticalAlert = {
  type: CriticalAlertType;
  severity: "critical";
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
};

export function buildCriticalAlert(input: {
  type: CriticalAlertType;
  metadata?: Record<string, string | number | boolean>;
  now?: Date;
}): CriticalAlert {
  return {
    type: input.type,
    severity: "critical",
    metadata: input.metadata ?? {},
    createdAt: (input.now ?? new Date()).toISOString(),
  };
}
