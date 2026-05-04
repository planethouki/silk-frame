import Lightbox from 'yet-another-react-lightbox'
import Inline from 'yet-another-react-lightbox/plugins/inline'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

export type TouchImageViewerSlide = {
  alt: string
  height: number
  src: string
  width: number
}

export function TouchImageViewer({
  currentIndex,
  onIndexChange,
  slides,
}: {
  currentIndex: number
  onIndexChange: (index: number) => void
  slides: TouchImageViewerSlide[]
}) {
  return (
    <div aria-label="Image viewer" className="touch-viewer" role="group">
      <Lightbox
        animation={{ zoom: 300 }}
        carousel={{
          finite: true,
          imageFit: 'contain',
          padding: 0,
          spacing: '16%',
        }}
        className="inline-lightbox"
        controller={{ closeOnPullDown: false }}
        index={currentIndex}
        inline={{
          className: 'inline-lightbox-root',
          style: { width: '100%', height: '100%' },
        }}
        on={{
          view: ({ index }) => {
            if (index !== currentIndex) {
              onIndexChange(index)
            }
          },
        }}
        plugins={[Inline, Zoom]}
        slides={slides}
        toolbar={{ buttons: [] }}
        zoom={{
          maxZoomPixelRatio: 2,
          scrollToZoom: true,
        }}
      />
    </div>
  )
}
