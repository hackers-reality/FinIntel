import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, X, Command, Clock } from 'lucide-react'
import { routeCommand, getIntentHelp } from '../services/intent-router'
import type { IntentMatch } from '../types/intent-router'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCommand: (intent: IntentMatch) => void
}

export default function CommandPalette({ isOpen, onClose, onCommand }: Props) {
  const [input, setInput] = useState('')
  const [intent, setIntent] = useState<IntentMatch | null>(null)
  const [history, setHistory] = useState<IntentMatch[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setInput('')
      setIntent(null)
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return

    const matched = routeCommand(input)
    if (matched.action !== 'unknown') {
      setHistory((prev) => [matched, ...prev].slice(0, 10))
      onCommand(matched)
      setInput('')
      setIntent(null)
      onClose()
    }
  }, [input, onCommand, onClose])

  const handleInputChange = useCallback((value: string) => {
    setInput(value)
    if (value.trim()) {
      setIntent(routeCommand(value))
    } else {
      setIntent(null)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#121821] border border-[#222C3B] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-6 py-5 border-b border-[#222C3B]">
          <Command size={18} className="text-[#8B97A8] mr-3" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            placeholder="Type a command or ask naturally..."
            className="flex-1 bg-transparent text-[#E6EDF3] text-sm outline-none placeholder:text-[#8B97A8]"
          />
          <button onClick={onClose} className="ml-3 text-[#8B97A8] hover:text-[#E6EDF3] transition-colors">
            <X size={18} />
          </button>
        </div>

        {intent && intent.action !== 'unknown' && (
          <div className="px-6 py-4 bg-[#1A2230] border-b border-[#222C3B]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ArrowRight size={14} className="text-[#3FB68B]" />
                <span className="text-xs font-bold text-[#3FB68B] uppercase">{intent.action.replace('_', ' ')}</span>
              </div>
              <span className="text-[10px] text-[#8B97A8]">{Math.round(intent.confidence * 100)}% match</span>
            </div>
            {Object.keys(intent.params).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(intent.params).map(([key, value]) => (
                  <span key={key} className="px-2 py-1 bg-[#222C3B] rounded text-[10px] text-[#E6EDF3]">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {input && (!intent || intent.action === 'unknown') && (
          <div className="px-6 py-4 text-xs text-[#8B97A8]">
            No matching command. Type <kbd className="px-1 py-0.5 bg-[#222C3B] rounded text-[10px]">/help</kbd> for available commands.
          </div>
        )}

        {history.length > 0 && (
          <div className="max-h-64 overflow-y-auto">
            <div className="px-6 py-3 border-b border-[#222C3B] flex items-center space-x-2">
              <Clock size={12} className="text-[#8B97A8]" />
              <span className="text-[10px] font-black uppercase text-[#8B97A8] tracking-widest">Recent</span>
            </div>
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  onCommand(item)
                  onClose()
                }}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-[#1A2230] transition-colors text-left"
              >
                <span className="text-sm text-[#E6EDF3]">{item.rawInput}</span>
                <span className="text-[10px] text-[#8B97A8] uppercase">{item.action.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        )}

        {!input && history.length === 0 && (
          <div className="px-6 py-8 text-center">
            <pre className="text-[10px] text-[#8B97A8] leading-relaxed whitespace-pre-wrap">
              {getIntentHelp()}
            </pre>
          </div>
        )}

        <div className="px-6 py-3 border-t border-[#222C3B] flex items-center justify-between text-[10px] text-[#8B97A8]">
          <div className="flex items-center space-x-4">
            <span><kbd className="px-1 py-0.5 bg-[#222C3B] rounded">Enter</kbd> run</span>
            <span><kbd className="px-1 py-0.5 bg-[#222C3B] rounded">Esc</kbd> close</span>
          </div>
          <span>FinIntel Command</span>
        </div>
      </div>
    </div>
  )
}
