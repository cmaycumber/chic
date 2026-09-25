/**
 * The text half of a room edit: read a comment against what is in the photo,
 * decide whether it is furniture to buy, and pick one listing per piece.
 *
 * Both calls are small structured lookups on the same model
 * (`ROOM_PLAN_MODEL`, Gemini 3.5 Flash Lite by default, thinking off).
 * Inception models have no JSON-schema mode on the AI Gateway, so for those
 * the answer comes back as a forced call to a single tool instead.
 */
import {
  gateway,
  generateObject,
  generateText,
  type LanguageModelUsage,
  tool,
} from "ai";
import z from "zod";
import type { AmazonProduct } from "./amazonSearch";

const DEFAULT_PLAN_MODEL = "google/gemini-3.5-flash-lite";
/** Models reached only through a forced tool call. */
const TOOL_CALL_PREFIX = "inception/";

/** The most pieces of furniture one comment may buy and place. */
export const MAX_PLAN_SLOTS = 3;
const PERCENT = 100;

/**
 * Amazon's search thumbnails are cut-outs on white; `_AC_UL` / `_AC_SX` /
 * `_AC_SY` are the catalogue-image renditions. Anything else is more likely a
 * lifestyle shot, which the image model copies badly.
 */
const CLEAN_PRODUCT_SHOT = /\._AC_(UL|SX|SY|SL)\d*/;

export function planModelId(override?: string): string {
  return override || process.env.ROOM_PLAN_MODEL || DEFAULT_PLAN_MODEL;
}

interface StructuredCall<T> {
  modelId: string;
  prompt: string;
  schema: z.ZodType<T>;
  toolDescription: string;
  toolName: string;
}

/**
 * One structured answer from the planning model: `generateObject` where the
 * provider has a schema mode, a forced tool call where it does not. Either
 * way the result is checked against the schema before it is trusted.
 */
async function callStructured<T>(
  call: StructuredCall<T>
): Promise<{ object: T; usage: LanguageModelUsage }> {
  const model = gateway.languageModel(call.modelId);
  // Planning is a lookup over a short list, not a reasoning task.
  const providerOptions = {
    google: { thinkingConfig: { thinkingBudget: 0 } },
    openai: { reasoningEffort: "minimal" },
  };

  if (!call.modelId.startsWith(TOOL_CALL_PREFIX)) {
    const { object, usage } = await generateObject({
      model,
      prompt: call.prompt,
      providerOptions,
      schema: call.schema,
    });
    return { object, usage };
  }

  const result = await generateText({
    model,
    prompt: call.prompt,
    providerOptions,
    toolChoice: { toolName: call.toolName, type: "tool" },
    tools: {
      [call.toolName]: tool({
        description: call.toolDescription,
        inputSchema: call.schema,
      }),
    },
  });
  const input = result.toolCalls.find(
    (candidate) => candidate.toolName === call.toolName
  )?.input;
  const parsed = call.schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`${call.toolName} returned an invalid answer`);
  }
  return { object: parsed.data, usage: result.usage };
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

const planSchema = z.object({
  kind: z
    .enum(["products", "freeform"])
    .describe(
      "products: the comment asks for furniture, lighting, rugs or decor someone could buy. freeform: anything else (paint, walls, flooring, light, mood, removing things, rearranging)."
    ),
  slots: z
    .array(
      z.object({
        action: z
          .enum(["replace", "add"])
          .describe(
            "replace: swap an item already in the room. add: a new item."
          ),
        itemId: z
          .string()
          .nullable()
          .describe("For replace: the id of the room item being swapped"),
        label: z.string().describe("Short name, e.g. 'Sofa', 'Coffee table'"),
        maxPrice: z
          .number()
          .nullable()
          .describe("Budget in USD if the comment gives one"),
        placement: z
          .string()
          .describe(
            "Where it goes in the photo, e.g. 'where the current sofa is', 'in front of the sofa, centred on the rug'"
          ),
        searchQuery: z
          .string()
          .describe(
            "Specific Amazon search query: style, colour, material and type as the comment asks. No brand names."
          ),
      })
    )
    .describe(`Empty for freeform. At most ${MAX_PLAN_SLOTS}.`),
});

