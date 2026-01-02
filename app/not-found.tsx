import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen px-6 py-16">
      <main className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-zinc-500 dark:text-zinc-400"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
