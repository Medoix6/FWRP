export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-4">Sorry, the page you are looking for does not exist.</p>
      <a href="/" className="text-blue-600 underline">Go Home</a>
    </div>
  );
}
