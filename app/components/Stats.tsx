const stats = [
  {
    value: "2,500+",
    label: "Needs Fulfilled",
    description: "Real help delivered through verified vendors",
  },
  {
    value: "$1.2M+",
    label: "In-Kind Value",
    description: "Direct contributions — never cash handoffs",
  },
  {
    value: "450+",
    label: "Verified Donors",
    description: "Generous hearts across Canada & the USA",
  },
  {
    value: "180+",
    label: "Partner Vendors",
    description: "Pharmacies, stores, schools & more in Pakistan",
  },
];

export default function Stats() {
  return (
    <section className="bg-green-800 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Impact you can trust
          </h2>
          <p className="mt-3 text-green-100">
            Every number represents a family helped with dignity and
            transparency.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-green-700/50 bg-green-900/30 p-6 text-center backdrop-blur-sm"
            >
              <p className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 font-semibold text-green-100">{stat.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-green-200/80">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
