import { Leaf, Users, Utensils, Recycle, HandHeart } from "lucide-react"

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
]

export default function Features() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Features</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-gray-900">
            Everything you need to rescue food with confidence
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{feature.name}</p>
                  <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

