export default function HomeScreen({ vibeResult, user, onStartQuiz, onGoExplore }) {
  function handleExplore() {
    if (!vibeResult) {
      onStartQuiz()
    } else {
      onGoExplore()
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-16 overflow-hidden">
      {/* Floating orbs */}
      <div
        className="fixed top-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-primary/20 blur-3xl -z-10 pointer-events-none"
        style={{ animation: 'float-orb-1 14s ease-in-out infinite' }}
      />
      <div
        className="fixed bottom-[-80px] left-[-60px] w-[350px] h-[350px] rounded-full bg-cyber-purple/20 blur-3xl -z-10 pointer-events-none"
        style={{ animation: 'float-orb-2 18s ease-in-out infinite' }}
      />
      <div
        className="fixed top-[20%] left-[-40px] w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl -z-10 pointer-events-none"
        style={{ animation: 'float-orb-3 11s ease-in-out infinite' }}
      />
      <div
        className="fixed bottom-[20%] right-[-30px] w-[300px] h-[300px] rounded-full bg-cyber-purple/15 blur-3xl -z-10 pointer-events-none"
        style={{ animation: 'float-orb-4 20s ease-in-out infinite' }}
      />

      {/* Center content */}
      <div className="flex flex-col items-center text-center gap-5">
        <h1 className="text-7xl font-black text-primary tracking-tighter leading-none">
          SOLE
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-xs leading-snug">
          Tìm tọa độ theo DNA du lịch của bạn
        </p>

        {vibeResult && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2">
            <span className="text-lg">✨</span>
            <span className="font-label text-label-md text-primary">{vibeResult.persona}</span>
          </div>
        )}

        <button
          onClick={handleExplore}
          className="neon-gradient text-on-primary font-label text-label-md uppercase tracking-widest px-8 py-4 rounded-full shadow-neon-green active:scale-95 transition-transform mt-2"
        >
          Khám phá ngay →
        </button>

        {!vibeResult && (
          <button
            onClick={onStartQuiz}
            className="font-label text-caption text-on-surface-variant underline underline-offset-4"
          >
            Chưa có DNA? Làm quiz →
          </button>
        )}

        {user && (
          <p className="font-label text-caption text-on-surface-dim/50 mt-4">
            {user.email}
          </p>
        )}
      </div>
    </div>
  )
}
