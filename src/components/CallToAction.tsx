import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-emerald-700">
      <div className="absolute inset-0 hero-grid opacity-20" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] items-center">
          <div className="text-white space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl">
              Ready to reduce food waste and grow your impact?
            </h2>
            <p className="text-lg text-emerald-100 max-w-xl">
              Launch your first donation in minutes, coordinate pickups, and keep your community informed with live
              updates.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {["Verified partners", "Instant pickup alerts", "Impact dashboards", "Secure messaging"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-lime-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" passHref>
                <Button className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-emerald-50">
                  Sign Up for Free
                </Button>
              </Link>
              <Link href="/learn-more" passHref>
                <Button variant="outline" className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white/10 border border-white/20 p-6 shadow-lg">
            <div className="rounded-2xl bg-white px-5 py-6">
              <p className="text-sm font-semibold text-gray-900">Donation snapshot</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Pickup window</p>
                  <p className="text-lg font-semibold text-gray-900">Set clear pickup times</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Items reserved</p>
                  <p className="text-lg font-semibold text-gray-900">Track reserved donations</p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-700">Carbon savings</p>
                  <p className="text-xl font-semibold text-emerald-700">Measure real impact</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
