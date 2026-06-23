import { AuthTokenManager } from "@/lib/clientAuth";
import { getCsrfHeaders } from "@/lib/clientCsrf";
import { sanitizeText } from "@/utils/sanitize";

export interface CreateDonationPayload {
  foodName: string;
  description: string;
  location: string;
  expiryDate: string;
  images: File[];
  pickupInstructions?: string;
  category?: string;
  quantityServings?: number;
  allergens?: string;
  packaging?: string;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  locationLat?: number;
  locationLng?: number;
}

export const listingsService = {
  async fetchListings() {
    const authHeader = AuthTokenManager.getAuthHeader();
    const res = await fetch("/api/donated-food", {
      headers: {
        ...(authHeader || {}),
      },
    });
    if (!res.ok) throw new Error("Failed to fetch listings");
    const payload = await res.json();
    return payload.data?.donations || payload.donations || [];
  },

  async fetchListingById(id: string) {
    const authHeader = AuthTokenManager.getAuthHeader();
    const res = await fetch(`/api/donated-food/${id}`, {
      headers: {
        ...(authHeader || {}),
      },
    });
    if (!res.ok) throw new Error("Failed to fetch listing detail");
    const payload = await res.json();
    return payload.data || payload;
  },

  async createListing(payload: CreateDonationPayload) {
    const authHeader = AuthTokenManager.getAuthHeader();
    const csrfHeaders = await getCsrfHeaders();

    const formData = new FormData();
    formData.append("foodName", sanitizeText(payload.foodName));
    formData.append("description", sanitizeText(payload.description));
    formData.append("location", sanitizeText(payload.location));
    formData.append("expiryDate", payload.expiryDate);
    
    if (payload.pickupInstructions) {
      formData.append("pickupInstructions", sanitizeText(payload.pickupInstructions));
    }
    if (payload.category) {
      formData.append("category", payload.category);
    }
    if (payload.quantityServings) {
      formData.append("quantityServings", payload.quantityServings.toString());
    }
    if (payload.allergens) {
      formData.append("allergens", sanitizeText(payload.allergens));
    }
    if (payload.packaging) {
      formData.append("packaging", sanitizeText(payload.packaging));
    }
    if (payload.pickupWindowStart) {
      formData.append("pickupWindowStart", payload.pickupWindowStart);
    }
    if (payload.pickupWindowEnd) {
      formData.append("pickupWindowEnd", payload.pickupWindowEnd);
    }
    if (payload.locationLat) {
      formData.append("locationLat", payload.locationLat.toString());
    }
    if (payload.locationLng) {
      formData.append("locationLng", payload.locationLng.toString());
    }

    payload.images.forEach((image) => {
      formData.append("images", image);
    });

    const res = await fetch("/api/donated-food", {
      method: "POST",
      headers: {
        ...(authHeader || {}),
        ...csrfHeaders,
      },
      body: formData,
    });

    if (!res.ok) {
      const errPayload = await res.json();
      throw new Error(errPayload?.error?.message || errPayload?.error || "Failed to create listing");
    }

    return await res.json();
  },

  async updateListing(id: string, form: FormData) {
    const authHeader = AuthTokenManager.getAuthHeader();
    const csrfHeaders = await getCsrfHeaders();
    const res = await fetch(`/api/donated-food/${id}`, {
      method: "PATCH",
      headers: {
        ...(authHeader || {}),
        ...csrfHeaders,
      },
      body: form,
    });
    if (!res.ok) {
      const errPayload = await res.json();
      throw new Error(errPayload?.error?.message || errPayload?.error || "Failed to update listing");
    }
    return await res.json();
  },

  async deleteListing(id: string) {
    const authHeader = AuthTokenManager.getAuthHeader();
    const csrfHeaders = await getCsrfHeaders();
    const res = await fetch(`/api/donated-food?id=${id}`, {
      method: "DELETE",
      headers: {
        ...(authHeader || {}),
        ...csrfHeaders,
      },
    });
    if (!res.ok) {
      const errPayload = await res.json();
      throw new Error(errPayload?.error?.message || errPayload?.error || "Failed to delete listing");
    }
    return await res.json();
  },

  async performAction(id: string, action: "reserve" | "pickup" | "cancel" | "remove") {
    const authHeader = AuthTokenManager.getAuthHeader();
    const csrfHeaders = await getCsrfHeaders();
    const res = await fetch(`/api/donated-food/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader || {}),
        ...csrfHeaders,
      },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const errPayload = await res.json();
      throw new Error(errPayload?.error?.message || errPayload?.error || "Action failed");
    }
    return await res.json();
  }
};
