
export type CategoryId =
  | "hospital"
  | "police"
  | "pharmacy"
  | "fire"
  | "fuel"
  | "towing"
  | "tyre"
  | "showroom";

export interface ServiceCategory {
  id: CategoryId;
  label: string;
  /** short label for chips */
  short: string;
  emoji: string;
  /** Tailwind accent colour token */
  color: string;
  /** Priority categories are emergency-critical and shown first / opened by default. */
  priority: boolean;
  /**
   * Overpass tag filters. Each entry becomes a node/way/relation query.
   * Format: [key, value]. value "*" means "any value present".
   */
  osm: [string, string][];
}

export const CATEGORIES: ServiceCategory[] = [
  {
    id: "hospital",
    label: "Hospitals, Clinics & Trauma Centres",
    short: "Hospital",
    emoji: "🏥",
    color: "#ef4444",
    priority: true,
    // Also match clinics/doctors — in many regions (esp. rural India) urgent
    // medical help is tagged as a clinic or doctor's surgery, not "hospital".
    osm: [
      ["amenity", "hospital"],
      ["healthcare", "hospital"],
      ["amenity", "clinic"],
      ["healthcare", "clinic"],
      ["amenity", "doctors"],
      ["emergency", "yes"],
    ],
  },
  {
    id: "police",
    label: "Police Stations",
    short: "Police",
    emoji: "🚓",
    color: "#3b82f6",
    priority: true,
    osm: [["amenity", "police"]],
  },
  {
    id: "pharmacy",
    label: "Pharmacies",
    short: "Pharmacy",
    emoji: "💊",
    color: "#10b981",
    priority: true,
    osm: [
      ["amenity", "pharmacy"],
      ["healthcare", "pharmacy"],
      ["shop", "chemist"],
      ["shop", "medical_supply"],
    ],
  },
  {
    id: "fire",
    label: "Fire Stations",
    short: "Fire",
    emoji: "🚒",
    color: "#f97316",
    priority: true,
    osm: [["amenity", "fire_station"]],
  },
  {
    id: "fuel",
    label: "Fuel / Petrol Stations",
    short: "Fuel",
    emoji: "⛽",
    color: "#a855f7",
    priority: false,
    osm: [["amenity", "fuel"]],
  },
  {
    id: "towing",
    label: "Towing & Vehicle Recovery",
    short: "Towing",
    emoji: "🛻",
    color: "#eab308",
    priority: false,
    osm: [
      ["amenity", "vehicle_inspection"],
      ["shop", "car_repair"],
      ["service:vehicle:towing", "yes"],
    ],
  },
  {
    id: "tyre",
    label: "Puncture / Tyre Repair",
    short: "Tyre",
    emoji: "🛞",
    color: "#64748b",
    priority: false,
    osm: [
      ["shop", "tyres"],
      ["service:vehicle:tyres", "yes"],
    ],
  },
  {
    id: "showroom",
    label: "Car Showrooms & Service",
    short: "Showroom",
    emoji: "🚗",
    color: "#0ea5e9",
    priority: false,
    osm: [
      ["shop", "car"],
      ["shop", "car_repair"],
    ],
  },
];

export const CATEGORY_MAP: Record<CategoryId, ServiceCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, ServiceCategory>;
