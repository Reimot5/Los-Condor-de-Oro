import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest, getAuthHeaders } from '@/lib/api'

interface Vote {
  category_id: string
  category_name: string
  candidate_id: string
  candidate_name: string
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
  const [loading, setLoading] = useState(true)

  const username = localStorage.getItem('admin_username') || ''
  const password = localStorage.getItem('admin_password') || ''

  useEffect(() => {
    fetchCategories()
    fetchVotes()
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

  const fetchVotes = async () => {
    try {
      const url = selectedCategory !== 'all'
        ? `/admin/votes?category_id=${selectedCategory}`
        : '/admin/votes'
      const data = await apiRequest<Vote[]>(url, {
        headers: getAuthHeaders(username, password),
      })
      setVotes(data)
    } catch (error) {
      console.error('Error fetching votes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando votaciones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Votaciones</h1>
          <p className="text-muted-foreground">Revisa todas las votaciones recibidas</p>
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
            
            return (
              <Card key={categoryId}>
                <CardHeader>
                  <div>
                    <CardTitle>{categoryName}</CardTitle>
                    <CardDescription>
                      Total de votos recibidos por candidato
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryVotes.map((vote) => (
                      <div
                        key={vote.candidate_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                      >
                        <span className="font-medium">{vote.candidate_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {vote.count} voto{vote.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
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

