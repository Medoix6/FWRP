import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">F</span>
            <span className="text-xl font-semibold tracking-tight text-gray-900">FWRP</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" passHref>
              <Button variant="ghost" className="text-gray-700 hover:text-emerald-600">
                Login
              </Button>
            </Link>
            <Link href="/signup" passHref>
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

