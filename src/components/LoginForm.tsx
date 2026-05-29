import { useState } from 'react'
import { Shield, Mail, Lock, Key, ArrowLeft, RefreshCw } from 'lucide-react'
import { forgotPassword, resetPassword } from '../services/auth'

interface LoginFormProps {
  onLogin: (email: string, password: string, mfaCode?: string) => Promise<void>
  onSwitchToRegister: () => void
  isLoading: boolean
  error: string | null
}

export default function LoginForm({ onLogin, onSwitchToRegister, isLoading, error }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login')
  
  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')

  // Recovery / Reset fields
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  
  // Local status
  const [localError, setLocalError] = useState<string | null>(null)
  const [localSuccess, setLocalSuccess] = useState<string | null>(null)
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setLocalSuccess(null)
    await onLogin(email, password, mfaCode || undefined)
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setLocalSuccess(null)
    setIsRecoveryLoading(true)
    try {
      const res = await forgotPassword(recoveryEmail)
      setLocalSuccess(res.message)
      setMode('reset')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to generate reset code.')
    } finally {
      setIsRecoveryLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setLocalError('Passwords do not match')
      return
    }
    setLocalError(null)
    setLocalSuccess(null)
    setIsRecoveryLoading(true)
    try {
      const res = await resetPassword(recoveryEmail, verificationCode, newPassword)
      setLocalSuccess(res.message + ' Please sign in with your new password.')
      setEmail(recoveryEmail) // Prefill email for login
      setMode('login')
      setPassword('') // Clear old password
      setNewPassword('')
      setConfirmNewPassword('')
      setVerificationCode('')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to reset password.')
    } finally {
      setIsRecoveryLoading(false)
    }
  }

  // Password validity checks
  const isNewPasswordValid = newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword)

  const isPasswordsMatch = newPassword === confirmNewPassword

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-cyan-400 rounded-2xl flex items-center justify-center text-black mx-auto mb-4 shadow-lg shadow-cyan-400/20">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white">
            {mode === 'login' ? 'FinIntel' : mode === 'forgot' ? 'Recover Account' : 'Reset Password'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {mode === 'login' && 'Sign in to your market intelligence workspace'}
            {mode === 'forgot' && 'Request a verification code to recover your account'}
            {mode === 'reset' && 'Enter the verification code printed on the server console'}
          </p>
        </div>

        {/* --- LOGIN MODE --- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            {(error || localError) && (
              <div className="bg-rose-400/10 border border-rose-400/30 text-rose-300 text-sm rounded-lg p-3">
                {error || localError}
              </div>
            )}

            {localSuccess && (
              <div className="bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-sm rounded-lg p-3">
                {localSuccess}
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
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryEmail(email)
                    setLocalError(null)
                    setLocalSuccess(null)
                    setMode('forgot')
                  }}
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
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
        )}

        {/* --- FORGOT PASSWORD MODE --- */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            {localError && (
              <div className="bg-rose-400/10 border border-rose-400/30 text-rose-300 text-sm rounded-lg p-3">
                {localError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="recoveryEmail" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="recoveryEmail"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors"
                  placeholder="trader@finintel.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRecoveryLoading}
              className="w-full py-3 bg-cyan-400 text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isRecoveryLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                <span>Send Reset Code</span>
              )}
            </button>

            <div className="text-center pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setLocalError(null)
                  setLocalSuccess(null)
                  setMode('login')
                }}
                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors flex items-center justify-center mx-auto space-x-1"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* --- RESET PASSWORD MODE --- */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            {localError && (
              <div className="bg-rose-400/10 border border-rose-400/30 text-rose-300 text-sm rounded-lg p-3">
                {localError}
              </div>
            )}

            {localSuccess && (
              <div className="bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs rounded-lg p-3">
                {localSuccess}
              </div>
            )}

            {newPassword && !isNewPasswordValid && (
              <div className="bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs rounded-lg p-3 space-y-1">
                <p className="font-bold uppercase text-[10px] tracking-wider">New Password Requirements:</p>
                <ul className="space-y-0.5 ml-4 list-disc text-[11px]">
                  <li className={newPassword.length >= 8 ? 'text-emerald-400' : ''}>At least 8 characters</li>
                  <li className={/[A-Z]/.test(newPassword) ? 'text-emerald-400' : ''}>One uppercase letter</li>
                  <li className={/[0-9]/.test(newPassword) ? 'text-emerald-400' : ''}>One number</li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword) ? 'text-emerald-400' : ''}>One special character</li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="resetEmail" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="resetEmail"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors"
                  placeholder="trader@finintel.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verification Code</label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors"
                  placeholder="123456"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmNewPassword" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white text-sm focus:border-cyan-400/50 focus:outline-none transition-colors ${
                    confirmNewPassword && !isPasswordsMatch ? 'border-rose-400/50' : 'border-white/10'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {confirmNewPassword && !isPasswordsMatch && (
                <p className="text-xs text-rose-400">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isRecoveryLoading || !isNewPasswordValid || !isPasswordsMatch || !verificationCode}
              className="w-full py-3 bg-cyan-400 text-black font-black text-sm uppercase tracking-widest rounded-xl hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isRecoveryLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>

            <div className="text-center pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setLocalError(null)
                  setLocalSuccess(null)
                  setMode('forgot')
                }}
                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors flex items-center justify-center mx-auto space-x-1"
              >
                <ArrowLeft size={14} />
                <span>Back to Request Code</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
