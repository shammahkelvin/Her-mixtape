import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Home() {
  const router = useRouter()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function fetchSongs() {
      const { data } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: true })
      if (isMounted) {
        setSongs(data || [])
        setLoading(false)
      }
    }
    fetchSongs()
    return () => { isMounted = false }
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#fdf6f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #e0806a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fdf6f0', padding: '40px 24px 80px', fontFamily: 'DM Sans, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .blob{position:fixed;border-radius:50%;filter:blur(70px);opacity:0.25;pointer-events:none}
        .card{background:#fff;border:1px solid #f0d8d0;border-radius:20px;overflow:hidden;box-shadow:0 10px 28px rgba(180,100,80,0.12);transition:transform .2s, box-shadow .2s;cursor:pointer}
        .card:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(180,100,80,0.18)}
      `}</style>

      <div className="blob" style={{ width: 320, height: 320, background: '#f5c5c5', top: -80, left: -120 }} />
      <div className="blob" style={{ width: 240, height: 240, background: '#fde8c8', bottom: -60, right: -80 }} />

      <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: '2.6px', textTransform: 'uppercase', color: '#b8816a' }}>your mixtape</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(34px,6vw,54px)', fontWeight: 300, color: '#2d1f1a', marginTop: 6 }}>
            songs, just for you ♡
          </h1>
          <p style={{ fontSize: 13, color: '#a08878', marginTop: 8 }}>
            tap a card to open and play
          </p>
        </div>

        {songs.length === 0 ? (
          <div style={{ background: '#fff5f0', border: '1px solid #f0d0c4', borderRadius: 18, padding: 24, textAlign: 'center', color: '#a08878' }}>
            No songs yet. Add one in the admin page first.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {songs.map((song, i) => (
              <div
                key={song.id}
                className="card"
                style={{ animation: 'fadeUp .6s ease both', animationDelay: `${i * 0.05}s` }}
                onClick={() => router.push(`/song/${song.id}`)}
              >
                <div style={{ position: 'relative', paddingTop: '100%', background: '#f9eee9' }}>
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '14px 16px 16px' }}>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 300, color: '#2d1f1a', marginBottom: 4 }}>
                    {song.title}
                  </h3>
                  <p style={{ fontSize: 12, color: '#a08878' }}>{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