export interface SurveyItem {
  box: { height: number; width: number; x: number; y: number };
  description: string;
  id: string;
  label: string;
}

export interface PlanInput {
  anchor?: { x: number; y: number };
  anchoredItem: SurveyItem | null;
  items: SurveyItem[];
  roomType?: string;
  style?: string;
  text: string;
}

export interface PlannedSlot {
  action: "add" | "replace";
  itemId?: string;
  label: string;
  maxPrice?: number;
  placement: string;
  searchQuery: string;
}

export interface Plan {
  kind: "freeform" | "products";
  slots: PlannedSlot[];
}

const FREEFORM: Plan = { kind: "freeform", slots: [] };

const pct = (value: number) => Math.round(value * PERCENT);

function describeItem(item: SurveyItem) {
  const { box } = item;
  return `- ${item.id}: ${item.label} (${item.description}); spans ${pct(box.x)}-${pct(box.x + box.width)}% across, ${pct(box.y)}-${pct(box.y + box.height)}% down`;
}

function buildPlanPrompt(input: PlanInput) {
  const room = [input.style, input.roomType?.replaceAll("-", " ")]
    .filter(Boolean)
    .join(" ");
  const pin = input.anchor
    ? `The comment is pinned at ${pct(input.anchor.x)}% across and ${pct(input.anchor.y)}% down${input.anchoredItem ? `, on ${input.anchoredItem.id} (${input.anchoredItem.label}). "This", "it" or an unnamed object in the comment means that item.` : "."}`
    : "The comment is not pinned to a spot.";
  return `You plan edits to a photo of a real ${room || "room"} for a shopping app. Every piece of furniture the edit puts in the photo is bought on Amazon, so decide what to buy.

Items in the photo:
${input.items.map(describeItem).join("\n") || "- (none detected)"}

${pin}

Comment: "${input.text}"

If the comment asks for furniture, lighting, rugs, art or decor to be replaced or added, answer kind "products" with one slot per piece to buy (at most ${MAX_PLAN_SLOTS}, the most important first). For "replace", itemId must be one of the ids above. The search query must describe the new piece the comment wants, not the old one. A general restyle ("make it mid-century") means the few most prominent pieces. Otherwise (paint, walls, floors, lighting mood, removing or moving things) answer kind "freeform" with no slots.`;
}

/** Keep only what the rest of the pipeline can act on. */
function tidyPlan(raw: z.infer<typeof planSchema>, input: PlanInput): Plan {
  const knownIds = new Set(input.items.map((item) => item.id));
  const slots = raw.slots
    .filter((slot) => slot.searchQuery.trim() && slot.label.trim())
    .slice(0, MAX_PLAN_SLOTS)
    .map((slot): PlannedSlot => {
      const itemId =
        slot.itemId && knownIds.has(slot.itemId) ? slot.itemId : undefined;
      return {
        // A swap of something that is not in the photo is an addition.
        action: slot.action === "replace" && itemId ? "replace" : "add",
        itemId,
        label: slot.label.trim(),
        maxPrice: slot.maxPrice ?? undefined,
        placement: slot.placement.trim(),
        searchQuery: slot.searchQuery.trim(),
      };
    });
  if (raw.kind === "freeform" || slots.length === 0) {
    return FREEFORM;
  }
  return { kind: "products", slots };
}

/** One planning call; null when the answer was unusable. */
async function attemptPlan(
  input: PlanInput,
  modelId: string,
  attempt: number
): Promise<Plan | null> {
  const startedAt = Date.now();
  try {
    const { object, usage } = await callStructured({
      modelId,
      prompt: buildPlanPrompt(input),
      schema: planSchema,
      toolDescription: "Submit the edit plan for this comment.",
      toolName: "submit_plan",
    });
    const plan = tidyPlan(object, input);
    // biome-ignore lint/suspicious/noConsole: usage telemetry for cost tracking
    console.info("[roomsAi] plan", {
      attempt,
      kind: plan.kind,
      model: modelId,
      ms: Date.now() - startedAt,
      slots: plan.slots.map((slot) => `${slot.action}:${slot.searchQuery}`),
      usage,
    });
    return plan;
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: planner reliability telemetry
    console.warn("[roomsAi] plan failed", {
      attempt,
      error: error instanceof Error ? error.message : String(error),
      model: modelId,
      ms: Date.now() - startedAt,
    });
    return null;
  }
}

