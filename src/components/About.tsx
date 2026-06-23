import { ClipboardList, HandHeart, Truck } from "lucide-react";

export default function About() {
  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-neutral-950 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] items-center">
          
          {/* About Left Column: Info & Stat Badges */}
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              About FWRP
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-gray-900 dark:text-white leading-tight">
              A modern platform for sharing surplus food responsibly
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              FWRP brings donors, volunteers, and food banks into a single workflow. Capture donations in minutes, keep pickup windows clear, and track every delivery with a transparent audit trail.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl border border-emerald-100/70 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20 px-5 py-4 transition-all hover:scale-[1.01]">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Faster coordination</p>
                <p className="text-sm text-gray-600 dark:text-gray-450 mt-1">Schedule pickups with clear, live windows.</p>
              </div>
              <div className="rounded-2xl border border-lime-100/70 dark:border-lime-950 bg-lime-50/40 dark:bg-lime-950/20 px-5 py-4 transition-all hover:scale-[1.01]">
                <p className="text-lg font-bold text-lime-700 dark:text-lime-400">More visibility</p>
                <p className="text-sm text-gray-600 dark:text-gray-450 mt-1">Track donation claims and delivery statuses.</p>
              </div>
            </div>
          </div>

          {/* About Right Column: "How It Works" Card Layout (Clean and Balanced) */}
          <div className="relative">
            <div className="rounded-3xl border border-emerald-100/80 dark:border-neutral-800 bg-gradient-to-br from-emerald-50/30 via-white to-lime-50/20 dark:from-neutral-900/50 dark:via-neutral-900 dark:to-neutral-900 p-8 shadow-xl shadow-emerald-950/5">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-450 mb-6">
                How it works
              </p>
              
              <div className="space-y-6">
                
                {/* Step 1 */}
                <div className="flex items-start gap-4 group">
                  <span className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-white">List surplus food</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Create a donation listing with photo, pickup window details, and notes in under two minutes.
                    </p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex items-start gap-4 group">
                  <span className="h-10 w-10 rounded-xl bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <HandHeart className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-white">Match with partners</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Connect instantly with nearby charities, shelters, or verified community recipients who receive alerts.
                    </p>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex items-start gap-4 group">
                  <span className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <Truck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-white">Confirm pickup</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Coordinate pickup slots, message each other in real-time, and log the donation to close the loop.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
