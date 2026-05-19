import assert from "node:assert/strict";
import test from "node:test";
import { buildRetryLearningLesson, formatLearningHints } from "./learning";

test("learning lesson records page retry failures in reusable language", () => {
  const lesson = buildRetryLearningLesson({
    pageNumber: 4,
    retryCount: 2,
    failures: ["illustration prompt must include watercolor style", "alignment score 0.62 below 0.72"],
  });

  assert.equal(
    lesson,
    "Page 4 needed retry 2 because illustration prompt must include watercolor style; alignment score 0.62 below 0.72",
  );
});

test("learning lesson handles setup-level failures", () => {
  const lesson = buildRetryLearningLesson({
    retryCount: 0,
    failures: ["expected 12 pages, received 9"],
  });

  assert.equal(lesson, "Book setup needed retry 0 because expected 12 pages, received 9");
});

test("learning hints are empty when there are no lessons", () => {
  assert.equal(formatLearningHints([]), "");
});

test("learning hints format recent lessons without changing rules automatically", () => {
  const hints = formatLearningHints([
    { lesson: "Page 2 needed retry because child name was missing" },
    { lesson: "Page 8 needed retry because watercolor style was missing" },
  ]);

  assert.equal(
    hints,
    [
      "Recent production lessons to avoid repeating:",
      "- Page 2 needed retry because child name was missing",
      "- Page 8 needed retry because watercolor style was missing",
    ].join("\n"),
  );
});
