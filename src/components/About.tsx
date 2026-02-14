import { ClipboardList, HandHeart, Truck } from "lucide-react"

export default function About() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">About FWRP</p>
            <h2 className="font-display text-3xl sm:text-4xl text-gray-900">
              A modern platform for sharing surplus food responsibly
            </h2>
            <p className="text-lg text-gray-600">
              FWRP brings donors, volunteers, and food banks into a single workflow. Capture donations in minutes,
              keep pickup windows clear, and track every delivery with a transparent audit trail.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                <p className="text-lg font-semibold text-emerald-700">Faster coordination</p>
                <p className="text-sm text-gray-600">Schedule pickups with clear windows</p>
              </div>
              <div className="rounded-2xl border border-lime-100 bg-lime-50/70 px-4 py-3">
                <p className="text-lg font-semibold text-lime-700">More visibility</p>
                <p className="text-sm text-gray-600">Track donations and status updates</p>
              </div>
            </div>
          </div>

          <div className="relative space-y-6">
            <div className="rounded-3xl border border-emerald-100 bg-white shadow-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-64 w-full object-cover"
                src="/img/hero-illustration.svg"
                alt="Food donation platform illustration"
              />
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-6 shadow-lg">
              <p className="text-sm font-semibold text-emerald-700">How it works</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-4">
                  <span className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-gray-900">List surplus food</p>
                    <p className="text-sm text-gray-600">Create a donation with pickup windows and notes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="h-10 w-10 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center">
                    <HandHeart className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-gray-900">Match with partners</p>
                    <p className="text-sm text-gray-600">Connect with nearby recipients instantly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Truck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-gray-900">Confirm pickup</p>
                    <p className="text-sm text-gray-600">Chat, coordinate, and close the loop.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

