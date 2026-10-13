"use client";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">Something went wrong on our side.</h1>
      <p className="mt-4 max-w-md text-sm text-neutral-600">
        An error occurred while loading this page. You can try reloading the page, or contact
        support if the issue persists.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
