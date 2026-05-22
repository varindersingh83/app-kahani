import type { BehaviorTaxonomyEntry } from "./behaviorTaxonomy";

export type BehaviorIssueTemplateEntry = BehaviorTaxonomyEntry & {
  sourceRow: number;
  expertSources: string;
  avoidDoing: string;
};

export const BEHAVIOR_ISSUE_TEMPLATE = [
  {
    "categoryId": "template_1_full_body_tantrum_when_told_no",
    "sourceRow": 1,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Full-body tantrum when told no",
    "mechanism": "Seeking control or autonomy in a situation controlled by adults.",
    "strategy": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Full-body tantrum when told no",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Full-body tantrum when told no",
      "full body tantrum",
      "full-body tantrum when told no",
      "full body",
      "full body tantrum when"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_2_screaming_in_public",
    "sourceRow": 2,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Screaming in public",
    "mechanism": "Frustration from limited language, immature impulse control, or blocked goal.",
    "strategy": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Screaming in public",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "screaming public",
      "Screaming in public",
      "screaming in public"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_3_crying_because_a_parent_leaves",
    "sourceRow": 3,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Crying because a parent leaves",
    "mechanism": "Transitions are hard; child loses a preferred activity, control, or connection.",
    "strategy": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Crying because a parent leaves",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Crying because a parent leaves",
      "Crying because a  leaves",
      "crying because parent",
      "crying because parent leaves",
      "crying because",
      "crying because a parent leaves"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_4_refusing_to_get_dressed",
    "sourceRow": 4,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Refusing to get dressed",
    "mechanism": "Need for attention, connection, predictability, or sensory regulation.",
    "strategy": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Refusing to get dressed",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing to get dressed",
      "refusing dressed",
      "Refusing to get dressed"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_5_running_away_from_caregiver",
    "sourceRow": 5,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Running away from caregiver",
    "mechanism": "Developmentally normal egocentrism and weak delay-of-gratification skills.",
    "strategy": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Running away from caregiver",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Running away from caregiver",
      "running away from",
      "running away from caregiver",
      "running away",
      "Running away from"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_6_hitting_parent",
    "sourceRow": 6,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Hitting parent",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Hitting parent",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "Hitting parent",
      "hitting parent",
      "Hitting"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_7_hitting_sibling",
    "sourceRow": 7,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Hitting sibling",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Hitting sibling",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "Hitting sibling",
      "hitting sibling"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_8_pushing_other_children",
    "sourceRow": 8,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Pushing other children",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Pushing other children",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "Pushing other children",
      "pushing other",
      "pushing other children"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_9_biting",
    "sourceRow": 9,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Biting",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Biting",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "Biting",
      "biting"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_10_kicking",
    "sourceRow": 10,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Kicking",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Kicking",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "kicking",
      "Kicking"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_11_throwing_toys",
    "sourceRow": 11,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Throwing toys",
    "mechanism": "Seeking control or autonomy in a situation controlled by adults.",
    "strategy": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Throwing toys",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "throwing toys",
      "Throwing toys"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_12_throwing_food",
    "sourceRow": 12,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Throwing food",
    "mechanism": "Normal picky eating, sensory sensitivity, low hunger, desire for control, or too many snacks before meals.",
    "strategy": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Throwing food",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "throwing food",
      "Throwing food"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_13_spitting",
    "sourceRow": 13,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Spitting",
    "mechanism": "Testing limits to learn rules and adult consistency.",
    "strategy": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Spitting",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Spitting",
      "spitting"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_14_hair_pulling",
    "sourceRow": 14,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Hair pulling",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Hair pulling",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "hair pulling",
      "Hair pulling"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_15_scratching",
    "sourceRow": 15,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Scratching",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Scratching",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "Scratching",
      "scratching"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_16_pinching",
    "sourceRow": 16,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Pinching",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Pinching",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "pinching",
      "Pinching"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_17_grabbing_toys",
    "sourceRow": 17,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Grabbing toys",
    "mechanism": "Need for movement, sleep, food, or a calmer environment.",
    "strategy": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Grabbing toys",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Grabbing toys",
      "grabbing toys"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_18_refusing_to_share",
    "sourceRow": 18,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Refusing to share",
    "mechanism": "Skill gap: the child has not learned the replacement behavior yet.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Refusing to share",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing share",
      "Refusing to share",
      "refusing to share"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_19_destroying_another_child_s_work",
    "sourceRow": 19,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Destroying another child's work",
    "mechanism": "Power struggle created by unclear limits, too many words, or inconsistent follow-through.",
    "strategy": "Use a short time-out or calm-down break only for unsafe or repeated behavior, roughly 1 minute per year of age, then reconnect and teach.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use a short time-out or calm-down break only for unsafe or repeated behavior, roughly 1 minute per year of age, then reconnect and teach. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Destroying another child's work",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "destroying another child",
      "destroying another",
      "destroying another child work",
      "Destroying another child's work",
      "destroying another child's work",
      "Destroying another 's work"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_20_knocking_over_blocks",
    "sourceRow": 20,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Knocking over blocks",
    "mechanism": "Overtired, hungry, overstimulated, or unable to express big feelings.",
    "strategy": "Stay calm; name the feeling; set one clear limit; offer two acceptable choices; praise any small cooperation.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay calm; name the feeling; set one clear limit; offer two acceptable choices; praise any small cooperation. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Knocking over blocks",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Knocking over blocks",
      "knocking over",
      "knocking over blocks"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_21_saying_no_to_every_request",
    "sourceRow": 21,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Saying no to every request",
    "mechanism": "Seeking control or autonomy in a situation controlled by adults.",
    "strategy": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Saying no to every request",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "saying every",
      "saying every request",
      "Saying no to every request",
      "saying no to every request"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_22_ignoring_instructions",
    "sourceRow": 22,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Ignoring instructions",
    "mechanism": "Frustration from limited language, immature impulse control, or blocked goal.",
    "strategy": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Ignoring instructions",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Ignoring instructions",
      "ignoring instructions"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_23_delaying_cleanup",
    "sourceRow": 23,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Delaying cleanup",
    "mechanism": "Transitions are hard; child loses a preferred activity, control, or connection.",
    "strategy": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Delaying cleanup",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "delaying cleanup",
      "Delaying cleanup"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_24_refusing_bath",
    "sourceRow": 24,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Refusing bath",
    "mechanism": "Need for attention, connection, predictability, or sensory regulation.",
    "strategy": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Refusing bath",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing bath",
      "Refusing bath"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_25_refusing_tooth_brushing",
    "sourceRow": 25,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Refusing tooth brushing",
    "mechanism": "Developmentally normal egocentrism and weak delay-of-gratification skills.",
    "strategy": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Refusing tooth brushing",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing tooth",
      "refusing tooth brushing",
      "Refusing tooth brushing"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_26_refusing_potty",
    "sourceRow": 26,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Refusing potty",
    "mechanism": "Body-skill learning, constipation, control seeking, fear of toilet, or stress after a routine change.",
    "strategy": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Refusing potty",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing potty",
      "Refusing potty"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_27_potty_accidents_after_training",
    "sourceRow": 27,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Potty accidents after training",
    "mechanism": "Body-skill learning, constipation, control seeking, fear of toilet, or stress after a routine change.",
    "strategy": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Potty accidents after training",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "potty accidents after",
      "potty accidents after training",
      "potty accidents",
      "Potty accidents after training"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_28_holding_poop",
    "sourceRow": 28,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Holding poop",
    "mechanism": "Body-skill learning, constipation, control seeking, fear of toilet, or stress after a routine change.",
    "strategy": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Holding poop",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "holding poop",
      "Holding poop"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_29_fighting_diaper_change",
    "sourceRow": 29,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Fighting diaper change",
    "mechanism": "Body-skill learning, constipation, control seeking, fear of toilet, or stress after a routine change.",
    "strategy": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Fighting diaper change",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "fighting diaper change",
      "fighting diaper",
      "Fighting diaper change"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_30_refusing_car_seat",
    "sourceRow": 30,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Refusing car seat",
    "mechanism": "Transitions are hard; child loses a preferred activity, control, or connection.",
    "strategy": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Refusing car seat",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Refusing car seat",
      "refusing seat",
      "refusing car seat"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_31_unbuckling_car_seat",
    "sourceRow": 31,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Unbuckling car seat",
    "mechanism": "Transitions are hard; child loses a preferred activity, control, or connection.",
    "strategy": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Unbuckling car seat",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Unbuckling car seat",
      "unbuckling seat",
      "unbuckling car seat"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_32_refusing_stroller",
    "sourceRow": 32,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Refusing stroller",
    "mechanism": "Transitions are hard; child loses a preferred activity, control, or connection.",
    "strategy": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Refusing stroller",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Refusing stroller",
      "refusing stroller"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_33_bolting_in_parking_lot",
    "sourceRow": 33,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Bolting in parking lot",
    "mechanism": "Transitions are hard; child loses a preferred activity, control, or connection.",
    "strategy": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Bolting in parking lot",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "bolting parking",
      "Bolting in parking lot",
      "bolting in parking lot"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_34_climbing_unsafe_furniture",
    "sourceRow": 34,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Climbing unsafe furniture",
    "mechanism": "Need for attention, connection, predictability, or sensory regulation.",
    "strategy": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Climbing unsafe furniture",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "climbing unsafe furniture",
      "climbing unsafe",
      "Climbing unsafe furniture"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_35_jumping_on_couch",
    "sourceRow": 35,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Jumping on couch",
    "mechanism": "Developmentally normal egocentrism and weak delay-of-gratification skills.",
    "strategy": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Jumping on couch",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Jumping on couch",
      "jumping on couch",
      "jumping couch"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_36_opening_doors_cabinets",
    "sourceRow": 36,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Opening doors/cabinets",
    "mechanism": "Anxiety, unfamiliar setting, crowd noise, or fear of separation.",
    "strategy": "After calm returns, repair: reconnect, restate the rule, practice once, and move on without a lecture.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "After calm returns, repair: reconnect, restate the rule, practice once, and move on without a lecture. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Opening doors/cabinets",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Opening doors/cabinets",
      "opening doors/cabinets",
      "opening doors cabinets",
      "opening doors"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_37_touching_dangerous_objects",
    "sourceRow": 37,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Touching dangerous objects",
    "mechanism": "Need for movement, sleep, food, or a calmer environment.",
    "strategy": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Touching dangerous objects",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Touching dangerous objects",
      "touching dangerous",
      "touching dangerous objects"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_38_pulling_pet_s_tail",
    "sourceRow": 38,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Pulling pet's tail",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Pulling pet's tail",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "Pulling pet's tail",
      "pulling pet's tail",
      "pulling tail"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_39_chasing_pets",
    "sourceRow": 39,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Chasing pets",
    "mechanism": "Power struggle created by unclear limits, too many words, or inconsistent follow-through.",
    "strategy": "Use a short time-out or calm-down break only for unsafe or repeated behavior, roughly 1 minute per year of age, then reconnect and teach.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use a short time-out or calm-down break only for unsafe or repeated behavior, roughly 1 minute per year of age, then reconnect and teach. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Chasing pets",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "chasing pets",
      "Chasing pets"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_40_squeezing_baby_sibling",
    "sourceRow": 40,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Squeezing baby sibling",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Squeezing baby sibling",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "squeezing baby",
      "squeezing baby sibling",
      "Squeezing baby sibling"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_41_jealousy_toward_new_sibling",
    "sourceRow": 41,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Jealousy toward new sibling",
    "mechanism": "Seeking control or autonomy in a situation controlled by adults.",
    "strategy": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Jealousy toward new sibling",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Jealousy toward new sibling",
      "jealousy toward sibling",
      "jealousy toward",
      "jealousy toward new sibling"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_42_demanding_parent_attention_constantly",
    "sourceRow": 42,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Demanding parent attention constantly",
    "mechanism": "Frustration from limited language, immature impulse control, or blocked goal.",
    "strategy": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Demanding parent attention constantly",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Demanding parent attention constantly",
      "demanding parent attention constantly",
      "demanding parent attention",
      "demanding parent",
      "Demanding  attention constantly"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_43_interrupting_adults",
    "sourceRow": 43,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Interrupting adults",
    "mechanism": "Testing limits to learn rules and adult consistency.",
    "strategy": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Interrupting adults",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Interrupting adults",
      "interrupting adults"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_44_whining",
    "sourceRow": 44,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Whining",
    "mechanism": "Need for attention, connection, predictability, or sensory regulation.",
    "strategy": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Whining",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Whining",
      "whining"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_45_baby_talk_regression",
    "sourceRow": 45,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Baby talk regression",
    "mechanism": "Developmentally normal egocentrism and weak delay-of-gratification skills.",
    "strategy": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Baby talk regression",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "baby talk",
      "baby talk regression",
      "Baby talk regression"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_46_clinginess_at_drop_off",
    "sourceRow": 46,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Clinginess at drop-off",
    "mechanism": "Transitions are hard; child loses a preferred activity, control, or connection.",
    "strategy": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Clinginess at drop-off",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "clinginess at drop-off",
      "Clinginess at drop-off",
      "clinginess drop"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_47_fear_of_strangers",
    "sourceRow": 47,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Fear of strangers",
    "mechanism": "Separation anxiety, temperament, unfamiliar adults, or low sense of safety in the setting.",
    "strategy": "Validate briefly, stay predictable, use a goodbye ritual, do not sneak away, and let the child warm up without forcing affection.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Validate briefly, stay predictable, use a goodbye ritual, do not sneak away, and let the child warm up without forcing affection. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Fear of strangers",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Fear of strangers",
      "fear of strangers",
      "fear strangers"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_48_refusing_sleep",
    "sourceRow": 48,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Refusing sleep",
    "mechanism": "Overtired body, separation need, inconsistent bedtime limits, fear, or delayed sleep pressure.",
    "strategy": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Refusing sleep",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Refusing sleep",
      "refusing sleep"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_49_coming_out_of_bed_repeatedly",
    "sourceRow": 49,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Coming out of bed repeatedly",
    "mechanism": "Overtired body, separation need, inconsistent bedtime limits, fear, or delayed sleep pressure.",
    "strategy": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Coming out of bed repeatedly",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Coming out of bed repeatedly",
      "coming repeatedly",
      "coming out of bed repeatedly"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_50_night_waking_for_parent",
    "sourceRow": 50,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Night waking for parent",
    "mechanism": "Overtired body, separation need, inconsistent bedtime limits, fear, or delayed sleep pressure.",
    "strategy": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Night waking for parent",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Night waking for",
      "night waking for parent",
      "night waking parent",
      "night waking",
      "Night waking for parent"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_51_nap_refusal",
    "sourceRow": 51,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Nap refusal",
    "mechanism": "Overtired body, separation need, inconsistent bedtime limits, fear, or delayed sleep pressure.",
    "strategy": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Nap refusal",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Nap refusal",
      "nap refusal"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_52_bedtime_stalling",
    "sourceRow": 52,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Bedtime stalling",
    "mechanism": "Overtired body, separation need, inconsistent bedtime limits, fear, or delayed sleep pressure.",
    "strategy": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use the same bedtime sequence, reduce stimulation, give one calm return-to-bed script, and praise staying in bed in the morning. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Bedtime stalling",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "bedtime stalling",
      "Bedtime stalling"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_53_demanding_screens",
    "sourceRow": 53,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Demanding screens",
    "mechanism": "High stimulation, habit loop, weak transition skills, and loss of control when a preferred activity ends.",
    "strategy": "Set the screen limit before starting; use a timer; give a 5-minute and 1-minute warning; hold the boundary; redirect to a concrete next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the screen limit before starting; use a timer; give a 5-minute and 1-minute warning; hold the boundary; redirect to a concrete next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Demanding screens",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "demanding screens",
      "Demanding screens"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_54_meltdown_when_screen_ends",
    "sourceRow": 54,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Meltdown when screen ends",
    "mechanism": "High stimulation, habit loop, weak transition skills, and loss of control when a preferred activity ends.",
    "strategy": "Set the screen limit before starting; use a timer; give a 5-minute and 1-minute warning; hold the boundary; redirect to a concrete next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the screen limit before starting; use a timer; give a 5-minute and 1-minute warning; hold the boundary; redirect to a concrete next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Meltdown when screen ends",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "meltdown when screen",
      "Meltdown when screen ends",
      "meltdown when screen ends",
      "meltdown when"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_55_sneaking_tablet_phone",
    "sourceRow": 55,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Sneaking tablet/phone",
    "mechanism": "High stimulation, habit loop, weak transition skills, and loss of control when a preferred activity ends.",
    "strategy": "Set the screen limit before starting; use a timer; give a 5-minute and 1-minute warning; hold the boundary; redirect to a concrete next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the screen limit before starting; use a timer; give a 5-minute and 1-minute warning; hold the boundary; redirect to a concrete next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Sneaking tablet/phone",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "sneaking tablet phone",
      "sneaking tablet",
      "Sneaking tablet/phone",
      "sneaking tablet/phone"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_56_copying_violent_screen_behavior",
    "sourceRow": 56,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Copying violent screen behavior",
    "mechanism": "High stimulation, habit loop, weak transition skills, and loss of control when a preferred activity ends.",
    "strategy": "Set the screen limit before starting; use a timer; give a 5-minute and 1-minute warning; hold the boundary; redirect to a concrete next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the screen limit before starting; use a timer; give a 5-minute and 1-minute warning; hold the boundary; redirect to a concrete next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Copying violent screen behavior",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "copying violent screen",
      "copying violent screen behavior",
      "copying violent",
      "Copying violent screen behavior"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_57_refusing_meals",
    "sourceRow": 57,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Refusing meals",
    "mechanism": "Normal picky eating, sensory sensitivity, low hunger, desire for control, or too many snacks before meals.",
    "strategy": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Refusing meals",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Refusing meals",
      "refusing meals"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_58_only_eating_sweets_snacks",
    "sourceRow": 58,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Only eating sweets/snacks",
    "mechanism": "Normal picky eating, sensory sensitivity, low hunger, desire for control, or too many snacks before meals.",
    "strategy": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Only eating sweets/snacks",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "only eating",
      "only eating sweets/snacks",
      "only eating sweets snacks",
      "only eating sweets",
      "Only eating sweets/snacks"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_59_throwing_plate_cup",
    "sourceRow": 59,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Throwing plate/cup",
    "mechanism": "Normal picky eating, sensory sensitivity, low hunger, desire for control, or too many snacks before meals.",
    "strategy": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Throwing plate/cup",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "throwing plate/cup",
      "throwing plate",
      "Throwing plate/cup"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_60_leaving_table_repeatedly",
    "sourceRow": 60,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Leaving table repeatedly",
    "mechanism": "Normal picky eating, sensory sensitivity, low hunger, desire for control, or too many snacks before meals.",
    "strategy": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Leaving table repeatedly",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "leaving table repeatedly",
      "leaving table",
      "Leaving table repeatedly"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_61_complaining_food_is_yucky",
    "sourceRow": 61,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Complaining food is yucky",
    "mechanism": "Normal picky eating, sensory sensitivity, low hunger, desire for control, or too many snacks before meals.",
    "strategy": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Complaining food is yucky",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Complaining food is yucky",
      "complaining food yucky",
      "complaining food is yucky",
      "complaining food"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_62_overstuffing_mouth",
    "sourceRow": 62,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Overstuffing mouth",
    "mechanism": "Frustration from limited language, immature impulse control, or blocked goal.",
    "strategy": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Overstuffing mouth",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "overstuffing mouth",
      "Overstuffing mouth"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_63_refusing_to_sit_at_restaurant",
    "sourceRow": 63,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Refusing to sit at restaurant",
    "mechanism": "Overstimulation, boredom, curiosity, need for movement, or adult expectations not taught before the setting.",
    "strategy": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Refusing to sit at restaurant",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Refusing to sit at restaurant",
      "refusing to sit at restaurant",
      "refusing restaurant"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_64_loud_voice_indoors",
    "sourceRow": 64,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Loud voice indoors",
    "mechanism": "Overstimulation, boredom, curiosity, need for movement, or adult expectations not taught before the setting.",
    "strategy": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Loud voice indoors",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Loud voice indoors",
      "loud voice",
      "loud voice indoors"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_65_running_indoors",
    "sourceRow": 65,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Running indoors",
    "mechanism": "Overstimulation, boredom, curiosity, need for movement, or adult expectations not taught before the setting.",
    "strategy": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Running indoors",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "running indoors",
      "Running indoors"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_66_touching_everything_in_stores",
    "sourceRow": 66,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Touching everything in stores",
    "mechanism": "Overstimulation, boredom, curiosity, need for movement, or adult expectations not taught before the setting.",
    "strategy": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Touching everything in stores",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "touching everything",
      "Touching everything in stores",
      "touching everything stores",
      "touching everything in stores"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_67_begging_for_toys_in_store",
    "sourceRow": 67,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Begging for toys in store",
    "mechanism": "Overstimulation, boredom, curiosity, need for movement, or adult expectations not taught before the setting.",
    "strategy": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Begging for toys in store",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "begging toys",
      "begging toys store",
      "begging for toys in store",
      "Begging for toys in store"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_68_checkout_line_meltdown",
    "sourceRow": 68,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Checkout-line meltdown",
    "mechanism": "Overstimulation, boredom, curiosity, need for movement, or adult expectations not taught before the setting.",
    "strategy": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Set the rule before entering; give a job; keep the child close; redirect to walking feet/quiet voice; leave briefly if unsafe or disruptive. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Checkout-line meltdown",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "checkout line meltdown",
      "Checkout-line meltdown",
      "checkout-line meltdown",
      "checkout line"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_69_refusing_to_leave_park",
    "sourceRow": 69,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Refusing to leave park",
    "mechanism": "Transitions are hard; child loses a preferred activity, control, or connection.",
    "strategy": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give advance warning, show the next step, offer a small job or choice, then follow through calmly and consistently. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Refusing to leave park",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing leave",
      "Refusing to leave park",
      "refusing leave park",
      "refusing to leave park"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_70_refusing_to_enter_school_daycare",
    "sourceRow": 70,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Refusing to enter school/daycare",
    "mechanism": "Overtired, hungry, overstimulated, or unable to express big feelings.",
    "strategy": "Stay calm; name the feeling; set one clear limit; offer two acceptable choices; praise any small cooperation.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay calm; name the feeling; set one clear limit; offer two acceptable choices; praise any small cooperation. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Refusing to enter school/daycare",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing enter school",
      "Refusing to enter school/daycare",
      "refusing enter",
      "refusing to enter school/daycare",
      "refusing enter school daycare"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_71_refusing_to_greet_relatives",
    "sourceRow": 71,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Refusing to greet relatives",
    "mechanism": "Separation anxiety, temperament, unfamiliar adults, or low sense of safety in the setting.",
    "strategy": "Validate briefly, stay predictable, use a goodbye ritual, do not sneak away, and let the child warm up without forcing affection.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Validate briefly, stay predictable, use a goodbye ritual, do not sneak away, and let the child warm up without forcing affection. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Refusing to greet relatives",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing greet relatives",
      "Refusing to greet relatives",
      "refusing to greet relatives",
      "refusing greet"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_72_hiding_behind_parent",
    "sourceRow": 72,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Hiding behind parent",
    "mechanism": "Separation anxiety, temperament, unfamiliar adults, or low sense of safety in the setting.",
    "strategy": "Validate briefly, stay predictable, use a goodbye ritual, do not sneak away, and let the child warm up without forcing affection.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Validate briefly, stay predictable, use a goodbye ritual, do not sneak away, and let the child warm up without forcing affection. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Hiding behind parent",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "hiding behind",
      "Hiding behind parent",
      "hiding behind parent",
      "Hiding behind"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_73_being_rude_to_guests",
    "sourceRow": 73,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Being rude to guests",
    "mechanism": "Testing limits to learn rules and adult consistency.",
    "strategy": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Being rude to guests",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "being rude guests",
      "being rude",
      "Being rude to guests",
      "being rude to guests"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_74_name_calling",
    "sourceRow": 74,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Name-calling",
    "mechanism": "Need for attention, connection, predictability, or sensory regulation.",
    "strategy": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Name-calling",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "name-calling",
      "Name-calling",
      "name calling"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_75_saying_i_hate_you",
    "sourceRow": 75,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Saying 'I hate you'",
    "mechanism": "Developmentally normal egocentrism and weak delay-of-gratification skills.",
    "strategy": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Saying 'I hate you'",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "saying 'i hate you'",
      "Saying 'I hate you'",
      "saying hate"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_76_using_potty_words_for_attention",
    "sourceRow": 76,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Using potty words for attention",
    "mechanism": "Body-skill learning, constipation, control seeking, fear of toilet, or stress after a routine change.",
    "strategy": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay neutral; use routine sits; give privacy; praise effort; avoid punishment; check constipation, fear, or readiness. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Using potty words for attention",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "using potty words for attention",
      "Using potty words for attention",
      "using potty words",
      "using potty",
      "using potty words attention"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_77_lying_to_avoid_trouble",
    "sourceRow": 77,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Lying to avoid trouble",
    "mechanism": "Need for movement, sleep, food, or a calmer environment.",
    "strategy": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Lying to avoid trouble",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Lying to avoid trouble",
      "lying to avoid trouble",
      "lying avoid trouble",
      "lying avoid"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_78_blaming_sibling_cousin",
    "sourceRow": 78,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Blaming sibling/cousin",
    "mechanism": "Skill gap: the child has not learned the replacement behavior yet.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Blaming sibling/cousin",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "blaming sibling/cousin",
      "blaming sibling",
      "Blaming sibling/cousin",
      "blaming sibling cousin"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_79_taking_things_without_asking",
    "sourceRow": 79,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Taking things without asking",
    "mechanism": "Power struggle created by unclear limits, too many words, or inconsistent follow-through.",
    "strategy": "Use a short time-out or calm-down break only for unsafe or repeated behavior, roughly 1 minute per year of age, then reconnect and teach.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use a short time-out or calm-down break only for unsafe or repeated behavior, roughly 1 minute per year of age, then reconnect and teach. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Taking things without asking",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Taking things without asking",
      "taking things without asking",
      "taking things",
      "taking things without"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_80_hoarding_toys",
    "sourceRow": 80,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Hoarding toys",
    "mechanism": "Overtired, hungry, overstimulated, or unable to express big feelings.",
    "strategy": "Stay calm; name the feeling; set one clear limit; offer two acceptable choices; praise any small cooperation.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay calm; name the feeling; set one clear limit; offer two acceptable choices; praise any small cooperation. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Hoarding toys",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "hoarding toys",
      "Hoarding toys"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_81_bossing_peers",
    "sourceRow": 81,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Bossing peers",
    "mechanism": "Seeking control or autonomy in a situation controlled by adults.",
    "strategy": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Bossing peers",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Bossing peers",
      "bossing peers"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_82_excluding_another_child",
    "sourceRow": 82,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Excluding another child",
    "mechanism": "Frustration from limited language, immature impulse control, or blocked goal.",
    "strategy": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Excluding another child",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "excluding another",
      "Excluding another child",
      "Excluding another",
      "excluding another child"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_83_meltdown_after_losing_game",
    "sourceRow": 83,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Meltdown after losing game",
    "mechanism": "Testing limits to learn rules and adult consistency.",
    "strategy": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Meltdown after losing game",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "meltdown after losing",
      "meltdown after losing game",
      "Meltdown after losing game",
      "meltdown after"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_84_cheating_in_games",
    "sourceRow": 84,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Cheating in games",
    "mechanism": "Need for attention, connection, predictability, or sensory regulation.",
    "strategy": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Cheating in games",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "cheating in games",
      "cheating games",
      "Cheating in games"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_85_refusing_turn_taking",
    "sourceRow": 85,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Refusing turn-taking",
    "mechanism": "Developmentally normal egocentrism and weak delay-of-gratification skills.",
    "strategy": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Refusing turn-taking",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing turn-taking",
      "refusing turn taking",
      "refusing turn",
      "Refusing turn-taking"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_86_poor_waiting_in_line",
    "sourceRow": 86,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Poor waiting in line",
    "mechanism": "Anxiety, unfamiliar setting, crowd noise, or fear of separation.",
    "strategy": "After calm returns, repair: reconnect, restate the rule, practice once, and move on without a lecture.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "After calm returns, repair: reconnect, restate the rule, practice once, and move on without a lecture. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Poor waiting in line",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "poor waiting in line",
      "poor waiting line",
      "poor waiting",
      "Poor waiting in line"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_87_constant_asking_why_to_delay",
    "sourceRow": 87,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Constant asking 'why' to delay",
    "mechanism": "Need for movement, sleep, food, or a calmer environment.",
    "strategy": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Constant asking 'why' to delay",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "constant asking",
      "constant asking 'why' to delay",
      "constant asking delay",
      "Constant asking 'why' to delay"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_88_negotiating_every_limit",
    "sourceRow": 88,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Negotiating every limit",
    "mechanism": "Skill gap: the child has not learned the replacement behavior yet.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Negotiating every limit",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "negotiating every limit",
      "Negotiating every limit",
      "negotiating every"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_89_demanding_exact_cup_plate_clothes",
    "sourceRow": 89,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Demanding exact cup/plate/clothes",
    "mechanism": "Normal picky eating, sensory sensitivity, low hunger, desire for control, or too many snacks before meals.",
    "strategy": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Keep meal structure predictable; offer small portions and one safe food; parent controls what/when/where, child controls whether/how much. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Demanding exact cup/plate/clothes",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "demanding exact cup/plate/clothes",
      "demanding exact plate",
      "Demanding exact cup/plate/clothes",
      "demanding exact plate clothes",
      "demanding exact"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_90_meltdown_over_broken_routine",
    "sourceRow": 90,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Meltdown over broken routine",
    "mechanism": "Overtired, hungry, overstimulated, or unable to express big feelings.",
    "strategy": "Stay calm; name the feeling; set one clear limit; offer two acceptable choices; praise any small cooperation.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Stay calm; name the feeling; set one clear limit; offer two acceptable choices; praise any small cooperation. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Meltdown over broken routine",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Meltdown over broken routine",
      "meltdown over",
      "meltdown over broken routine",
      "meltdown over broken"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_91_perfectionism_tears_over_drawing_mistake",
    "sourceRow": 91,
    "scene": "Bedtime at home; hotel room; cousin's house; travel day; nap transition",
    "visibleBehavior": "Perfectionism: tears over drawing mistake",
    "mechanism": "Seeking control or autonomy in a situation controlled by adults.",
    "strategy": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Prevent first: snack, rest, simple schedule, warning before transitions, and a clear next step. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child accepts the limit with protest but moves to one of the offered choices.",
    "storyFocusLabel": "Perfectionism: tears over drawing mistake",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "perfectionism tears over",
      "perfectionism tears over drawing",
      "perfectionism tears",
      "perfectionism: tears over drawing mistake",
      "Perfectionism: tears over drawing mistake"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_92_giving_up_quickly",
    "sourceRow": 92,
    "scene": "Restaurant waiting area; grocery checkout; mall; airport; doctor's office",
    "visibleBehavior": "Giving up quickly",
    "mechanism": "Frustration from limited language, immature impulse control, or blocked goal.",
    "strategy": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use positive directions: tell the child what to do, not only what to stop. Model and practice the phrase or action. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child learns the routine and needs fewer reminders over repeated practice.",
    "storyFocusLabel": "Giving up quickly",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "giving quickly",
      "giving up quickly",
      "Giving up quickly"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_93_saying_i_can_t_before_trying",
    "sourceRow": 93,
    "scene": "Park playground; playdate; Montessori classroom; daycare; sibling/cousin gathering",
    "visibleBehavior": "Saying 'I can't' before trying",
    "mechanism": "Testing limits to learn rules and adult consistency.",
    "strategy": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Give brief attention to safe behavior and minimal attention to defiance. Do not reward the tantrum by giving the forbidden item. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child repairs with adult support: says sorry, returns item, helps clean, or tries again.",
    "storyFocusLabel": "Saying 'I can't' before trying",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "saying 'i can't' before trying",
      "saying before trying",
      "Saying 'I can't' before trying",
      "saying before"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_94_refusing_help_then_melting_down",
    "sourceRow": 94,
    "scene": "Car seat; stroller; school drop-off; leaving a friend's house; public event",
    "visibleBehavior": "Refusing help then melting down",
    "mechanism": "Need for attention, connection, predictability, or sensory regulation.",
    "strategy": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use Montessori-style freedom within limits: 'You may do A or B.' Keep the prepared environment simple, ordered, and child-accessible. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child feels seen but not in charge of the boundary, reducing future power struggles.",
    "storyFocusLabel": "Refusing help then melting down",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "refusing help then",
      "refusing help",
      "refusing help then melting",
      "refusing help then melting down",
      "Refusing help then melting down"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_95_overreacting_to_small_injury",
    "sourceRow": 95,
    "scene": "Toy aisle; birthday party; screen-time ending; grandparent's house; cafe",
    "visibleBehavior": "Overreacting to small injury",
    "mechanism": "Developmentally normal egocentrism and weak delay-of-gratification skills.",
    "strategy": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Redirect to a replacement: hands on lap, walking feet, soft voice, asking for help, waiting card, or breathing with adult. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child starts copying the replacement phrase or action in similar settings.",
    "storyFocusLabel": "Overreacting to small injury",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Overreacting to small injury",
      "overreacting small",
      "overreacting to small injury",
      "overreacting small injury"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_96_sensitive_to_clothing_tags_seams",
    "sourceRow": 96,
    "scene": "Bathroom; potty training; bath time; teeth brushing; getting dressed",
    "visibleBehavior": "Sensitive to clothing tags/seams",
    "mechanism": "Anxiety, unfamiliar setting, crowd noise, or fear of separation.",
    "strategy": "After calm returns, repair: reconnect, restate the rule, practice once, and move on without a lecture.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "After calm returns, repair: reconnect, restate the rule, practice once, and move on without a lecture. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child tolerates small waits and transitions with warnings and predictable steps.",
    "storyFocusLabel": "Sensitive to clothing tags/seams",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Sensitive to clothing tags/seams",
      "sensitive clothing tags",
      "sensitive clothing tags seams",
      "sensitive clothing",
      "sensitive to clothing tags/seams"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_97_covering_ears_in_noisy_places",
    "sourceRow": 97,
    "scene": "Meal table at home; restaurant; picnic; daycare lunch; relative's dinner",
    "visibleBehavior": "Covering ears in noisy places",
    "mechanism": "Need for movement, sleep, food, or a calmer environment.",
    "strategy": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Use natural/logical consequences: toy rests if thrown; leave restaurant briefly if screaming continues; cleanup happens before next activity. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child has fewer public meltdowns because food, rest, and sensory needs are planned.",
    "storyFocusLabel": "Covering ears in noisy places",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Covering ears in noisy places",
      "covering ears",
      "covering ears noisy places",
      "covering ears in noisy places",
      "covering ears noisy"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_98_tantrum_in_crowded_mall",
    "sourceRow": 98,
    "scene": "Quiet spaces; library; temple/church/gurdwara; movie/theater lobby; airplane",
    "visibleBehavior": "Tantrum in crowded mall",
    "mechanism": "Skill gap: the child has not learned the replacement behavior yet.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child gains confidence from doing part of the task independently.",
    "storyFocusLabel": "Tantrum in crowded mall",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "tantrum crowded",
      "tantrum in crowded mall",
      "tantrum crowded mall",
      "Tantrum in crowded mall"
    ],
    "intensity": 75
  },
  {
    "categoryId": "template_99_separation_anxiety_at_relatives_house",
    "sourceRow": 99,
    "scene": "Transitions between activities; cleanup time; leaving park; bedtime; getting into car",
    "visibleBehavior": "Separation anxiety at relatives' house",
    "mechanism": "Separation anxiety, temperament, unfamiliar adults, or low sense of safety in the setting.",
    "strategy": "Validate briefly, stay predictable, use a goodbye ritual, do not sneak away, and let the child warm up without forcing affection.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "Validate briefly, stay predictable, use a goodbye ritual, do not sneak away, and let the child warm up without forcing affection. Avoid: Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "targetOutcome": "Child still has feelings but recovers without getting the forbidden reward.",
    "storyFocusLabel": "Separation anxiety at relatives' house",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not yell, shame, threaten, hit, over-explain during peak distress, or give the forbidden item to stop the behavior.",
    "aliases": [
      "Separation anxiety at relatives' house",
      "separation anxiety",
      "separation anxiety at relatives' house",
      "separation anxiety relatives",
      "separation anxiety relatives house"
    ],
    "intensity": 55
  },
  {
    "categoryId": "template_100_aggression_when_tired_hungry",
    "sourceRow": 100,
    "scene": "Home morning routine; restaurant; shopping center; park; daycare pickup; relative's house",
    "visibleBehavior": "Aggression when tired/hungry",
    "mechanism": "Impulse control is immature; child may be frustrated, tired, jealous, overstimulated, or lacking words.",
    "strategy": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands.",
    "childStorySkill": "practice the replacement action in the same everyday scene",
    "parentGuidance": "For aggression or danger, block calmly, say 'I won't let you hit,' move child to safety, then teach the replacement after calm. Then help the child repair: check on the hurt person, return space, and practice gentle hands. Avoid: Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "targetOutcome": "Child calms faster and begins using words, gestures, or help-seeking instead of escalating.",
    "storyFocusLabel": "Aggression when tired/hungry",
    "expertSources": "CDC; AAP/HealthyChildren; NAEYC; AMS; Mayo/Child Mind",
    "avoidDoing": "Do not hit back, force a fake apology, label the child bad, or leave unsafe behavior unblocked.",
    "aliases": [
      "aggression when",
      "aggression when tired",
      "Aggression when tired/hungry",
      "aggression when tired/hungry",
      "aggression when tired hungry"
    ],
    "intensity": 55
  }
] satisfies BehaviorIssueTemplateEntry[];
