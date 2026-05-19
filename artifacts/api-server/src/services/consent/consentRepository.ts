export type ConsentType = "onboarding" | "external_text_ai";

export type ConsentRecord = {
  userId: string;
  consentType: ConsentType;
  version: string;
  consentedAt: string;
  anonymousInstallIdEncrypted?: string;
  metadata: Record<string, unknown>;
};

export type ConsentRepository = {
  save(record: ConsentRecord): Promise<ConsentRecord>;
  latest(userId: string, consentType: ConsentType): Promise<ConsentRecord | null>;
};

export function createInMemoryConsentRepository(): ConsentRepository {
  const records: ConsentRecord[] = [];

  return {
    async save(record) {
      records.push(record);
      return record;
    },
    async latest(userId, consentType) {
      return (
        records
          .filter(
            (record) =>
              record.userId === userId && record.consentType === consentType,
          )
          .at(-1) ?? null
      );
    },
  };
}
