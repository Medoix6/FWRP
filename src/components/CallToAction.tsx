import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CallToAction() {
  return (
    <div className="bg-green-600">
      <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          <span className="block">Ready to reduce food waste?</span>
          <span className="block">Join FWRP today.</span>
        </h2>
        <p className="mt-4 text-lg leading-6 text-green-100">
          Start making a positive impact on the environment and your community. Sign up now and be part of the solution
          to food waste.
        </p>
        <Link href="/signup" passHref>
          <Button className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50 sm:w-auto">
            Sign Up for Free
          </Button>
        </Link>
      </div>
    </div>
  )
}
