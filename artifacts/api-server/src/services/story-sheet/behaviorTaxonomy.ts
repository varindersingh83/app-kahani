import type { BehaviorClassificationSummary } from "./types";

export type BehaviorTaxonomyEntry = BehaviorClassificationSummary & {
  aliases: string[];
  intensity: number;
  redFlagExclusions?: string[];
};

export const BEHAVIOR_TAXONOMY: BehaviorTaxonomyEntry[] = [
  {
    categoryId: "bedtime_separation",
    scene: "bedtime",
    visibleBehavior: "resists sleeping alone or needs parent to stay",
    mechanism: "separation anxiety",
    strategy: "connection before separation with a predictable check-in ritual",
    childStorySkill: "practice a tiny goodbye and trust the caregiver returns",
    parentGuidance:
      "Use the same short connection ritual and return briefly when promised.",
    targetOutcome:
      "Child can begin bedtime with a small, supported separation step.",
    storyFocusLabel: "bedtime separation practice",
    aliases: [
      "sleep alone",
      "won't sleep alone",
      "wont sleep alone",
      "needs me to stay",
      "asks me to stay",
      "stay with them",
      "separation",
      "alone in bed",
    ],
    intensity: 70,
  },
  {
    categoryId: "bedtime_transition_resistance",
    scene: "bedtime",
    visibleBehavior: "resists stopping play or moving into the bedtime routine",
    mechanism: "transition resistance",
    strategy: "predictable transition bridge with one limited choice",
    childStorySkill: "pause play, save a place, and take the next small step",
    parentGuidance:
      "Give one clear transition cue, save the play, and offer one bounded choice.",
    targetOutcome:
      "Child can move from play toward bedtime with support and one small choice.",
    storyFocusLabel: "bedtime transition practice",
    aliases: [
      "stop playing",
      "won't stop playing",
      "wont stop playing",
      "get ready for bed",
      "bedtime starts",
      "bedtime routine",
      "changing clothes",
      "change clothes",
      "not changing clothes",
    ],
    intensity: 65,
  },
  {
    categoryId: "bedtime_meltdown",
    scene: "bedtime",
    visibleBehavior: "screams or melts down when bedtime begins",
    mechanism: "overwhelmed transition",
    strategy: "co-regulation first, then one tiny bedtime step",
    childStorySkill: "let the body get helped before trying the next step",
    parentGuidance:
      "Lower demands briefly, help the child settle, then return to one tiny next step.",
    targetOutcome:
      "Child can recover from the protest enough to try one small bedtime action.",
    storyFocusLabel: "bedtime meltdown recovery",
    aliases: [
      "screams",
      "screaming",
      "meltdown",
      "meltdowns",
      "tantrum",
      "tantrums",
      "cries",
      "crying",
      "bedtime is awful",
    ],
    intensity: 95,
  },
  {
    categoryId: "sharing_turn_taking",
    scene: "sharing and play",
    visibleBehavior: "grabs, refuses, or struggles to share toys",
    mechanism: "turn-taking frustration",
    strategy: "clear turn boundary with a concrete return cue",
    childStorySkill: "wait for a turn and trust the toy can come back",
    parentGuidance:
      "Name whose turn it is, show when the turn changes, and keep the return cue concrete.",
    targetOutcome:
      "Child can tolerate a short wait and rejoin play after a turn changes.",
    storyFocusLabel: "sharing and turn-taking practice",
    aliases: [
      "share",
      "sharing",
      "won't share",
      "wont share",
      "blocks with friends",
      "grabs toys",
      "takes toys",
      "turn taking",
      "turn-taking",
    ],
    intensity: 60,
  },
  {
    categoryId: "screen_limit_resistance",
    scene: "screens",
    visibleBehavior: "protests when screen time ends",
    mechanism: "limit frustration",
    strategy: "preview the ending and move into a concrete next activity",
    childStorySkill: "finish a favorite thing and find the next real-world action",
    parentGuidance:
      "Preview the ending, hold the limit, and immediately anchor the next activity.",
    targetOutcome:
      "Child can move away from a screen with protest but without the screen returning.",
    storyFocusLabel: "screen ending practice",
    aliases: [
      "screens",
      "screen time",
      "tablet",
      "ipad",
      "phone",
      "tv",
      "won't turn off",
      "wont turn off",
    ],
    intensity: 72,
  },
  {
    categoryId: "aggression_impulse",
    scene: "sibling or peer play",
    visibleBehavior: "hits, pushes, or throws when upset",
    mechanism: "impulse control under frustration",
    strategy: "block unsafe action and redirect to a safe physical action",
    childStorySkill: "stop hands and use a safe action before repair",
    parentGuidance:
      "Stop unsafe hands calmly, keep everyone safe, then offer a concrete repair.",
    targetOutcome:
      "Child can have the impulse interrupted and practice a safe repair.",
    storyFocusLabel: "gentle hands repair practice",
    aliases: ["hits", "hitting", "pushes", "pushing", "throws", "biting", "bites"],
    intensity: 90,
  },
  {
    categoryId: "cleanup_transition",
    scene: "cleanup",
    visibleBehavior: "refuses cleanup or leaving a play setup",
    mechanism: "transition resistance",
    strategy: "make the stopping point visible and start with one concrete job",
    childStorySkill: "save what matters and do the first tiny cleanup action",
    parentGuidance:
      "Mark what can stay, choose the first tiny cleanup job, and keep the limit concrete.",
    targetOutcome: "Child can begin cleanup without needing the whole job to feel easy.",
    storyFocusLabel: "cleanup transition practice",
    aliases: ["cleanup", "clean up", "put toys away", "won't clean", "wont clean"],
    intensity: 55,
  },
  {
    categoryId: "school_dropoff_separation",
    scene: "school dropoff",
    visibleBehavior: "clings or cries at preschool or daycare dropoff",
    mechanism: "separation anxiety",
    strategy: "brief goodbye ritual with confident return language",
    childStorySkill: "hold a goodbye routine and join the next safe adult",
    parentGuidance:
      "Keep goodbye short and repeatable, then leave after the ritual.",
    targetOutcome:
      "Child can move through dropoff with support and a familiar goodbye pattern.",
    storyFocusLabel: "dropoff separation practice",
    aliases: ["dropoff", "drop off", "school", "preschool", "daycare", "clings"],
    intensity: 78,
  },
  {
    categoryId: "mealtime_pressure",
    scene: "meals",
    visibleBehavior: "refuses food or argues at meals",
    mechanism: "autonomy and sensory caution",
    strategy: "reduce pressure and keep mealtime predictable",
    childStorySkill: "notice food without pressure and stay connected at the table",
    parentGuidance:
      "Avoid pressure or rewards; keep the meal calm and predictable.",
    targetOutcome:
      "Child can remain near food calmly without tasting being the victory.",
    storyFocusLabel: "mealtime calm practice",
    aliases: ["won't eat", "wont eat", "refuses food", "picky", "mealtime", "dinner"],
    intensity: 68,
    redFlagExclusions: ["losing weight", "weight loss", "choking", "vomiting"],
  },
  {
    categoryId: "public_place_limit",
    scene: "public places",
    visibleBehavior: "runs, grabs, or melts down in a store or public place",
    mechanism: "limit frustration in a stimulating place",
    strategy: "clear body boundary and one concrete job",
    childStorySkill: "keep body close and help with one simple public-place job",
    parentGuidance:
      "Use a simple body boundary and give one concrete helper job.",
    targetOutcome:
      "Child can stay closer and participate in one small public-place action.",
    storyFocusLabel: "public-place body boundary practice",
    aliases: ["store", "grocery", "public", "runs away", "cart", "shopping"],
    intensity: 82,
  },
];

