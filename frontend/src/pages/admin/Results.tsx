import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Trophy } from 'lucide-react'
import { apiRequest, getAuthHeaders } from '@/lib/api'

interface Result {
  category_id: string
  category_name: string
  category_description: string
  candidates: {
    candidate_id: string
    candidate_name: string
    votes: number
  }[]
  winner_candidate_id: string | null
  winner_announced: boolean
}

export default function AdminResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const username = localStorage.getItem('admin_username') || ''
  const password = localStorage.getItem('admin_password') || ''

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const data = await apiRequest<Result[]>('/admin/results', {
        headers: getAuthHeaders(username, password),
      })
      setResults(data)
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetWinner = async (categoryId: string, candidateId: string) => {
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
      fetchResults()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al establecer ganador',
        variant: 'destructive',
      })
    }
  }

  const handlePublish = async (categoryId: string, announce: boolean) => {
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
      fetchResults()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Error al publicar',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando resultados...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resultados</h1>
        <p className="text-muted-foreground">Resultados de votación por categoría</p>
      </div>

      <div className="space-y-6">
        {results.map((result) => (
          <Card key={result.category_id}>
            <CardHeader>
              <CardTitle>{result.category_name}</CardTitle>
              <CardDescription>{result.category_description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.candidates.length === 0 ? (
                  <p className="text-muted-foreground">No hay candidatos</p>
                ) : (
                  result.candidates.map((candidate, index) => (
                    <div
                      key={candidate.candidate_id}
                      className={`flex justify-between items-center p-3 rounded ${
                        candidate.candidate_id === result.winner_candidate_id
                          ? 'bg-gold/20 border border-gold'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gold">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{candidate.candidate_name}</span>
                      </div>
                      <span className="text-lg font-bold">{candidate.votes} votos</span>
                    </div>
                  ))
                )}
              </div>
              {!result.winner_candidate_id && result.candidates.length > 0 && (
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium">Establecer Ganador:</label>
                  <Select
                    onValueChange={(candidateId) =>
                      handleSetWinner(result.category_id, candidateId)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el ganador" />
                    </SelectTrigger>
                    <SelectContent>
                      {result.candidates.map((candidate) => (
                        <SelectItem
                          key={candidate.candidate_id}
                          value={candidate.candidate_id}
                        >
                          {candidate.candidate_name} ({candidate.votes} votos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {result.winner_candidate_id && (
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-gold/10 border border-gold rounded">
                    <p className="font-semibold text-gold flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      Ganador: {result.candidates.find(c => c.candidate_id === result.winner_candidate_id)?.candidate_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.candidates.find(c => c.candidate_id === result.winner_candidate_id)?.votes} {result.candidates.find(c => c.candidate_id === result.winner_candidate_id)?.votes === 1 ? 'voto' : 'votos'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Estado: {result.winner_announced ? 'Anunciado' : 'No anunciado'}
                    </p>
                  </div>
                  <Button
                    variant={result.winner_announced ? 'outline' : 'default'}
                    className={`w-full ${!result.winner_announced ? 'bg-gold hover:bg-gold-dark text-foreground' : ''}`}
                    onClick={() =>
                      handlePublish(result.category_id, !result.winner_announced)
                    }
                  >
                    {result.winner_announced
                      ? 'Ocultar Ganador'
                      : 'Publicar Ganador'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
