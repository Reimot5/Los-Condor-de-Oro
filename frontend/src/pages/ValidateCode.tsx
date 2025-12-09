import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Shield } from 'lucide-react'
import { apiRequest } from '@/lib/api'

export default function ValidateCode() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await apiRequest<{ valid: boolean; state?: string; error?: string }>('/validate-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })

      if (data.valid) {
        toast({
          title: 'Código válido',
          description: 'Redirigiendo...',
        })
        
        // No guardamos el código, se pedirá cada vez
        if (data.state === 'NOMINATIONS') {
          navigate('/nominate')
        } else if (data.state === 'VOTING') {
          navigate('/vote')
        } else {
          navigate('/')
        }
      } else {
        toast({
          title: 'Código inválido',
          description: data.error || 'El código no es válido o ya fue usado',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo validar el código',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-2 border-gold/40 bg-black/60 backdrop-blur-md shadow-[0_0_40px_rgba(212,175,55,0.3)]">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
            </div>
            <CardTitle className="text-2xl text-gold font-bold drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">Validar Código</CardTitle>
            <CardDescription className="text-white/80">
              Ingresa tu código único para participar en el evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-white font-medium">Código de Miembro</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  required
                  className="text-center text-lg tracking-widest bg-black/40 border-gold/40 text-white placeholder:text-white/50"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold-dark text-foreground"
                disabled={loading || !code}
              >
                {loading ? 'Validando...' : 'Validar Código'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

