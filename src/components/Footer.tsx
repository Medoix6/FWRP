import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        {/* Removed Privacy Policy and Terms of Service links */}
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} Food Waste Reduction Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

