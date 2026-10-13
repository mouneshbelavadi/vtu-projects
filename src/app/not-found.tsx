import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-neutral-900 text-2xl font-semibold">404: Page Not Found</h1>
      <p className="text-neutral-600 mt-4 max-w-md text-sm">
        This page does not exist. Check the address or go to the home page.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 rounded-md border px-4 py-2 text-sm font-medium"
        >
          Return to home page
        </Link>
      </div>
    </main>
  );
}
