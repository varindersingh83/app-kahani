import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMultiIssueNotice,
  classifyStoryRequest,
  planStoryIssues,
} from "./planner";

test("classifies bedtime separation anxiety", () => {
  const result = classifyStoryRequest({
    mode: "behavior",
    prompt: "my child won't sleep alone",
  });

  assert.equal(result.status, "classified");
  assert.equal(result.primary.scene, "bedtime");
  assert.equal(result.primary.mechanism, "separation anxiety");
  assert.match(result.parentNote, /ritual|return/i);
});

test("classifies bedtime transition resistance", () => {
  const result = classifyStoryRequest({
    mode: "behavior",
    prompt: "my child won't stop playing to get ready for bed",
  });

  assert.equal(result.status, "classified");
  assert.equal(result.primary.scene, "bedtime");
  assert.equal(result.primary.mechanism, "transition resistance");
  assert.match(result.primary.strategy, /transition/i);
});

test("asks one clarification question for vague bedtime prompts", () => {
  const result = classifyStoryRequest({
    mode: "behavior",
    prompt: "bedtime is awful",
  });

  assert.equal(result.status, "needs_clarification");
  assert.match(result.question, /clearest thing/i);
});

test("classifies plain mealtime refusal without asking for clarification", () => {
  const result = classifyStoryRequest({
    mode: "behavior",
    prompt: "Emma not eating her food.",
  });

  assert.equal(result.status, "classified");
  assert.equal(result.primary.categoryId, "mealtime_pressure");
  assert.equal(result.primary.storyFocusLabel, "mealtime calm practice");
});

test("uses clarification context to classify a vague prompt", () => {
  const result = classifyStoryRequest({
    mode: "behavior",
    prompt: "bedtime is awful",
    clarification: {
      originalPrompt: "bedtime is awful",
      answer: "he refuses to stop playing when bedtime starts",
    },
  });

  assert.equal(result.status, "classified");
  assert.equal(result.primary.categoryId, "bedtime_transition_resistance");
});

test("auto-picks the most intense visible behavior in a multi-issue prompt", () => {
  const result = classifyStoryRequest({
    mode: "behavior",
    prompt:
      "won't change clothes, asks me to stay, and screams when bedtime starts",
  });

  assert.equal(result.status, "classified");
  assert.equal(result.primary.categoryId, "bedtime_meltdown");
  assert.ok(result.secondary.some((issue) => issue.categoryId === "bedtime_separation"));
  assert.match(result.primary.strategy, /co-regulation/i);
});

test("plans classified issues with behavior package metadata", () => {
  const result = planStoryIssues({
    mode: "behavior",
    prompt: "Meltdowns during transitions and demanding screens constantly",
  });

  assert.equal(result[0]?.classification?.categoryId, "bedtime_meltdown");
  assert.match(result[0]?.bookIntent ?? "", /focused behavior-support/);
  assert.equal(
    buildMultiIssueNotice(result),
    "We can generate one book for one issue at a time. Generating this book for: bedtime meltdown recovery.",
  );
});

test("keeps a single issue as one planned book", () => {
  const result = planStoryIssues({
    mode: "behavior",
    prompt: "Meltdowns during transitions",
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.issue, "bedtime meltdown recovery");
  assert.equal(buildMultiIssueNotice(result), undefined);
});

test("caps planned issues so one prompt cannot fan out without bound", () => {
  const result = planStoryIssues({
    mode: "behavior",
    prompt: "Transitions, Screens, Hitting, School dropoff, Mealtime",
  });

  assert.equal(result.length, 3);
});
