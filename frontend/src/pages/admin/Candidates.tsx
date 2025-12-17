import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Trash2, Edit2, Upload, FileSpreadsheet } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { apiRequest, apiRequestFormData, getAuthHeaders, getProfileImageUrl, API_URL } from '@/lib/api'

interface Candidate {
  id: string
  display_name: string
  profile_image_url: string | null
  is_active: boolean
  _count: {
    votes: number
    nominations: number
  }
  category_candidates: {
    category: {
      id: string
      name: string
    }
  }[]
}

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Candidate | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showImportForm, setShowImportForm] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    display_name: '',
    is_active: true,
  })
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const deletingRef = useRef<string | null>(null)
  const { toast } = useToast()

  const username = localStorage.getItem('admin_username') || ''
  const password = localStorage.getItem('admin_password') || ''

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const data = await apiRequest<Candidate[]>('/admin/candidates', {
        headers: getAuthHeaders(username, password),
      })
      setCandidates(data)
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = editing ? 'PUT' : 'POST'
      
      // Si hay imagen, usar FormData
      if (profileImage) {
        const formDataToSend = new FormData()
        formDataToSend.append('display_name', formData.display_name)
        formDataToSend.append('is_active', String(formData.is_active))
        formDataToSend.append('profile_image', profileImage)
        
        if (editing) {
          formDataToSend.append('id', editing.id)
        }

        const response = await fetch(`${API_URL}/admin/candidates`, {
          method,
          headers: getAuthHeaders(username, password),
          body: formDataToSend,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error al guardar')
        }

        await response.json()
      } else {
        // Sin imagen, usar JSON normal
        await apiRequest('/admin/candidates', {
          method,
          headers: {
            ...getAuthHeaders(username, password),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editing ? { id: editing.id, display_name: formData.display_name, is_active: formData.is_active } : formData),
        })
      }

      toast({
        title: editing ? 'Candidato actualizado' : 'Candidato creado',
        description: 'El candidato se guardó correctamente',
      })
      setShowForm(false)
      setEditing(null)
      setFormData({ display_name: '', is_active: true })
      setProfileImage(null)
      setImagePreview(null)
      fetchCandidates()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    // Prevenir múltiples ejecuciones usando ref (más rápido que el estado)
    if (deletingRef.current === id || deletingId === id) {
      return
    }

    // Establecer inmediatamente para prevenir doble ejecución
    deletingRef.current = id
    setDeletingId(id)
    
    try {
      await apiRequest(`/admin/candidates?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(username, password),
      })

      toast({
        title: 'Candidato eliminado',
        description: 'El candidato se eliminó correctamente',
      })
      fetchCandidates()
    } catch (error: any) {
      // Si el error es 404, significa que ya fue eliminado (probablemente en una petición anterior)
      // No mostrar error en ese caso, solo refrescar la lista silenciosamente
      if (error.status === 404 || error.message?.includes('404') || error.message?.includes('no existe')) {
        fetchCandidates()
        return
      }
      
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar candidato',
        variant: 'destructive',
      })
    } finally {
      deletingRef.current = null
      setDeletingId(null)
    }
  }

  const handleEdit = (candidate: Candidate) => {
    setEditing(candidate)
    setFormData({
      display_name: candidate.display_name,
      is_active: candidate.is_active,
    })
    setImagePreview(candidate.profile_image_url ? getProfileImageUrl(candidate.profile_image_url) : null)
    setProfileImage(null)
    setShowForm(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) {
      toast({
        title: 'Error',
        description: 'Selecciona un archivo Excel',
        variant: 'destructive',
      })
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const data = await apiRequestFormData<{
        success: boolean
        imported: number
        total: number
        images_imported?: number
        errors?: string[]
      }>('/admin/candidates/import', formData, getAuthHeaders(username, password))

      const imagesText = data.images_imported 
        ? ` (${data.images_imported} imagen${data.images_imported !== 1 ? 'es' : ''} importada${data.images_imported !== 1 ? 's' : ''})`
        : ''
      
      toast({
        title: 'Importación exitosa',
        description: `Se importaron ${data.imported} candidatos de ${data.total} totales${imagesText}${data.errors ? `. ${data.errors.length} error${data.errors.length !== 1 ? 'es' : ''}.` : ''}`,
      })

      if (data.errors && data.errors.length > 0) {
        console.error('Errores de importación:', data.errors)
      }

      setImportFile(null)
      setShowImportForm(false)
      fetchCandidates()
    } catch (error: any) {
      console.error('Error al importar candidatos:', error)
      toast({
        title: 'Error',
        description: error.message || 'Error al importar candidatos',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando candidatos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Candidatos</h1>
          <p className="text-muted-foreground">Gestiona los candidatos por categoría</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowImportForm(true)
              setShowForm(false)
            }}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
          <Button
            className="bg-gold hover:bg-gold-dark text-foreground"
            onClick={() => {
              setEditing(null)
              setFormData({ display_name: '', is_active: true })
              setProfileImage(null)
              setImagePreview(null)
              setShowForm(true)
              setShowImportForm(false)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Miembro
          </Button>
        </div>
      </div>

      {showImportForm && (
        <Card>
          <CardHeader>
            <CardTitle>Importar Candidatos desde Excel</CardTitle>
            <CardDescription>
              <div className="space-y-2">
                <p>Puedes subir un archivo Excel (.xlsx, .xls) o un ZIP que contenga:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Un archivo Excel con las columnas: display_name, is_active (opcional)</li>
                  <li>También se aceptan: "Nombre", "Miembro", "Activo"</li>
                  <li>Imágenes WEBP o GIF: si el nombre tiene prefijo " | " (ej: "ζ | Wolves"), la imagen debe llamarse solo la parte después del prefijo (ej: "Wolves.webp" o "Wolves.gif")</li>
                  <li>Si el nombre no tiene prefijo, la imagen debe llamarse igual al nombre completo</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Las imágenes pueden estar en la raíz del ZIP o en cualquier carpeta.
                  <br />
                  <strong>Ejemplo:</strong> Si en el Excel está "ζ | Wolves", la imagen debe llamarse "Wolves.webp" o "Wolves.gif"
                </p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImportExcel} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="excel-file">Archivo Excel o ZIP (.xlsx, .xls, .zip)</Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls,.zip"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-gold hover:bg-gold-dark text-foreground"
                  disabled={importing || !importFile}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? 'Importando...' : 'Importar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowImportForm(false)
                    setImportFile(null)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Editar Candidato' : 'Nuevo Candidato'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Miembro</Label>
                <Input
                  id="name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Nombre del miembro del clan"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile_image">Imagen de Perfil</Label>
                <Input
                  id="profile_image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gold/40"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-gold hover:bg-gold-dark text-foreground">
                  {editing ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditing(null)
                    setProfileImage(null)
                    setImagePreview(null)
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {candidates.map((candidate) => (
          <Card key={candidate.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <img
                    src={getProfileImageUrl(candidate.profile_image_url)}
                    alt={candidate.display_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gold/40"
                  />
                  <div>
                    <CardTitle>{candidate.display_name}</CardTitle>
                    <CardDescription>
                      {candidate.category_candidates.length > 0 
                        ? `Seleccionado en ${candidate.category_candidates.length} categoría(s)`
                        : 'No seleccionado en ninguna categoría'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(candidate)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar candidato?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminarán todos los votos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingId === candidate.id}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => {
                            e.preventDefault()
                            handleDelete(candidate.id)
                          }}
                          disabled={deletingId === candidate.id}
                        >
                          {deletingId === candidate.id ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  <span>Nominaciones: {candidate._count.nominations}</span>
                  <span className="ml-4">Votos: {candidate._count.votes}</span>
                  <span className="ml-4">Estado: {candidate.is_active ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
