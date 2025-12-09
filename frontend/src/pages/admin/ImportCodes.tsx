import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Upload, Eye, CheckCircle2, XCircle } from 'lucide-react'
import { apiRequest, getAuthHeaders } from '@/lib/api'

interface Code {
  id: string
  code: string
  used_in_nomination: boolean
  used_in_voting: boolean
  created_at: string
}

export default function AdminImportCodes() {
  const [codes, setCodes] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingCodes, setExistingCodes] = useState<Code[]>([])
  const [loadingCodes, setLoadingCodes] = useState(true)
  const { toast } = useToast()

  const username = localStorage.getItem('admin_username') || ''
  const password = localStorage.getItem('admin_password') || ''

  useEffect(() => {
    fetchExistingCodes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const codesArray = codes
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (codesArray.length === 0) {
        throw new Error('No hay códigos para importar')
      }

      const data = await apiRequest<{ imported: number; total: number }>('/admin/import-codes', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(username, password),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codes: codesArray }),
      })

      toast({
        title: 'Códigos importados',
        description: `Se importaron ${data.imported} códigos de ${data.total} totales`,
      })
      handleImportSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al importar códigos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingCodes = async () => {
    try {
      setLoadingCodes(true)
      const data = await apiRequest<Code[]>('/admin/codes', {
        headers: getAuthHeaders(username, password),
      })
      setExistingCodes(data)
    } catch (error) {
      console.error('Error fetching codes:', error)
    } finally {
      setLoadingCodes(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCodes(content)
    }
    reader.readAsText(file)
  }

  const handleImportSuccess = () => {
    setCodes('')
    fetchExistingCodes()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Códigos</h1>
        <p className="text-muted-foreground">
          Importa códigos únicos desde un archivo CSV o ingrésalos manualmente. Visualiza los códigos existentes con censura.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importar Códigos</CardTitle>
          <CardDescription>
            Ingresa los códigos uno por línea o sube un archivo CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Subir archivo CSV</Label>
              <input
                id="file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-primary-foreground hover:file:bg-gold-dark"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codes">Códigos (uno por línea)</Label>
              <Textarea
                id="codes"
                value={codes}
                onChange={(e) => setCodes(e.target.value)}
                placeholder="ABC123&#10;DEF456&#10;GHI789"
                rows={10}
                className="font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gold hover:bg-gold-dark text-foreground"
              disabled={loading || !codes.trim()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Importando...' : 'Importar Códigos'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Códigos Existentes</CardTitle>
              <CardDescription>
                Lista de códigos con información censurada para seguridad
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExistingCodes}
              disabled={loadingCodes}
            >
              <Eye className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCodes ? (
            <div className="text-center py-8 text-muted-foreground">Cargando códigos...</div>
          ) : existingCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay códigos registrados</div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {existingCodes.map((code) => (
                  <div
                    key={code.id}
                    className="p-4 border rounded-lg bg-card space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-mono font-semibold text-gold">
                        {code.code}
                      </code>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {code.used_in_nomination ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-500" />
                        )}
                        <span className={code.used_in_nomination ? 'text-green-500' : 'text-muted-foreground'}>
                          Nominación
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {code.used_in_voting ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-500" />
                        )}
                        <span className={code.used_in_voting ? 'text-green-500' : 'text-muted-foreground'}>
                          Votación
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(code.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
