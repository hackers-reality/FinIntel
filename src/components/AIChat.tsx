import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react'
import type { ResearchResult, MarketBehavior, CompanyDueDiligence, DocumentRisk } from '../types/research'
import { API_BASE_URL } from '../constants/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface Props {
  ticker?: string
  researchResult?: ResearchResult | null
  behavior?: MarketBehavior | null
  companyIntel?: CompanyDueDiligence | null
  documentRisk?: DocumentRisk | null
  accessToken: string | null
}

const SUGGESTED_PROMPTS = [
  "Analyze RELIANCE.NS",
  "What did Vijay Kedia buy recently?",
  "Explain Nifty 50 today",
  "Find growth stocks under ₹500"
]

export default function AIChat({ ticker, researchResult, behavior, companyIntel, documentRisk, accessToken }: Props) {
  // Generate sessionId once per chat session
  const [sessionId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your FinIntel AI research assistant. I can help you analyze stocks, understand market trends, review risks, and provide investment insights.${ticker ? ` Currently looking at ${ticker}.` : ''} What would you like to explore?`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load chat history from GET /api/chat/history?session_id={id} on mount
  useEffect(() => {
    if (!accessToken) return
    let active = true
    async function fetchHistory() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/history?session_id=${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        })
        if (response.ok && active) {
          const data = await response.json()
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp || Date.now())
            }))
            setMessages(formatted)
          }
        }
      } catch (err) {
        console.error('Error fetching chat history:', err)
      }
    }
    fetchHistory()
    return () => {
      active = false
    }
  }, [sessionId, accessToken])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const context = JSON.stringify({
        ticker,
        researchResult,
        behavior,
        companyIntel,
        documentRisk,
      })

      const response = await fetch(`${API_BASE_URL}/api/research/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          question: messageText,
          session_id: sessionId,
          context: context,
        })
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'No response received.',
        timestamp: new Date(),
        suggestions: generateFollowUps(messageText, data.answer || ''),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error connecting to the AI service. Please try again.',
          timestamp: new Date(),
        }
      ])
    } finally {
      setIsSending(false)
    }
  }

  const generateFollowUps = (question: string, answer: string): string[] => {
    const followUps: string[] = []
    if (question.toLowerCase().includes('risk')) {
      followUps.push('How can I mitigate these risks?', 'Show historical risk events')
    }
    if (question.toLowerCase().includes('price') || question.toLowerCase().includes('target')) {
      followUps.push('What could change this target?', 'Show analyst consensus')
    }
    if (followUps.length === 0) {
      followUps.push('Tell me more', 'Show related insights')
    }
    return followUps.slice(0, 3)
  }

  return (
    <div className="flex flex-col h-[600px] bg-[#111118] border border-[#1e1e2e] rounded-[2rem] overflow-hidden shadow-xl">
      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
            <Bot size={20} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-black text-cyan-400 uppercase tracking-wider">Aegis AI Core Assistant</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Sovereign Market Intellect</p>
          </div>
        </div>
        {ticker && (
          <div className="px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
            <p className="text-[10px] font-black uppercase text-cyan-300">{ticker}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start space-x-2.5 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${message.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-cyan-400/10 border-cyan-400/20'}`}>
                  {message.role === 'user' ? <User size={14} className="text-gray-400" /> : <Bot size={14} className="text-cyan-400" />}
                </div>
                <div className={`rounded-2xl p-4 text-xs leading-relaxed ${message.role === 'user' ? 'bg-cyan-300 text-black font-semibold' : 'bg-[#181824] text-gray-200 border border-white/5 shadow-md'}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-white/5 pt-2">
                      <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Suggested follow-ups:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => handleSend(suggestion)}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-cyan-300 hover:bg-white/10 hover:text-white transition-all"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[8px] text-gray-600 mt-1 ml-10 uppercase tracking-widest">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                <Bot size={14} className="text-cyan-400" />
              </div>
              <div className="bg-[#181824] border border-white/5 rounded-2xl p-4">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Grid */}
      <div className="px-5 py-2 bg-black/10 border-t border-white/5">
        <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider mb-2">Recommended Prompts</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-left p-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-gray-300 hover:bg-cyan-300 hover:text-black hover:border-cyan-300 transition-all font-medium truncate"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input container */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about market trends, stock analysis, risks..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-300/50"
            disabled={isSending}
          />
          <button
            onClick={() => handleSend()}
            disabled={isSending || !input.trim()}
            className="px-4 py-3 bg-cyan-300 text-black rounded-xl hover:bg-cyan-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
