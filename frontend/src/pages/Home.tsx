import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import LandingPage from '@/components/public/LandingPage'

type EventState = 'SETUP' | 'NOMINATIONS' | 'VOTING' | 'CLOSED'

export default function Home() {
  const [state, setState] = useState<EventState>('SETUP')
  const [winnersVisible, setWinnersVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEventState() {
      try {
        const eventState = await apiRequest<{ state: string; winners_visible: boolean }>('/event-state')
        setState(eventState.state as EventState)
        setWinnersVisible(eventState.winners_visible || false)
      } catch (error) {
        console.error('Error fetching event state:', error)
        setState('SETUP')
        setWinnersVisible(false)
      } finally {
        setLoading(false)
      }
    }
    fetchEventState()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold-light">Cargando...</div>
      </div>
    )
  }

  return <LandingPage state={state} winnersVisible={winnersVisible} />
}