/**
 * Read a comment and decide what it buys. Retries once on a malformed answer;
 * after that the comment is treated as freeform, which is always renderable.
 */
export async function planComment(
  input: PlanInput,
  modelOverride?: string
): Promise<Plan> {
  const modelId = planModelId(modelOverride);
  return (
    (await attemptPlan(input, modelId, 1)) ??
    (await attemptPlan(input, modelId, 2)) ??
    FREEFORM
  );
}

// ---------------------------------------------------------------------------
// Pick
// ---------------------------------------------------------------------------

const pickSchema = z.object({
  picks: z.array(
    z.object({
      listing: z.number().int().describe("Index of the chosen listing"),
      slot: z.number().int().describe("Index of the slot"),
    })
  ),
});

export interface PickSlot {
  label: string;
  listings: AmazonProduct[];
  maxPrice?: number;
  searchQuery: string;
}

const isCleanShot = (product: AmazonProduct) =>
  CLEAN_PRODUCT_SHOT.test(product.imageUrl);

/**
 * The listing a sensible shopper would take without reading: within budget,
 * a clean product photo, and the most well-reviewed rating.
 */
function fallbackPick(slot: PickSlot): number {
  let best = 0;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const [index, product] of slot.listings.entries()) {
    const overBudget =
      slot.maxPrice !== undefined && product.price > slot.maxPrice;
    const score =
      (product.rating ?? 0) * Math.log1p(product.reviewCount ?? 0) +
      (isCleanShot(product) ? 1 : 0) -
      (overBudget ? PERCENT : 0);
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  }
  return best;
}

function buildPickPrompt(comment: string, slots: PickSlot[]) {
  const sections = slots.map((slot, slotIndex) => {
    const listings = slot.listings.map(
      (product, index) =>
        `  ${index}. ${product.name} | $${product.price} | ${product.rating ?? "?"} stars, ${product.reviewCount ?? 0} reviews | ${isCleanShot(product) ? "catalogue photo" : "photo type unknown"}`
    );
    const budget =
      slot.maxPrice === undefined ? "" : ` (budget $${slot.maxPrice})`;
    return `Slot ${slotIndex}: ${slot.label}, searched as "${slot.searchQuery}"${budget}\n${listings.join("\n")}`;
  });
  return `A shopper commented on a photo of their room: "${comment}"

For each slot, choose the one listing that best matches what they asked for. Prefer, in order: a faithful match to the requested style, colour and material; within budget; a clean catalogue photo of the product alone; a good rating with many reviews. Answer with one pick per slot.

${sections.join("\n\n")}`;
}

/**
 * Choose one listing per slot in a single call. Any slot the model skips or
 * answers out of range gets the deterministic pick, as does every slot when
 * the call itself fails.
 */
export async function pickProducts(
  comment: string,
  slots: PickSlot[],
  modelOverride?: string
): Promise<number[]> {
  const fallback = slots.map(fallbackPick);
  const modelId = planModelId(modelOverride);
  const startedAt = Date.now();
  try {
    const { object, usage } = await callStructured({
      modelId,
      prompt: buildPickPrompt(comment, slots),
      schema: pickSchema,
      toolDescription: "Submit the chosen listing for each slot.",
      toolName: "submit_picks",
    });
    const chosen = [...fallback];
    const answered = new Set<number>();
    for (const pick of object.picks) {
      const slot = slots.at(pick.slot);
      if (slot && pick.listing >= 0 && pick.listing < slot.listings.length) {
        chosen[pick.slot] = pick.listing;
        answered.add(pick.slot);
      }
    }
    // biome-ignore lint/suspicious/noConsole: usage telemetry for cost tracking
    console.info("[roomsAi] pick", {
      fallbackSlots: slots.length - answered.size,
      model: modelId,
      ms: Date.now() - startedAt,
      picks: chosen,
      usage,
    });
    return chosen;
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: picker reliability telemetry
    console.warn("[roomsAi] pick failed", {
      error: error instanceof Error ? error.message : String(error),
      model: modelId,
      ms: Date.now() - startedAt,
      picks: fallback,
    });
    return fallback;
  }
}
