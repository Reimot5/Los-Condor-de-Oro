import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'
import { apiRequest, getProfileImageUrl } from '@/lib/api'

interface Winner {
  category_id: string
  category_name: string
  category_description: string
  candidate_id: string | null
  candidate_name: string | null
  profile_image_url: string | null
  votes: number
  announced: boolean
}

export default function Winners() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWinners()
  }, [])

  const fetchWinners = async () => {
    try {
      const data = await apiRequest<Winner[]>('/winners')
      setWinners(data)
    } catch (error) {
      console.error('Error fetching winners:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando ganadores...</p>
      </div>
    )
  }

  const announcedWinners = winners.filter((w) => w.announced && w.candidate_id)
  const pendingWinners = winners.filter((w) => !w.announced && w.candidate_id)

  return (
    <div className="min-h-screen bg-black relative">
      {/* Fondo fijo */}
      <div className="fixed inset-0 z-0">
        {/* Imagen de fondo con animación */}
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src="/fondo.jpg"
            alt="Trofeo Los Cóndor de Oro"
            className="w-full h-full object-contain object-center"
          />
          {/* Overlay oscuro para mejorar legibilidad */}
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>

        {/* Efecto de spotlight dorado animado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute inset-0 bg-gradient-radial from-gold/10 via-transparent to-transparent pointer-events-none"
        />
        
        {/* Efecto de brillo sutil animado */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent pointer-events-none"
        />
      </div>

      {/* Contenido con scroll */}
      <div className="relative z-10 min-h-screen py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-8"
        >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <Trophy className="h-12 w-12 text-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
            <h1 className="text-4xl md:text-5xl font-bold text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.6)] tracking-wide">
              GANADORES
            </h1>
          </div>
          <p className="text-xl text-gold-light font-medium">
            Los Cóndor de Oro - Legión Cóndor
          </p>
        </motion.div>

        {announcedWinners.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">Ganadores Anunciados</h2>
            <div className="grid gap-6 md:grid-cols-2 auto-rows-fr">
              {announcedWinners.map((winner, index) => (
                <motion.div
                  key={winner.category_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-2 border-gold/40 bg-black/60 backdrop-blur-md shadow-[0_0_40px_rgba(212,175,55,0.3)] h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="text-gold flex items-center gap-2 font-bold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                        <Trophy className="h-5 w-5" />
                        {winner.category_name}
                      </CardTitle>
                      <CardDescription className="text-white/80 line-clamp-2">{winner.category_description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className="text-center space-y-4"
                      >
                        <div className="flex justify-center">
                          <img
                            src={getProfileImageUrl(winner.profile_image_url)}
                            alt={winner.candidate_name || 'Ganador'}
                            className="w-24 h-24 rounded-full object-cover border-2 border-gold/60 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                          />
                        </div>
                        <p className="text-3xl font-bold text-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]">
                          {winner.candidate_name}
                        </p>
                        <p className="text-sm text-gold-light">
                          {winner.votes} {winner.votes === 1 ? 'voto' : 'votos'}
                        </p>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {pendingWinners.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Próximos Anuncios</h2>
            <div className="grid gap-4">
              {pendingWinners.map((winner) => (
                <Card key={winner.category_id} className="border-2 border-gold/20 bg-black/40 backdrop-blur-sm opacity-60 h-full flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-white">{winner.category_name}</CardTitle>
                    <CardDescription className="text-white/70 line-clamp-2">{winner.category_description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center">
                    <p className="text-gold-light">Próximamente...</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {winners.length === 0 && (
          <Card className="border-2 border-gold/20 bg-black/40 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <p className="text-gold-light">
                Aún no hay ganadores anunciados
              </p>
            </CardContent>
          </Card>
        )}
        </motion.div>
      </div>
    </div>
  )
}

