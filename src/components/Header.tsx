import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-green-600">FWRP</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" passHref>
              <Button variant="ghost" className="text-gray-600 hover:text-green-600">
                Login
              </Button>
            </Link>
            <Link href="/signup" passHref>
              <Button className="bg-green-600 text-white hover:bg-green-700">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

