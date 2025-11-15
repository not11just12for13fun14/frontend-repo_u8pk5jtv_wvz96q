import { useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function App() {
  const [text, setText] = useState('Once upon a time, Alice walked through a quiet forest. She whispered, "I can do this." A storm gathered, but she found a warm cottage and smiled.')
  const [style, setStyle] = useState('storybook')
  const [pacing, setPacing] = useState('normal')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${API}/api/animate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style, pacing })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Request failed: ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Text → Animated Scene Plan</h1>
          <p className="text-gray-600">No human narrator will be added unless you ask. This generates a consistent cast, environments, and smooth scene transitions.</p>
        </header>

        <section className="bg-white rounded-xl shadow p-4 grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <label className="block text-sm font-medium text-gray-700">Story text</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8} className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Style</label>
              <select value={style} onChange={e => setStyle(e.target.value)} className="w-full border rounded-md p-2">
                <option value="storybook">Storybook</option>
                <option value="noir">Noir</option>
                <option value="sci-fi">Sci‑Fi</option>
                <option value="watercolor">Watercolor</option>
                <option value="anime">Anime</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pacing</label>
              <select value={pacing} onChange={e => setPacing(e.target.value)} className="w-full border rounded-md p-2">
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            <button onClick={generate} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded-md">
              {loading ? 'Generating…' : 'Generate Scenes'}
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        </section>

        {result && (
          <section className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Characters</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {result.characters.map(c => (
                    <li key={c.id} className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full" style={{background: `hsl(${(c.color*55)%360} 70% 45%)`}}></span>{c.name} <span className="text-gray-400">({c.id})</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Environments</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {result.environments.map(env => (
                    <li key={env.id}>{env.name} <span className="text-gray-400">({env.id})</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Global Style</h3>
                <p className="text-sm text-gray-700">{result.style}</p>
              </div>
            </div>
            <div className="space-y-4">
              {result.scenes.map((s, idx) => (
                <div key={s.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{s.title}</h4>
                    <span className="text-xs text-gray-500">Transition: {s.transition.type} · {s.transition.duration}s</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{s.description}</p>
                  <div className="mt-2 text-sm text-gray-700">
                    <p className="text-gray-600">Environment: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{s.environmentId}</span></p>
                    <ul className="mt-2 grid sm:grid-cols-2 gap-2">
                      {s.characters.map(ch => (
                        <li key={ch.id} className="bg-gray-50 rounded p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{result.characters.find(c => c.id===ch.id)?.name}</span>
                            {ch.emotion && <span className="text-xs italic text-gray-500">{ch.emotion}</span>}
                          </div>
                          {ch.dialogue && (
                            <p className="text-xs mt-1 border-l-2 border-indigo-400 pl-2 text-gray-700">“{ch.dialogue}”</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-gray-500 pb-6">
          Tip: Ask for changes like removing a character, adjusting style, changing pacing, or adding effects — no human presenter will be added unless you request it.
        </footer>
      </div>
    </div>
  )
}

export default App
