import assert from "node:assert/strict";
import test from "node:test";
import {
  generateApprovedStoryConcepts,
  type JsonChatClient,
} from "./storyConceptGenerator";
import type { BehaviorTemplate, ReferenceBook } from "./types";

const behavior: BehaviorTemplate = {
  categoryId: "template_1_full_body_tantrum_when_told_no",
  sourceRow: 1,
  scene: "bedroom",
  visibleBehavior: "Full-body tantrum when told no",
  mechanism: "Seeking control or autonomy.",
  strategy: "Give warning and a clear next step.",
  childStorySkill: "practice one small next step",
  parentGuidance: "Give warning and a clear next step. Avoid yelling.",
  targetOutcome: "Child accepts the limit with protest but moves to a choice.",
  storyFocusLabel: "Full-body tantrum when told no",
  avoidDoing: "Do not yell or give the forbidden item.",
};

const referenceBooks: ReferenceBook[] = Array.from({ length: 5 }, (_, index) => ({
  title: `Reference ${index + 1}`,
  author: `Author ${index + 1}`,
  source: "open_library",
  sourceId: `/works/OL${index + 1}W`,
}));

function concept(title: string) {
  return {
    title,
    coreTheme: "Emotional regulation and limits",
    story: "{child_name} wanted the shiny truck. {parent_name} stayed close.",
    endingMessage: "Limits feel safer with love nearby.",
    placeholders: ["{child_name}", "{parent_name}"],
    toolsOrRituals: ["dragon breaths"],
    inspiredBy: ["Reference 1"],
  };
}

test("accepts three passing concepts from the first batch and stops", async () => {
  let calls = 0;
  const client: JsonChatClient = async (_system, prompt) => {
    calls += 1;
    if (/Return exactly 3 story concepts/.test(prompt)) {
      return {
        data: { concepts: [concept("A"), concept("B"), concept("C")] },
        usage: { total_tokens: 10 },
      };
    }
    return {
      data: {
        pass: true,
        score: 9,
        reasons: ["Strong parent action."],
        requiredFixes: [],
        safetyFlags: [],
      },
      usage: { total_tokens: 1 },
    };
  };

  const result = await generateApprovedStoryConcepts({
    behavior,
    referenceBooks,
    jsonClient: client,
  });

  assert.deepEqual(result.concepts.map((entry) => entry.title), ["A", "B", "C"]);
  assert.equal(result.status.status, "complete");
  assert.equal(result.attempts.length, 1);
  assert.equal(calls, 4);
  assert.equal(result.usage?.total_tokens, 13);
});

test("saves partial approved concepts after max batches", async () => {
  let batch = 0;
  const client: JsonChatClient = async (_system, prompt) => {
    if (/Return exactly 2 story concepts/.test(prompt)) {
      batch += 1;
      return {
        data: {
          concepts: [
            concept(`Passing ${batch}`),
            concept(`Failing ${batch}`),
          ],
        },
      };
    }
    const title = prompt.match(/"title": "([^"]+)"/)?.[1] ?? "";
    return {
      data: {
        pass: /^Passing [12]$/.test(title),
        score: /^Passing [12]$/.test(title) ? 9 : 4,
        reasons: /^Passing [12]$/.test(title)
          ? ["Good."]
          : ["Parent action is generic."],
        requiredFixes: ["Show the actual replacement action."],
        safetyFlags: [],
      },
    };
  };

  const result = await generateApprovedStoryConcepts({
    behavior,
    referenceBooks,
    jsonClient: client,
    batchSize: 2,
    maxBatches: 2,
    targetCount: 3,
  });

  assert.deepEqual(result.concepts.map((entry) => entry.title), [
    "Passing 1",
    "Passing 2",
  ]);
  assert.equal(result.status.status, "manual_review_needed");
  assert.equal(result.status.missingCount, 1);
  assert.match(result.status.warnings.join("\n"), /Only 2 of 3/);
});

test("excludes failed concepts from final output while retaining attempt notes", async () => {
  const client: JsonChatClient = async (_system, prompt) => {
    if (/Return exactly 1 story concepts/.test(prompt)) {
      return { data: { concepts: [concept("Bad Idea")] } };
    }
    return {
      data: {
        pass: false,
        score: 3,
        reasons: ["Unsafe parent action."],
        requiredFixes: ["Block danger first."],
        safetyFlags: ["unsafe"],
      },
    };
  };

  const result = await generateApprovedStoryConcepts({
    behavior,
    referenceBooks,
    jsonClient: client,
    batchSize: 1,
    maxBatches: 1,
  });

  assert.deepEqual(result.concepts, []);
  assert.equal(result.attempts[0]?.candidates[0]?.title, "Bad Idea");
  assert.deepEqual(result.attempts[0]?.candidates[0]?.reasons, [
    "Unsafe parent action.",
  ]);
});

test("handles invalid candidate batches as failed attempts", async () => {
  const client: JsonChatClient = async () => ({ data: { concepts: [{ title: "No body" }] } });

  const result = await generateApprovedStoryConcepts({
    behavior,
    referenceBooks,
    jsonClient: client,
    maxBatches: 1,
  });

  assert.equal(result.concepts.length, 0);
  assert.deepEqual(result.attempts[0]?.candidates[0]?.reasons, [
    "No valid story concepts returned.",
  ]);
});

test("rejects duplicate approved titles within one issue", async () => {
  const client: JsonChatClient = async (_system, prompt) => {
    if (/Return exactly 3 story concepts/.test(prompt)) {
      return {
        data: {
          concepts: [concept("Same"), concept("Same"), concept("Different")],
        },
      };
    }
    return {
      data: {
        pass: true,
        score: 9,
        reasons: ["Good."],
        requiredFixes: [],
        safetyFlags: [],
      },
    };
  };

  const result = await generateApprovedStoryConcepts({
    behavior,
    referenceBooks,
    jsonClient: client,
    maxBatches: 1,
  });

  assert.deepEqual(result.concepts.map((entry) => entry.title), [
    "Same",
    "Different",
  ]);
  assert.match(
    result.attempts[0]?.candidates.map((entry) => entry.reasons.join(" ")).join("\n") ?? "",
    /Duplicate approved title/,
  );
});
