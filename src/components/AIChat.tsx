import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react'
import type { ResearchResult, MarketBehavior, CompanyDueDiligence, DocumentRisk } from '../types/research'

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
  onAskQuestion: (question: string, context?: string) => Promise<string>
  isLoading: boolean
}

export default function AIChat({ ticker, researchResult, behavior, companyIntel, documentRisk, onAskQuestion, isLoading }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: `Hello! I'm your FinIntel AI research assistant. I can help you analyze stocks, understand market trends, review risks, and provide investment insights.${ticker ? ` Currently looking at ${ticker}.` : ''} What would you like to explore?`,
    timestamp: new Date(),
    suggestions: [
      'What\'s the current market sentiment?',
      'Analyze the technical indicators',
      'Show me risk factors',
      'Compare with sector peers',
    ],
  }])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const context = JSON.stringify({
        ticker,
        researchResult,
        behavior,
        companyIntel,
        documentRisk,
      })
      const response = await onAskQuestion(messageText, context)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions: generateFollowUps(messageText, response),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date(),
      }])
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
    <div className="flex flex-col h-[600px] bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center">
          <Bot size={20} className="text-cyan-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">FinIntel AI Assistant</p>
          <p className="text-[10px] text-gray-500">Research • Analysis • Insights</p>
        </div>
        {ticker && (
          <div className="px-3 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-lg">
            <p className="text-[10px] font-black uppercase text-cyan-400">{ticker}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${message.role === 'user' ? 'bg-white/10' : 'bg-cyan-400/20'}`}>
                  {message.role === 'user' ? <User size={16} className="text-gray-300" /> : <Bot size={16} className="text-cyan-400" />}
                </div>
                <div className={`rounded-2xl p-4 ${message.role === 'user' ? 'bg-cyan-400 text-black' : 'bg-white/5 text-gray-200'}`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-gray-500">Suggested follow-ups:</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => handleSend(suggestion)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[9px] text-gray-600 mt-1 ml-10">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                <Bot size={16} className="text-cyan-400" />
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about market trends, stock analysis, risks..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-400/50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-cyan-400 text-black rounded-xl hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <button className="text-[10px] text-gray-500 hover:text-cyan-400 transition-colors flex items-center space-x-1">
            <Lightbulb size={12} />
            <span>Get suggestions</span>
          </button>
          <button className="text-[10px] text-gray-500 hover:text-emerald-400 transition-colors flex items-center space-x-1">
            <TrendingUp size={12} />
            <span>Market outlook</span>
          </button>
          <button className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors flex items-center space-x-1">
            <AlertTriangle size={12} />
            <span>Risk check</span>
          </button>
        </div>
      </div>
    </div>
  )
}
