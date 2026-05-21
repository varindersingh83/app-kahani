import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(import.meta.dirname, "..");
const defaultModel = "openai/gpt-5.4-nano";
const behaviorPrompts = [
  "Emma screams when it is time to leave the park.",
  "Emma will not eat her dinner.",
  "Emma keeps throwing toys when she is mad.",
  "Emma will not clean up her toys.",
  "Emma keeps grabbing toys from other kids.",
  "Emma screams when she cannot have the tablet.",
  "Emma runs away when it is time to put on shoes.",
  "Emma will not stop playing to get ready for bed.",
  "Emma hits when another child takes a toy.",
  "Emma refuses to sit at the table.",
  "Emma cries when it is time to get in the car.",
  "Emma keeps dumping blocks instead of cleaning up.",
  "Emma will not share the swing.",
  "Emma shouts when she has to wait.",
  "Emma throws food from the table.",
  "Emma will not hold hands near the street.",
  "Emma knocks over towers when she is frustrated.",
  "Emma keeps asking for one more show.",
  "Emma grabs crayons from her brother.",
  "Emma hides when it is time to leave preschool.",
];

const args = parseArgs(process.argv.slice(2));
const iterations = Number(args.iterations ?? args.n ?? 100);
const offline = isTruthy(args.offline) || isTruthy(process.env.STORY_RATING_LOOP_OFFLINE);
const runId =
  args.runId ??
  new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
const outputRoot = path.join(repoRoot, "artifacts", "story-rating-iterations", runId);
const sleepMs = Number(args.sleepMs ?? 250);

await loadDotEnv(path.join(repoRoot, ".env"));

const config = offline ? null : getAiConfig();
if (!offline && !config) {
  throw new Error(
    "Missing AI config. Set AI_INTEGRATIONS_OPENROUTER_BASE_URL and AI_INTEGRATIONS_OPENROUTER_API_KEY.",
  );
}

const seedLearningPath = path.join(
  repoRoot,
  "docs",
  "brainstorms",
  "2026-05-21-story-rating-learning.md",
);
const seedLearning = await readFile(seedLearningPath, "utf8");
let learning = seedLearning;
const iterationsJsonl = path.join(outputRoot, "iterations.jsonl");
const iterationsMd = path.join(outputRoot, "iterations.md");
const learningMd = path.join(outputRoot, "learning.md");
const summaryMd = path.join(outputRoot, "summary.md");

await mkdir(outputRoot, { recursive: true });
await writeFile(
  path.join(outputRoot, "run-config.json"),
  `${JSON.stringify(
    {
      runId,
      iterations,
      mode: offline ? "offline-local-rubric" : "provider",
      model: config?.model ?? null,
      startedAt: new Date().toISOString(),
      seedLearningPath: path.relative(repoRoot, seedLearningPath),
    },
    null,
    2,
  )}\n`,
);
await writeFile(iterationsMd, `# Story Rating Iterations\n\nRun: ${runId}\n\n`);
await writeFile(learningMd, learning);

const results = [];
const offlineState = {
  avoid: new Set(),
  reinforce: new Set(),
};
for (let index = 0; index < iterations; index += 1) {
  const prompt = behaviorPrompts[index % behaviorPrompts.length];
  const result = offline
    ? runOfflineIteration({
        iteration: index + 1,
        prompt,
        learning,
        previousResults: results.slice(-8),
        state: offlineState,
      })
    : await runIteration({
        config,
        iteration: index + 1,
        prompt,
        learning,
        previousResults: results.slice(-8),
      });

  results.push(result);
  learning = mergeLearning(learning, result.learning_addition);

  await appendJsonLine(iterationsJsonl, result);
  await appendIterationMarkdown(iterationsMd, result);
  await writeFile(learningMd, learning);
  await writeFile(summaryMd, buildSummary(results, learning));

  console.log(
    `iteration ${result.iteration}/${iterations}: ${result.rating} ${result.score}/10 - ${result.prompt}`,
  );

  if (sleepMs > 0 && index < iterations - 1) {
    await new Promise((resolve) => setTimeout(resolve, sleepMs));
  }
}

await writeFile(summaryMd, buildSummary(results, learning, true));
console.log(`\nDone. Wrote ${path.relative(repoRoot, outputRoot)}`);

