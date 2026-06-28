export function businessTypesForCategory(category) {
  switch (category) {
    case "Medicine":
      return ["Pharmacy"];
    case "Food":
      return ["Grocery Store"];
    case "School Fees":
      return ["School"];
    default:
      return null;
  }
}

export function normalizeCity(city) {
  return city.trim().split(",")[0].trim().toLowerCase();
}

export function citiesMatch(a, b) {
  return normalizeCity(a) === normalizeCity(b);
}

export function sortVendorsByRecipientCity(vendors, recipientCity) {
  return [...vendors].sort((a, b) => {
    const aNear = citiesMatch(a.city, recipientCity);
    const bNear = citiesMatch(b.city, recipientCity);
    if (aNear && !bNear) return -1;
    if (!aNear && bNear) return 1;
    return a.business_name.localeCompare(b.business_name);
  });
}

export function countProductsByVendor(productRows) {
  const counts = new Map();
  for (const row of productRows) {
    counts.set(row.vendor_id, (counts.get(row.vendor_id) ?? 0) + 1);
  }
  return counts;
}
