import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-green-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-800 mb-8">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">Reducing Food Waste to Lower Carbon Footprint</h1>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">The Impact of Food Waste on Carbon Emissions</h2>
          <p className="text-gray-600 mb-4">
            Food waste is a significant contributor to greenhouse gas emissions. When food decomposes in landfills, it
            produces methane, a potent greenhouse gas that is 25 times more harmful than carbon dioxide in terms of
            trapping heat in the atmosphere.
          </p>
          <p className="text-gray-600 mb-4">
            According to the Food and Agriculture Organization (FAO) of the United Nations, if food waste were a
            country, it would be the third-largest emitter of greenhouse gases after the United States and China.
          </p>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How Reducing Food Waste Helps</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Lowers methane emissions from landfills</li>
            <li>Reduces the carbon footprint associated with food production, processing, and transportation</li>
            <li>Conserves energy and resources used in food production</li>
            <li>Decreases the need for expansion of agricultural lands, protecting forests and biodiversity</li>
          </ul>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Simple Steps to Reduce Food Waste</h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li>Plan your meals and make a shopping list</li>
            <li>Store food properly to extend its life</li>
            <li>Use up leftovers creatively</li>
            <li>Compost food scraps instead of throwing them in the trash</li>
            <li>Donate excess food to local food banks or community organizations</li>
          </ol>
        </section>
      </main>
    </div>
  )
}