async function runIteration({
  config,
  iteration,
  prompt,
  learning,
  previousResults,
}) {
  const userPrompt = [
    "You are running a sequential self-improvement loop for Kahani story generation.",
    "Generate exactly one short picture-book behavior story, then rate it using the current rubric.",
    "Use the user's taste, not generic expert-only taste.",
    "Important learned taste:",
    learning,
    "Recent iteration outcomes:",
    JSON.stringify(
      previousResults.map((result) => ({
        iteration: result.iteration,
        prompt: result.prompt,
        rating: result.rating,
        score: result.score,
        failure: result.failure_mode,
        learning: result.learning_addition,
      })),
      null,
      2,
    ),
    "Current parent prompt:",
    prompt,
    "Output valid JSON only with this exact shape:",
    JSON.stringify(
      {
        iteration,
        prompt,
        story_title: "short title",
        story_pages: [
          "page 1 text",
          "page 2 text",
          "page 3 text",
          "page 4 text",
          "page 5 text",
          "page 6 text",
          "page 7 text",
          "page 8 text",
        ],
        rating: "Good or Bad",
        score: 8,
        rating_reason: "specific reason in the user's taste",
        parent_action: "what the parent did",
        failure_mode: "none or specific failure",
        learning_addition: "one durable rubric note learned or reinforced",
        prompt_rule_to_keep: "one generator rule for future stories",
      },
      null,
      2,
    ),
    "Rating rules:",
    "- Good means the parent action is practical, recognizable, likely to work, and the child makes a clear next-step behavior change.",
    "- Good may include rewards, simple moral language, empathy, or playful pretend if it plausibly works for ages 2-5.",
    "- Bad means the strategy is unsafe, physically odd, parent-unrealistic, unrelated to the target behavior, confusing, or just poetic without a useful action.",
    "- Be nitpicky about literal wording and parent practicality.",
    "- If a story is bad, the learning_addition must be a concrete rule that would prevent that failure next time.",
  ].join("\n\n");

  const response = await requestJson(config, {
    system:
      "You are a strict story-generation evaluator. Return valid JSON only. No markdown.",
    user: userPrompt,
  });

  return {
    ...response,
    iteration,
    prompt,
    rating:
      response.rating === "Good" || response.rating === "Bad"
        ? response.rating
        : Number(response.score) >= 7
          ? "Good"
          : "Bad",
    score: clampScore(response.score),
    story_pages: Array.isArray(response.story_pages)
      ? response.story_pages.slice(0, 12).map(String)
      : [],
    created_at: new Date().toISOString(),
  };
}

function runOfflineIteration({ iteration, prompt, state }) {
  const type = classifyPrompt(prompt);
  const strategy = chooseOfflineStrategy(type, iteration, state);
  const story = buildOfflineStory(type, prompt, strategy);
  const evaluation = evaluateOfflineStory(type, strategy, story);

  if (evaluation.rating === "Bad") {
    state.avoid.add(strategy.key);
  } else {
    state.reinforce.add(strategy.key);
  }

  return {
    iteration,
    prompt,
    story_title: story.title,
    story_pages: story.pages,
    rating: evaluation.rating,
    score: evaluation.score,
    rating_reason: evaluation.reason,
    parent_action: strategy.parentAction,
    failure_mode: evaluation.failureMode,
    learning_addition: evaluation.learning,
    prompt_rule_to_keep: evaluation.rule,
    created_at: new Date().toISOString(),
  };
}

function classifyPrompt(prompt) {
  const lower = prompt.toLowerCase();
  if (/eat|dinner|food|table/.test(lower)) return "food";
  if (/throw|hit|knock/.test(lower)) return "unsafe";
  if (/clean|dumping|blocks/.test(lower)) return "cleanup";
  if (/grab|share|swing|crayon/.test(lower)) return "sharing";
  if (/tablet|show/.test(lower)) return "screen";
  if (/shoes|car|park|leave|preschool|bed|wait/.test(lower)) return "transition";
  if (/street|hold hands/.test(lower)) return "safety";
  return "general";
}

