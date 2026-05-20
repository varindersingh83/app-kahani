import assert from "node:assert/strict";
import test from "node:test";
import {
  appendClarificationMessages,
  appendFocusMessages,
  buildInitialStoryChat,
} from "./storyChat";

test("initial story chat starts with one scoped Kahani prompt", () => {
  const messages = buildInitialStoryChat();

  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.role, "kahani");
  assert.match(messages[0]?.text ?? "", /clearest behavior/i);
});

test("clarification appends one question with optional choices", () => {
  const messages = appendClarificationMessages(
    buildInitialStoryChat(),
    "What is the clearest thing your child does?",
    ["clings", "screams"],
  );

  assert.equal(messages.length, 2);
  assert.match(messages[1]?.text ?? "", /clings/);
  assert.match(messages[1]?.text ?? "", /screams/);
});

test("focus messages keep parent note separate from behavior label storage", () => {
  const messages = appendFocusMessages(
    buildInitialStoryChat(),
    "bedtime transition practice",
    "Save the play, then offer one small choice.",
  );

  assert.equal(messages.length, 3);
  assert.match(messages[1]?.text ?? "", /Story focus/);
  assert.match(messages[2]?.text ?? "", /small choice/);
});
