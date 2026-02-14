import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf, Sparkles, TrendingUp } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-lime-50 to-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-64 w-64 rounded-full bg-lime-200/40 blur-3xl" />
        <div className="absolute inset-0 hero-grid opacity-60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] items-center py-16 sm:py-20 lg:py-24">
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm text-emerald-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Community-powered food rescue
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-gray-900">
                Turn surplus meals into
                <span className="block text-emerald-600">real local impact</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-xl">
                FWRP connects donors, volunteers, and organizations to rescue food at scale. Track donations, message in
                real time, and keep usable meals out of landfills.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Link href="/signup" passHref>
                <Button className="w-full sm:w-auto px-8 py-4 text-base bg-emerald-600 hover:bg-emerald-700">
                  Get Started
                </Button>
              </Link>
              <Link href="/learn-more" passHref>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-8 py-4 text-base border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div className="rounded-2xl bg-white/80 border border-emerald-100 px-4 py-3 shadow-sm">
                <p className="text-emerald-700 font-semibold">Real-time</p>
                <p className="text-gray-600">Donation tracking</p>
              </div>
              <div className="rounded-2xl bg-white/80 border border-emerald-100 px-4 py-3 shadow-sm">
                <p className="text-emerald-700 font-semibold">Verified</p>
                <p className="text-gray-600">Community partners</p>
              </div>
              <div className="rounded-2xl bg-white/80 border border-emerald-100 px-4 py-3 shadow-sm">
                <p className="text-emerald-700 font-semibold">Secure</p>
                <p className="text-gray-600">In-app messaging</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-[420px] w-full object-cover"
                src="/img/hero-illustration.svg"
                alt="Food donation platform illustration"
              />
            </div>

            <div className="absolute -left-6 bottom-12 rounded-2xl bg-white/90 border border-emerald-100 px-4 py-3 shadow-lg animate-float-slow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Leaf className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Waste reduced</p>
                  <p className="text-xs text-gray-500">Track local impact</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-6 top-10 rounded-2xl bg-white/90 border border-emerald-100 px-4 py-3 shadow-lg animate-float-slower">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">New donors</p>
                  <p className="text-xs text-gray-500">Growing community</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

