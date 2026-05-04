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
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--ink)] hover:bg-[var(--soft)] focus-visible:bg-[var(--soft)] focus-visible:outline-none disabled:cursor-wait disabled:opacity-[0.62] [&_svg]:h-[17px] [&_svg]:w-[17px]"
            onClick={() => setIsEditingThumbSettings((current) => !current)}
            type="button"
          >
            {isEditingThumbSettings ? <XMarkIcon /> : <PencilSquareIcon />}
          </button>
        }
      />
      <ContentNotice />
      {isEditingThumbSettings ? (
        <section
          className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5"
          aria-label="Thumbnail settings"
        >
          <fieldset className="grid min-w-0 gap-[7px] border-0 p-0 m-0">
            <legend className="p-0 text-[13px] text-[var(--muted)]">Fit</legend>
            <div className="flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--paper)]">
              <button
                aria-pressed={thumbSettings.fit === 'cover'}
                className="min-h-[34px] border-0 bg-transparent px-3 font-[inherit] text-[var(--muted)] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--surface)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, fit: 'cover' })
                }
                type="button"
              >
                Cover
              </button>
              <button
                aria-pressed={thumbSettings.fit === 'contain'}
                className="min-h-[34px] border-0 border-l border-[var(--border)] bg-transparent px-3 font-[inherit] text-[var(--muted)] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--surface)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, fit: 'contain' })
                }
                type="button"
              >
                Contain
              </button>
            </div>
          </fieldset>
          <fieldset className="grid min-w-0 gap-[7px] border-0 p-0 m-0">
            <legend className="p-0 text-[13px] text-[var(--muted)]">Frame</legend>
            <div className="flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--paper)]">
              <button
                aria-pressed={thumbSettings.frame === 'square'}
                className="min-h-[34px] border-0 bg-transparent px-3 font-[inherit] text-[var(--muted)] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--surface)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, frame: 'square' })
                }
                type="button"
              >
                Square
              </button>
              <button
                aria-pressed={thumbSettings.frame === 'portrait'}
                className="min-h-[34px] border-0 border-l border-[var(--border)] bg-transparent px-3 font-[inherit] text-[var(--muted)] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--surface)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, frame: 'portrait' })
                }
                type="button"
              >
                3:4
              </button>
            </div>
          </fieldset>
          <fieldset className="grid min-w-0 gap-[7px] border-0 p-0 m-0">
            <legend className="p-0 text-[13px] text-[var(--muted)]">Crop Y</legend>
            <div className="flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--paper)]">
              <button
                aria-pressed={thumbSettings.verticalAlign === 'top'}
                className="min-h-[34px] border-0 bg-transparent px-3 font-[inherit] text-[var(--muted)] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--surface)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
                onClick={() =>
                  updateThumbSettings({ ...thumbSettings, verticalAlign: 'top' })
                }
                type="button"
              >
                Top
              </button>
              <button
                aria-pressed={thumbSettings.verticalAlign === 'center'}
                className="min-h-[34px] border-0 border-l border-[var(--border)] bg-transparent px-3 font-[inherit] text-[var(--muted)] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--surface)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
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
                className="min-h-[34px] border-0 border-l border-[var(--border)] bg-transparent px-3 font-[inherit] text-[var(--muted)] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--surface)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
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
