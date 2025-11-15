import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAutoAdvance(enabled, deps, getDelayMs, onTick) {
  const timerRef = useRef(null)
  useEffect(() => {
    if (!enabled) return
    const delay = getDelayMs()
    if (!delay || delay <= 0) return
    timerRef.current && clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onTick(), delay)
    return () => {
      timerRef.current && clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

function App() {
  const [text, setText] = useState('Once upon a time, Alice walked through a quiet forest. She whispered, "I can do this." A storm gathered, but she found a warm cottage and smiled.')
  const [style, setStyle] = useState('storybook')
  const [pacing, setPacing] = useState('normal')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [playing, setPlaying] = useState(false)
  const [idx, setIdx] = useState(0)

  const basePerSceneMs = useMemo(() => {
    if (pacing === 'slow') return 4000
    if (pacing === 'fast') return 1800
    return 2800
  }, [pacing])

  const currentScene = result?.scenes[idx]

  const getTransitionVariants = (t) => {
    const common = { duration: (currentScene?.transition?.duration || 0.8) }
    switch (t) {
      case 'wipe':
        return {
          initial: { x: '100%', opacity: 1 },
          animate: { x: 0, opacity: 1, transition: { ...common } },
          exit: { x: '-100%', opacity: 1, transition: { ...common } },
        }
      case 'pan':
        return {
          initial: { scale: 1.1, x: 20, opacity: 0.9 },
          animate: { scale: 1, x: 0, opacity: 1, transition: { ...common } },
          exit: { scale: 0.98, x: -15, opacity: 0.9, transition: { ...common } },
        }
      case 'dolly':
        return {
          initial: { scale: 0.9, opacity: 0 },
          animate: { scale: 1, opacity: 1, transition: { ...common } },
          exit: { scale: 1.05, opacity: 0, transition: { ...common } },
        }
      case 'fade-through-black':
        return {
          initial: { opacity: 0, filter: 'brightness(0)' },
          animate: { opacity: 1, filter: 'brightness(1)', transition: { ...common } },
          exit: { opacity: 0, filter: 'brightness(0)', transition: { ...common } },
        }
      case 'crossfade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { ...common } },
          exit: { opacity: 0, transition: { ...common } },
        }
    }
  }

  const getDelayMs = () => {
    if (!currentScene) return 0
    const t = (currentScene.transition?.duration || 0.8) * 1000
    return basePerSceneMs + t
  }

  useAutoAdvance(playing && !!result, [playing, idx, result, basePerSceneMs], getDelayMs, () => {
    setIdx((i) => {
      const next = i + 1
      if (!result) return 0
      if (next >= result.scenes.length) {
        setPlaying(false)
        return i
      }
      return next
    })
  })

  const resetPlayer = () => {
    setIdx(0)
    setPlaying(false)
  }

  const generate = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    resetPlayer()
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
      setIdx(0)
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
          <p className="text-gray-600">No human narrator will be added unless you ask. Generate a consistent cast, environments, and smooth scene transitions — now with an animated preview.</p>
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

            {/* Animated Preview Player */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setIdx(i => Math.max(0, i - 1))} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Prev</button>
                  {!playing ? (
                    <button onClick={() => setPlaying(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">Play</button>
                  ) : (
                    <button onClick={() => setPlaying(false)} className="px-3 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm">Pause</button>
                  )}
                  <button onClick={() => setIdx(i => result ? Math.min(result.scenes.length - 1, i + 1) : 0)} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Next</button>
                  <button onClick={resetPlayer} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Reset</button>
                </div>
                <div className="text-xs text-gray-500">Scene {idx + 1} / {result.scenes.length} • Auto {playing ? 'On' : 'Off'}</div>
              </div>

              <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden rounded-md bg-gradient-to-br from-gray-50 to-gray-100 border">
                <AnimatePresence mode="wait">
                  {currentScene && (
                    <motion.div
                      key={currentScene.id}
                      className="absolute inset-0 p-4 flex flex-col"
                      initial={getTransitionVariants(currentScene.transition?.type).initial}
                      animate={getTransitionVariants(currentScene.transition?.type).animate}
                      exit={getTransitionVariants(currentScene.transition?.type).exit}
                    >
                      <div className="text-xs text-gray-500">{result.environments.find(e => e.id === currentScene.environmentId)?.name} • {currentScene.transition.type}</div>
                      <div className="mt-1 font-semibold">{currentScene.title}</div>
                      <div className="mt-2 text-sm text-gray-700 line-clamp-[7]">{currentScene.description}</div>
                      <div className="mt-auto">
                        <div className="text-xs text-gray-500">In scene:</div>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          {currentScene.characters.map((ch) => {
                            const base = result.characters.find(c => c.id === ch.id)
                            return (
                              <div key={ch.id} className="rounded-md p-2 border bg-white/80 backdrop-blur">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium" style={{color: `hsl(${(base.color*55)%360} 70% 40%)`}}>{base.name}</span>
                                  {ch.emotion && <span className="text-[10px] italic text-gray-500">{ch.emotion}</span>}
                                </div>
                                {ch.dialogue && <div className="text-xs mt-1 border-l-2 border-indigo-400 pl-2 text-gray-700">“{ch.dialogue}”</div>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Static Scene List */}
            <div className="space-y-4">
              {result.scenes.map((s) => (
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
