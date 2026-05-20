import type { CharacterImageSource } from "./characterPrivacy";

export type CartoonCharacterReplacement =
  | {
      ok: true;
      imageUri: string;
      imageSource: CharacterImageSource;
    }
  | {
      ok: false;
      reason: "unsafe_descriptor";
    };

const RAW_PHOTO_REFERENCE_PATTERN =
  /(data:image\/(?!svg\+xml)|blob:|file:\/\/|https?:\/\/|base64,|photoUri)/i;

export function createCartoonCharacterReplacement(input: {
  descriptor?: string;
  relationship?: "child" | "mom" | "dad";
}): CartoonCharacterReplacement {
  const descriptor = input.descriptor?.trim() ?? "";
  if (RAW_PHOTO_REFERENCE_PATTERN.test(descriptor)) {
    return { ok: false, reason: "unsafe_descriptor" };
  }

  const palette = paletteFromDescriptor(descriptor);
  const accent = input.relationship === "child" ? "#E6B45C" : "#6EA6A1";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-kahani-cartoon="v1" viewBox="0 0 240 240"><rect width="240" height="240" rx="48" fill="${palette.background}"/><circle cx="120" cy="108" r="54" fill="${palette.skin}"/><path d="M66 96c10-38 34-58 60-58 30 0 51 23 55 61-24-18-78-24-115-3z" fill="${palette.hair}"/><path d="M64 188c16-31 35-46 56-46s40 15 56 46v22H64v-22z" fill="${palette.clothing}"/><circle cx="99" cy="111" r="6" fill="#3A3028"/><circle cx="141" cy="111" r="6" fill="#3A3028"/><path d="M102 132c10 8 26 8 36 0" fill="none" stroke="#3A3028" stroke-width="7" stroke-linecap="round"/><circle cx="188" cy="60" r="20" fill="${accent}"/></svg>`;

  return {
    ok: true,
    imageUri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    imageSource: "generated-cartoon",
  };
}

function paletteFromDescriptor(descriptor: string) {
  const normalized = descriptor.toLowerCase();
  const hash = hashString(normalized || "generic-character");
  return {
    background: pick(hash, ["#F7E6C8", "#DCEBDD", "#D8E2F1", "#F2D7D9"]),
    skin: pick(hash >> 2, ["#8D5F45", "#B77A54", "#D5A06F", "#F0C9A0"]),
    hair: colorFromDescriptor(normalized, "hair", [
      "#3A3028",
      "#6B4A35",
      "#B88A4A",
      "#C8C3BA",
    ]),
    clothing: colorFromDescriptor(normalized, "clothing", [
      "#6E8FB2",
      "#8E6DAE",
      "#D2786D",
      "#6EA6A1",
    ]),
  };
}

function colorFromDescriptor(
  descriptor: string,
  target: "hair" | "clothing",
  fallback: string[],
) {
  const colors: Record<string, string> = {
    black: "#2F2925",
    blonde: "#D8B35A",
    blue: "#5C87B9",
    brown: "#6B4A35",
    gray: "#A5A39C",
    green: "#6EA66E",
    pink: "#D98DA5",
    purple: "#8E6DAE",
    red: "#C85D4D",
    white: "#F1EEE8",
    yellow: "#D9B94C",
  };

  for (const [name, color] of Object.entries(colors)) {
    if (descriptor.includes(`${name} ${target}`)) return color;
  }

  return pick(hashString(`${target}:${descriptor}`), fallback);
}

function pick<T>(hash: number, values: T[]) {
  return values[Math.abs(hash) % values.length];
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}
