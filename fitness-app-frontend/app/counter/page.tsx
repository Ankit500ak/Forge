import Link from 'next/link'
import { PushupCounter } from '@/components/counter/PushupCounter'

export default function CounterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold">Pushup Counter</h1>
          <p className="mt-2 text-sm text-slate-600">A lightweight pushup counter that works in-browser and with Capacitor native motion when available.</p>
          <div className="mt-4">
            <Link href="/" className="text-sm text-slate-500 underline">Back to home</Link>
          </div>
        </header>

        <section className="grid gap-6">
          <div className="p-6 rounded-2xl shadow-sm bg-white">
            <PushupCounter />
          </div>

          <div className="p-4 text-sm text-slate-600 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold">How to test</h3>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Open this page on your phone: <strong>/counter</strong>.</li>
              <li>Place the phone on your chest or near your body and press <strong>Start</strong>.</li>
              <li>Perform pushups and watch the counter increase.</li>
              <li>If testing on desktop, use the <strong>+1 (simulate)</strong> button to emulate reps.</li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  )
}
