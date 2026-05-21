# Behavior Taxonomy Staging Smoke Fixtures

Use synthetic characters only. Do not use real child names, family photos, or real family behavior details.

## Local Classification Fixtures

| Fixture | Prompt | Expected result |
|---|---|---|
| `bedtime-separation` | `My child will not sleep alone and needs me to stay in the room.` | Classifies as bedtime separation anxiety; no clarification. |
| `bedtime-transition` | `My child will not stop playing to get ready for bed.` | Classifies as bedtime transition resistance; no clarification. |
| `vague-bedtime` | `Bedtime is awful.` | Returns one clarification question; no story job starts. |
| `multi-issue-bedtime` | `Won't change clothes, asks me to stay, and screams when bedtime starts.` | Auto-picks bedtime meltdown recovery as primary; secondary issues are not story goals. |
| `developmental-red-flag` | `My 4 year old stopped speaking and is not speaking anymore.` | Blocks with professional-support guidance; no story job starts. |
| `medical-red-flag` | `My child won't eat and is losing weight.` | Blocks with professional-support guidance; no story job starts. |

## Provider-Backed Fixtures

Run only after staging provider caps are confirmed.

| Fixture | Prompt | Expected result |
|---|---|---|
| `allowed-sharing` | `My child grabs blocks and will not share with friends.` | Story job completes; story focus is sharing and turn-taking practice; Library saves without visible taxonomy labels. |
| `allowed-bedtime-transition` | `My child will not stop playing to get ready for bed.` | Story job completes; parent note and story prompt use the transition strategy. |

## Page Boundary Fixtures

For service-level verification, use synthetic story JSON with 8, 10, and 12 pages. Expected result: all pages preserve text order and page images map to `story_page_01.png` through the matching final page number. Unused 4x4 sheet cells remain blank and are not mapped to reader story pages.
