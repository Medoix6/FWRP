export type DonationStatus =
  | "available"
  | "reserved"
  | "picked_up"
  | "expired"
  | "cancelled"
  | "removed";

export interface DonationLocation {
  lat: number;
  lng: number;
}

export interface Donation {
  id: string;
  foodName: string;
  description: string;
  location: string;
  locationCoords?: DonationLocation;
  category?: string;
  quantityServings?: number;
  allergens?: string[];
  packaging?: string;
  expiryDate: string;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  pickupInstructions?: string;
  imageUrls: string[];
  status: DonationStatus;
  reservedBy?: string | null;
  reservedAt?: string | null;
  pickedUpAt?: string | null;
  removedAt?: string | null;
  userId: string;
  userEmail?: string;
  userName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
