import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { ContentNotice } from '../components/ContentNotice'
import { GalleryGrid } from '../components/GalleryGrid'
import { PageHeading } from '../components/PageHeading'
import type { GalleryImage, GalleryThumbSettings, LoadState } from '../types'

const thumbSettingsKey = 'silk-frame.galleryThumbSettings'

const defaultThumbSettings: GalleryThumbSettings = {
  fit: 'cover',
  frame: 'square',
  verticalAlign: 'center',
}

function loadThumbSettings(): GalleryThumbSettings {
  try {
    const stored = window.localStorage.getItem(thumbSettingsKey)
    if (!stored) return defaultThumbSettings

    const parsed = JSON.parse(stored) as Partial<GalleryThumbSettings>
    return {
      fit: parsed.fit === 'contain' ? 'contain' : 'cover',
      frame: parsed.frame === 'portrait' ? 'portrait' : 'square',
      verticalAlign:
        parsed.verticalAlign === 'top' || parsed.verticalAlign === 'bottom'
          ? parsed.verticalAlign
          : 'center',
    }
  } catch {
    return defaultThumbSettings
  }
}

export function GalleryPage({
  images,
  loadState,
  title = 'Latest',
}: {
  images: GalleryImage[]
  loadState: LoadState
  title?: string
}) {
  const [thumbSettings, setThumbSettings] = useState(loadThumbSettings)
  const [isEditingThumbSettings, setIsEditingThumbSettings] = useState(false)

  const updateThumbSettings = (nextSettings: GalleryThumbSettings) => {
    setThumbSettings(nextSettings)
    window.localStorage.setItem(thumbSettingsKey, JSON.stringify(nextSettings))
  }

  return (
    <main>
      <PageHeading
        eyebrow="Personal image gallery"
        title={title}
        loadState={loadState}
        imageCount={images.length}
        actions={
          <button
            aria-expanded={isEditingThumbSettings}
            aria-label={
              isEditingThumbSettings
                ? 'Close thumbnail settings'
                : 'Edit thumbnail settings'
            }
            className="icon-action"
            onClick={() => setIsEditingThumbSettings((current) => !current)}
            type="button"
          >
            {isEditingThumbSettings ? <XMarkIcon /> : <PencilSquareIcon />}
          </button>
        }
      />
      <ContentNotice />
      {isEditingThumbSettings ? (
        <section className="thumb-settings-panel" aria-label="Thumbnail settings">
          <fieldset>
            <legend>Fit</legend>
            <div className="segmented-control">
              <button
                aria-pressed={thumbSettings.fit === 'cover'}
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, fit: 'cover' })
                }
                type="button"
              >
                Cover
              </button>
              <button
                aria-pressed={thumbSettings.fit === 'contain'}
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, fit: 'contain' })
                }
                type="button"
              >
                Contain
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend>Frame</legend>
            <div className="segmented-control">
              <button
                aria-pressed={thumbSettings.frame === 'square'}
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, frame: 'square' })
                }
                type="button"
              >
                Square
              </button>
              <button
                aria-pressed={thumbSettings.frame === 'portrait'}
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, frame: 'portrait' })
                }
                type="button"
              >
                3:4
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend>Crop Y</legend>
            <div className="segmented-control">
              <button
                aria-pressed={thumbSettings.verticalAlign === 'top'}
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, verticalAlign: 'top' })
                }
                type="button"
              >
                Top
              </button>
              <button
                aria-pressed={thumbSettings.verticalAlign === 'center'}
                onClick={() =>
                  updateThumbSettings({
                    ...thumbSettings,
                    verticalAlign: 'center',
                  })
                }
                type="button"
              >
                Center
              </button>
              <button
                aria-pressed={thumbSettings.verticalAlign === 'bottom'}
                onClick={() =>
                  updateThumbSettings({
                    ...thumbSettings,
                    verticalAlign: 'bottom',
                  })
                }
                type="button"
              >
                Bottom
              </button>
            </div>
          </fieldset>
        </section>
      ) : null}
      <GalleryGrid images={images} thumbSettings={thumbSettings} />
    </main>
  )
}
