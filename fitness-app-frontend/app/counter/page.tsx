import Link from 'next/link'
import { StepCounter } from '@/components/counter/StepCounter'

export default function CounterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-white">🚶 Step Counter</h1>
          <p className="mt-2 text-sm text-slate-300">Advanced pedometer with GPS tracking. Detects real steps using frequency analysis, ignores phone shakes.</p>
          <div className="mt-4">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200 underline">← Back to home</Link>
          </div>
        </header>

        <section className="grid gap-6">
          <div className="p-6 rounded-2xl shadow-lg bg-slate-800/50 backdrop-blur border border-slate-700">
            <StepCounter />
          </div>

          <div className="p-4 text-sm text-slate-300 bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 space-y-3">
            <h3 className="font-semibold text-white">📖 How to Use</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open this page on your <strong>phone</strong> for best accuracy</li>
              <li>Press <strong>▶️ Start</strong> to begin step detection and GPS tracking</li>
              <li>Walk or run naturally - the counter detects steps using frequency analysis</li>
              <li>GPS provides real distance traveled and accuracy data</li>
              <li>Press <strong>⏹️ Stop</strong> to finish, then <strong>🔄 Reset</strong> to clear data</li>
            </ol>

            <div className="pt-3 border-t border-slate-700">
              <p className="font-semibold text-white mb-2">⚙️ Sensitivity Tips</p>
              <p className="text-xs text-slate-400">
                Lower sensitivity (0.5) ignores jitter and false positives for slower walks. Higher sensitivity (2.0) detects faster running. Default (1.0) is balanced.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
