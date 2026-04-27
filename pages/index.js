import { useState, useRef } from 'react'
import { useRouter } from 'next/router'

const PASSWORD = 'baby'

const wrongMessages = [
  "Hmm... that's not it bestie 😭",
  "Nope! Try again, you got this babe",
  "That's definitely not right lmaooo",
  "Are you even trying rn 💀",
  "Nooo way that's not it either",
  "Babe... BABE.",
  "I genuinely cannot believe this",
  "At this point I'm worried about you 😭",
  "Ok last try before I reconsider everything",
]

const clues = {
  3: "💡 Clue 1: you like it when I say it...",
  6: "💡 Clue 2: and no, it's not Chérie ahaha",
  9: "💡 Clue 3: ok I see that you have failed... Baby 😭❤️",
}

export default function LockScreen() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [tries, setTries] = useState(0)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('wrong')
  const [shaking, setShaking] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [confetti, setConfetti] = useState([])
  const inputRef = useRef(null)

  function playWrongSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'
      o.frequency.setValueAtTime(320, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.15)
      g.gain.setValueAtTime(0.3, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      o.start(); o.stop(ctx.currentTime + 0.3)
    } catch (e) {}
  }

  function playSuccessSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'
        o.frequency.value = freq
        const t = ctx.currentTime + i * 0.12
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.25, t + 0.05)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
        o.start(t); o.stop(t + 0.4)
      })
    } catch (e) {}
  }

  function spawnConfetti() {
    const colors = ['#e0806a','#f5c5c5','#c07060','#e8d5f5','#fde8c8','#5DCAA5','#f0997b','#d4537e']
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 6,
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.8,
      round: Math.random() > 0.5,
    }))
    setConfetti(pieces)
    setTimeout(() => setConfetti([]), 4000)
  }

  async function handleSuccess() {
    setUnlocked(true)
    setMessage("yesss that's it!! welcome baby ♡")
    setMessageType('success')
    playSuccessSound()
    spawnConfetti()
    setTimeout(() => router.push('/home'), 2800)
  }

  function handleGuess() {
    const val = value.trim().toLowerCase()
    if (!val) return

    if (val === PASSWORD) {
      handleSuccess()
      return
    }

    const newTries = tries + 1
    setTries(newTries)
    setValue('')
    setShaking(true)
    setTimeout(() => setShaking(false), 400)
    playWrongSound()

    if (clues[newTries]) {
      setMessage(clues[newTries])
      setMessageType('clue')
    } else {
      setMessage(wrongMessages[Math.min(newTries - 1, wrongMessages.length - 1)])
      setMessageType('wrong')
    }

  }

  const dots = Array.from({ length: 9 }, (_, i) => i < tries)

  return (
    <main style={{
      minHeight: '100vh', background: '#fdf6f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
        @keyframes fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}
        .blob{position:fixed;border-radius:50%;filter:blur(65px);opacity:0.28;pointer-events:none}
        .pw-input{
          width:100%;border:1.5px solid #f0d0c4;border-radius:30px;padding:13px 22px;
          font-size:15px;text-align:center;background:#fff;outline:none;color:#2d1f1a;
          font-family:'DM Sans',sans-serif;transition:border .25s,background .25s;
        }
        .pw-input:focus{border-color:#d8907a}
        .pw-input.shaking{animation:shake .4s ease}
        .pw-input.won{border-color:#5DCAA5;background:#f0fdf8}
        .open-btn{
          width:100%;border:none;border-radius:30px;padding:13px 0;
          font-size:14px;font-family:'DM Sans',sans-serif;font-weight:500;
          cursor:pointer;transition:background .2s,transform .15s;
          background:#e0806a;color:#fff;
          box-shadow:0 4px 16px rgba(224,128,106,0.25);
        }
        .open-btn:hover{background:#c86a55;transform:scale(1.02)}
        .open-btn:active{transform:scale(0.97)}
        .open-btn.won{background:#5DCAA5}
      `}</style>

      {/* blobs */}
      <div className="blob" style={{width:320,height:320,background:'#f5c5c5',top:-80,left:-100}}/>
      <div className="blob" style={{width:220,height:220,background:'#e8d5f5',bottom:-40,right:-60}}/>
      <div className="blob" style={{width:200,height:200,background:'#fde8c8',top:'40%',right:-80}}/>

      {/* confetti */}
      {confetti.map(p => (
        <div key={p.id} style={{
          position:'fixed', top:-10, left:`${p.left}%`,
          width:p.size, height:p.size,
          background:p.color, borderRadius:p.round?'50%':'2px',
          animation:`fall ${p.duration}s ${p.delay}s linear forwards`,
          pointerEvents:'none', zIndex:100,
        }}/>
      ))}

      <div style={{ width:'100%', maxWidth:380, padding:'0 24px', position:'relative', zIndex:1 }}>

        {/* tag */}
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <span style={{
            fontSize:10, letterSpacing:'2.5px', textTransform:'uppercase',
            color:'#b8816a', background:'#f9ece5', border:'1px solid #f0cbbf',
            borderRadius:20, padding:'4px 14px',
          }}>a mixtape for you</span>
        </div>

        {/* title */}
        <h1 style={{
          fontFamily:'Cormorant Garamond, serif', fontSize:'clamp(34px,8vw,48px)',
          fontWeight:300, color:'#2d1f1a', textAlign:'center', lineHeight:1.2,
          marginBottom:10, animation:'popIn .6s ease both',
        }}>
          {unlocked ? <>you made it<br/><em style={{color:'#c07060'}}>baby</em> ♡</> : <>this is for<br/><em style={{color:'#c07060'}}>you</em> ♡</>}
        </h1>

        <p style={{ fontSize:13, color:'#a08878', textAlign:'center', marginBottom:24, lineHeight:1.5 }}>
          {unlocked ? 'I made this just for you. enjoy ♡' : 'type the secret word to open your gift'}
        </p>

        {/* message */}
        {message && (
          <div style={{
            borderRadius:14, padding:'12px 16px', marginBottom:14,
            fontSize:13, lineHeight:1.55, textAlign:'center',
            animation:'fadeUp .3s ease both',
            background: messageType==='success' ? '#f0fdf8' : messageType==='clue' ? '#fff8f0' : '#fff0ee',
            border: `1px solid ${messageType==='success'?'#9FE1CB':messageType==='clue'?'#f5ddb5':'#f5c5b5'}`,
            color: messageType==='success' ? '#085041' : messageType==='clue' ? '#8a5a20' : '#b05040',
          }}>
            {message}
          </div>
        )}

        {/* dots */}
        {!unlocked && (
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:18 }}>
            {dots.map((used, i) => (
              <div key={i} style={{
                width:8, height:8, borderRadius:'50%',
                background: used ? '#e0806a' : '#f0d0c4',
                transition:'background .3s',
              }}/>
            ))}
          </div>
        )}

        {/* input */}
        {!unlocked && (
          <div style={{ marginBottom:12 }}>
            <input
              ref={inputRef}
              className={`pw-input${shaking?' shaking':''}${unlocked?' won':''}`}
              type="text"
              placeholder="..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleGuess()}
            />
          </div>
        )}

        {/* button */}
        {!unlocked && (
          <button
            className={`open-btn${unlocked?' won':''}`}
            onClick={handleGuess}
          >
            open ♡
          </button>
        )}

        {unlocked && (
          <div style={{ textAlign:'center', fontSize:13, color:'#a08878', animation:'fadeUp .5s ease both' }}>
            taking you to your mixtape...
          </div>
        )}
      </div>
    </main>
  )
}