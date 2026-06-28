// Temporary dev sender — Resend test address (no domain verification required).
export const FROM_EMAIL = "Apki Amanat <onboarding@resend.dev>";

const BRAND_GREEN = "#15803d";
const BRAND_GREEN_DARK = "#166534";

function emailLayout({ title, bodyHtml, buttonLabel, buttonHref }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dcfce7;">
          <tr>
            <td style="background-color:${BRAND_GREEN};padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Apki Amanat</p>
              <p style="margin:6px 0 0;font-size:11px;font-weight:600;color:#bbf7d0;text-transform:uppercase;letter-spacing:0.12em;">Your Trust</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
              ${
                buttonLabel && buttonHref
                  ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
                <tr>
                  <td style="border-radius:8px;background-color:${BRAND_GREEN};">
                    <a href="${buttonHref}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${buttonLabel}</a>
                  </td>
                </tr>
              </table>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f0fdf4;border-top:1px solid #dcfce7;text-align:center;">
              <p style="margin:0;font-size:13px;color:#166534;font-weight:500;">Your Trust | آپ کی امانت</p>
              <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">&copy; ${new Date().getFullYear()} Apki Amanat. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildCaseVerifiedEmail({ caseTitle, recipientName }) {
  const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND_GREEN_DARK};">Your case has been verified</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">${greeting}</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">
      Great news! Your case <strong style="color:${BRAND_GREEN_DARK};">"${caseTitle}"</strong> has been verified and is now visible to donors. You should receive help soon.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">— Apki Amanat Team</p>
  `;

  return emailLayout({
    title: "Your case has been verified",
    bodyHtml,
    buttonLabel: "View Dashboard",
    buttonHref: "https://apkiamanat.com/dashboard",
  });
}

export function buildCaseRejectedEmail({ caseTitle, recipientName }) {
  const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND_GREEN_DARK};">Update on your case</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">${greeting}</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">
      Unfortunately your case <strong style="color:${BRAND_GREEN_DARK};">"${caseTitle}"</strong> could not be verified at this time. Please contact us for more information.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">— Apki Amanat Team</p>
  `;

  return emailLayout({
    title: "Update on your case",
    bodyHtml,
    buttonLabel: "Contact Support",
    buttonHref: "mailto:support@apkiamanat.com",
  });
}

export function buildDonationConfirmationEmail({
  donorName,
  caseTitle,
  amountPkr,
}) {
  const greeting = donorName ? `Dear ${donorName},` : "Dear Donor,";
  const formattedAmount = Number(amountPkr).toLocaleString("en-PK");
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND_GREEN_DARK};">Thank you for your donation</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
      Thank you for your generous contribution through Apki Amanat. Your support helps fulfill real needs with dignity and transparency.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #dcfce7;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#15803d;text-transform:uppercase;letter-spacing:0.05em;">Donation Details</p>
          <p style="margin:0 0 6px;font-size:15px;color:#374151;"><strong>Case:</strong> ${caseTitle}</p>
          <p style="margin:0;font-size:15px;color:#374151;"><strong>Amount:</strong> Rs. ${formattedAmount} PKR</p>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#374151;">
      Your donation is being processed. The recipient will be notified once the need is fulfilled.
    </p>
    <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#374151;">With gratitude,<br/>— Apki Amanat Team</p>
  `;

  return emailLayout({
    title: "Thank you for your donation",
    bodyHtml,
    buttonLabel: "Browse More Cases",
    buttonHref: "https://apkiamanat.com/cases",
  });
}

function formatReceiptItemsHtml(items) {
  if (!items?.length) return "<p style=\"margin:0;font-size:15px;color:#374151;\">No items listed.</p>";
  return items
    .map(
      (item) =>
        `<p style="margin:0 0 6px;font-size:15px;color:#374151;">${item.quantity}x ${item.name} — Rs. ${Number(item.pricePkr ?? item.price_pkr ?? 0).toLocaleString("en-PK")} each</p>`,
    )
    .join("");
}

export function buildStoreOrderDonorEmail({
  donorName,
  vendorName,
  caseTitle,
  items,
  totalPkr,
  receiptId,
}) {
  const greeting = donorName ? `Dear ${donorName},` : "Dear Donor,";
  const formattedTotal = Number(totalPkr).toLocaleString("en-PK");
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND_GREEN_DARK};">Your order receipt</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
      Thank you for shopping through Apki Amanat. Your payment is held securely until the recipient collects their items.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #dcfce7;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#15803d;text-transform:uppercase;letter-spacing:0.05em;">Receipt #${receiptId?.slice(0, 8) ?? ""}</p>
          <p style="margin:0 0 6px;font-size:15px;color:#374151;"><strong>Vendor:</strong> ${vendorName}</p>
          <p style="margin:0 0 12px;font-size:15px;color:#374151;"><strong>Case:</strong> ${caseTitle}</p>
          ${formatReceiptItemsHtml(items)}
          <p style="margin:12px 0 0;font-size:15px;color:#374151;"><strong>Total:</strong> Rs. ${formattedTotal} PKR</p>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#374151;">— Apki Amanat Team</p>
  `;

  return emailLayout({
    title: "Your order receipt",
    bodyHtml,
    buttonLabel: "Browse Cases",
    buttonHref: "https://apkiamanat.com/cases",
  });
}

