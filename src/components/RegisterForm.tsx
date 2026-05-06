import { useState } from 'react'
import { Shield, Mail, Lock } from 'lucide-react'

interface RegisterFormProps {
  onRegister: (email: string, password: string) => Promise<void>
  onSwitchToLogin: () => void
  isLoading: boolean
  error: string | null
}

export default function RegisterForm({ onRegister, onSwitchToLogin, isLoading, error }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      return
    }
    await onRegister(email, password)
  }

  const passwordsMatch = password === confirmPassword
  const passwordStrength = password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-400 rounded-2xl flex items-center justify-center text-black mx-auto mb-4 shadow-lg shadow-cyan-400/20">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">FinIntel</h1>
          <p className="text-gray-400 text-sm mt-2">Create your market intelligence account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="bg-rose-400/10 border border-rose-400/30 text-rose-300 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {password && !passwordStrength && (
            <div className="bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs rounded-lg p-3 space-y-1">
              <p className="font-bold uppercase">Password Requirements:</p>
              <ul className="space-y-0.5 ml-4 list-disc">
                <li className={password.length >= 8 ? 'text-emerald-400' : ''}>At least 8 characters</li>
                <li className={/[A-Z]/.test(password) ? 'text-emerald-400' : ''}>One uppercase letter</li>
                <li className={/[0-9]/.test(password) ? 'text-emerald-400' : ''}>One number</li>
                <li className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? 'text-emerald-400' : ''}>One special character</li>
              </ul>
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
            <label htmlFor="confirm" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors ${
                  confirmPassword && !passwordsMatch ? 'border-rose-400/50' : 'border-white/10'
                }`}
                placeholder="••••••••"
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-rose-400">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !passwordStrength || !passwordsMatch}
            className="w-full py-3 bg-cyan-400 text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="text-center pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
            >
              Already have an account? <span className="font-bold">Sign In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
