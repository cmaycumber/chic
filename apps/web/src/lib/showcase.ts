export interface ShowcaseHotspot {
  detail: string;
  id: string;
  label: string;
  price: number;
  searchQuery: string;
  x: number;
  y: number;
}

/** Normalized (0..1) coordinates into showcase-living-room.jpg. */
export const SHOWCASE_HOTSPOTS: ShowcaseHotspot[] = [
  {
    detail: "Deep-seat modular sofa in soft bouclé.",
    id: "sofa",
    label: "Charcoal modular sofa",
    price: 1299,
    searchQuery: "charcoal modular sofa",
    x: 0.5,
    y: 0.66,
  },
  {
    detail: "Sweeping arc silhouette in brushed brass.",
    id: "lamp",
    label: "Brass arc floor lamp",
    price: 189,
    searchQuery: "brass arc floor lamp",
    x: 0.63,
    y: 0.43,
  },
  {
    detail: "Solid reclaimed oak with a live edge.",
    id: "coffee-table",
    label: "Reclaimed wood coffee table",
    price: 449,
    searchQuery: "reclaimed wood coffee table",
    x: 0.51,
    y: 0.76,
  },
  {
    detail: "Cognac leather sling seat on a steel frame.",
    id: "chair-right",
    label: "Leather sling chair",
    price: 399,
    searchQuery: "leather sling chair",
    x: 0.84,
    y: 0.74,
  },
  {
    detail: "Round leather pouf, footrest or extra seat.",
    id: "pouf",
    label: "Cognac leather pouf",
    price: 129,
    searchQuery: "cognac leather pouf",
    x: 0.45,
    y: 0.83,
  },
  {
    detail: "Hand-woven rattan frame with a linen cushion.",
    id: "chair-left",
    label: "Rattan lounge chair",
    price: 329,
    searchQuery: "rattan lounge chair",
    x: 0.23,
    y: 0.73,
  },
  {
    detail: "Faux bird of paradise, potted, 5 feet tall.",
    id: "plant",
    label: "Bird of paradise, 5 ft",
    price: 89,
    searchQuery: "bird of paradise plant 5 ft",
    x: 0.94,
    y: 0.6,
  },
] as const;

/** Guided-demo cycling order: a pleasant sweep across the room. */
export const SHOWCASE_DEMO_ORDER = [
  "sofa",
  "lamp",
  "coffee-table",
  "chair-right",
  "pouf",
  "chair-left",
  "plant",
] as const;
