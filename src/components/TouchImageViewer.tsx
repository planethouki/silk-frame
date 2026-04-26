import { useRef, useState, type PointerEvent } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

type Transform = {
  scale: number
  x: number
  y: number
}

type Point = {
  x: number
  y: number
}

const MIN_SCALE = 1
const MAX_SCALE = 4
const SWIPE_DISTANCE = 72

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function distance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function midpoint(first: Point, second: Point) {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  }
}

function clampTransform(
  nextTransform: Transform,
  container: HTMLDivElement | null,
) {
  if (!container || nextTransform.scale <= MIN_SCALE) {
    return { scale: MIN_SCALE, x: 0, y: 0 }
  }

  const maxX = (container.clientWidth * (nextTransform.scale - 1)) / 2
  const maxY = (container.clientHeight * (nextTransform.scale - 1)) / 2

  return {
    scale: nextTransform.scale,
    x: clamp(nextTransform.x, -maxX, maxX),
    y: clamp(nextTransform.y, -maxY, maxY),
  }
}

export function TouchImageViewer({
  alt,
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  onSwipeDown,
  src,
}: {
  alt: string
  canGoNext: boolean
  canGoPrevious: boolean
  onNext: () => void
  onPrevious: () => void
  onSwipeDown?: () => void
  src: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pointersRef = useRef(new Map<number, Point>())
  const transformRef = useRef<Transform>({ scale: MIN_SCALE, x: 0, y: 0 })
  const dragStartRef = useRef<Point | null>(null)
  const dragTransformRef = useRef<Transform>({ scale: MIN_SCALE, x: 0, y: 0 })
  const pinchStartRef = useRef<{
    distance: number
    midpoint: Point
    transform: Transform
  } | null>(null)
  const didPinchRef = useRef(false)
  const [transform, setTransform] = useState<Transform>({
    scale: MIN_SCALE,
    x: 0,
    y: 0,
  })

  const updateTransform = (nextTransform: Transform) => {
    const clampedTransform = clampTransform(nextTransform, containerRef.current)
    transformRef.current = clampedTransform
    setTransform(clampedTransform)
  }

  const resetTransform = () => {
    updateTransform({ scale: MIN_SCALE, x: 0, y: 0 })
  }

  const clearGesture = () => {
    pointersRef.current.clear()
    dragStartRef.current = null
    pinchStartRef.current = null
    didPinchRef.current = false
  }

  const startPinch = () => {
    const points = [...pointersRef.current.values()]
    if (points.length < 2) return

    pinchStartRef.current = {
      distance: distance(points[0], points[1]),
      midpoint: midpoint(points[0], points[1]),
      transform: transformRef.current,
    }
    didPinchRef.current = true
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    const point = { x: event.clientX, y: event.clientY }
    pointersRef.current.set(event.pointerId, point)

    if (pointersRef.current.size === 1) {
      dragStartRef.current = point
      dragTransformRef.current = transformRef.current
      didPinchRef.current = false
      return
    }

    startPinch()
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return

    const nextPoint = { x: event.clientX, y: event.clientY }
    pointersRef.current.set(event.pointerId, nextPoint)

    if (pointersRef.current.size >= 2 && pinchStartRef.current) {
      const points = [...pointersRef.current.values()]
      const nextDistance = distance(points[0], points[1])
      const nextMidpoint = midpoint(points[0], points[1])
      const pinchStart = pinchStartRef.current
      const nextScale = clamp(
        (pinchStart.transform.scale * nextDistance) / pinchStart.distance,
        MIN_SCALE,
        MAX_SCALE,
      )
      const scaleRatio = nextScale / pinchStart.transform.scale
      const containerRect = containerRef.current?.getBoundingClientRect()
      const center = containerRect
        ? {
            x: containerRect.left + containerRect.width / 2,
            y: containerRect.top + containerRect.height / 2,
          }
        : pinchStart.midpoint

      updateTransform({
        scale: nextScale,
        x:
          nextMidpoint.x -
          center.x -
          scaleRatio * (pinchStart.midpoint.x - center.x - pinchStart.transform.x),
        y:
          nextMidpoint.y -
          center.y -
          scaleRatio * (pinchStart.midpoint.y - center.y - pinchStart.transform.y),
      })
      return
    }

    if (transformRef.current.scale <= MIN_SCALE || !dragStartRef.current) return

    updateTransform({
      scale: transformRef.current.scale,
      x: dragTransformRef.current.x + nextPoint.x - dragStartRef.current.x,
      y: dragTransformRef.current.y + nextPoint.y - dragStartRef.current.y,
    })
  }

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const startPoint = dragStartRef.current
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    pointersRef.current.delete(event.pointerId)

    if (pointersRef.current.size >= 2) {
      startPinch()
      return
    }

    pinchStartRef.current = null

    if (pointersRef.current.size === 1) {
      const remainingPoint = [...pointersRef.current.values()][0]
      dragStartRef.current = remainingPoint
      dragTransformRef.current = transformRef.current
      return
    }

    dragStartRef.current = null

    if (
      didPinchRef.current ||
      transformRef.current.scale > MIN_SCALE ||
      !startPoint
    ) {
      didPinchRef.current = false
      return
    }

    const deltaX = event.clientX - startPoint.x
    const deltaY = event.clientY - startPoint.y
    if (
      event.pointerType === 'touch' &&
      onSwipeDown &&
      deltaY > SWIPE_DISTANCE &&
      Math.abs(deltaY) > Math.abs(deltaX)
    ) {
      event.preventDefault()
      event.stopPropagation()
      clearGesture()
      onSwipeDown()
      return
    }

    if (Math.abs(deltaX) < SWIPE_DISTANCE || Math.abs(deltaX) < Math.abs(deltaY)) {
      return
    }

    if (deltaX < 0 && canGoNext) {
      onNext()
    } else if (deltaX > 0 && canGoPrevious) {
      onPrevious()
    }
  }

  const handleDoubleClick = () => {
    if (transform.scale > MIN_SCALE) {
      resetTransform()
      return
    }

    updateTransform({ scale: 2, x: 0, y: 0 })
  }

  return (
    <div
      aria-label="Image viewer"
      className="touch-viewer"
      onDoubleClick={handleDoubleClick}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      ref={containerRef}
      role="group"
    >
      <img
        alt={alt}
        className="detail-image"
        draggable={false}
        src={src}
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        }}
      />
      <div className="viewer-actions">
        <button
          aria-label="Previous image"
          className="viewer-nav-button"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <ChevronLeftIcon />
        </button>
        <button
          aria-label="Next image"
          className="viewer-nav-button"
          disabled={!canGoNext}
          onClick={onNext}
          onPointerDown={(event) => event.stopPropagation()}
          type="button"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}
