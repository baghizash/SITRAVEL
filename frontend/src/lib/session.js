// Persistent client session id for seat-lock realtime coordination.
const KEY = "sitravel_session_id";

export function getSessionId() {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = "sess_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "sess_" + Math.random().toString(36).slice(2, 12);
  }
}
