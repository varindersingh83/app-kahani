export type StoryChatMessage = {
  id: string;
  role: "parent" | "kahani";
  text: string;
  tone?: "normal" | "note" | "error" | "progress";
};

export type StoryClarificationState = {
  originalPrompt: string;
  question: string;
  choices?: string[];
};

export function createStoryChatMessage(
  role: StoryChatMessage["role"],
  text: string,
  tone: StoryChatMessage["tone"] = "normal",
): StoryChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    text,
    tone,
  };
}

export function buildInitialStoryChat(): StoryChatMessage[] {
  return [
    {
      id: "story-chat-welcome",
      role: "kahani",
      text: "Tell me what is happening with your child. I will focus the story on the clearest behavior.",
      tone: "note",
    },
  ];
}

export function appendClarificationMessages(
  messages: StoryChatMessage[],
  question: string,
  choices?: string[],
) {
  const choiceText =
    choices && choices.length > 0 ? `\n${choices.map((choice) => `• ${choice}`).join("\n")}` : "";
  return [
    ...messages,
    createStoryChatMessage("kahani", `${question}${choiceText}`, "note"),
  ];
}

export function appendFocusMessages(
  messages: StoryChatMessage[],
  focus?: string,
  parentNote?: string,
) {
  const next = [...messages];
  if (focus) {
    next.push(createStoryChatMessage("kahani", `Story focus: ${focus}`, "note"));
  }
  if (parentNote) {
    next.push(createStoryChatMessage("kahani", parentNote, "note"));
  }
  return next;
}
