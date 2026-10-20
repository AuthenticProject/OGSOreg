import React, { useState } from 'react'
import {
  Camera,
  Play,
  Pause,
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

  // Split photos into two balanced rows for the dual marquee
  const row1Photos = GALLERY_PHOTOS.slice(0, 12)
  const row2Photos = GALLERY_PHOTOS.slice(12)

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

            {/* Play/Pause & Speed Controls */}
            <div className="flex items-center flex-wrap gap-2.5">
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
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RUNNING TEXT (MARQUEE) MODE                                              */}
      {/* ========================================================================= */}
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
              />
            ))}
          </div>
        </div>

        {/* Hover hint */}
        <div className="text-center pt-2">
          <p className={cn('text-xs italic tracking-wide', isDark ? 'text-emerald-300/60' : 'text-gray-500')}>
            Arahkan kursor atau sentuh untuk menjeda
          </p>
        </div>
      </div>

    </section>
  )
}

// Sub-component: Individual Marquee Photo Card
interface PhotoCardProps {
  photo: GalleryPhoto
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo }) => {
  return (
    <div
      className="group relative shrink-0 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] border border-emerald-950/10 bg-white"
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

      {/* Subtle shimmer overlay on hover — no text */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}
