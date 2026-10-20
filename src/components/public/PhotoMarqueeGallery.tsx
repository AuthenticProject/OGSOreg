import React, { useState, useEffect, useCallback } from 'react'
import {
  Camera,
  Play,
  Pause,
  Grid,
  Sparkles,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  SlidersHorizontal,
} from 'lucide-react'
import { GALLERY_PHOTOS, type GalleryPhoto } from '../../constants/galleryPhotos'
import { cn } from '../../lib/utils'

interface PhotoMarqueeGalleryProps {
  className?: string
  showSectionHeader?: boolean
  variant?: 'dark' | 'light'
}

export const PhotoMarqueeGallery: React.FC<PhotoMarqueeGalleryProps> = ({
  className,
  showSectionHeader = true,
  variant = 'light',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [isFast, setIsFast] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'running' | 'grid'>('running')
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Split photos into two balanced rows for the dual marquee
  const row1Photos = GALLERY_PHOTOS.slice(0, 12)
  const row2Photos = GALLERY_PHOTOS.slice(12)

  // Filtered photos for Grid mode
  const filteredGridPhotos = GALLERY_PHOTOS.filter((photo) => {
    if (activeCategory === 'all') return true
    return photo.category === activeCategory
  })

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedPhoto) return

      if (e.key === 'Escape') {
        setSelectedPhoto(null)
      } else if (e.key === 'ArrowRight') {
        const currentIndex = GALLERY_PHOTOS.findIndex((p) => p.id === selectedPhoto.id)
        const nextIndex = (currentIndex + 1) % GALLERY_PHOTOS.length
        setSelectedPhoto(GALLERY_PHOTOS[nextIndex])
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = GALLERY_PHOTOS.findIndex((p) => p.id === selectedPhoto.id)
        const prevIndex = (currentIndex - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length
        setSelectedPhoto(GALLERY_PHOTOS[prevIndex])
      }
    },
    [selectedPhoto]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return
    const currentIndex = GALLERY_PHOTOS.findIndex((p) => p.id === selectedPhoto.id)
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % GALLERY_PHOTOS.length
      setSelectedPhoto(GALLERY_PHOTOS[nextIndex])
    } else {
      const prevIndex = (currentIndex - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length
      setSelectedPhoto(GALLERY_PHOTOS[prevIndex])
    }
  }

  const isDark = variant === 'dark'

  return (
    <section
      id="galeri-dokumentasi"
      className={cn(
        'relative py-16 sm:py-24 overflow-hidden select-none transition-colors duration-300',
        isDark
          ? 'bg-gradient-to-b from-[#0A1E17] via-[#0C241B] to-[#0A1E17] text-white'
          : 'bg-[#F5F8F4] text-[#0C241B] border-b border-emerald-950/10',
        className
      )}
    >
      {/* Background Decorative Mesh & Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-700/10 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        {showSectionHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/10 text-emerald-800 border border-emerald-700/20 text-xs font-bold tracking-wider uppercase">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dokumentasi & Kilas Balik Kegiatan</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Galeri Visual{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-[#166534]">
                  Olimpiade Sains Gontor
                </span>
              </h2>
              <p className={cn('text-sm sm:text-base leading-relaxed', isDark ? 'text-emerald-200/80' : 'text-gray-600')}>
                Menyaksikan langsung antusiasme, kecerdasan santri, ketegangan kompetisi, serta kemegahan malam
                penganugerahan jawara sains se-Indonesia.
              </p>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Mode Toggle: Running vs Grid */}
              <div className="inline-flex p-1 rounded-xl bg-emerald-950/10 border border-emerald-900/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('running')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    activeTab === 'running'
                      ? 'bg-[#166534] text-white shadow-sm'
                      : isDark
                      ? 'text-emerald-300 hover:text-white'
                      : 'text-emerald-900 hover:bg-emerald-100/50'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Running Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('grid')}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    activeTab === 'grid'
                      ? 'bg-[#166534] text-white shadow-sm'
                      : isDark
                      ? 'text-emerald-300 hover:text-white'
                      : 'text-emerald-900 hover:bg-emerald-100/50'
                  )}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Semua Foto ({GALLERY_PHOTOS.length})</span>
                </button>
              </div>

              {/* Running Mode Speed & Play/Pause Controls */}
              {activeTab === 'running' && (
                <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-emerald-950/10 border border-emerald-900/10">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? 'Jeda Gulir' : 'Lanjutkan Gulir'}
                    className={cn(
                      'p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                      isPlaying
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-emerald-200 text-emerald-900'
                    )}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFast(!isFast)}
                    title={isFast ? 'Kecepatan Normal' : 'Kecepatan Cepat'}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                      isFast
                        ? 'bg-amber-600 text-white shadow-sm'
                        : isDark
                        ? 'text-emerald-300 hover:text-white'
                        : 'text-emerald-900 hover:bg-emerald-100/50'
                    )}
                  >
                    {isFast ? '2x Cepat' : '1x Normal'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Filters for Grid Mode */}
        {activeTab === 'grid' && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 mr-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
            </span>
            {[
              { id: 'all', label: 'Semua Momen' },
              { id: 'kompetisi', label: 'Kompetisi & Ujian' },
              { id: 'upacara', label: 'Pembukaan & Penutupan' },
              { id: 'laboratorium', label: 'Praktikum & Lab' },
              { id: 'prestasi', label: 'Penganugerahan Juara' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                  activeCategory === cat.id
                    ? 'bg-[#166534] text-white shadow-sm'
                    : 'bg-white/80 hover:bg-emerald-50 text-emerald-900 border border-emerald-900/10'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. RUNNING TEXT (MARQUEE) MODE                                           */}
      {/* ========================================================================= */}
      {activeTab === 'running' && (
        <div className="relative w-full overflow-hidden space-y-5 py-2 group marquee-pause">
          {/* Subtle Left & Right Edge Gradient Masks for Cinematic Fade */}
          <div
            className={cn(
              'absolute top-0 bottom-0 left-0 w-16 sm:w-32 z-20 pointer-events-none bg-gradient-to-r',
              isDark ? 'from-[#0A1E17] to-transparent' : 'from-[#F5F8F4] to-transparent'
            )}
          />
          <div
            className={cn(
              'absolute top-0 bottom-0 right-0 w-16 sm:w-32 z-20 pointer-events-none bg-gradient-to-l',
              isDark ? 'from-[#0A1E17] to-transparent' : 'from-[#F5F8F4] to-transparent'
            )}
          />

          {/* ROW 1: Scrolling Left */}
          <div className="flex overflow-hidden">
            <div
              className={cn(
                'flex items-center gap-4 sm:gap-6 shrink-0',
                isFast ? 'animate-marquee-left-fast' : 'animate-marquee-left'
              )}
              style={{
                animationPlayState: isPlaying ? undefined : 'paused',
              }}
            >
              {[...row1Photos, ...row1Photos].map((photo, index) => (
                <PhotoCard
                  key={`r1-${photo.id}-${index}`}
                  photo={photo}
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          </div>

          {/* ROW 2: Scrolling Right (Opposite Direction) */}
          <div className="flex overflow-hidden">
            <div
              className={cn(
                'flex items-center gap-4 sm:gap-6 shrink-0',
                isFast ? 'animate-marquee-right-fast' : 'animate-marquee-right'
              )}
              style={{
                animationPlayState: isPlaying ? undefined : 'paused',
              }}
            >
              {[...row2Photos, ...row2Photos].map((photo, index) => (
                <PhotoCard
                  key={`r2-${photo.id}-${index}`}
                  photo={photo}
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          </div>

          {/* Hover hint */}
          <div className="text-center pt-2">
            <p className={cn('text-xs italic tracking-wide', isDark ? 'text-emerald-300/60' : 'text-gray-500')}>
              Arahkan kursor atau sentuh untuk menjeda • Klik foto untuk memperbesar
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GRID MODE                                                             */}
      {/* ========================================================================= */}
      {activeTab === 'grid' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredGridPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-4/3 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl bg-emerald-950/5 border border-emerald-950/10 cursor-pointer transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {photo.categoryLabel}
                  </span>
                  <h4 className="text-xs font-bold leading-snug line-clamp-1">{photo.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIGHTBOX MODAL                                                        */}
      {/* ========================================================================= */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigatePhoto('prev')
            }}
            className="absolute left-3 sm:left-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Foto Sebelumnya"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigatePhoto('next')
            }}
            className="absolute right-3 sm:right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
            aria-label="Foto Selanjutnya"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Card Modal */}
          <div
            className="relative max-w-4xl max-h-[92vh] w-full bg-[#0C241B] border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Preview Container */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] max-h-[65vh]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[65vh] w-auto max-w-full object-contain mx-auto"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-xs font-semibold text-[#A7F3D0] backdrop-blur-sm">
                Foto {selectedPhoto.id} dari {GALLERY_PHOTOS.length}
              </div>
            </div>

            {/* Photo Info Footer */}
            <div className="p-4 sm:p-6 bg-gradient-to-b from-[#0C241B] to-[#081812] text-white space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/50 text-[#A7F3D0] border border-emerald-500/30 text-xs font-medium">
                  <Tag className="w-3 h-3" />
                  <span>{selectedPhoto.categoryLabel}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300/80">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedPhoto.location}</span>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{selectedPhoto.title}</h3>
              <p className="text-sm text-emerald-100/80 leading-relaxed">{selectedPhoto.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// Sub-component: Individual Marquee Photo Card
interface PhotoCardProps {
  photo: GalleryPhoto
  onClick: () => void
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] border border-emerald-950/10 bg-white"
      style={{
        width: photo.width > photo.height ? '280px' : '200px',
        height: '190px',
      }}
    >
      <img
        src={photo.url}
        alt={photo.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 text-white">
        <div className="flex justify-between items-start">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[10px] font-semibold text-[#A7F3D0]">
            {photo.categoryLabel}
          </span>
          <div className="p-1.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-white leading-tight line-clamp-1">{photo.title}</h4>
          <p className="text-[10px] text-emerald-200/80 line-clamp-1 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {photo.location}
          </p>
        </div>
      </div>
    </div>
  )
}
