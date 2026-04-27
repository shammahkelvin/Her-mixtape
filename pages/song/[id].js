import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function SongPage() {
  const router = useRouter()
  const { id, auto } = router.query
  const [song, setSong] = useState(null)
  const [songs, setSongs] = useState([])
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [duration, setDuration] = useState('0:00')
  const [noteVisible, setNoteVisible] = useState(false)
  const [bars, setBars] = useState(Array(40).fill(0.08))
  const [shouldAutoplay, setShouldAutoplay] = useState(false)
  const audioRef = useRef(null)
  const animRef = useRef(null)
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)

  useEffect(() => {
    if (!router.isReady) return
    setShouldAutoplay(auto === '1')
  }, [auto, router.isReady])

  useEffect(() => { if (id) fetchSong() }, [id])
  useEffect(() => { if (song) setTimeout(() => setNoteVisible(true), 2500) }, [song])

  useEffect(() => {
    if (!song || !shouldAutoplay) return
    const audio = audioRef.current
    if (!audio) return

    const tryPlay = async () => {
      setupAnalyser(audio)
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume()
      await audio.play()
      animateBars()
      setPlaying(true)
      navigator.mediaSession && (navigator.mediaSession.playbackState = 'playing')
    }

    if (audio.readyState >= 2) {
      void tryPlay()
      return
    }

    audio.addEventListener('canplay', tryPlay, { once: true })
    return () => audio.removeEventListener('canplay', tryPlay)
  }, [song, shouldAutoplay])

  // Keep audio alive when screen locks
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.setAttribute('playsinline', '')
    audio.setAttribute('webkit-playsinline', '')
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') return
      if (playing && analyserRef.current) animateBars()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [playing])

  // Media Session for lock screen controls
  useEffect(() => {
    if (!song || !('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: 'A mixtape for you ♡',
      artwork: [{ src: song.cover_url, sizes: '512x512', type: 'image/jpeg' }],
    })
    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play()
      setPlaying(true)
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause()
      setPlaying(false)
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext())
    navigator.mediaSession.setActionHandler('seekto', (e) => {
      if (audioRef.current && e.seekTime != null)
        audioRef.current.currentTime = e.seekTime
    })
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (audioRef.current) audioRef.current.currentTime -= 10
    })
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (audioRef.current) audioRef.current.currentTime += 10
    })
  }, [song])

  async function fetchSong() {
    const { data: current } = await supabase
      .from('songs').select('*').eq('id', id).single()
    setSong(current)

    const { data: all } = await supabase
      .from('songs').select('id').order('created_at', { ascending: true })
    setSongs(all || [])
  }

  function playNext() {
    cancelAnimationFrame(animRef.current)
    const currentIndex = songs.findIndex(s => s.id === id)
    const next = songs[currentIndex + 1]
    if (next) {
      router.push(`/song/${next.id}?auto=1`)
    } else {
      router.push('/')
    }
  }

  function formatTime(s) {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec < 10 ? '0' : ''}${sec}`
  }

  function setupAnalyser(audioEl) {
    if (audioCtxRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    const source = ctx.createMediaElementSource(audioEl)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    audioCtxRef.current = ctx
    analyserRef.current = analyser
  }

  function animateBars() {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const count = 40
    const step = Math.floor(data.length / count)
    const next = Array.from({ length: count }, (_, i) =>
      Math.max(0.05, data[i * step] / 255)
    )
    setBars(next)
    animRef.current = requestAnimationFrame(animateBars)
  }

  async function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      cancelAnimationFrame(animRef.current)
      setBars(Array(40).fill(0.08))
      setPlaying(false)
      navigator.mediaSession && (navigator.mediaSession.playbackState = 'paused')
    } else {
      setupAnalyser(audio)
      if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume()
      await audio.play()
      animateBars()
      setPlaying(true)
      navigator.mediaSession && (navigator.mediaSession.playbackState = 'playing')
    }
  }

  // Single onLoaded — handles duration only
  function onLoaded() {
    setDuration(formatTime(audioRef.current?.duration))
  }

  function onTimeUpdate() {
    const a = audioRef.current
    if (!a) return
    setProgress((a.currentTime / a.duration) * 100 || 0)
    setCurrentTime(formatTime(a.currentTime))
    if ('mediaSession' in navigator && !isNaN(a.duration)) {
      navigator.mediaSession.setPositionState({
        duration: a.duration,
        playbackRate: a.playbackRate,
        position: a.currentTime,
      })
    }
  }

  function seek(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    if (audioRef.current) audioRef.current.currentTime = pct * audioRef.current.duration
  }

  if (!song) return (
    <div style={{ minHeight: '100vh', background: '#fdf6f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #e0806a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fdf6f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 60px', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes vinylSpin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .vinyl-outer {
          width: 280px; height: 280px; border-radius: 50%; position: relative;
          animation: ${playing ? 'vinylSpin 4s linear infinite' : 'none'};
          box-shadow: ${playing ? '0 20px 60px rgba(180,100,80,0.35)' : '0 8px 32px rgba(180,100,80,0.15)'};
          transition: box-shadow 0.4s;
        }
        .back-btn {
          align-self: flex-start; margin: 20px 0 32px;
          font-size: 12px; color: #a08878; cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; font-family: inherit; transition: color 0.2s;
        }
        .back-btn:hover { color: #2d1f1a }
        .note-box {
          opacity: 0; transform: translateY(16px);
          animation: ${noteVisible ? 'fadeUp 1s ease forwards' : 'none'};
        }
        .play-btn {
          width: 60px; height: 60px; border-radius: 50%;
          background: #e0806a; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 20px rgba(224,128,106,0.4);
          transition: background 0.2s, transform 0.15s;
        }
        .play-btn:hover { background: #c86a55; transform: scale(1.06) }
        .play-btn:active { transform: scale(0.96) }
        .skip-btn {
          background: none; border: none; cursor: pointer; opacity: 0.45;
          display: flex; align-items: center; transition: opacity 0.2s;
        }
        .skip-btn:hover { opacity: 1 }
      `}</style>

      <button className="back-btn" onClick={() => { cancelAnimationFrame(animRef.current); router.push('/') }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="#a08878" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        back to mixtape
      </button>

      <div className="vinyl-outer">
        <svg width="280" height="280" viewBox="0 0 280 280" style={{ borderRadius: '50%', display: 'block' }}>
          <defs>
            <pattern id="cover" patternUnits="objectBoundingBox" width="1" height="1">
              <image href={song.cover_url} width="280" height="280" preserveAspectRatio="xMidYMid slice"/>
            </pattern>
            <radialGradient id="vinylGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)"/>
              <stop offset="60%" stopColor="rgba(0,0,0,0.55)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0.75)"/>
            </radialGradient>
          </defs>
          <circle cx="140" cy="140" r="140" fill="url(#cover)"/>
          <circle cx="140" cy="140" r="140" fill="url(#vinylGrad)"/>
          {[40,55,70,85,100,112,122,130].map(r => (
            <circle key={r} cx="140" cy="140" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
          ))}
          <circle cx="140" cy="140" r="38" fill="url(#cover)" opacity="0.9"/>
          <circle cx="140" cy="140" r="38" fill="rgba(0,0,0,0.3)"/>
          <circle cx="140" cy="140" r="6" fill="#fdf6f0"/>
          <circle cx="140" cy="140" r="3" fill="#e0806a"/>
          <ellipse cx="100" cy="90" rx="40" ry="20" fill="rgba(255,255,255,0.06)" transform="rotate(-30 100 90)"/>
        </svg>
      </div>

      <div style={{ textAlign: 'center', margin: '28px 0 20px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 300, color: '#2d1f1a', lineHeight: 1.2, marginBottom: 6 }}>
          {song.title}
        </h1>
        <p style={{ fontSize: 14, color: '#a08878' }}>{song.artist}</p>
      </div>

      {/* Waveform */}
      <div style={{ width: '100%', maxWidth: 340, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 56, cursor: 'pointer', padding: '0 2px' }} onClick={seek}>
          {bars.map((h, i) => {
            const pct = (i / bars.length) * 100
            const played = pct <= progress
            return (
              <div key={i} style={{
                flex: 1,
                height: `${Math.max(8, h * 52)}px`,
                borderRadius: 3,
                background: played
                  ? `rgba(224,128,106,${0.6 + h * 0.4})`
                  : `rgba(240,216,208,${0.5 + h * 0.3})`,
                transition: playing ? 'height 0.1s ease, background 0.2s' : 'background 0.3s',
              }}/>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#c4a89c' }}>{currentTime}</span>
          <span style={{ fontSize: 11, color: '#c4a89c' }}>{duration}</span>
        </div>
      </div>

      {/* Controls: skip button + play button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, margin: '8px 0 32px' }}>
        <button className="skip-btn" onClick={playNext} title="Next song">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="#2d1f1a">
            <path d="M4 4l10 7-10 7V4zm12 0v14h2V4h-2z"/>
          </svg>
        </button>
        <button className="play-btn" onClick={togglePlay}>
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <rect x="4" y="3" width="4" height="14" rx="1.5"/>
              <rect x="12" y="3" width="4" height="14" rx="1.5"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path d="M5 3.5l12 6.5-12 6.5V3.5z"/>
            </svg>
          )}
        </button>
      </div>

      <div className="note-box" style={{ width: '100%', maxWidth: 340, background: '#fff5f0', border: '1px solid #f0d0c4', borderRadius: 20, padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: 12, top: -10, fontFamily: 'Cormorant Garamond, serif', fontSize: 90, color: '#f5c5b5', opacity: 0.5, lineHeight: 1, userSelect: 'none' }}>"</span>
        <p style={{ fontSize: 10, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#c09080', marginBottom: 12 }}>a little note</p>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 17, color: '#5a3a30', lineHeight: 1.8, fontWeight: 300 }}>
          {song.note}
        </p>
        <p style={{ textAlign: 'right', fontSize: 13, color: '#b09088', marginTop: 16 }}>— with love, always ♡</p>
      </div>

      <audio
        ref={audioRef}
        src={song.audio_url}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoaded}
        onEnded={playNext}
        crossOrigin="anonymous"
        playsInline
        preload="metadata"
      />
    </div>
  )
}