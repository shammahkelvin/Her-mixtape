import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = 'kelannie'

export default function Admin() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [form, setForm] = useState({ title:'', artist:'', duration:'', note:'' })
  const [cover, setCover] = useState(null)
  const [audio, setAudio] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function safeFilename(name) {
    return name
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async function upload() {
    if (!form.title || !cover || !audio) {
      setError('Please fill in title, cover image and audio file.')
      return
    }
    setLoading(true)
    setError('')
    setDone(false)

    try {
      // Upload cover
      const coverPath = `covers/${Date.now()}-${safeFilename(cover.name)}`
      const { error: coverErr } = await supabase.storage
        .from('music')
        .upload(coverPath, cover, { upsert: true })
      if (coverErr) throw coverErr

      const { data: { publicUrl: cover_url } } = supabase.storage
        .from('music')
        .getPublicUrl(coverPath)

      // Upload audio
      const audioPath = `audio/${Date.now()}-${safeFilename(audio.name)}`
      const { error: audioErr } = await supabase.storage
        .from('music')
        .upload(audioPath, audio, { upsert: true })
      if (audioErr) throw audioErr

      const { data: { publicUrl: audio_url } } = supabase.storage
        .from('music')
        .getPublicUrl(audioPath)

      // Insert into DB
      const { error: dbErr } = await supabase
        .from('songs')
        .insert([{ ...form, cover_url, audio_url }])
      if (dbErr) throw dbErr

      setDone(true)
      setForm({ title:'', artist:'', duration:'', note:'' })
      setCover(null)
      setAudio(null)

    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (!auth) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fdf6f0'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,width:320,border:'1px solid #f0d8d0'}}>
        <p style={{fontWeight:500,marginBottom:16,color:'#2d1f1a'}}>Admin — just for you ♡</p>
        <input
          style={{border:'1px solid #f0d8d0',borderRadius:8,padding:'8px 12px',width:'100%',marginBottom:12,fontSize:14}}
          type="password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key==='Enter' && pw===ADMIN_PASSWORD && setAuth(true)}
          placeholder="password"
        />
        <button
          onClick={() => pw===ADMIN_PASSWORD && setAuth(true)}
          style={{background:'#e0806a',color:'#fff',border:'none',borderRadius:8,padding:'10px 0',width:'100%',cursor:'pointer',fontSize:14}}
        >
          Enter
        </button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#fdf6f0',padding:'48px 24px'}}>
      <div style={{maxWidth:520,margin:'0 auto',background:'#fff',borderRadius:20,padding:32,border:'1px solid #f0d8d0'}}>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:400,color:'#2d1f1a',marginBottom:6}}>
          Add a song ♡
        </h1>
        <p style={{fontSize:12,color:'#a08878',marginBottom:28}}>
          Fill in the details, upload the files, done.
        </p>

        {done && (
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:14,color:'#166534'}}>
            Song added successfully! You can add another one.
          </div>
        )}
        {error && (
          <div style={{background:'#fff5f5',border:'1px solid #fecaca',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:14,color:'#991b1b'}}>
            {error}
          </div>
        )}

        {[
          {key:'title', placeholder:'Song title'},
          {key:'artist', placeholder:'Artist name'},
          {key:'duration', placeholder:'Duration (e.g. 3:45)'},
        ].map(f => (
          <input key={f.key}
            style={{border:'1px solid #f0d8d0',borderRadius:10,padding:'10px 14px',width:'100%',marginBottom:12,fontSize:14,color:'#2d1f1a',outline:'none'}}
            placeholder={f.placeholder}
            value={form[f.key]}
            onChange={e => setForm({...form, [f.key]: e.target.value})}
          />
        ))}

        <textarea
          style={{border:'1px solid #f0d8d0',borderRadius:10,padding:'10px 14px',width:'100%',marginBottom:20,fontSize:14,color:'#2d1f1a',height:110,resize:'none',outline:'none',fontFamily:'Georgia,serif',fontStyle:'italic'}}
          placeholder="Your personal note — why does this song make you think of her?"
          value={form.note}
          onChange={e => setForm({...form, note: e.target.value})}
        />

        <label style={{display:'block',fontSize:12,color:'#a08878',marginBottom:6}}>Cover image (jpg, png)</label>
        <input type="file" accept="image/*"
          onChange={e => setCover(e.target.files[0])}
          style={{marginBottom:4,fontSize:13}}
        />
        {cover && <p style={{fontSize:11,color:'#b8816a',marginBottom:16}}>✓ {cover.name}</p>}

        <label style={{display:'block',fontSize:12,color:'#a08878',marginBottom:6,marginTop:12}}>Audio file (mp3)</label>
        <input type="file" accept="audio/*"
          onChange={e => setAudio(e.target.files[0])}
          style={{marginBottom:4,fontSize:13}}
        />
        {audio && <p style={{fontSize:11,color:'#b8816a',marginBottom:20}}>✓ {audio.name}</p>}

        <button
          onClick={upload}
          disabled={loading}
          style={{
            background: loading ? '#e0b0a0' : '#e0806a',
            color:'#fff',border:'none',borderRadius:30,
            padding:'14px 0',width:'100%',fontSize:14,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop:8,transition:'background .2s'
          }}
        >
          {loading ? 'Uploading… please wait ♡' : 'Add song ♡'}
        </button>

        {loading && (
          <p style={{fontSize:12,color:'#a08878',textAlign:'center',marginTop:12}}>
            Uploading cover + audio to Supabase, this takes a moment…
          </p>
        )}
      </div>
    </div>
  )
}