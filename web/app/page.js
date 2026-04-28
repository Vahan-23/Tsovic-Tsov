import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Tsovic-Tsov
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          City statues, digital collection
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          The mobile app loads figure data from this site&apos;s API. Use the admin to edit
          texts, image URLs, and download QR codes whose payload is the figure id (read by the
          in-app scanner).
        </p>
        <ul className="mt-8 space-y-3 text-slate-700">
          <li className="flex gap-2">
            <span className="font-mono text-indigo-600">GET</span>
            <code className="rounded bg-slate-100 px-2 py-0.5 text-sm">/api/figures</code>
            <span className="text-slate-500">— public JSON for the app</span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-indigo-600">Admin</span>
            <Link href="/admin" className="font-semibold text-indigo-600 hover:underline">
              /admin
            </Link>
            <span className="text-slate-500">— manage figures & QR</span>
          </li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Open admin
          </Link>
          <a
            href="/api/figures"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            View API JSON
          </a>
        </div>
      </main>
    </div>
  );
}