function chooseOfflineStrategy(type, iteration, state) {
  const good = {
    transition: [
      strategy("first_then_choice", "First/then boundary plus a choice that moves the child toward the target action."),
      strategy("playful_target", "Playful pretend that still gets the child to complete the target action."),
      strategy("countdown", "A concrete countdown or last turn followed by the required next step."),
    ],
    food: [
      strategy("reward_bites", "Clear family rule: a small bite target, then dessert or preferred next thing."),
      strategy("choice_bite", "Choice between two safe ways to try the food, such as tiny bite or fork bite."),
      strategy("helper_then_taste", "Child helps prepare the food and then takes one clear taste."),
    ],
    unsafe: [
      strategy("remove_redirect_retry", "Unsafe object is removed, child gets a safe physical outlet, then retries safely."),
      strategy("empathy_repair", "Child sees the simple social or object consequence and repairs it."),
      strategy("clear_rule_replacement", "Clear rule plus a replacement action that is safe and realistic."),
    ],
    cleanup: [
      strategy("drop_or_place", "Toy must go in the basket; child chooses drop it in or place it gently."),
      strategy("park_toy", "Toy parks in the basket after one final useful action."),
      strategy("help_or_self", "Parent gives a clear boundary: child does it or parent helps do it."),
    ],
    sharing: [
      strategy("return_ask_turn", "Toy returns to the owner, then child asks for a turn."),
      strategy("trade_or_wait", "Child can offer a trade or wait; original toy stays with the other child."),
      strategy("simple_moral_repair", "Simple social language plus clear give-back repair."),
    ],
    screen: [
      strategy("first_then_screen", "First required task, then timed screen access."),
      strategy("tablet_sleep", "Playful tablet-sleep deflection that stops screaming and moves child away from screen."),
      strategy("ask_small_voice", "Child practices a smaller request and accepts the stated boundary."),
    ],
    safety: [
      strategy("stop_hold_choice", "Immediate safety boundary, then choice of which hand or how to walk."),
      strategy("carry_or_hold", "Clear safe alternatives: hold hand or be carried."),
    ],
    general: [
      strategy("first_then_choice", "First/then boundary plus a choice that moves the child toward the target action."),
      strategy("empathy_repair", "Child sees the simple social or object consequence and repairs it."),
    ],
  };
  const bad = {
    transition: [
      strategy("chase_game", "Parent chases the child, accidentally rewarding running away."),
      strategy("symbolic_only", "Poetic symbol without an operational next step."),
    ],
    food: [
      strategy("unsafe_smell", "Food smelling/touching replaces eating and may feel physically unsafe."),
      strategy("no_eating_outcome", "Story ends before the child eats or follows a clear family rule."),
    ],
    unsafe: [
      strategy("confusing_choice", "Choice does not match the real rule or desired behavior."),
      strategy("promise_never", "Child promises never to do it again, which is too tidy and unrealistic."),
    ],
    cleanup: [
      strategy("basket_feelings_only", "Basket feelings replace the concrete cleanup rule."),
      strategy("wrong_choice", "Choice allows the toy to stay outside the basket when cleanup is the goal."),
    ],
    sharing: [
      strategy("ask_without_return", "Child asks for a turn but keeps the grabbed toy."),
    ],
    screen: [
      strategy("give_in_screaming", "Parent gives tablet because of screaming."),
    ],
    safety: [
      strategy("street_bargain", "Parent bargains near a street instead of making safety non-negotiable."),
    ],
    general: [strategy("symbolic_only", "Poetic symbol without an operational next step.")],
  };
  const goodPool = good[type] ?? good.general;
  const badPool = (bad[type] ?? bad.general).filter((item) => !state.avoid.has(item.key));

  if (badPool.length > 0 && shouldProbeBad(iteration)) {
    return badPool[(iteration + type.length) % badPool.length];
  }
  return goodPool[(iteration + type.length) % goodPool.length];
}

function strategy(key, parentAction) {
  return { key, parentAction };
}

function shouldProbeBad(iteration) {
  return iteration <= 30 ? iteration % 4 === 0 : iteration % 13 === 0;
}

function buildOfflineStory(type, prompt, strategy) {
  const child = "Emma";
  const title = titleFor(type, strategy);
  const pages = storyPagesFor(type, strategy, child, prompt);
  return { title, pages };
}

