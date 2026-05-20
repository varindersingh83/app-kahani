import type { AppearanceSource } from "./characterPrivacy";

export type CharacterDescriptorInput = {
  presentation?: "from-photo" | "girl" | "boy";
  notes?: string;
  source?: AppearanceSource;
};

export function buildCharacterDescriptor(input: CharacterDescriptorInput) {
  const notes = input.notes?.trim();
  if (input.source === "local-photo" && notes) {
    return notes;
  }

  const identity =
    input.presentation === "girl" || input.presentation === "boy"
      ? `The main child is a ${input.presentation}.`
      : "Use only the parent-entered appearance description; do not infer gender from the child's name.";

  return notes ? `${identity} ${notes}.` : identity;
}
