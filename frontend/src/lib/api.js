const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080";

const SESSION_KEY = "unibite_session";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      typeof body === "string" && body
        ? body
        : `Request failed (${response.status})`,
    );
  }

  return body;
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function login(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout(token) {
  return apiRequest("/api/auth/logout", {
    method: "POST",
    headers: {
      "X-Session-Token": token,
    },
  });
}

export function getListings() {
  return apiRequest("/api/listings");
}

export function getUsers() {
  return apiRequest("/api/users");
}

export function getListingsByRestaurant(restaurantId) {
  return apiRequest(`/api/listings/restaurant/${restaurantId}`);
}

export function createListing(payload) {
  return apiRequest("/api/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createClaim(payload) {
  return apiRequest("/api/claims", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getClaimsByStudent(studentId) {
  return apiRequest(`/api/claims/student/${studentId}`);
}

export function getClaimsByListing(listingId) {
  return apiRequest(`/api/claims/listing/${listingId}`);
}

export function cancelClaim(claimId) {
  return apiRequest(`/api/claims/${claimId}/cancel`, {
    method: "POST",
  });
}

export function redeemByToken(qrToken) {
  return apiRequest(`/api/claims/redeem?qrToken=${encodeURIComponent(qrToken)}`, {
    method: "POST",
  });
}
