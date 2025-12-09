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
      {/* Efecto de spotlight dorado */}
      <div className="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center space-y-8 relative z-10"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Trophy className="h-16 w-16 text-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
            <h1 className="text-6xl md:text-7xl font-bold text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.6)] tracking-wide">
              LOS CÓNDOR DE ORO
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-gold-light font-medium"
          >
            Legión Cóndor
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-black/60 backdrop-blur-md border-2 border-gold/40 rounded-lg p-8 space-y-6 shadow-[0_0_40px_rgba(212,175,55,0.3)]"
        >
          <h2 className="text-3xl font-bold text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">{info.title}</h2>
          <p className="text-lg text-white/90 leading-relaxed">{info.description}</p>

          {info.action && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
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
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-8 text-sm text-gold-light"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Clan Legión Cóndor</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Premiación Oficial</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