function titleFor(type, strategy) {
  const titles = {
    transition: "Shoes First",
    food: "One Tiny Bite",
    unsafe: "Try Again With Gentle Hands",
    cleanup: "Drop Or Place",
    sharing: "Ask For A Turn",
    screen: "First Then Tablet",
    safety: "Hand By The Street",
    general: "One Small Step",
  };
  if (strategy.key === "tablet_sleep") return "The Tablet Sleeps";
  if (strategy.key === "playful_target") return "The Shoe Finds A Foot";
  if (strategy.key === "basket_feelings_only") return "The Lonely Basket";
  if (strategy.key === "chase_game") return "The Chase";
  return titles[type] ?? "One Small Step";
}

function storyPagesFor(type, strategy, child) {
  if (strategy.key === "chase_game") {
    return [
      `${child} ran away when Mom brought the shoes.`,
      "Mom laughed and chased her around the room.",
      `${child} squealed and ran faster.`,
      "Mom caught her by the chair.",
      `${child} kicked and giggled.`,
      "Mom put the shoes on quickly.",
      `${child} ran to the door.`,
      'Mom said, "That was fun."',
    ];
  }
  if (strategy.key === "unsafe_smell") {
    return [
      `${child} pushed dinner away.`,
      'Dad said, "You can smell the pea."',
      `${child} leaned close to the pea.`,
      "The pea bumped near her nose.",
      `${child} laughed and moved back.`,
      'Dad said, "That counts."',
      `${child} touched the spoon.`,
      "Dinner was done.",
    ];
  }
  if (strategy.key === "basket_feelings_only") {
    return [
      `${child} left blocks all over the rug.`,
      'Dad said, "The basket feels lonely."',
      `${child} looked at the basket.`,
      "The basket waited quietly.",
      `${child} felt sorry for it.`,
      "She put one block inside.",
      'Dad said, "Now it is happy."',
      "The room was still full of blocks.",
    ];
  }
  if (strategy.key === "wrong_choice") {
    return [
      `${child} held a block during cleanup.`,
      'Mom said, "Blocks can go in the basket or stay on the floor."',
      `${child} put it on the floor.`,
      'Mom said, "Okay."',
      `${child} smiled.`,
      "The basket stayed empty.",
      "More blocks stayed out.",
      "Cleanup was over.",
    ];
  }
  if (strategy.key === "give_in_screaming") {
    return [
      `${child} screamed for the tablet.`,
      "Mom covered her ears.",
      'Mom said, "Fine, take it."',
      `${child} stopped screaming.`,
      "She watched the tablet.",
      "Mom sighed by the counter.",
      `${child} smiled at the screen.`,
      "The room was quiet.",
    ];
  }
  if (strategy.key === "street_bargain") {
    return [
      `${child} pulled her hand away near the street.`,
      'Dad said, "If you hold hands, you get candy."',
      `${child} looked at the cars.`,
      "She stepped toward the curb.",
      "Dad reached fast.",
      `${child} cried for candy.`,
      "They crossed after a long argument.",
      "Dad looked tired.",
    ];
  }

  const goodStories = {
    first_then_choice: [
      `${child} ran behind the couch when it was time to go.`,
      'Mom said, "First shoes, then door."',
      `${child} shook her head.`,
      'Mom held up both shoes. "Left first or right first?"',
      `${child} pointed to the right shoe.`,
      "Mom slid it on.",
      `${child} gave one little kick.`,
      "Then she brought the left foot too.",
    ],
    playful_target: [
      `${child} ran away from her shoes.`,
      'Dad lifted one shoe. "Oh no, this shoe lost its Emma foot."',
      `${child} stopped by the table.`,
      'The shoe wiggled. "Where is my foot?"',
      `${child} laughed.`,
      "She put one foot in.",
      "The other shoe wiggled too.",
      `${child} gave it the other foot.`,
    ],
    countdown: [
      `${child} stayed on the swing when it was time to leave.`,
      'Mom said, "Two more pushes, then gate."',
      "One push went high.",
      "Two push went lower.",
      `${child} frowned at the gate.`,
      'Mom said, "Stomp or hop?"',
      `${child} stomped to the gate.`,
      "At the gate, she waved bye to the swing.",
    ],
    reward_bites: [
      `${child} pushed dinner away.`,
      'Dad said, "Three bites, then dessert."',
      `${child} frowned at the plate.`,
      "Dad held up three fingers.",
      `${child} took one small bite.`,
      "Then another.",
      "After the third bite, Dad brought dessert.",
      `${child} smiled at the little bowl.`,
    ],
    choice_bite: [
      `${child} did not want the rice.`,
      'Mom said, "Fork bite or spoon bite?"',
      `${child} picked the spoon.`,
      "Mom put a tiny bit on it.",
      `${child} took the tiny bite.`,
      'Mom said, "You did it."',
      `${child} drank water.`,
      "Dinner kept going.",
    ],
    helper_then_taste: [
      `${child} pushed the noodles away.`,
      'Mom said, "You can sprinkle the cheese."',
      `${child} sprinkled a little cheese.`,
      "The noodles looked snowy.",
      'Mom said, "Now one tiny bite."',
      `${child} took one noodle.`,
      "It slipped from the fork.",
      `${child} tried again and ate it.`,
    ],
    remove_redirect_retry: [
      `${child} threw the toy car.`,
      "Mom picked up the car and put it on the shelf.",
      '"Cars are done for now," Mom said.',
      `${child} cried and kicked the rug.`,
      'Mom pointed to the pillows. "Kick the pillow."',
      `${child} kicked one pillow hard.`,
      'Mom said, "Try the car on the floor."',
      `${child} drove it slowly by Mom's foot.`,
    ],
    empathy_repair: [
      `${child} threw Teddy on the rug.`,
      'Mom said, "Teddy fell hard."',
      `${child} looked at Teddy.`,
      "Teddy was upside down.",
      `${child} picked him up.`,
      "She gave Teddy a squeeze.",
      'Mom said, "Gentle hands."',
      `${child} set Teddy on the chair.`,
    ],
    clear_rule_replacement: [
      `${child} lifted the red block to throw.`,
      'Dad said, "Blocks go down. Balls can throw."',
      "He moved the block to the rug.",
      "He rolled a soft ball to Emma.",
      `${child} threw the ball into the bin.`,
      "Bump.",
      'Dad said, "Ball throws. Block builds."',
      `${child} put the block on the tower.`,
    ],
    drop_or_place: [
      `${child}'s blocks were all over the rug.`,
      'Mom said, "Blocks go in the basket now."',
      `${child} held one block and frowned.`,
      'Mom said, "Drop it in or place it gently."',
      `${child} dropped it in. Thump.`,
      "Mom handed her another block.",
      `${child} placed this one softly.`,
      "The basket made a little block mountain.",
    ],
    park_toy: [
      `${child} kept driving the red truck after cleanup time.`,
      'Dad said, "One more drive, then truck parks in the basket."',
      `${child} drove around the chair.`,
      'Dad pointed. "Park it or I can help park it."',
      `${child} hugged the truck.`,
      "Dad waited.",
      `${child} drove the truck into the basket.`,
      'Dad said, "Parked."',
    ],
    help_or_self: [
      `${child} sat beside the blocks at cleanup time.`,
      'Mom said, "Blocks go in the basket."',
      `${child} looked away.`,
      'Mom said, "You do one, or I help your hand do one."',
      `${child} grabbed a blue block.`,
      "She dropped it in.",
      "Mom picked up a red block.",
      "They filled the basket together.",
    ],
    return_ask_turn: [
      `${child} grabbed Liam's truck.`,
      'Mom said, "His turn."',
      "The truck went back to Liam.",
      `${child} stomped once.`,
      'Mom said, "Ask, can I have a turn?"',
      `${child} whispered the words.`,
      "Liam drove one more circle.",
      "Then he gave Emma the truck.",
    ],
    trade_or_wait: [
      `${child} wanted the yellow truck.`,
      "She reached for it.",
      'Dad said, "Liam has it."',
      "Dad held up a blue car.",
      '"Trade, or wait by me."',
      `${child} pushed the blue car to Liam.`,
      "Liam looked at it.",
      "Then he handed her the truck.",
    ],
    simple_moral_repair: [
      `${child} grabbed the train from Noah.`,
      'Mom said, "Sharing makes everyone happy."',
      `${child} looked at Noah's empty hands.`,
      "She gave the train back.",
      "Noah smiled.",
      `${child} smiled too.`,
      'Mom said, "Good sharing."',
      "Then Noah gave her a turn.",
    ],
    first_then_screen: [
      `${child} screamed for the tablet.`,
      'Dad said, "First dinner, then tablet."',
      `${child} kicked the chair.`,
      'Dad said, "Three bites, then five minutes."',
      `${child} took one bite.`,
      "Dad held up two fingers.",
      `${child} took two more bites.`,
      "Dad set the timer and gave her the tablet.",
    ],
    tablet_sleep: [
      `${child} screamed for the tablet.`,
      'Mom said, "The tablet is sleeping."',
      `${child} looked at the dark screen.`,
      '"Tablet sleeping?" she asked.',
      "Mom nodded.",
      `${child} tucked the tablet beside the napkin.`,
      "She stopped screaming.",
      "The tablet had a nap.",
    ],
    ask_small_voice: [
      `${child} wanted the tablet while Mom cooked.`,
      "She screamed so loud the spoon jumped.",
      'Mom said, "Tablet after food."',
      `${child} screamed again.`,
      'Mom said, "Ask with a small voice."',
      `${child} rubbed her eyes. "Tablet after food?"`,
      'Mom said, "Yes. After food."',
      `${child} waited with her cup.`,
    ],
    stop_hold_choice: [
      `${child} pulled her hand away near the street.`,
      'Dad said, "Stop. Street means hand."',
      "Cars hummed by.",
      'Dad held out both hands. "This hand or this hand?"',
      `${child} frowned.`,
      "She picked the left hand.",
      "They crossed together.",
      "Dad kept her hand until the sidewalk.",
    ],
    carry_or_hold: [
      `${child} let go near the curb.`,
      'Mom said, "Hand or carry."',
      `${child} crossed her arms.`,
      "Mom picked her up.",
      `${child} cried on Mom's shoulder.`,
      "Cars passed by.",
      "At the sidewalk, Mom put her down.",
      `${child} held Mom's hand again.`,
    ],
  };
  return goodStories[strategy.key] ?? goodStories.first_then_choice;
}

