import { Leaf, Users, Utensils, Recycle, HandHeart } from "lucide-react";

const features = [
  {
    name: "Eco-Friendly",
    description: "Cut emissions by routing surplus food to nearby recipients fast.",
    icon: Leaf,
  },
  {
    name: "Community Sharing",
    description: "Connect donors, volunteers, and shelters with verified profiles.",
    icon: Users,
  },
  {
    name: "Efficient Distribution",
    description: "Automated pickup windows and live chat keep deliveries on track.",
    icon: Utensils,
  },
  {
    name: "Circular Impact",
    description: "Track food rescued, meals served, and carbon saved in one place.",
    icon: Recycle,
  },
  {
    name: "Care Network",
    description: "Prioritize high-need areas with smart matching and alerts.",
    icon: HandHeart,
  },
];

export default function Features() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Features
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight">
            Everything you need to rescue food with confidence
          </h2>
        </div>

        {/* Features Card Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group rounded-3xl border border-emerald-100/50 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-800"
            >
              <div className="flex items-start gap-4">
                {/* Feature Icon Container */}
                <div className="h-12 w-12 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950 text-emerald-755 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-600 transition-colors duration-300">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                {/* Feature Details */}
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                    {feature.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
