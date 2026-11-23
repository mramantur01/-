import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CityConfig, TripState } from '../../types/taxi';

interface OsmCityMapProps {
  currentCity: CityConfig;
  tripState: TripState;
  routeCoordinates: [number, number][];
  onSelectCoords: (coords: { lat: number; lng: number; name?: string }) => void;
  selectionMode: 'pickup' | 'destination';
  onSwitchTo2Gis: () => void;
}

const pin = (color: string, label: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font:700 13px/1 system-ui;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

/**
 * Free OpenStreetMap fallback, used when no Google Maps key is configured.
 * Supports tapping to pick A/B points and draws the current route.
 */
export const OsmCityMap: React.FC<OsmCityMapProps> = ({
  currentCity,
  tripState,
  routeCoordinates,
  onSelectCoords,
  selectionMode,
  onSwitchTo2Gis
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelectCoords);
  onSelectRef.current = onSelectCoords;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [currentCity.centerCoordinates.lat, currentCity.centerCoordinates.lng],
      13
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      onSelectRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapRef.current?.setView(
      [currentCity.centerCoordinates.lat, currentCity.centerCoordinates.lng],
      13
    );
  }, [currentCity.id]);

  const { pickup, destination } = tripState;
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const pts: L.LatLngExpression[] = [];
    if (pickup.coords.lat != null && pickup.coords.lng != null) {
      L.marker([pickup.coords.lat, pickup.coords.lng], { icon: pin('#000', 'A') })
        .bindTooltip(pickup.name)
        .addTo(layer);
      pts.push([pickup.coords.lat, pickup.coords.lng]);
    }
    if (destination.coords.lat != null && destination.coords.lng != null) {
      L.marker([destination.coords.lat, destination.coords.lng], { icon: pin('#276EF1', 'B') })
        .bindTooltip(destination.name)
        .addTo(layer);
      pts.push([destination.coords.lat, destination.coords.lng]);
    }
    if (routeCoordinates.length >= 2) {
      const line = L.polyline(routeCoordinates, { color: '#276EF1', weight: 5, opacity: 0.85 }).addTo(layer);
      map.fitBounds(line.getBounds(), { padding: [40, 40], maxZoom: 16 });
    } else if (pts.length === 2) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16 });
    }
  }, [
    pickup.name,
    pickup.coords.lat,
    pickup.coords.lng,
    destination.name,
    destination.coords.lat,
    destination.coords.lng,
    routeCoordinates
  ]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-[500] flex flex-wrap gap-2 pointer-events-none">
        <div className="inline-flex items-center gap-2 bg-white/95 border border-neutral-200 px-3 py-1.5 rounded-lg shadow-md text-[11px] font-semibold text-black">
          <span
            className={`w-2 h-2 rounded-full ${selectionMode === 'pickup' ? 'bg-black' : 'bg-[#276EF1]'}`}
          />
          <span>
            {selectionMode === 'pickup'
              ? 'Нажмите на карту: точка А (Подача)'
              : 'Нажмите на карту: точка Б (Куда)'}
          </span>
        </div>
        <button
          type="button"
          onClick={onSwitchTo2Gis}
          className="pointer-events-auto bg-white/95 border border-neutral-200 px-3 py-1.5 rounded-lg shadow-md text-[11px] font-semibold text-black hover:bg-neutral-100"
        >
          2ГИС адреса
        </button>
      </div>
    </div>
  );
};