function evaluateOfflineStory(type, strategy) {
  const failures = {
    chase_game: [
      "Bad",
      2,
      "Parent chasing rewards the running-away behavior and is not what parents want to do.",
      "parent reinforces running",
      "Do not solve refusal by turning it into a chase game; the parent action must reduce the target behavior, not reward it.",
    ],
    unsafe_smell: [
      "Bad",
      3,
      "Smelling food can feel physically unsafe or pointless, and the child does not eat or follow a clear dinner rule.",
      "unsafe or pointless food step",
      "Food stories should move toward eating, tasting, or a clear family rule; avoid smell-only victories.",
    ],
    basket_feelings_only: [
      "Bad",
      4,
      "The basket feeling lonely is too indirect and leaves cleanup unfinished.",
      "symbol replaces task",
      "Empathy can help, but cleanup stories still need the toy to actually go where it belongs.",
    ],
    wrong_choice: [
      "Bad",
      2,
      "The choice allows the wrong outcome; cleanup requires the block to go in the basket.",
      "choice avoids target",
      "Choices must be between two acceptable ways to complete the same target action.",
    ],
    give_in_screaming: [
      "Bad",
      2,
      "The parent gives the tablet because of screaming, so screaming works.",
      "rewarded screaming",
      "Rewards are fine only after the requested behavior, not as a payoff for the problem behavior.",
    ],
    street_bargain: [
      "Bad",
      1,
      "Street safety should be non-negotiable; bargaining near traffic is unsafe.",
      "unsafe bargaining",
      "Safety stories need an immediate boundary first, then a limited safe choice.",
    ],
  };
  if (failures[strategy.key]) {
    const [rating, score, reason, failureMode, learning] = failures[strategy.key];
    return {
      rating,
      score,
      reason,
      failureMode,
      learning,
      rule: learning,
    };
  }
  return {
    rating: "Good",
    score: type === "safety" ? 9 : 8,
    reason:
      "The parent action is concrete, parent-recognizable, and moves Emma toward one clear next-step behavior.",
    failureMode: "none",
    learning:
      "Good stories should keep a visible cause-effect line from parent action to child next step.",
    rule:
      "Use practical parent actions that either set a clear boundary, give a logical choice, or create a realistic incentive.",
  };
}

