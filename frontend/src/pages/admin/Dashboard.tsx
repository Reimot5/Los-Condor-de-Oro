import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiRequest, getAuthHeaders } from '@/lib/api'

interface CodeStats {
  total: number
  used_in_nomination: number
  used_in_voting: number
  unused: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    categories: 0,
    nominations: 0,
    candidates: 0,
    votes: 0,
  })
  const [codeStats, setCodeStats] = useState<CodeStats | null>(null)

  useEffect(() => {
    fetchStats()
    fetchCodeStats()
  }, [])

  const fetchStats = async () => {
    try {
      const username = localStorage.getItem('admin_username')
      const password = localStorage.getItem('admin_password')
      if (!username || !password) return

      const [categories, nominations, candidates, votes] = await Promise.all([
        apiRequest<any[]>('/admin/categories', { headers: getAuthHeaders(username, password) }),
        apiRequest<any[]>('/admin/nominations', { headers: getAuthHeaders(username, password) }),
        apiRequest<any[]>('/admin/candidates', { headers: getAuthHeaders(username, password) }),
        apiRequest<any[]>('/admin/votes?only_selected=true', { headers: getAuthHeaders(username, password) }),
      ])

      const totalVotes = votes.reduce((sum: number, v: any) => sum + v.count, 0)

      setStats({
        categories: categories.length,
        nominations: nominations.length,
        candidates: candidates.length,
        votes: totalVotes,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchCodeStats = async () => {
    try {
      const username = localStorage.getItem('admin_username')
      const password = localStorage.getItem('admin_password')
      if (!username || !password) return

      const stats = await apiRequest<CodeStats>('/admin/codes/stats', {
        headers: getAuthHeaders(username, password),
      })
      setCodeStats(stats)
    } catch (error) {
      console.error('Error fetching code stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Estadísticas Generales</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>Total de categorías</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nominaciones</CardTitle>
              <CardDescription>Total de nominaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.nominations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Candidatos</CardTitle>
              <CardDescription>Total de candidatos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.candidates}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Votos</CardTitle>
              <CardDescription>Total de votos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.votes}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {codeStats && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Estadísticas de Códigos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de Códigos</CardTitle>
                <CardDescription>Códigos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold">{codeStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usados en Nominación</CardTitle>
                <CardDescription>Códigos que han nominado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{codeStats.used_in_nomination}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {codeStats.total > 0 
                    ? `${Math.round((codeStats.used_in_nomination / codeStats.total) * 100)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usados en Votación</CardTitle>
                <CardDescription>Códigos que han votado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{codeStats.used_in_voting}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {codeStats.total > 0 
                    ? `${Math.round((codeStats.used_in_voting / codeStats.total) * 100)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>No Utilizados</CardTitle>
                <CardDescription>Códigos disponibles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">{codeStats.unused}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {codeStats.total > 0 
                    ? `${Math.round((codeStats.unused / codeStats.total) * 100)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