export function validateBehaviorTaxonomy(entries = BEHAVIOR_TAXONOMY) {
  const seenAliases = new Map<string, string>();
  const errors: string[] = [];

  for (const entry of entries) {
    for (const field of [
      "categoryId",
      "scene",
      "visibleBehavior",
      "mechanism",
      "strategy",
      "childStorySkill",
      "parentGuidance",
      "targetOutcome",
      "storyFocusLabel",
    ] as const) {
      if (!entry[field]?.trim()) errors.push(`${entry.categoryId} missing ${field}`);
    }
    if (entry.aliases.length === 0) errors.push(`${entry.categoryId} missing aliases`);

    for (const alias of entry.aliases) {
      const key = alias.toLowerCase().trim();
      const existing = seenAliases.get(key);
      if (existing && existing !== entry.categoryId) {
        errors.push(`alias "${alias}" appears in ${existing} and ${entry.categoryId}`);
      }
      seenAliases.set(key, entry.categoryId);
    }
  }

  return errors;
}

export function toClassificationSummary(
  entry: BehaviorTaxonomyEntry,
): BehaviorClassificationSummary {
  return {
    categoryId: entry.categoryId,
    scene: entry.scene,
    visibleBehavior: entry.visibleBehavior,
    mechanism: entry.mechanism,
    strategy: entry.strategy,
    childStorySkill: entry.childStorySkill,
    parentGuidance: entry.parentGuidance,
    targetOutcome: entry.targetOutcome,
    storyFocusLabel: entry.storyFocusLabel,
  };
}

export function findBehaviorMatches(input: string) {
  const normalized = normalize(input);
  return BEHAVIOR_TAXONOMY.map((entry) => {
    const score = entry.aliases.reduce(
      (total, alias) => total + (normalized.includes(normalize(alias)) ? 1 : 0),
      0,
    );
    return { entry, score };
  })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.entry.intensity - a.entry.intensity || b.score - a.score);
}

export function isVagueBehaviorPrompt(input: string) {
  const normalized = normalize(input);
  if (!normalized) return true;
  return (
    /\b(awful|hard|difficult|bad|struggle|struggling|problem|issue|rough)\b/.test(
      normalized,
    ) &&
    /\b(bedtime|meal|school|dropoff|screen|public|cleanup|sharing|transition)\b/.test(
      normalized,
    )
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[\u2018\u2019']/g, "'").replace(/\s+/g, " ").trim();
}
