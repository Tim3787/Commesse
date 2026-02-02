export function getToken() {
  return localStorage.getItem("token") || "";
}

export function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("decodeJwt error:", e);
    return null;
  }
}

export function getAuthUser() {
  return decodeJwt(getToken());
}
