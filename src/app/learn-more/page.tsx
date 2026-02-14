import Link from "next/link"
import { ArrowLeft, Leaf, Recycle, Truck, Users } from "lucide-react"

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-lime-50 to-white">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-800 mb-8">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Home
        </Link>

        <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Learn More</p>
            <h1 className="font-display text-4xl sm:text-5xl text-gray-900">
              Reduce food waste with practical, community-first action
            </h1>
            <p className="text-lg text-gray-600">
              Food waste impacts the environment, budgets, and local food security. FWRP helps you keep surplus food in
              circulation by connecting donors, volunteers, and community organizations with a clear, accountable flow.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Reduce landfill waste</p>
                <p className="text-sm text-gray-600">Reroute edible food before it spoils.</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">Support local partners</p>
                <p className="text-sm text-gray-600">Deliver where it is needed most.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white shadow-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-72 w-full object-cover"
              src="/img/hero-illustration.svg"
              alt="Food rescue illustration"
            />
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "How food waste harms communities",
              copy:
                "When usable food is discarded, it increases disposal costs and leaves fewer resources for families and shelters that rely on donations.",
              icon: Users,
            },
            {
              title: "Why rescue matters",
              copy:
                "Redirecting surplus food reduces the environmental load of landfills and maximizes the value of resources spent on production and transport.",
              icon: Leaf,
            },
            {
              title: "What FWRP enables",
              copy:
                "A clear workflow for listing, matching, and confirming pickups so every donation is visible and accountable.",
              icon: Recycle,
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <item.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Simple ways to reduce food waste</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Plan and portion with care</p>
                <p className="text-sm text-gray-600">Buy what you can use and keep storage organized.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Recycle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Share surplus quickly</p>
                <p className="text-sm text-gray-600">List extra items and coordinate a pickup window.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center">
                <Leaf className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Store food properly</p>
                <p className="text-sm text-gray-600">Use labeled containers and clear dates.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">Connect with partners</p>
                <p className="text-sm text-gray-600">Work with food banks and shelters near you.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

