import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [songs, setSongs] = useState([])
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const router = useRouter()

  const UNLOCK_KEY = 'hers_unlocked'

  // Password lock — change this to her name or a word you share
  const SECRET = 'sunshine'

  useEffect(() => {
    if (unlocked) fetchSongs()
  }, [unlocked])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(UNLOCK_KEY)
    if (saved === 'true') setUnlocked(true)
  }, [])

  async function fetchSongs() {
    const { data } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: true })
    setSongs(data || [])
  }

  if (!unlocked) return (
    <main className="min-h-screen bg-[#fdf6f0] flex flex-col items-center justify-center gap-6 px-6">
      <p className="font-serif italic text-3xl text-[#2d1f1a]">this is for you ♡</p>
      <p className="text-sm text-[#a08878]">type your name to open</p>
      <input
        className="border border-[#f0d8d0] rounded-full px-6 py-3 text-center bg-white outline-none focus:border-[#d8907a] transition text-[#2d1f1a] w-56"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key !== 'Enter') return
          if (input.toLowerCase() !== SECRET) return
          window.localStorage.setItem(UNLOCK_KEY, 'true')
          setUnlocked(true)
        }}
        placeholder="…"
      />
      <button
        onClick={() => {
          if (input.toLowerCase() !== SECRET) return
          window.localStorage.setItem(UNLOCK_KEY, 'true')
          setUnlocked(true)
        }}
        className="bg-[#e0806a] text-white rounded-full px-8 py-2 text-sm hover:bg-[#c86a55] transition"
      >
        open ♡
      </button>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#fdf6f0] px-6 py-16 max-w-2xl mx-auto">
      <header className="text-center mb-14">
        <span className="text-xs tracking-widest text-[#b8816a] uppercase">a mixtape for you</span>
        <h1 className="font-serif text-5xl text-[#2d1f1a] mt-3 mb-3 font-light">
          Songs that make me<br/>think of <em>you</em>
        </h1>
        <p className="text-sm text-[#a08878]">click a song to hear it</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {songs.map((song, i) => (
          <div
            key={song.id}
            onClick={() => router.push(`/song/${song.id}`)}
            className="cursor-pointer group rounded-2xl overflow-hidden bg-white border border-[#f0d8d0] hover:border-[#d8907a] hover:-translate-y-1 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="relative aspect-square">
              <img
                src={song.cover_url}
                alt={song.title}
                className="w-full h-full object-cover"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="#e0806a">
                    <path d="M4 2.5l9 5.5-9 5.5V2.5z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-[#2d1f1a] truncate">{song.title}</p>
              <p className="text-xs text-[#a08878] mt-0.5 truncate">{song.artist}</p>
              <p className="text-xs text-[#c4a89c] mt-1">{song.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}