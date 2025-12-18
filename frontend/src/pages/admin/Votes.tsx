import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Trophy } from 'lucide-react'
import { apiRequest, getAuthHeaders, getProfileImageUrl } from '@/lib/api'

interface Vote {
  category_id: string
  category_name: string
  category_description?: string
  category_winner_candidate_id: string | null
  category_winner_announced: boolean
  candidate_id: string
  candidate_name: string
  profile_image_url: string | null
  count: number
  first_vote: string
}

interface Category {
  id: string
  name: string
}

export default function AdminVotes() {
  const [votes, setVotes] = useState<Vote[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [onlySelected, setOnlySelected] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const username = localStorage.getItem('admin_username') || ''
  const password = localStorage.getItem('admin_password') || ''

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    // Resetear onlySelected cuando se cambia de categoría
    if (selectedCategory === 'all') {
      setOnlySelected(true)
    }
    fetchVotes()
  }, [selectedCategory, onlySelected])

  const fetchCategories = async () => {
    try {
      const data = await apiRequest<Category[]>('/admin/categories', {
        headers: getAuthHeaders(username, password),
      })
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchVotes = async (preserveScroll: boolean = false) => {
    try {
      // Guardar posición del scroll si se solicita
      const scrollPosition = preserveScroll ? window.scrollY : null
      
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category_id', selectedCategory)
      }
      // Por defecto mostrar solo candidatos seleccionados (como Results)
      // Si se selecciona una categoría específica, se puede alternar con el botón
      if (onlySelected || selectedCategory === 'all') {
        params.append('only_selected', 'true')
      }
      
      const url = `/admin/votes${params.toString() ? `?${params.toString()}` : ''}`
      const data = await apiRequest<Vote[]>(url, {
        headers: getAuthHeaders(username, password),
      })
      setVotes(data)
      
      // Restaurar posición del scroll después de actualizar
      if (preserveScroll && scrollPosition !== null) {
        // Usar requestAnimationFrame doble para asegurar que el DOM se haya actualizado completamente
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPosition)
          })
        })
      }
    } catch (error) {
      console.error('Error fetching votes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetWinner = async (categoryId: string, candidateId: string) => {
    setSaving(true)
    try {
      await apiRequest('/admin/publish-winner', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(username, password),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: categoryId,
          candidate_id: candidateId,
        }),
      })

      toast({
        title: 'Ganador establecido',
        description: 'El ganador se estableció correctamente',
      })
      fetchVotes(true)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al establecer ganador',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (categoryId: string, announce: boolean) => {
    setSaving(true)
    try {
      await apiRequest('/admin/publish-winner', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(username, password),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: categoryId,
          announce,
        }),
      })

      toast({
        title: announce ? 'Ganador publicado' : 'Publicación cancelada',
        description: `El ganador ${announce ? 'se publicó' : 'ya no está publicado'}`,
      })
      fetchVotes(true)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al publicar',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveWinner = async (categoryId: string) => {
    setSaving(true)
    try {
      await apiRequest('/admin/publish-winner', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(username, password),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: categoryId,
          candidate_id: null,
        }),
      })

      toast({
        title: 'Ganador removido',
        description: 'El ganador se removió correctamente',
      })
      fetchVotes(true)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al remover ganador',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando votaciones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resultados y Votaciones</h1>
          <p className="text-muted-foreground">Resultados de votación por categoría</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategory !== 'all' && (
            <Button
              variant={onlySelected ? 'default' : 'outline'}
              onClick={() => setOnlySelected(!onlySelected)}
            >
              {onlySelected ? 'Solo Seleccionados' : 'Ver Todos los Votos'}
            </Button>
          )}
        </div>
      </div>

      {votes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay votaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            votes.reduce((acc: Record<string, Vote[]>, vote) => {
              if (!acc[vote.category_id]) {
                acc[vote.category_id] = []
              }
              acc[vote.category_id].push(vote)
              return acc
            }, {})
          ).map(([categoryId, categoryVotes]) => {
            const categoryName = categoryVotes[0]?.category_name || ''
            const winnerCandidateId = categoryVotes[0]?.category_winner_candidate_id || null
            const winnerAnnounced = categoryVotes[0]?.category_winner_announced || false
            
            return (
              <Card key={categoryId}>
                <CardHeader>
                  <CardTitle>{categoryName}</CardTitle>
                  {categoryVotes[0]?.category_description && (
                    <CardDescription>{categoryVotes[0].category_description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryVotes.map((vote, index) => (
                      <div
                        key={vote.candidate_id}
                        className={`flex justify-between items-center p-3 rounded ${
                          vote.candidate_id === winnerCandidateId
                            ? 'bg-gold/20 border border-gold'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-gold">
                            #{index + 1}
                          </span>
                          <img
                            src={getProfileImageUrl(vote.profile_image_url)}
                            alt={vote.candidate_name}
                            className="w-10 h-10 rounded-full object-cover border border-gold/40"
                          />
                          <span className="font-medium">{vote.candidate_name}</span>
                        </div>
                        <span className="text-lg font-bold">{vote.count} votos</span>
                      </div>
                    ))}
                  </div>
                  
                  {!winnerCandidateId && categoryVotes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-medium">Establecer Ganador:</label>
                      <Select
                        onValueChange={(candidateId) =>
                          handleSetWinner(categoryId, candidateId)
                        }
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el ganador" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryVotes.map((vote) => (
                            <SelectItem
                              key={vote.candidate_id}
                              value={vote.candidate_id}
                            >
                              {vote.candidate_name} ({vote.count} votos)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {winnerCandidateId && (
                    <div className="mt-4 space-y-2">
                      <div className="p-3 bg-gold/10 border border-gold rounded">
                        <p className="font-semibold text-gold flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Ganador: {categoryVotes.find(c => c.candidate_id === winnerCandidateId)?.candidate_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {categoryVotes.find(c => c.candidate_id === winnerCandidateId)?.count} {categoryVotes.find(c => c.candidate_id === winnerCandidateId)?.count === 1 ? 'voto' : 'votos'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Estado: {winnerAnnounced ? 'Anunciado' : 'No anunciado'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={winnerAnnounced ? 'outline' : 'default'}
                          className={`flex-1 ${!winnerAnnounced ? 'bg-gold hover:bg-gold-dark text-foreground' : ''}`}
                          onClick={() =>
                            handlePublish(categoryId, !winnerAnnounced)
                          }
                          disabled={saving}
                        >
                          {winnerAnnounced
                            ? 'Ocultar Ganador'
                            : 'Publicar Ganador'}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleRemoveWinner(categoryId)}
                          disabled={saving}
                        >
                          Remover Ganador
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

