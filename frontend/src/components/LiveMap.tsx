import { memo, useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MarkerType =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'delivery'
  | 'driver'
  | 'customer'
  | 'default'

export interface MapMarker {
  id: string
  position: [number, number]
  type?: MarkerType
  label?: string
  popup?: React.ReactNode
}

export interface LiveMapProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  height?: string | number
  className?: string
  scrollWheelZoom?: boolean
  fitBounds?: boolean
  driverPosition?: [number, number]
  driverLabel?: string
}

const DEFAULT_CENTER: [number, number] = [-1.2921, 36.8219]

const STATUS_COLORS: Record<MarkerType, string> = {
  pending: '#eab308',
  assigned: '#3b82f6',
  in_transit: '#a855f7',
  delivered: '#22c55e',
  failed: '#ef4444',
  delivery: '#ef4444',
  driver: '#f97316',
  customer: '#ef4444',
  default: '#6b7280',
}

const STATUS_ICONS: Record<MarkerType, string> = {
  pending: '⏳',
  assigned: '👤',
  in_transit: '🚚',
  delivered: '✓',
  failed: '!',
  delivery: '📍',
  driver: '🚐',
  customer: '🏠',
  default: '📍',
}

function createMarkerIcon(type: MarkerType = 'default'): L.DivIcon {
  const color = STATUS_COLORS[type] ?? STATUS_COLORS.default
  const symbol = STATUS_ICONS[type] ?? STATUS_ICONS.default
  return L.divIcon({
    className: 'live-map-marker',
    html: `
      <div style="
        background:${color};
        width:32px;height:32px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1;color:#fff;font-weight:bold;">${symbol}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  })
}

function createDriverIcon(): L.DivIcon {
  return L.divIcon({
    className: 'live-map-driver',
    html: `
      <div style="
        background:#f97316;
        width:28px;height:28px;
        border-radius:50%;
        border:2px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        animation:live-map-pulse 2s infinite;
      ">
        <span style="font-size:13px;">🚐</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

const driverIcon = createDriverIcon()

const iconCache = new Map<MarkerType, L.DivIcon>()
function getCachedIcon(type: MarkerType): L.DivIcon {
  if (!iconCache.has(type)) {
    iconCache.set(type, createMarkerIcon(type))
  }
  return iconCache.get(type)!
}

interface BoundsFitterProps {
  markers: MapMarker[]
  driverPosition?: [number, number]
  fitBounds: boolean
}

function BoundsFitter({ markers, driverPosition, fitBounds }: BoundsFitterProps) {
  const map = useMap()

  useEffect(() => {
    if (!fitBounds) return

    const positions: [number, number][] = markers.map((m) => m.position)
    if (driverPosition) positions.push(driverPosition)

    if (positions.length === 0) return

    if (positions.length === 1) {
      map.setView(positions[0], 15)
      return
    }

    const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [markers, driverPosition, fitBounds, map])

  return null
}

interface SizeInvalidatorProps {
  containerRef: React.RefObject<HTMLDivElement>
}

function SizeInvalidator({ containerRef }: SizeInvalidatorProps) {
  const map = useMap()

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    const timeoutId = setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(timeoutId)
    }
  }, [map, containerRef])

  return null
}

interface ViewUpdaterProps {
  center: [number, number]
  zoom: number
  active: boolean
}

function ViewUpdater({ center, zoom, active }: ViewUpdaterProps) {
  const map = useMap()

  useEffect(() => {
    if (!active) return
    map.setView(center, zoom)
  }, [center, zoom, active, map])

  return null
}

const LiveMap = memo(function LiveMap({
  center = DEFAULT_CENTER,
  zoom = 13,
  markers = [],
  height = 400,
  className = '',
  scrollWheelZoom = true,
  fitBounds = false,
  driverPosition,
  driverLabel,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const memoizedMarkers = useMemo(() => markers, [markers])

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <style>{`
        .live-map-marker { background: transparent; border: none; }
        .live-map-driver { background: transparent; border: none; }
        @keyframes live-map-pulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(249,115,22,0.4), 0 0 0 0 rgba(249,115,22,0.5); }
          50% { box-shadow: 0 2px 8px rgba(249,115,22,0.4), 0 0 0 12px rgba(249,115,22,0); }
        }
        .leaflet-container { font-family: inherit; }
        .leaflet-popup-content-wrapper { border-radius: 8px; }
        .leaflet-popup-content { margin: 12px 16px; }
      `}</style>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        {memoizedMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={getCachedIcon(marker.type ?? 'default')}
          >
            {marker.popup && (
              <Popup>
                <div style={{ minWidth: '180px' }}>{marker.popup}</div>
              </Popup>
            )}
          </Marker>
        ))}
        {driverPosition && (
          <Marker
            position={driverPosition}
            icon={driverIcon}
          >
            {driverLabel && (
              <Popup>
                <div style={{ minWidth: '140px', fontWeight: 600 }}>
                  {driverLabel}
                </div>
              </Popup>
            )}
          </Marker>
        )}
        <BoundsFitter
          markers={memoizedMarkers}
          driverPosition={driverPosition}
          fitBounds={fitBounds}
        />
        <ViewUpdater center={center} zoom={zoom} active={!fitBounds} />
        <SizeInvalidator containerRef={containerRef} />
      </MapContainer>
    </div>
  )
})

export default LiveMap
