import { AuthTokenManager } from "@/lib/clientAuth";
import { getCsrfHeaders } from "@/lib/clientCsrf";
import { sanitizeText } from "@/utils/sanitize";

export const usersService = {
  async fetchUserProfile(uid: string) {
    const authHeader = AuthTokenManager.getAuthHeader();
    const res = await fetch(`/api/users/${uid}`, {
      headers: {
        ...(authHeader || {}),
      },
    });
    if (!res.ok) throw new Error("Failed to fetch user profile");
    const payload = await res.json();
    return payload.data || payload;
  },

  async updateUserProfile(uid: string, data: any) {
    const authHeader = AuthTokenManager.getAuthHeader();
    const csrfHeaders = await getCsrfHeaders();
    
    // Sanitize any user-supplied text
    const sanitizedData = { ...data };
    const textFields = ["name", "phone", "address", "city", "state", "postalCode", "bio"];
    textFields.forEach((field) => {
      if (typeof sanitizedData[field] === "string") {
        sanitizedData[field] = sanitizeText(sanitizedData[field]);
      }
    });

    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader || {}),
        ...csrfHeaders,
      },
      body: JSON.stringify({ id: uid, ...sanitizedData }),
    });

    if (!res.ok) {
      const errPayload = await res.json();
      throw new Error(errPayload?.error?.message || errPayload?.error || "Failed to update profile");
    }

    return await res.json();
  },

  async fetchAllUsers() {
    const authHeader = AuthTokenManager.getAuthHeader();
    const res = await fetch("/api/users", {
      headers: {
        ...(authHeader || {}),
      },
    });
    if (!res.ok) {
      const errPayload = await res.json();
      throw new Error(errPayload?.error?.message || "Failed to fetch users");
    }
    const payload = await res.json();
    return payload.data?.users || payload.users || [];
  },

  async deleteUser(uid: string) {
    const authHeader = AuthTokenManager.getAuthHeader();
    const csrfHeaders = await getCsrfHeaders();
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader || {}),
        ...csrfHeaders,
      },
      body: JSON.stringify({ id: uid }),
    });

    if (!res.ok) {
      const errPayload = await res.json();
      throw new Error(errPayload?.error?.message || errPayload?.error || "Failed to delete user");
    }

    return await res.json();
  }
};
