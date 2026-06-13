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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-container-margin"
      onMouseMove={(e) => {
        const x = e.clientX / window.innerWidth
        const y = e.clientY / window.innerHeight
        document.body.style.backgroundImage = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,107,107,0.07) 0%, transparent 50%)`
      }}
    >
      <div className="fixed top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 left-0 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl -z-10" />

      <h1 className="font-display text-display-lg text-primary tracking-tighter mb-2">SOLE</h1>
      <p className="font-label text-label-md text-on-surface-variant mb-stack-lg text-center">
        Khám phá vibe du lịch của bạn
      </p>

      <div className="glass-card w-full max-w-sm rounded-lg p-stack-lg shadow-xl">
        <div className="flex mb-stack-md border-b border-outline-variant">
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 font-label text-label-md transition-colors ${
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-stack-md">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-surface-container-low border border-outline-variant rounded-DEFAULT px-4 py-3 font-body text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary"
          />
          {error && (
            <p className="text-red-500 font-label text-label-md text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="sunset-gradient text-on-primary font-label text-label-md uppercase tracking-widest py-4 rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? '...' : tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  )
}
