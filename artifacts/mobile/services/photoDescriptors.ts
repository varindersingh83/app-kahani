import type {
  CharacterPresentation,
  CharacterRole,
} from "./characterPrivacy";

export type CharacterDescriptorInput = {
  presentation?: CharacterPresentation;
  role?: CharacterRole;
  notes?: string;
};

export function buildCharacterDescriptor(input: CharacterDescriptorInput) {
  const notes = input.notes?.trim();
  const role =
    input.role === "adult" ? "adult caregiver" : "main child";
  const identity =
    input.presentation === "girl" || input.presentation === "boy"
      ? `The ${role} has ${input.presentation} presentation.`
      : `Use only the parent-entered appearance description for the ${role}; do not infer gender from the character's name.`;

  return notes ? `${identity} ${notes}.` : identity;
}
