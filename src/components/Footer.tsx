export default function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-950 border-t border-emerald-100/50 dark:border-neutral-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="md:order-1">
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Food Waste Reduction Platform (FWRP). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
