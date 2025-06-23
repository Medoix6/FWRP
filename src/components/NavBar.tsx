"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/dashboard", label: "Dashboard" },
	{ href: "/donate-food", label: "Donate Food" },
	{ href: "/edit-profile", label: "Edit Profile" },
	{ href: "/admin", label: "Admin" },
	{ href: "/login", label: "Login" },
	{ href: "/signup", label: "Signup" },
];

export default function NavBar() {
	const pathname = usePathname();
	return (
		<nav className="w-full flex gap-4 p-4 border-b bg-white/80 sticky top-0 z-50">
			{navLinks.map((link) => (
				<Link
					key={link.href}
					href={link.href}
					className={
						pathname === link.href
							? "font-bold text-blue-600 underline"
							: "text-gray-700 hover:text-blue-500"
					}
				>
					{link.label}
				</Link>
			))}
		</nav>
	);
}
