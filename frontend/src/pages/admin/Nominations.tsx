import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { apiRequest, getAuthHeaders, getProfileImageUrl } from '@/lib/api'

interface Nomination {
  category_id: string
  category_name: string
  candidate_id: string
  candidate_name: string
  profile_image_url: string | null
  count: number
  first_nomination: string
}

interface Category {
  id: string
  name: string
}

interface SelectedCandidate {
  candidate_id: string
  candidate_name: string
  profile_image_url: string | null
}

interface SelectedCandidatesByCategory {
  category_id: string
  category_name: string
  candidates: SelectedCandidate[]
}

export default function AdminNominations() {
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string[]>>({})
  const [savedCandidates, setSavedCandidates] = useState<Record<string, SelectedCandidate[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const username = localStorage.getItem('admin_username') || ''
  const password = localStorage.getItem('admin_password') || ''

  useEffect(() => {
    fetchCategories()
    fetchSavedCandidates()
  }, [])

  useEffect(() => {
    fetchNominations()
  }, [selectedCategory])

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

  const fetchSavedCandidates = async () => {
    try {
      const data = await apiRequest<SelectedCandidatesByCategory[]>('/admin/categories/selected-candidates', {
        headers: getAuthHeaders(username, password),
      })
      
      // Convertir a formato Record para fácil acceso
      const saved: Record<string, SelectedCandidate[]> = {}
      data.forEach((item) => {
        saved[item.category_id] = item.candidates
      })
      setSavedCandidates(saved)
    } catch (error) {
      console.error('Error fetching saved candidates:', error)
    }
  }

  const fetchNominations = async () => {
    try {
      const url = selectedCategory !== 'all'
        ? `/admin/nominations?category_id=${selectedCategory}`
        : '/admin/nominations'
      const data = await apiRequest<Nomination[]>(url, {
        headers: getAuthHeaders(username, password),
      })
      setNominations(data)
      
      // Agrupar por categoría
      const grouped: Record<string, Nomination[]> = {}
      data.forEach((nom) => {
        if (!grouped[nom.category_id]) {
          grouped[nom.category_id] = []
        }
        grouped[nom.category_id].push(nom)
      })
      
      // Inicializar selecciones con los primeros 5 de cada categoría
      const initialSelections: Record<string, string[]> = {}
      Object.keys(grouped).forEach((catId) => {
        initialSelections[catId] = grouped[catId]
          .slice(0, 5)
          .map((n) => n.candidate_id)
      })
      setSelectedCandidates(initialSelections)
    } catch (error) {
      console.error('Error fetching nominations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCandidate = (categoryId: string, candidateId: string) => {
    setSelectedCandidates((prev) => {
      const current = prev[categoryId] || []
      const isSelected = current.includes(candidateId)
      
      if (isSelected) {
        return {
          ...prev,
          [categoryId]: current.filter((id) => id !== candidateId),
        }
      } else {
        if (current.length >= 5) {
          toast({
            title: 'Límite alcanzado',
            description: 'Solo puedes seleccionar hasta 5 candidatos por categoría',
            variant: 'destructive',
          })
          return prev
        }
        return {
          ...prev,
          [categoryId]: [...current, candidateId],
        }
      }
    })
  }

  const handleSaveSelections = async (categoryId: string) => {
    setSaving(true)
    try {
      const candidateIds = selectedCandidates[categoryId] || []
      
      await apiRequest('/admin/categories/select-candidates', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(username, password),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: categoryId,
          candidate_ids: candidateIds,
          max_candidates: 5,
        }),
      })

      toast({
        title: 'Candidatos seleccionados',
        description: `Se seleccionaron ${candidateIds.length} candidatos para esta categoría`,
      })
      
      // Actualizar la lista de candidatos guardados
      await fetchSavedCandidates()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar selecciones',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando nominaciones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nominaciones</h1>
          <p className="text-muted-foreground">Revisa todas las nominaciones recibidas</p>
        </div>
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
      </div>

      {nominations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No hay nominaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            nominations.reduce((acc: Record<string, Nomination[]>, nom) => {
              if (!acc[nom.category_id]) {
                acc[nom.category_id] = []
              }
              acc[nom.category_id].push(nom)
              return acc
            }, {})
          ).map(([categoryId, categoryNominations]) => {
            const categoryName = categoryNominations[0]?.category_name || ''
            const selected = selectedCandidates[categoryId] || []
            const saved = savedCandidates[categoryId] || []
            
            return (
              <Card key={categoryId}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{categoryName}</CardTitle>
                      <CardDescription>
                        Selecciona entre 1 y 5 candidatos para esta categoría
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handleSaveSelections(categoryId)}
                      disabled={saving || selected.length === 0 || selected.length > 5}
                      className="bg-gold hover:bg-gold-dark text-foreground"
                    >
                      {saving ? 'Guardando...' : `Guardar (${selected.length})`}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {saved.length > 0 && (
                    <div className="mb-6 p-4 bg-gold/10 border border-gold rounded-lg">
                      <h3 className="font-semibold text-gold mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-gold rounded-full"></span>
                        Candidatos Guardados ({saved.length})
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {saved.map((candidate) => (
                          <div
                            key={candidate.candidate_id}
                            className="flex items-center gap-2 px-3 py-2 bg-background border border-gold/30 rounded-lg"
                          >
                            <img
                              src={getProfileImageUrl(candidate.profile_image_url)}
                              alt={candidate.candidate_name}
                              className="w-8 h-8 rounded-full object-cover border border-gold/40"
                            />
                            <span className="text-sm font-medium">{candidate.candidate_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {categoryNominations.map((nom) => {
                      const isSelected = selected.includes(nom.candidate_id)
                      const isSaved = saved.some(c => c.candidate_id === nom.candidate_id)
                      return (
                        <div
                          key={nom.candidate_id}
                          className={`flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent ${
                            isSaved ? 'bg-gold/5 border-gold/30' : ''
                          }`}
                        >
                          <Checkbox
                            id={`${categoryId}-${nom.candidate_id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleToggleCandidate(categoryId, nom.candidate_id)}
                            disabled={!isSelected && selected.length >= 5}
                          />
                          <label
                            htmlFor={`${categoryId}-${nom.candidate_id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getProfileImageUrl(nom.profile_image_url)}
                                  alt={nom.candidate_name}
                                  className="w-10 h-10 rounded-full object-cover border border-gold/40"
                                />
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{nom.candidate_name}</span>
                                  {isSaved && (
                                    <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full font-medium">
                                      Guardado
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {nom.count} nominación{nom.count !== 1 ? 'es' : ''}
                              </span>
                            </div>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
