import React, { useMemo } from 'react';
import { CityConfig, Driver, TripState } from '../../types/taxi';
import { MapPin, Navigation, Compass, Layers, Sparkles } from 'lucide-react';

interface CityMapProps {
  currentCity: CityConfig;
  tripState: TripState;
  nearbyDrivers: Driver[];
  onMapClick: (coords: { x: number; y: number }) => void;
  onSelectLandmark: (landmark: any, type: 'pickup' | 'destination') => void;
  selectionMode: 'pickup' | 'destination';
}

export const CityMap: React.FC<CityMapProps> = ({
  currentCity,
  tripState,
  nearbyDrivers,
  onMapClick,
  onSelectLandmark,
  selectionMode
}) => {
  // Generate stylized roads based on city
  const roads = useMemo(() => {
    if (currentCity.id === 'cholpon-ata') {
      return [
        { path: 'M 0 50 Q 50 48 100 52', width: 5, label: 'Трасса А-363 (Северный берег)' },
        { path: 'M 10 30 Q 50 32 90 28', width: 3, label: 'ул. Советская' },
        { path: 'M 35 15 L 35 75', width: 2 },
        { path: 'M 60 18 L 60 78', width: 2 },
        { path: 'M 75 25 L 75 80', width: 2.5 }
      ];
    }
    if (currentCity.id === 'intercity') {
      return [
        { path: 'M 15 20 Q 35 45 40 75', width: 6, label: 'Трасса М41 Бишкек-Ош (Төө-Ашуу)' },
        { path: 'M 15 20 Q 50 25 80 32', width: 5, label: 'Трасса Бишкек - Ысык-Көл' },
        { path: 'M 40 75 Q 55 72 70 80', width: 4, label: 'Ош - Жалал-Абад' },
        { path: 'M 80 32 Q 90 40 95 60', width: 3.5, label: 'Кольцевая Ысык-Көл' }
      ];
    }
    // Default city grid (Bishkek, Osh, etc.)
    return [
      { path: 'M 0 45 L 100 45', width: 6, label: 'пр. Чуй / ул. Ленина' },
      { path: 'M 0 60 L 100 60', width: 4.5, label: 'ул. Киевская / Токтогула' },
      { path: 'M 0 30 L 100 30', width: 4, label: 'пр. Жибек Жолу' },
      { path: 'M 0 75 L 100 75', width: 5, label: 'ул. Ахунбаева / Южная Магистраль' },
      { path: 'M 35 0 L 35 100', width: 5, label: 'пр. Манаса / Айтматова' },
      { path: 'M 50 0 L 50 100', width: 4, label: 'ул. Абдрахманова (Советская)' },
      { path: 'M 65 0 L 65 100', width: 3.5, label: 'ул. 7 Апреля (Алма-Атинская)' },
      { path: 'M 20 0 L 20 100', width: 3 },
      { path: 'M 80 0 L 80 100', width: 3 },
      // Diagonal expressways
      { path: 'M 15 15 L 85 85', width: 2.5 }
    ];
  }, [currentCity.id]);

  // Coordinates of pickup and destination
  const pickup = tripState.pickup.coords;
  const destination = tripState.destination.coords;

  // Driver animated position
  const activeDriverPos = useMemo(() => {
    if (!tripState.driver) return null;
    if (tripState.status === 'driver_assigned' || tripState.status === 'driver_arrived') {
      const p = tripState.driverProgress;
      const startX = tripState.driver.position.x;
      const startY = tripState.driver.position.y;
      return {
        x: startX + (pickup.x - startX) * p,
        y: startY + (pickup.y - startY) * p
      };
    }
    if (tripState.status === 'in_trip') {
      const p = tripState.tripProgress;
      return {
        x: pickup.x + (destination.x - pickup.x) * p,
        y: pickup.y + (destination.y - pickup.y) * p
      };
    }
    return tripState.driver.position;
  }, [tripState.driver, tripState.status, tripState.driverProgress, tripState.tripProgress, pickup, destination]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* SVG Canvas Map */}
      <svg
        className="w-full h-full cursor-crosshair"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = ((e.clientX - rect.left) / rect.width) * 100;
          const clickY = ((e.clientY - rect.top) / rect.height) * 100;
          onMapClick({
            x: Math.round(clickX * 10) / 10,
            y: Math.round(clickY * 10) / 10
          });
        }}
      >
        <defs>
          {/* Subtle grid pattern for urban blocks */}
          <pattern id="urban-blocks" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="9" height="9" fill="#0f172a" rx="1" />
            <path d="M 0 10 L 10 10 M 10 0 L 10 10" stroke="#1e293b" strokeWidth="0.4" />
          </pattern>

          {/* Glowing line gradient */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          {/* Water gradient */}
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* City background base */}
        <rect width="100" height="100" fill="url(#urban-blocks)" />

        {/* Mountain backdrop for Tien Shan feel */}
        <path
          d="M 0 0 L 15 8 L 30 2 L 45 10 L 60 4 L 75 12 L 90 5 L 100 12 L 100 0 Z"
          fill="#1e293b"
          opacity="0.35"
        />

        {/* Lake Issyk-Kul representation if in Cholpon-Ata */}
        {currentCity.id === 'cholpon-ata' && (
          <path
            d="M 0 65 Q 40 60 70 66 Q 90 70 100 68 L 100 100 L 0 100 Z"
            fill="url(#waterGrad)"
          />
        )}

        {/* Rivers for Bishkek (Ala-Archa) or Osh (Ak-Buura) */}
        {currentCity.id === 'bishkek' && (
          <path
            d="M 40 100 Q 38 60 36 30 Q 34 10 32 0"
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.2"
            opacity="0.5"
            strokeDasharray="1 1"
          />
        )}
        {currentCity.id === 'osh' && (
          <path
            d="M 45 100 Q 48 55 46 25 Q 44 10 42 0"
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            opacity="0.5"
          />
        )}

        {/* Major Roads Grid */}
        {roads.map((road, idx) => (
          <g key={idx}>
            <path
              d={road.path}
              fill="none"
              stroke="#1e293b"
              strokeWidth={road.width * 1.4}
              strokeLinecap="round"
            />
            <path
              d={road.path}
              fill="none"
              stroke="#334155"
              strokeWidth={road.width}
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Active Route Line between Pickup and Destination */}
        <path
          d={`M ${pickup.x} ${pickup.y} Q ${(pickup.x + destination.x) / 2 + 3} ${(pickup.y + destination.y) / 2 - 4} ${destination.x} ${destination.y}`}
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="3 1.5"
          className="animate-[dash_15s_linear_infinite]"
        />

        {/* Driver en-route to pickup line */}
        {activeDriverPos && (tripState.status === 'driver_assigned' || tripState.status === 'driver_arrived') && (
          <path
            d={`M ${activeDriverPos.x} ${activeDriverPos.y} L ${pickup.x} ${pickup.y}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            opacity="0.75"
          />
        )}

        {/* Landmark Points on Map */}
        {currentCity.landmarks.map((lm) => (
          <g
            key={lm.id}
            className="cursor-pointer transition-transform hover:scale-125"
            onClick={(e) => {
              e.stopPropagation();
              onSelectLandmark(lm, selectionMode);
            }}
          >
            <circle
              cx={lm.x}
              cy={lm.y}
              r="2.5"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="0.8"
            />
            <circle cx={lm.x} cy={lm.y} r="1.2" fill="#38bdf8" />
            <text
              x={lm.x}
              y={lm.y + 4.5}
              fill="#94a3b8"
              fontSize="2.4"
              fontWeight="600"
              textAnchor="middle"
              className="pointer-events-none drop-shadow"
            >
              {lm.name.ru}
            </text>
          </g>
        ))}

        {/* Nearby Roaming Drivers (when idle/searching) */}
        {tripState.status !== 'in_trip' &&
          nearbyDrivers.map((drv) => (
            <g
              key={drv.id}
              transform={`translate(${drv.position.x}, ${drv.position.y}) rotate(${drv.heading})`}
              className="transition-all duration-1000 ease-linear pointer-events-none"
            >
              <rect
                x="-1.6"
                y="-2.4"
                width="3.2"
                height="4.8"
                rx="0.9"
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth="0.4"
              />
              <rect x="-1" y="-1.5" width="2" height="1" rx="0.3" fill="#1e293b" />
              <circle cx="-1" cy="1.6" r="0.4" fill="#ef4444" />
              <circle cx="1" cy="1.6" r="0.4" fill="#ef4444" />
            </g>
          ))}

        {/* Active Driver Car (during trip or dispatch) */}
        {activeDriverPos && (
          <g
            transform={`translate(${activeDriverPos.x}, ${activeDriverPos.y}) rotate(${tripState.driver?.heading || 0})`}
            className="transition-all duration-700 ease-out"
          >
            {/* Pulse aura */}
            <circle cx="0" cy="0" r="4.5" fill="#38bdf8" opacity="0.25" className="animate-ping" />
            {/* Detailed car shape */}
            <rect
              x="-2"
              y="-3"
              width="4"
              height="6"
              rx="1.2"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="0.6"
            />
            {/* Windshield */}
            <rect x="-1.4" y="-1.8" width="2.8" height="1.4" rx="0.4" fill="#0f172a" />
            {/* Headlights */}
            <circle cx="-1.3" cy="-2.6" r="0.4" fill="#fef08a" />
            <circle cx="1.3" cy="-2.6" r="0.4" fill="#fef08a" />
          </g>
        )}

        {/* Pickup Pin (A) */}
        <g transform={`translate(${pickup.x}, ${pickup.y})`}>
          <circle cx="0" cy="0" r="4" fill="#22c55e" opacity="0.3" className="animate-pulse" />
          <circle cx="0" cy="0" r="2.2" fill="#22c55e" stroke="#ffffff" strokeWidth="0.6" />
          <text
            x="0"
            y="-3.5"
            fill="#ffffff"
            fontSize="2.4"
            fontWeight="bold"
            textAnchor="middle"
            className="drop-shadow"
          >
            A
          </text>
        </g>

        {/* Destination Pin (B) */}
        <g transform={`translate(${destination.x}, ${destination.y})`}>
          <circle cx="0" cy="0" r="4" fill="#ef4444" opacity="0.3" className="animate-pulse" />
          <circle cx="0" cy="0" r="2.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
          <text
            x="0"
            y="-3.5"
            fill="#ffffff"
            fontSize="2.4"
            fontWeight="bold"
            textAnchor="middle"
            className="drop-shadow"
          >
            B
          </text>
        </g>
      </svg>

      {/* Floating Map HUD Controls (Top Right) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={() => {
            // Re-center on city default
            onMapClick(currentCity.mapCenter);
          }}
          title="Центр города"
          className="h-11 w-11 rounded-xl bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-800 flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <Compass className="w-5 h-5 text-amber-400" />
        </button>
        <button
          onClick={() => {
            // Pick current GPS simulation
            onMapClick({ x: 48, y: 46 });
          }}
          title="Моё местоположение (GPS)"
          className="h-11 w-11 rounded-xl bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-800 flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <Navigation className="w-5 h-5 text-sky-400" />
        </button>
      </div>

      {/* Selection Mode Notice Pill */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-medium text-slate-300 shadow-md">
        <MapPin
          className={`w-4 h-4 ${selectionMode === 'pickup' ? 'text-emerald-400' : 'text-red-400'}`}
        />
        <span>
          Клик по карте: {selectionMode === 'pickup' ? 'Точка посадки (A)' : 'Точка высадки (B)'}
        </span>
      </div>

      {/* City Badge & Mountain silhouette */}
      <div className="absolute bottom-3 left-4 z-10 pointer-events-none flex items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">{currentCity.name.ru}</span>
        <span>·</span>
        <span>{currentCity.regionName}</span>
        <span>·</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {nearbyDrivers.length} авто на линии
        </span>
      </div>
    </div>
  );
};
