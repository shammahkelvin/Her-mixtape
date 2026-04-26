import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function SongPage() {
  const router = useRouter()
  const { id } = router.query
  const [song, setSong] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [noteVisible, setNoteVisible] = useState(false)
  const [playError, setPlayError] = useState('')
  const audioRef = useRef(null)

  useEffect(() => {
    if (id) fetchSong()
  }, [id])

  // Reveal the note after 3s — feels like a letter being written
  useEffect(() => {
    if (song) setTimeout(() => setNoteVisible(true), 3000)
  }, [song])

  async function fetchSong() {
    const { data } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single()
    setSong(data)
  }

  function togglePlay() {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      return
    }

    setPlayError('')
    const result = audioRef.current.play()
    if (result && typeof result.then === 'function') {
      result
        .then(() => setPlaying(true))
        .catch((err) => {
          setPlayError(err?.message || 'Audio playback failed.')
          setPlaying(false)
        })
    } else {
      setPlaying(true)
    }
  }

  function onTimeUpdate() {
    const a = audioRef.current
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) {
      setProgress(0)
      return
    }
    setProgress((a.currentTime / a.duration) * 100 || 0)
  }

  function seek(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const a = audioRef.current
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return
    a.currentTime = pct * a.duration
  }

  if (!song) return (
    <div className="min-h-screen bg-[#fdf6f0] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#e0806a] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#fdf6f0] flex flex-col items-center justify-center px-6 py-16">
      <button
        onClick={() => router.push('/')}
        className="self-start mb-10 text-xs text-[#a08878] hover:text-[#2d1f1a] transition flex items-center gap-1"
      >
        ← back to the mixtape
      </button>

      <div className="w-full max-w-sm">
        {/* Cover */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 aspect-square">
          <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover"/>
          {/* Spinning vinyl overlay when playing */}
          {playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-white/30 animate-spin" style={{animationDuration:'8s'}}>
                <div className="w-full h-full rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white/80"/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Song info */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl text-[#2d1f1a] font-light leading-tight">{song.title}</h1>
          <p className="text-[#a08878] mt-1">{song.artist}</p>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 bg-[#f0d8d0] rounded-full mb-6 cursor-pointer"
          onClick={seek}
        >
          <div
            className="h-full bg-[#e0806a] rounded-full transition-all"
            style={{width: `${progress}%`}}
          />
        </div>

        {/* Play button */}
        <div className="flex items-center justify-center mb-12">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-[#e0806a] hover:bg-[#c86a55] flex items-center justify-center transition shadow-lg"
          >
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                <rect x="4" y="3" width="4" height="14" rx="1"/>
                <rect x="12" y="3" width="4" height="14" rx="1"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                <path d="M5 3.5l12 6.5-12 6.5V3.5z"/>
              </svg>
            )}
          </button>
        </div>

        {playError && (
          <p className="text-xs text-[#b14434] text-center mb-6">
            {playError}
          </p>
        )}

        {/* Your note — fades in after 3s */}
        <div className={`transition-all duration-1000 ${noteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-[#fff5f0] border border-[#f0d0c4] rounded-2xl p-6 relative overflow-hidden">
            <span className="absolute right-4 top-0 text-[80px] leading-none text-[#f5c5b5]/60 font-serif select-none">"</span>
            <p className="text-xs tracking-widest text-[#c09080] uppercase mb-3">a little note</p>
            <p className="font-serif italic text-lg text-[#5a3a30] leading-relaxed font-light">{song.note}</p>
            <p className="text-right text-sm text-[#b09088] mt-4">— with love, always ♡</p>
          </div>
        </div>
      </div>

      {/* Hidden audio */}
      <audio
        ref={audioRef}
        src={song.audio_url}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => setPlaying(false)}
      />
    </main>
  )
}