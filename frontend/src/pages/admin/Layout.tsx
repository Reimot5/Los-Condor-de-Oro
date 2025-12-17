import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Award, 
  Users, 
  Trophy, 
  Settings, 
  FileText,
  LogOut,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { apiRequest, getAuthHeaders } from '@/lib/api'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Categorías', icon: Award },
  { href: '/admin/event-state', label: 'Estado del Evento', icon: Settings },
  { href: '/admin/nominations', label: 'Nominaciones', icon: FileText },
  { href: '/admin/votes', label: 'Votaciones', icon: CheckCircle },
  { href: '/admin/candidates', label: 'Candidatos', icon: Users },
  { href: '/admin/results', label: 'Resultados y Ganadores', icon: Trophy },
  { href: '/admin/import-codes', label: 'Importar Códigos', icon: FileText },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const username = localStorage.getItem('admin_username')
      const password = localStorage.getItem('admin_password')

      if (!username || !password) {
        navigate('/admin/login')
        return
      }

      await apiRequest('/admin/login', {
        method: 'POST',
        headers: getAuthHeaders(username, password),
      })

      setAuthenticated(true)
    } catch (error) {
      navigate('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_username')
    localStorage.removeItem('admin_password')
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="w-64 bg-card border-r border-border min-h-screen p-4">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gold mb-6">Panel Admin</h2>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-gold/20 text-gold"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <Button
              variant="outline"
              className="w-full mt-8"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

