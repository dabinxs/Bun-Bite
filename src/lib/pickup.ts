export interface PickupBranch {
  id: string;
  name: string;
  address: string;
  hours: string;
  fullHours: string;
  contact: string;
  status: "Open" | "Closed";
  pickup: string;
  delivery: string;
  prepTime: string;
  mapUrl: string;
  availableProductIds: number[];
}

export const PICKUP_BRANCHES: PickupBranch[] = [
  {
    id: "binan-main",
    name: "Bun & Bite - Bi\u00f1an Main Branch",
    address: "Barangay Langkiwa, Bi\u00f1an City, Laguna",
    hours: "9:00 AM - 10:00 PM",
    fullHours: "Monday to Sunday, 9:00 AM - 10:00 PM",
    contact: "+63 912 345 6789",
    status: "Open",
    pickup: "Available",
    delivery: "Available",
    prepTime: "15-25 minutes",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Barangay+Langkiwa+Binan+City+Laguna",
    availableProductIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
  {
    id: "pavilion",
    name: "Bun & Bite - Pavilion Branch",
    address: "Pavilion Mall Area, Bi\u00f1an City, Laguna",
    hours: "10:00 AM - 9:00 PM",
    fullHours: "Monday to Sunday, 10:00 AM - 9:00 PM",
    contact: "+63 917 222 3344",
    status: "Open",
    pickup: "Available",
    delivery: "Limited nearby areas",
    prepTime: "20-30 minutes",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Pavilion+Mall+Area+Binan+City+Laguna",
    availableProductIds: [1, 3, 4, 5, 6, 7, 9, 10, 13, 14, 15, 17, 18],
  },
  {
    id: "sta-rosa",
    name: "Bun & Bite - Sta. Rosa Branch",
    address: "Sta. Rosa, Laguna",
    hours: "10:00 AM - 10:00 PM",
    fullHours: "Monday to Sunday, 10:00 AM - 10:00 PM",
    contact: "+63 918 555 7788",
    status: "Open",
    pickup: "Available",
    delivery: "Available",
    prepTime: "20-35 minutes",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Sta+Rosa+Laguna",
    availableProductIds: [1, 2, 4, 5, 8, 11, 12, 13, 15, 16, 18, 19],
  },
];

export function getPickupBranch(branchId: string | undefined) {
  return PICKUP_BRANCHES.find((branch) => branch.id === branchId);
}
