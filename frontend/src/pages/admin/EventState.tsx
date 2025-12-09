import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { apiRequest, getAuthHeaders } from '@/lib/api'

type EventState = 'SETUP' | 'NOMINATIONS' | 'VOTING' | 'CLOSED'

export default function AdminEventState() {
  const [state, setState] = useState<EventState>('SETUP')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const username = localStorage.getItem('admin_username') || ''
  const password = localStorage.getItem('admin_password') || ''

  useEffect(() => {
    fetchState()
  }, [])

  const fetchState = async () => {
    try {
      const data = await apiRequest<{ state: string }>('/admin/event-state', {
        headers: getAuthHeaders(username, password),
      })
      if (data.state) {
        setState(data.state as EventState)
      }
    } catch (error) {
      console.error('Error fetching state:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiRequest('/admin/event-state', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(username, password),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state }),
      })

      toast({
        title: 'Estado actualizado',
        description: `El evento ahora está en estado: ${state}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const getStateDescription = (s: EventState) => {
    switch (s) {
      case 'SETUP':
        return 'El evento está en configuración. Los usuarios no pueden participar aún.'
      case 'NOMINATIONS':
        return 'Los usuarios pueden nominar candidatos en las categorías activas.'
      case 'VOTING':
        return 'Los usuarios pueden votar por los candidatos en cada categoría.'
      case 'CLOSED':
        return 'El evento ha finalizado. Se pueden ver los ganadores.'
      default:
        return ''
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando estado...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estado del Evento</h1>
        <p className="text-muted-foreground">Gestiona el estado global del evento</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado Actual</CardTitle>
          <CardDescription>Selecciona el estado del evento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={state} onValueChange={(value) => setState(value as EventState)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SETUP">SETUP</SelectItem>
              <SelectItem value="NOMINATIONS">NOMINATIONS</SelectItem>
              <SelectItem value="VOTING">VOTING</SelectItem>
              <SelectItem value="CLOSED">CLOSED</SelectItem>
            </SelectContent>
          </Select>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">{getStateDescription(state)}</p>
          </div>

          <Button
            className="bg-gold hover:bg-gold-dark text-foreground"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Estado'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
