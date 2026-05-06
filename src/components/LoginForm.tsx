import { useState } from 'react'
import { Shield, Mail, Lock, Key } from 'lucide-react'
import type { LoginRequest } from '../types/auth'

interface LoginFormProps {
  onLogin: (email: string, password: string, mfaCode?: string) => Promise<void>
  onSwitchToRegister: () => void
  isLoading: boolean
  error: string | null
}

export default function LoginForm({ onLogin, onSwitchToRegister, isLoading, error }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onLogin(email, password, mfaCode || undefined)
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-400 rounded-2xl flex items-center justify-center text-black mx-auto mb-4 shadow-lg shadow-cyan-400/20">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">FinIntel</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to your market intelligence workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="bg-rose-400/10 border border-rose-400/30 text-rose-300 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors"
                placeholder="trader@finintel.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="mfa" className="text-xs font-bold text-gray-400 uppercase tracking-widest">MFA Code (if enabled)</label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="mfa"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors"
                placeholder="123456"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-cyan-400 text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
            >
              Don't have an account? <span className="font-bold">Register</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
