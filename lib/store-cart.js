const CART_PREFIX = "apkiamanat-store-cart-";

export function saveStoreCart(vendorId, cart) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${CART_PREFIX}${vendorId}`, JSON.stringify(cart));
}

export function loadStoreCart(vendorId) {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${CART_PREFIX}${vendorId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoreCart(vendorId) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${CART_PREFIX}${vendorId}`);
}

export function formatCartItemsSummary(cart) {
  return cart
    .map((item) => `${item.quantity}x ${item.name} (${item.pricePkr} PKR each)`)
    .join("; ");
}

export function buildReceiptPayload({
  receiptId,
  donorName,
  vendorName,
  items,
  total,
  caseTitle,
  date,
  recipientName,
  recipientEmail,
}) {
  return {
    receipt_id: receiptId,
    donor_name: donorName,
    vendor_name: vendorName,
    items,
    total,
    date,
    case_title: caseTitle,
    recipient_name: recipientName ?? null,
    recipient_email: recipientEmail ?? null,
  };
}

const RECEIPT_PREFIX = "apkiamanat-receipt-";

export function saveStoredReceipt(receiptId, payload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${RECEIPT_PREFIX}${receiptId}`, JSON.stringify(payload));
}

export function loadStoredReceipt(receiptId) {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${RECEIPT_PREFIX}${receiptId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
