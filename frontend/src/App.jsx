import { useState, useEffect } from 'react'
import { api } from './api.js'
import AuthScreen from './components/AuthScreen.jsx'
import EntryScreen from './components/EntryScreen.jsx'
import QuizScreen from './components/QuizScreen.jsx'
import VibeResult from './components/VibeResult.jsx'
import Itinerary from './components/Itinerary.jsx'
import { calculateScores } from './utils/scoring.js'
import { QUESTIONS } from './data/questions.js'
import BottomNav from './components/BottomNav.jsx'
import YourVibeScreen from './components/YourVibeScreen.jsx'

export default function App() {
  const [screen, setScreen] = useState('AUTH')
  const [user, setUser] = useState(null)

  const [tripType, setTripType] = useState('inday')
  const [duration, setDuration] = useState(8)
  const [location, setLocation] = useState('')
  const [quizAnswers, setQuizAnswers] = useState([])
  const [vibeResult, setVibeResult] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [loadingRec, setLoadingRec] = useState(false)
  const [activeTab, setActiveTab] = useState('explore')

  useEffect(() => {
    if (!api.hasToken()) return
    api.me()
      .then(async (userData) => {
        setUser(userData)
        if (userData.has_vibe) {
          try {
            const profile = await api.getVibe()
            setVibeResult({
          primary: profile.primary_vibe,
          secondary: profile.secondary_vibe,
          axes: profile.scores || {},
          persona: profile.persona || profile.primary_vibe,
          tagline: '',
          accentColor: '#BD00FF',
        })
          } catch (_) {}
        }
        setScreen('ENTRY')
      })
      .catch(() => {
        api.clearToken()
      })
  }, [])

  function handleAuthSuccess(userData) {
    setUser(userData)
    setScreen('ENTRY')
  }

  function handleEntryDone(entryData) {
    setTripType(entryData.tripType)
    setDuration(entryData.duration)
    setLocation(entryData.location)
    if (user?.has_vibe && vibeResult) {
      // Already has vibe — go straight to recommendations
      handleGetRecommendationsWithEntry(entryData, vibeResult)
    } else {
      setScreen('QUIZ1')
    }
  }

  async function handleGetRecommendationsWithEntry(entryData, vibe) {
    setLoadingRec(true)
    setScreen('ITINERARY')
    setActiveTab('itinerary')
    try {
      const data = await api.recommendations({
        primary_vibe: vibe.primary,
        secondary_vibe: vibe.secondary,
        location: entryData.location,
        trip_type: entryData.tripType,
        duration: entryData.duration,
        persona: vibe.persona,
        scores: vibe.axes,
      })
      setRecommendations(data)
    } catch (e) {
      console.error('Recommendation failed:', e)
    } finally {
      setLoadingRec(false)
    }
  }

  function handleQuiz1Done(answers) {
    setQuizAnswers(answers)
    setScreen('QUIZ2')
  }

  async function handleQuiz2Done(answers) {
    const allAnswers = [...quizAnswers, ...answers]
    const result = calculateScores(allAnswers)
    setVibeResult(result)
    try {
      await api.quizComplete({
        primary_vibe: result.primary,
        secondary_vibe: result.secondary,
        scores: result.axes,
        persona: result.persona,
      })
      setUser(prev => prev ? { ...prev, has_vibe: true } : prev)
    } catch (e) {
      console.warn('Failed to save vibe:', e)
    }
    setScreen('VIBE')
  }

  async function handleGetRecommendations() {
    if (!vibeResult || !location) return
    setLoadingRec(true)
    setScreen('ITINERARY')
    setActiveTab('itinerary')
    try {
      const data = await api.recommendations({
        primary_vibe: vibeResult.primary,
        secondary_vibe: vibeResult.secondary,
        location,
        trip_type: tripType,
        duration,
        persona: vibeResult.persona,
        scores: vibeResult.axes,
      })
      setRecommendations(data)
    } catch (e) {
      console.error('Recommendation failed:', e)
    } finally {
      setLoadingRec(false)
    }
  }

  function handleRestart() {
    setQuizAnswers([])
    setRecommendations(null)
    setActiveTab('explore')
    setScreen('ENTRY')
  }

  function handleRetakeQuiz() {
    setQuizAnswers([])
    setVibeResult(null)
    setUser(prev => prev ? { ...prev, has_vibe: false } : prev)
    setScreen('QUIZ1')
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'explore') {
      setScreen(recommendations ? 'VIBE' : 'ENTRY')
    } else if (tab === 'vibe') {
      setScreen('YOUR_VIBE')
    } else if (tab === 'itinerary') {
      setScreen('ITINERARY')
    }
  }

  const screen1Qs = QUESTIONS.slice(0, 5)
  const screen2Qs = QUESTIONS.slice(5, 10)
  const showNav = !['AUTH', 'QUIZ1', 'QUIZ2'].includes(screen)

  return (
    <div className="min-h-screen bg-background">
      {screen === 'AUTH'       && <AuthScreen onSuccess={handleAuthSuccess} />}
      {screen === 'ENTRY'      && <EntryScreen user={user} vibeResult={vibeResult} onDone={handleEntryDone} onRetakeQuiz={handleRetakeQuiz} />}
      {screen === 'QUIZ1'      && <QuizScreen questions={screen1Qs} screenIndex={1} totalScreens={2} onDone={handleQuiz1Done} />}
      {screen === 'QUIZ2'      && <QuizScreen questions={screen2Qs} screenIndex={2} totalScreens={2} onDone={handleQuiz2Done} />}
      {screen === 'VIBE'       && <VibeResult vibeResult={vibeResult} onContinue={handleGetRecommendations} />}
      {screen === 'ITINERARY'  && <Itinerary recommendations={recommendations} loading={loadingRec} tripType={tripType} location={location} onRestart={handleRestart} />}
      {screen === 'YOUR_VIBE'  && <YourVibeScreen vibeResult={vibeResult} />}
      {showNav && <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  )
}
