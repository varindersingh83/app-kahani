import assert from "node:assert/strict";
import test from "node:test";
import {
  BEHAVIOR_TAXONOMY,
  findBehaviorMatches,
  validateBehaviorTaxonomy,
} from "./behaviorTaxonomy";

test("taxonomy entries include required story-planning fields", () => {
  assert.deepEqual(validateBehaviorTaxonomy(), []);
});

test("covers bedtime separation anxiety", () => {
  const match = findBehaviorMatches("my child won't sleep alone")[0];

  assert.equal(match?.entry.categoryId, "bedtime_separation");
  assert.equal(match.entry.scene, "bedtime");
  assert.equal(match.entry.mechanism, "separation anxiety");
  assert.match(match.entry.strategy, /connection/i);
});

test("covers bedtime transition resistance", () => {
  const match = findBehaviorMatches(
    "my child won't stop playing to get ready for bed",
  )[0];

  assert.equal(match?.entry.categoryId, "bedtime_transition_resistance");
  assert.equal(match.entry.mechanism, "transition resistance");
  assert.match(match.entry.strategy, /transition/i);
});

test("covers sharing and turn-taking", () => {
  const match = findBehaviorMatches("won't share blocks with friends")[0];

  assert.equal(match?.entry.categoryId, "sharing_turn_taking");
  assert.match(match.entry.childStorySkill, /turn/i);
});

test("rejects duplicate aliases across normal taxonomy entries", () => {
  const duplicated = [
    ...BEHAVIOR_TAXONOMY,
    {
      ...BEHAVIOR_TAXONOMY[0],
      categoryId: "duplicate_alias",
    },
  ];

  assert.ok(validateBehaviorTaxonomy(duplicated).some((error) => /alias/.test(error)));
});
