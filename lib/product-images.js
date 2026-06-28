export const PRODUCT_IMAGE_MAX_SIZE = 2 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png"];

export const PRODUCT_CATEGORY_ICONS = {
  Medicine: "💊",
  Food: "🍚",
  Grocery: "🛒",
  Stationery: "✏️",
  Other: "📦",
};

export function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function validateProductImage(file) {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPG or PNG image.";
  }
  if (file.size > PRODUCT_IMAGE_MAX_SIZE) {
    return "Image must be 2 MB or smaller.";
  }
  return null;
}

export function getProductImageExtension(file) {
  return file.type === "image/png" ? "png" : "jpg";
}

export async function uploadProductImage(supabase, vendorId, productId, file) {
  const ext = getProductImageExtension(file);
  const path = `${vendorId}/${productId}/${Date.now()}-${sanitizeFileName(file.name || `image.${ext}`)}`;
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
