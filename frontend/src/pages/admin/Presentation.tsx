import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiRequest, getAuthHeaders, getProfileImageUrl } from '@/lib/api'

interface Nominee {
  candidate_id: string
  candidate_name: string
  profile_image_url: string | null
}

interface Winner {
  candidate_id: string | null
  candidate_name: string | null
  profile_image_url: string | null
}

interface CategoryData {
  category_id: string
  category_name: string
  category_description: string
  nominees: Nominee[]
  winner: Winner
}

type SlideType = 'video' | 'category-announcement' | 'nominees' | 'winner'

interface Slide {
  type: SlideType
  categoryData?: CategoryData
  index: number
}

// Ruta del video de presentación local
const PRESENTATION_VIDEO_URL = '/Premiacion.mp4'

export default function Presentation() {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [visibleNominees, setVisibleNominees] = useState<Record<string, number>>({})
  const [backgroundMusic, setBackgroundMusic] = useState<HTMLAudioElement | null>(null)

  const username = localStorage.getItem('admin_username') || ''
  const password = localStorage.getItem('admin_password') || ''

  useEffect(() => {
    fetchPresentationData()
  }, [])

  useEffect(() => {
    if (categories.length > 0) {
      generateSlides()
    }
  }, [categories])

  useEffect(() => {
    // Inicializar visibilidad de nominados cuando cambia la slide
    if (slides[currentSlide]?.type === 'nominees') {
      const categoryId = slides[currentSlide].categoryData?.category_id
      if (categoryId) {
        setVisibleNominees({ [categoryId]: 0 })
        // Animar nominados secuencialmente
        const nominees = slides[currentSlide].categoryData?.nominees || []
        nominees.forEach((_, index) => {
          setTimeout(() => {
            setVisibleNominees((prev) => ({
              ...prev,
              [categoryId]: index + 1,
            }))
          }, (index + 1) * 1000) // 1 segundo entre cada nominado
        })
      }
    }
  }, [currentSlide, slides])

  useEffect(() => {
    // Reproducir sonido cuando se muestra un ganador
    if (slides[currentSlide]?.type === 'winner') {
      playCelebrationSound()
    }
  }, [currentSlide, slides])

  // Iniciar música de fondo después de la slide del video
  useEffect(() => {
    // Solo iniciar música si ya pasamos la slide del video (currentSlide > 0) y no se ha iniciado
    if (currentSlide > 0 && !backgroundMusic) {
      const audio = new Audio('/Medal-of-Honor.mp3')
      audio.loop = true
      audio.volume = 0.1 // Volumen moderado para música de fondo
      audio.play().catch((error) => {
        console.warn('No se pudo reproducir la música de fondo:', error)
      })
      setBackgroundMusic(audio)
    }
  }, [currentSlide, backgroundMusic])

  // Limpiar música cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause()
        backgroundMusic.currentTime = 0
      }
    }
  }, [backgroundMusic])

  const fetchPresentationData = async () => {
    try {
      const data = await apiRequest<CategoryData[]>('/admin/presentation-data', {
        headers: getAuthHeaders(username, password),
      })
      setCategories(data)
    } catch (error) {
      console.error('Error fetching presentation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlides = () => {
    const newSlides: Slide[] = []
    let slideIndex = 0

    // Slide de video
    newSlides.push({
      type: 'video',
      index: slideIndex++,
    })

    // Para cada categoría: slide de anuncio + slide de nominados + slide de ganador
    categories.forEach((category) => {
      newSlides.push({
        type: 'category-announcement',
        categoryData: category,
        index: slideIndex++,
      })
      newSlides.push({
        type: 'nominees',
        categoryData: category,
        index: slideIndex++,
      })
      newSlides.push({
        type: 'winner',
        categoryData: category,
        index: slideIndex++,
      })
    })

    setSlides(newSlides)
  }

  const playCelebrationSound = () => {
    // Crear un audio element para el sonido de celebración
    // Usar un sonido de celebración desde una URL externa o un archivo local
    // Si tienes un archivo local, colócalo en public/ y usa: '/celebration-sound.mp3'
    const audio = new Audio('/Battlecry.mp3') // Reemplazar con URL real o ruta local
    const initialVolume = 0.5
    audio.volume = initialVolume
    audio.play().catch((error) => {
      // Silenciar errores si el navegador bloquea la reproducción automática
      console.warn('No se pudo reproducir el sonido de celebración:', error)
    })
    
    // Fade out en los últimos 2 segundos (de 5 a 7 segundos)
    const fadeOutStart = 5000 // Empezar fade out a los 5 segundos
    const fadeOutDuration = 2000 // Duración del fade out: 2 segundos
    const totalDuration = 7000 // Duración total: 7 segundos
    const startTime = Date.now()
    
    const fadeOutInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      
      if (elapsed >= fadeOutStart && elapsed < totalDuration) {
        // Calcular el volumen basado en el progreso del fade out
        const fadeProgress = (elapsed - fadeOutStart) / fadeOutDuration
        audio.volume = initialVolume * (1 - fadeProgress)
      }
    }, 50) // Actualizar cada 50ms para un fade out suave
    
    // Detener el audio después de 7 segundos
    setTimeout(() => {
      clearInterval(fadeOutInterval)
      audio.pause()
      audio.currentTime = 0
      audio.volume = initialVolume // Restaurar volumen para la próxima vez
    }, totalDuration)
  }

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        setCurrentSlide((prev) => prev + 1)
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1)
      }
    },
    [currentSlide, slides.length]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gold text-xl">Cargando presentación...</p>
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gold text-xl">No hay datos de presentación disponibles</p>
      </div>
    )
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Video de fondo de confeti - constante entre slides */}
      {currentSlideData.type !== 'video' && (
        <video
          src="/confeti.mp4"
          className="fixed inset-0 w-full h-full object-cover opacity-50 pointer-events-none z-0"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={(e) => {
            const video = e.currentTarget
            video.play().catch(() => {
              // Ignorar errores de autoplay
            })
          }}
        />
      )}
      {/* Video de fondo de foco de luz - constante entre slides */}
      {currentSlideData.type !== 'video' && (
        <video
          src="/foco-de-luz.mp4"
          className="fixed inset-0 w-full h-full object-cover opacity-50 pointer-events-none z-0"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={(e) => {
            const video = e.currentTarget
            video.play().catch(() => {
              // Ignorar errores de autoplay
            })
          }}
        />
      )}
      {/* Indicador de progreso */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-gold w-8' : 'bg-gold/30'
            }`}
          />
        ))}
      </div>

      {/* Controles de navegación */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentSlide === 0}
          className="p-2 bg-gold/20 hover:bg-gold/40 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-gold" />
        </button>
        <div className="px-4 py-2 bg-black/60 rounded-full">
          <span className="text-gold text-sm">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
        <button
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          className="p-2 bg-gold/20 hover:bg-gold/40 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-6 w-6 text-gold" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {currentSlideData.type === 'video' && (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex items-center justify-center bg-black"
          >
            <div className="w-full h-full relative">
              <video
                src={PRESENTATION_VIDEO_URL}
                className="w-full h-full object-cover"
                autoPlay
                muted
                controls
                playsInline
                onPlay={() => {
                  // Desmutear cuando el usuario interactúa con el video
                  const videoElement = document.querySelector('video') as HTMLVideoElement
                  if (videoElement) {
                    videoElement.muted = false
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        {currentSlideData.type === 'category-announcement' && currentSlideData.categoryData && (
          <motion.div
            key={`category-announcement-${currentSlideData.categoryData.category_id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex items-center justify-center relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center px-8 relative z-10"
            >
              <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-6xl md:text-8xl font-bold text-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.9)] mb-6"
              >
                {currentSlideData.categoryData.category_name}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-4xl text-gold-light"
              >
                {currentSlideData.categoryData.category_description}
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {currentSlideData.type === 'nominees' && currentSlideData.categoryData && (
          <motion.div
            key={`nominees-${currentSlideData.categoryData.category_id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-12 relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12 relative z-10"
            >
              <h2 className="text-5xl md:text-7xl font-bold text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.8)] mb-4">
                {currentSlideData.categoryData.category_name}
              </h2>
              <p className="text-2xl md:text-3xl text-gold-light">
                {currentSlideData.categoryData.category_description}
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center items-center gap-8 max-w-7xl w-full">
              {currentSlideData.categoryData.nominees.map((nominee, index) => {
                const categoryId = currentSlideData.categoryData!.category_id
                const isVisible = (visibleNominees[categoryId] || 0) > index

                return (
                  <motion.div
                    key={nominee.candidate_id}
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={
                      isVisible
                        ? { opacity: 1, scale: 1, y: 0 }
                        : { opacity: 0, scale: 0.5, y: 50 }
                    }
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative">
                      <img
                        src={getProfileImageUrl(nominee.profile_image_url)}
                        alt={nominee.candidate_name}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gold/60 shadow-[0_0_30px_rgba(212,175,55,0.6)]"
                      />
                    </div>
                    <p className="mt-4 text-xl md:text-2xl font-semibold text-gold text-center">
                      {nominee.candidate_name}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {currentSlideData.type === 'winner' && currentSlideData.categoryData && (
          <motion.div
            key={`winner-${currentSlideData.categoryData.category_id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-12 relative overflow-hidden z-10"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center relative z-10"
            >
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mb-8"
              >
                <Trophy className="h-24 w-24 md:h-32 md:w-32 text-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.9)] mx-auto" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl font-bold text-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.8)] mb-4"
              >
                {currentSlideData.categoryData.category_name}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl md:text-3xl text-gold-light mb-12"
              >
                {currentSlideData.categoryData.category_description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-8 w-48 h-48 md:w-64 md:h-64">
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-gold shadow-[0_0_40px_rgba(212,175,55,0.8)] overflow-hidden"
                    style={{
                      backgroundImage: `url(${getProfileImageUrl(currentSlideData.categoryData.winner.profile_image_url)})`,
                      backgroundSize: '150%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                </div>

                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="text-5xl md:text-7xl font-bold text-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.9)]"
                >
                  {currentSlideData.categoryData.winner.candidate_name}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="text-3xl md:text-4xl text-gold-light mt-4"
                >
                  🏆 GANADOR 🏆
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

