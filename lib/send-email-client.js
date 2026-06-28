/**
 * Fire-and-forget email helper. Failures are logged but never block the caller.
 */
export async function sendEmail(payload) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.error("Email send failed:", body.error ?? response.statusText);
    }
  } catch (err) {
    console.error("Email send error:", err);
  }
}
