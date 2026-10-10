import { Activity, HeartPulse, Leaf, Pill, Stethoscope } from "lucide-react";

export const categories = [
  { id: "medicines", name: "Medicines", shortName: "Medicines", description: "Know what you take, and why.", icon: Pill, color: "sage" },
  { id: "conditions", name: "Diseases & conditions", shortName: "Conditions", description: "Understand the signs and the science.", icon: HeartPulse, color: "peach" },
  { id: "instruments", name: "Medical instruments", shortName: "Instruments", description: "Get familiar with the tools of care.", icon: Stethoscope, color: "lavender" },
  { id: "wellness", name: "Health & wellness", shortName: "Wellness", description: "Small steps toward feeling better.", icon: Leaf, color: "yellow" },
  { id: "first-aid", name: "First aid", shortName: "First aid", description: "Learn the basics. Be better prepared.", icon: Activity, color: "blue" },
] as const;

export function getCategory(id: string) {
  return categories.find((category) => category.id === id) ?? categories[0];
}
