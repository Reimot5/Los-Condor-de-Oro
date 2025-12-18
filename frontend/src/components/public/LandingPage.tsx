import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Trophy, Users, Calendar } from 'lucide-react'

type EventState = 'SETUP' | 'NOMINATIONS' | 'VOTING' | 'CLOSED'

interface LandingPageProps {
  state: EventState
}

export default function LandingPage({ state }: LandingPageProps) {
  const navigate = useNavigate()

  const getStateInfo = () => {
    switch (state) {
      case 'SETUP':
        return {
          title: 'Preparando el Evento',
          description: 'Los Cóndor de Oro se están preparando. Pronto podrás participar.',
          action: null,
        }
      case 'NOMINATIONS':
        return {
          title: 'Etapa de Nominaciones',
          description: 'Es hora de nominar a los mejores miembros del clan.',
          action: { label: 'Nominar', path: '/nominate' },
        }
      case 'VOTING':
        return {
          title: 'Etapa de Votación',
          description: 'Vota por tus candidatos favoritos en cada categoría.',
          action: { label: 'Votar', path: '/vote' },
        }
      case 'CLOSED':
        return {
          title: 'Evento Cerrado',
          description: 'Las votaciones han finalizado. Descubre a los ganadores.',
          action: { label: 'Ver Ganadores', path: '/winners' },
        }
      default:
        return {
          title: 'Los Cóndor de Oro',
          description: 'Premiación oficial del clan Legión Cóndor',
          action: null,
        }
    }
  }

  const info = getStateInfo()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Imagen de fondo con animación */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0"
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
        className="absolute inset-0 bg-gradient-radial from-gold/10 via-transparent to-transparent pointer-events-none z-[1]"
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
        className="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent pointer-events-none z-[1]"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-4xl w-full text-center space-y-8 relative z-10"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 md:gap-8 lg:gap-12 mb-8"
          >
            <Trophy className="h-20 w-20 md:h-24 md:w-24 text-gold drop-shadow-[0_0_25px_rgba(212,175,55,0.9)]" />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.8)] tracking-wider leading-tight">
              LOS CÓNDOR DE ORO
            </h1>
            <Trophy className="h-20 w-20 md:h-24 md:w-24 text-gold drop-shadow-[0_0_25px_rgba(212,175,55,0.9)]" />
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-2xl md:text-3xl text-gold-light font-semibold tracking-wide drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
          >
            Legión Cóndor
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-black/80 backdrop-blur-lg border-2 border-gold/50 rounded-xl p-8 md:p-10 space-y-6 shadow-[0_0_50px_rgba(212,175,55,0.4)]"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] tracking-wide">
            {info.title}
          </h2>
          <p className="text-base md:text-xl text-white/95 leading-relaxed font-light">
            {info.description}
          </p>

          {info.action && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 }}
            >
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gold hover:bg-gold-dark text-foreground"
                onClick={() => navigate(info.action!.path)}
              >
                {info.action.label}
              </Button>
            </motion.div>
          )}

          {state === 'CLOSED' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate('/winners')}
              >
                Ver Ganadores
              </Button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm md:text-base text-gold-light/90"
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" />
            <span className="font-medium">Clan Legión Cóndor</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gold/30" />
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gold" />
            <span className="font-medium">Premiación Oficial</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

