import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import LandingPage from '@/components/public/LandingPage'

type EventState = 'SETUP' | 'NOMINATIONS' | 'VOTING' | 'CLOSED'

export default function Home() {
  const [state, setState] = useState<EventState>('SETUP')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEventState() {
      try {
        const eventState = await apiRequest<{ state: string }>('/admin/event-state', {
          headers: {
            Authorization: `Basic ${btoa('admin:admin')}`, // Temporary, should use proper auth
          },
        })
        setState(eventState.state as EventState)
      } catch (error) {
        console.error('Error fetching event state:', error)
        setState('SETUP')
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

  return <LandingPage state={state} />
}