function isTruthy(value) {
  return /^(1|true|yes)$/i.test(String(value ?? "").trim());
}

function mergeLearning(current, addition) {
  const trimmed = String(addition ?? "").trim();
  if (!trimmed || trimmed.toLowerCase() === "none") return current;
  if (current.includes(trimmed)) return current;
  return `${current.trim()}\n- ${trimmed}\n`;
}

function buildSummary(results, learning, complete = false) {
  const good = results.filter((result) => result.rating === "Good").length;
  const bad = results.filter((result) => result.rating === "Bad").length;
  const average =
    results.length === 0
      ? 0
      : results.reduce((total, result) => total + Number(result.score || 0), 0) /
        results.length;
  const failures = countBy(
    results
      .filter((result) => result.failure_mode && result.failure_mode !== "none")
      .map((result) => result.failure_mode),
  );
  const rules = results
    .map((result) => result.prompt_rule_to_keep)
    .filter(Boolean)
    .filter((rule, index, allRules) => allRules.indexOf(rule) === index)
    .slice(-20);
  const failureLines = Object.entries(failures)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([failure, count]) => `- ${failure}: ${count}`);

  return [
    "# Story Rating Loop Summary",
    "",
    `Status: ${complete ? "complete" : "running"}`,
    `Iterations: ${results.length}`,
    `Good: ${good}`,
    `Bad: ${bad}`,
    `Average score: ${average.toFixed(2)}`,
    "",
    "## Recurring Failure Modes",
    "",
    ...(failureLines.length > 0 ? failureLines : ["- none"]),
    "",
    "## Recent Rules To Keep",
    "",
    ...rules.map((rule) => `- ${rule}`),
    "",
    "## Current Learning Rubric",
    "",
    learning.trim(),
    "",
  ].join("\n");
}

