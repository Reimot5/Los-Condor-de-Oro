import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { useToast } from '@/components/ui/use-toast'
import { Award } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface Category {
  id: string
  name: string
  short_description: string
}

interface Candidate {
  id: string
  display_name: string
}

export default function Nominate() {
  const [code, setCode] = useState('')
  const [codeValidated, setCodeValidated] = useState(false)
  const [validatingCode, setValidatingCode] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [nominations, setNominations] = useState<Record<string, string>>({}) // category_id -> candidate_id
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
    fetchCandidates()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await apiRequest<Category[]>('/categories?active=true')
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchCandidates = async () => {
    try {
      const data = await apiRequest<Candidate[]>('/candidates')
      setCandidates(data)
    } catch (error) {
      console.error('Error fetching candidates:', error)
    }
  }

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidatingCode(true)

    try {
      const data = await apiRequest<{ valid: boolean; state?: string; error?: string }>('/validate-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })

      if (data.valid && data.state === 'NOMINATIONS') {
        setCodeValidated(true)
        toast({
          title: 'Código válido',
          description: 'Puedes proceder a nominar',
        })
      } else {
        toast({
          title: 'Código inválido',
          description: data.error || 'El código ingresado no es válido o no puedes nominar en este momento',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      const errorMessage = error.message || 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      toast({
        title: 'Error de conexión',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setValidatingCode(false)
    }
  }

  const handleNominationChange = (categoryId: string, candidateId: string) => {
    setNominations((prev) => ({
      ...prev,
      [categoryId]: candidateId,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code || !codeValidated) {
      toast({
        title: 'Error',
        description: 'Debes validar tu código primero',
        variant: 'destructive',
      })
      return
    }

    // Validar que se completen todas las categorías
    if (Object.keys(nominations).length !== categories.length) {
      toast({
        title: 'Error',
        description: `Debes nominar en todas las categorías (${Object.keys(nominations).length}/${categories.length})`,
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Enviar todas las nominaciones en una sola llamada
      await apiRequest('/nominate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          nominations: Object.entries(nominations).map(([category_id, candidate_id]) => ({
            category_id,
            candidate_id,
          })),
        }),
      })

      toast({
        title: 'Nominaciones exitosas',
        description: `Se registraron ${Object.keys(nominations).length} nominaciones correctamente`,
      })

      navigate('/')
    } catch (error: any) {
      toast({
        title: 'Error al registrar',
        description: error.message || 'No se pudieron registrar las nominaciones. Por favor, intenta nuevamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto relative z-10"
      >
        <Card className="border-2 border-gold/40 bg-black/60 backdrop-blur-md shadow-[0_0_40px_rgba(212,175,55,0.3)]">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Award className="h-12 w-12 text-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
            </div>
            <CardTitle className="text-2xl text-gold font-bold drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">Nominar Candidato</CardTitle>
            <CardDescription className="text-white/80">
              Propón un candidato para una categoría. Puedes nominarte a ti mismo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!codeValidated ? (
              <form onSubmit={handleValidateCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white font-medium">Código de Miembro</Label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    required
                    className="w-full h-10 rounded-md border-2 border-gold/40 bg-black/40 px-3 py-2 text-center text-lg tracking-widest text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
                    disabled={validatingCode}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-dark text-foreground"
                  disabled={validatingCode || !code}
                >
                  {validatingCode ? 'Validando...' : 'Validar Código'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-sm text-gold-light mb-4">
                  Debes nominar en todas las categorías ({Object.keys(nominations).length}/{categories.length})
                </div>
                
                {categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <Label htmlFor={category.id} className="text-white font-medium">
                      {category.name} - {category.short_description}
                    </Label>
                    <Combobox
                      options={candidates.map((c) => ({
                        value: c.id,
                        label: c.display_name,
                      }))}
                      value={nominations[category.id] || ''}
                      onValueChange={(value) => handleNominationChange(category.id, value)}
                      placeholder="Selecciona un miembro"
                      searchPlaceholder="Buscar miembro..."
                      disabled={loading}
                    />
                  </div>
                ))}

                <Button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-dark text-foreground"
                  disabled={loading || Object.keys(nominations).length !== categories.length}
                >
                  {loading ? 'Enviando...' : `Enviar ${Object.keys(nominations).length} Nominaciones`}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

