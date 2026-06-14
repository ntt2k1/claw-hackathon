import { useState } from 'react'
import { api } from '../api.js'

export default function AuthScreen({ onSuccess }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = tab === 'login'
        ? await api.login(email, password)
        : await api.register(email, password)
      api.saveToken(data.token)
      onSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-background">
      <div className="fixed top-0 right-0 w-72 h-72 bg-cyber-purple/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black text-primary tracking-tighter mb-2">SOLE</h1>
        <p className="text-label-md text-on-surface-variant tracking-widest uppercase">
          Khám phá vibe du lịch của bạn
        </p>
      </div>

      <div className="glass-card w-full max-w-sm rounded-xl p-6 shadow-card">
        <div className="flex mb-5 border-b border-outline-variant">
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2.5 text-label-md font-semibold transition-colors ${
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-3 text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-surface-container-high border border-outline-variant rounded-DEFAULT px-4 py-3 text-body-md text-on-surface placeholder-on-surface-dim/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
          {error && (
            <p className="text-red-400 text-label-md text-center bg-red-500/10 rounded-lg py-2 px-3">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="neon-gradient text-on-primary font-bold text-label-md uppercase tracking-widest py-4 rounded-full shadow-neon-green active:scale-95 transition-transform disabled:opacity-50 mt-1"
          >
            {loading ? '...' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  )
}
