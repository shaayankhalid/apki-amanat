const donorSteps = [
  {
    step: "01",
    title: "Browse verified cases",
    description:
      "Explore real needs from verified recipients — medicine, food, school fees, wedding expenses, and more.",
  },
  {
    step: "02",
    title: "Choose a need to fulfill",
    description:
      "Pick a case that speaks to you. Every request is reviewed and verified before it goes live.",
  },
  {
    step: "03",
    title: "Pay the vendor directly",
    description:
      "Your contribution goes straight to a connected pharmacy, store, or school. No cash to individuals.",
  },
];

const recipientSteps = [
  {
    step: "01",
    title: "Submit your verified need",
    description:
      "Tell us what you need and provide documentation. Our team verifies every request with care.",
  },
  {
    step: "02",
    title: "Get matched with a donor",
    description:
      "Once approved, your case is listed for donors in Canada and the USA who want to help directly.",
  },
  {
    step: "03",
    title: "Receive help through vendors",
    description:
      "Donors fulfill your need through partner vendors. You receive medicine, groceries, fees paid — with dignity.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-600">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-green-900 sm:text-4xl">
            Transparent help, both ways
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Whether you&apos;re giving from abroad or seeking support at home,
            every step is designed for trust and accountability.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <StepColumn
            badge="For Donors"
            badgeColor="bg-green-700 text-white"
            steps={donorSteps}
            accent="border-green-200 bg-green-50"
            numberColor="text-green-700"
          />
          <StepColumn
            badge="For Recipients"
            badgeColor="bg-white text-green-800 border border-green-200"
            steps={recipientSteps}
            accent="border-green-100 bg-white"
            numberColor="text-green-600"
          />
        </div>
      </div>
    </section>
  );
}

function StepColumn({
  badge,
  badgeColor,
  steps,
  accent,
  numberColor,
}: {
  badge: string;
  badgeColor: string;
  steps: { step: string; title: string; description: string }[];
  accent: string;
  numberColor: string;
}) {
  return (
    <div className={`rounded-2xl border p-6 sm:p-8 ${accent}`}>
      <span
        className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${badgeColor}`}
      >
        {badge}
      </span>

      <ol className="mt-8 space-y-8">
        {steps.map((item) => (
          <li key={item.step} className="flex gap-5">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold shadow-sm ${numberColor}`}
            >
              {item.step}
            </span>
            <div>
              <h3 className="font-semibold text-green-900">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
