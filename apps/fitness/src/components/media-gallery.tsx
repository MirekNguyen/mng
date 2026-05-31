import { Play, CloseCircle, RoundAltArrowLeft, RoundAltArrowRight } from '@solar-icons/react'
import { useState, useCallback, useEffect } from 'react'

type MediaItem = {
  url: string
  type: 'image' | 'video'
}

type MediaGalleryProps = {
  items: MediaItem[]
}

export const MediaGallery = ({ items }: MediaGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (index: number): void => setLightboxIndex(index)
  const closeLightbox = (): void => setLightboxIndex(null)

  const goNext = useCallback((): void => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % items.length)
  }, [lightboxIndex, items.length])

  const goPrev = useCallback((): void => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + items.length) % items.length)
  }, [lightboxIndex, items.length])

  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, goNext, goPrev])

  if (items.length === 0) return null

  return (
    <>
      {/* Thumbnail strip */}
      <div className="py-4 flex gap-1.5 overflow-x-auto scrollbar-none">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="relative h-52 flex-shrink-0 rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
          >
            {item.type === 'video' ? (
              <>
                <video src={item.url} className="h-full w-auto object-cover" muted preload="metadata" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 text-[var(--color-ink)] ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </>
            ) : (
              <img src={item.url} alt="" className="h-full w-auto object-cover group-hover:scale-105 transition-transform duration-200" />
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={closeLightbox}>
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <CloseCircle className="w-5 h-5" />
          </button>

          {/* Nav arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <RoundAltArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <RoundAltArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Content */}
          <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {items[lightboxIndex].type === 'video' ? (
              <video
                src={items[lightboxIndex].url}
                className="max-w-full max-h-[85vh] rounded-lg"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={items[lightboxIndex].url}
                alt=""
                className="max-w-full max-h-[85vh] rounded-lg object-contain"
              />
            )}
          </div>

          {/* Counter */}
          {items.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {items.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
