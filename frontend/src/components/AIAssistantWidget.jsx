// =============================================================
// src/components/AIAssistantWidget.jsx - Agent IA transversal
// Disponible dans tous les espaces connectes.
// =============================================================
import React, { useRef, useState } from 'react'
import { analyserIncident, askAssistant, getPredictiveBriefing } from '../api/aiApi'

const AIAssistantWidget = () => {
  const fileInputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    if (!question.trim()) return
    const currentQuestion = question.trim()
    setQuestion('')
    setMessages((current) => [...current, { role: 'user', text: currentQuestion }])
    setLoading(true)
    try {
      const response = await askAssistant({
        question: currentQuestion,
        conversationId,
        pageContext: 'assistant_widget',
      })
      if (response.conversation_id) setConversationId(response.conversation_id)
      setMessages((current) => [...current, { role: 'assistant', text: response.answer || 'Aucune reponse disponible.' }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: 'ECO IA est temporairement indisponible.' }])
    } finally {
      setLoading(false)
    }
  }

  const askPredictiveBriefing = async () => {
    setLoading(true)
    setMessages((current) => [...current, { role: 'user', text: 'Briefing predictif des risques' }])
    try {
      const data = await getPredictiveBriefing()
      const top = (data.predictions || []).slice(0, 5)
      const text = top.length
        ? top.map((item, index) => `${index + 1}. ${item.commune}: score ${item.risk_score}, niveau ${item.risk_level}`).join('\n')
        : 'Aucune prediction disponible pour le moment.'
      setMessages((current) => [...current, { role: 'assistant', text: `Priorites predictives:\n${text}` }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: "Le briefing predictif n'est pas disponible pour le moment." }])
    } finally {
      setLoading(false)
    }
  }

  const analyzeImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMessages((current) => [...current, { role: 'user', text: `Analyse image: ${file.name}` }])
    try {
      const data = await analyserIncident({ imageFile: file, description: 'Analyse rapide depuis agent IA transversal' })
      const recommendations = (data.recommandations || []).slice(0, 3).map((item) => `- ${item}`).join('\n')
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: `Gravite: ${data.graviteLabel} | Confiance: ${data.confiance || 0}%\n${data.analyse}${recommendations ? `\n${recommendations}` : ''}`,
        },
      ])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', text: 'ECO IA est temporairement indisponible.' }])
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  return (
    <>
      {open && (
        <section
          className="eco-card"
          style={{
            position: 'fixed',
            right: 18,
            bottom: 82,
            width: 380,
            maxWidth: 'calc(100vw - 36px)',
            height: 500,
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 8,
            boxShadow: '0 18px 60px rgba(0,0,0,0.24)',
          }}
        >
          <header style={{ padding: '14px 16px', background: 'var(--eco-accent-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 800 }}>Agent IA ECO RDC</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Assistant operationnel connecte aux donnees</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} style={{ border: 0, background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 6, width: 30, height: 30 }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14, background: 'var(--eco-bg-primary)' }}>
            {messages.length === 0 && (
              <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                Posez une question sur vos signalements, les risques, les priorites, les publications ou les actions a mener.
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <div style={{ maxWidth: '86%', padding: '10px 12px', borderRadius: 8, background: message.role === 'user' ? 'var(--eco-accent)' : 'var(--eco-bg-card)', color: message.role === 'user' ? '#fff' : 'var(--eco-text-primary)', border: message.role === 'user' ? 'none' : '1px solid var(--eco-border)', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
                  {message.text}
                </div>
              </div>
            ))}
            {loading && <div style={{ color: 'var(--eco-text-secondary)', fontSize: '0.84rem' }}><i className="bi bi-cpu-fill me-2"></i>Analyse en cours...</div>}
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--eco-border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-sm btn-outline-success" onClick={askPredictiveBriefing} disabled={loading}>
              <i className="bi bi-activity me-1"></i>Briefing
            </button>
            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              <i className="bi bi-image-fill me-1"></i>Image
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={analyzeImage} />
          </div>

          <form onSubmit={submit} style={{ padding: 12, borderTop: '1px solid var(--eco-border)', display: 'flex', gap: 8 }}>
            <input className="eco-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Votre question..." disabled={loading} />
            <button className="btn-eco btn" disabled={loading || !question.trim()} aria-label="Envoyer">
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          width: 54,
          height: 54,
          borderRadius: 14,
          border: 0,
          background: 'var(--eco-accent-gradient)',
          color: '#fff',
          zIndex: 1999,
          boxShadow: '0 10px 32px rgba(45,122,78,0.35)',
        }}
        title="Agent IA ECO RDC"
      >
        <i className="bi bi-cpu-fill" style={{ fontSize: '1.25rem' }}></i>
      </button>
    </>
  )
}

export default AIAssistantWidget
