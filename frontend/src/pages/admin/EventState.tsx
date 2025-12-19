import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { apiRequest, getAuthHeaders } from '@/lib/api'

type EventState = 'SETUP' | 'NOMINATIONS' | 'VOTING' | 'CLOSED'

export default function AdminEventState() {
  const [state, setState] = useState<EventState>('SETUP')
  const [winnersVisible, setWinnersVisible] = useState(false)
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
      const data = await apiRequest<{ state: string; winners_visible: boolean }>('/admin/event-state', {
        headers: getAuthHeaders(username, password),
      })
      if (data.state) {
        setState(data.state as EventState)
      }
      if (typeof data.winners_visible === 'boolean') {
        setWinnersVisible(data.winners_visible)
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
        body: JSON.stringify({ state, winners_visible: winnersVisible }),
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

          {state === 'CLOSED' && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="winners-visible" className="text-base font-medium">
                  Mostrar página de ganadores
                </Label>
                <p className="text-sm text-muted-foreground">
                  Controla si la ruta /winners es visible para los usuarios
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="winners-visible"
                  checked={winnersVisible}
                  onChange={(e) => setWinnersVisible(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>
          )}

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
