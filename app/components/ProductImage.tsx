import { PRODUCT_CATEGORY_ICONS } from "@/lib/product-images";

export default function ProductImage({
  name,
  category,
  imageUrl,
  className = "h-40 w-full",
}: {
  name: string;
  category: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const icon = PRODUCT_CATEGORY_ICONS[category as keyof typeof PRODUCT_CATEGORY_ICONS] ?? "📦";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${className} rounded-xl border border-green-100 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex flex-col items-center justify-center rounded-xl border border-green-100 bg-green-50/60`}
      aria-hidden="true"
    >
      <span className="text-4xl">{icon}</span>
      <span className="mt-2 text-xs font-medium text-green-700">{category}</span>
    </div>
  );
}
