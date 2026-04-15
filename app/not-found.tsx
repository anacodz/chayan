import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
        <p className="text-on-surface-variant">The page you are looking for does not exist.</p>
        <Link href="/" className="mt-6 inline-block text-primary hover:underline">Return Home</Link>
      </div>
    </div>
  );
}