async function appendIterationMarkdown(filePath, result) {
  const lines = [
    `## Iteration ${String(result.iteration).padStart(3, "0")}`,
    "",
    `Prompt: ${result.prompt}`,
    "",
    `Rating: ${result.rating} (${result.score}/10)`,
    "",
    `Reason: ${result.rating_reason}`,
    "",
    `Parent action: ${result.parent_action}`,
    "",
    `Failure mode: ${result.failure_mode}`,
    "",
    "Story:",
    "",
    ...(result.story_pages ?? []).map((page, index) => `${index + 1}. ${page}`),
    "",
    `Learning: ${result.learning_addition}`,
    "",
    `Rule to keep: ${result.prompt_rule_to_keep}`,
    "",
  ];
  await fs.promises.appendFile(filePath, `${lines.join("\n")}\n`);
}

async function appendJsonLine(filePath, value) {
  await fs.promises.appendFile(filePath, `${JSON.stringify(value)}\n`);
}

function countBy(values) {
  const counts = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(1, Math.min(10, Math.round(score)));
}

async function requestJson(config, { system, user }) {
  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(config.openRouterAppTitle
          ? { "X-OpenRouter-Title": config.openRouterAppTitle }
          : {}),
        ...(config.openRouterSiteUrl
          ? { "HTTP-Referer": config.openRouterSiteUrl }
          : {}),
      },
      body: JSON.stringify({
        model: config.model,
        max_completion_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`AI request failed ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI request returned empty content.");
  return JSON.parse(extractJson(content));
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(`No JSON object in model response: ${text.slice(0, 200)}`);
  }
  return text.slice(start, end + 1);
}

function getAiConfig() {
  const baseUrl =
    process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL ??
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey =
    process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY ??
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return {
    baseUrl,
    apiKey,
    model:
      process.env.STORY_RATING_LOOP_MODEL ??
      process.env.AI_INTEGRATIONS_OPENROUTER_MODEL ??
      process.env.AI_INTEGRATIONS_OPENAI_MODEL ??
      defaultModel,
    openRouterSiteUrl: process.env.OPENROUTER_SITE_URL,
    openRouterAppTitle: process.env.OPENROUTER_APP_TITLE,
  };
}

async function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = await readFile(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    let value = trimmed.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}
