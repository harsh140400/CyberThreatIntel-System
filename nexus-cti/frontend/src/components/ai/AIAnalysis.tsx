// AIAnalysis.tsx — Claude-powered SOC analyst
import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { aiApi } from '../../lib/api'
import { Btn, Card, SectionTitle, Tag } from '../shared'

interface Message { role: 'user' | 'assistant'; content: string }

const PRESETS = [
  'Analyze the current threat landscape and identify the highest-risk actors',
  'What MITRE ATT&CK techniques are most commonly observed in active campaigns?',
  'Generate defensive recommendations to protect against ransomware',
  'Summarize the relationship between observed IOCs and known malware families',
  'What behavioral patterns indicate APT activity in the current IOC dataset?',
  'Explain STIX/TAXII standards for threat intelligence sharing',
  'What is the recommended incident response playbook for a BlackCat ransomware attack?',
  'How should a SOC analyst pivot from a suspicious IP IOC to a full investigation?',
]

function MarkdownText({ text }: { text: string }) {
  // Minimal markdown: bold, code, headers, bullets
  const lines = text.split('\n')
  return (
    <div style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <div key={i} style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: 13, marginTop: 10, marginBottom: 4 }}>{line.slice(4)}</div>
        if (line.startsWith('## '))  return <div key={i} style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: 14, marginTop: 12, marginBottom: 4 }}>{line.slice(3)}</div>
        if (line.startsWith('# '))   return <div key={i} style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: 16, marginTop: 14, marginBottom: 6 }}>{line.slice(2)}</div>
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <div key={i} style={{ display: 'flex', gap: 8, marginTop: 2 }}><span style={{ color: 'var(--cyan)', flexShrink: 0 }}>▸</span><span>{renderInline(line.slice(2))}</span></div>
        }
        if (/^\d+\. /.test(line)) {
          const [num, ...rest] = line.split('. ')
          return <div key={i} style={{ display: 'flex', gap: 8, marginTop: 2 }}><span className="mono" style={{ color: 'var(--cyan)', flexShrink: 0, minWidth: 18 }}>{num}.</span><span>{renderInline(rest.join('. '))}</span></div>
        }
        if (line === '') return <div key={i} style={{ height: 6 }} />
        return <div key={i}>{renderInline(line)}</div>
      })}
    </div>
  )
}

function renderInline(text: string) {
  // Bold **text** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} style={{ color: 'var(--text)', fontWeight: 700 }}>{p.slice(2,-2)}</strong>
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="mono" style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, fontSize: 11, color: 'var(--orange)' }}>{p.slice(1,-1)}</code>
    return p
  })
}

export default function AIAnalysis() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: q }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await aiApi.analyze(newMessages)
      setMessages([...newMessages, { role: 'assistant', content: res.data.response }])
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? 'AI Analysis unavailable. Check ANTHROPIC_API_KEY in backend .env'
      setMessages([...newMessages, { role: 'assistant', content: `**Error:** ${detail}` }])
      toast.error('AI Analysis error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 14, gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="orbit" style={{ color: 'var(--purple)', fontSize: 13, letterSpacing: 2 }}>◈ AI THREAT ANALYST</span>
        <Tag color="var(--purple)">CLAUDE-POWERED</Tag>
        {messages.length > 0 && (
          <Btn variant="ghost" onClick={() => setMessages([])} style={{ marginLeft: 'auto', fontSize: 10 }}>CLEAR SESSION</Btn>
        )}
      </div>

      {/* Preset queries */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {PRESETS.map(p => (
          <button key={p} onClick={() => send(p)} disabled={loading}
            style={{
              background: 'transparent', border: '1px solid rgba(224,64,251,0.25)', borderRadius: 3,
              color: 'var(--purple)', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
              fontFamily: "'Rajdhani',sans-serif", opacity: loading ? 0.5 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,64,251,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {p.length > 55 ? p.slice(0, 55) + '…' : p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
            <div style={{ fontSize: 56, opacity: 0.08 }}>◈</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.8 }}>
              Ask the AI analyst anything about your threat environment<br />or select a preset query above
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="fade-in"
            style={{
              padding: '12px 14px', borderRadius: 6,
              background: m.role === 'user' ? 'rgba(224,64,251,0.05)' : 'var(--bg2)',
              border: `1px solid ${m.role === 'user' ? 'rgba(224,64,251,0.2)' : 'var(--border)'}`,
              borderLeft: `3px solid ${m.role === 'user' ? 'var(--purple)' : 'var(--cyan)'}`,
            }}>
            <div style={{ fontSize: 9, color: m.role === 'user' ? 'var(--purple)' : 'var(--cyan)', letterSpacing: 1.5, marginBottom: 8, fontWeight: 700 }}>
              {m.role === 'user' ? '◈ ANALYST QUERY' : '◈ AI RESPONSE'}
            </div>
            {m.role === 'assistant' ? <MarkdownText text={m.content} /> : (
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{m.content}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="fade-in" style={{
            padding: '12px 14px', borderRadius: 6, background: 'var(--bg2)',
            border: '1px solid var(--border)', borderLeft: '3px solid var(--purple)',
          }}>
            <div style={{ fontSize: 9, color: 'var(--purple)', letterSpacing: 1.5, marginBottom: 10 }}>◈ AI ANALYSIS IN PROGRESS</div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0,1,2].map(j => (
                <div key={j} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)',
                  animation: `blink ${0.8 + j * 0.2}s step-end infinite`,
                  animationDelay: `${j * 0.25}s`,
                }} />
              ))}
              <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>Correlating threat intelligence…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Ask the AI analyst — e.g. 'What is the most likely attack vector based on current IOCs?'"
          style={{ flex: 1 }}
          disabled={loading}
        />
        <Btn
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          style={{ borderColor: 'rgba(224,64,251,0.5)', color: 'var(--purple)' }}
        >
          ANALYZE
        </Btn>
      </div>
    </div>
  )
}