export function buildStoreOrderVendorEmail({
  vendorName,
  donorName,
  caseTitle,
  items,
  totalPkr,
}) {
  const greeting = vendorName ? `Hello ${vendorName},` : "Hello,";
  const formattedTotal = Number(totalPkr).toLocaleString("en-PK");
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND_GREEN_DARK};">New store order</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
      <strong>${donorName ?? "A donor"}</strong> placed a new order for case <strong>"${caseTitle}"</strong>. Please prepare the items for pickup.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #dcfce7;">
      <tr>
        <td style="padding:20px;">
          ${formatReceiptItemsHtml(items)}
          <p style="margin:12px 0 0;font-size:15px;color:#374151;"><strong>Total:</strong> Rs. ${formattedTotal} PKR</p>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#374151;">— Apki Amanat Team</p>
  `;

  return emailLayout({
    title: "New store order",
    bodyHtml,
    buttonLabel: "Vendor Dashboard",
    buttonHref: "https://apkiamanat.com/vendor",
  });
}

export function buildStoreReceiptRecipientEmail({
  recipientName,
  donorName,
  vendorName,
  caseTitle,
  items,
  totalPkr,
}) {
  const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
  const formattedTotal = Number(totalPkr).toLocaleString("en-PK");
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND_GREEN_DARK};">Items ordered for you</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#374151;">${greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
      <strong>${donorName ?? "A generous donor"}</strong> has ordered items for your case <strong>"${caseTitle}"</strong> from <strong>${vendorName}</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #dcfce7;">
      <tr>
        <td style="padding:20px;">
          ${formatReceiptItemsHtml(items)}
          <p style="margin:12px 0 0;font-size:15px;color:#374151;"><strong>Total value:</strong> Rs. ${formattedTotal} PKR</p>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#374151;">
      Please visit the vendor to collect your items when ready. Payment is held by Apki Amanat until you collect.
    </p>
    <p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#374151;">— Apki Amanat Team</p>
  `;

  return emailLayout({
    title: "Items ordered for you",
    bodyHtml,
    buttonLabel: "View Dashboard",
    buttonHref: "https://apkiamanat.com/dashboard",
  });
}

export const EMAIL_SUBJECTS = {
  "case-verified": "Your case has been verified — Apki Amanat",
  "case-rejected": "Update on your case — Apki Amanat",
  "donation-confirmation": "Thank you for your donation — Apki Amanat",
  "store-order-donor": "Your order receipt — Apki Amanat",
  "store-order-vendor": "New store order — Apki Amanat",
  "store-receipt-recipient": "A donor has ordered items for you — Apki Amanat",
};

export function buildEmailHtml(type, data) {
  switch (type) {
    case "case-verified":
      return buildCaseVerifiedEmail(data);
    case "case-rejected":
      return buildCaseRejectedEmail(data);
    case "donation-confirmation":
      return buildDonationConfirmationEmail(data);
    case "store-order-donor":
      return buildStoreOrderDonorEmail(data);
    case "store-order-vendor":
      return buildStoreOrderVendorEmail(data);
    case "store-receipt-recipient":
      return buildStoreReceiptRecipientEmail(data);
    default:
      return null;
  }
}
