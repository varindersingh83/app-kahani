import assert from "node:assert/strict";
import test from "node:test";
import { buildMultiIssueNotice, planStoryIssues } from "./planner";

test("splits obvious multi-issue behavior prompts into separate story issues", () => {
  const result = planStoryIssues({
    mode: "behavior",
    prompt: "Meltdowns during transitions, Demanding screens constantly",
  });

  assert.deepEqual(
    result.map((issue) => issue.issue),
    ["Meltdowns during transitions", "Demanding screens constantly"],
  );
  assert.match(result[0]?.bookIntent ?? "", /focused behavior-support/);
  assert.equal(
    buildMultiIssueNotice(result),
    "We can generate one book for one issue at a time. Generating this book for: Meltdowns during transitions.",
  );
});

test("keeps a single issue as one planned book", () => {
  const result = planStoryIssues({
    mode: "behavior",
    prompt: "Meltdowns during transitions",
  });

  assert.equal(result.length, 1);
  assert.equal(result[0]?.issue, "Meltdowns during transitions");
  assert.equal(buildMultiIssueNotice(result), undefined);
});

test("caps planned issues so one prompt cannot fan out without bound", () => {
  const result = planStoryIssues({
    mode: "behavior",
    prompt: "Transitions, Screens, Hitting, Bedtime, Mealtime",
  });

  assert.deepEqual(
    result.map((issue) => issue.issue),
    ["Transitions", "Screens", "Hitting"],
  );
});
