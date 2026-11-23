import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus,
  MapMouseEvent
} from '@vis.gl/react-google-maps';
import { CityConfig, Driver, TripState } from '../../types/taxi';
import { interpolateAlongRoute } from '../../services/geoService';
import {
  Compass,
  Navigation,
  Search,
  Layers,
  Building2,
  Eye,
  EyeOff,
  MapPin,
  Loader2,
  X,
  LocateFixed
} from 'lucide-react';

declare const __GOOGLE_MAPS_API_KEY__: string | undefined;

export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ||
  (typeof __GOOGLE_MAPS_API_KEY__ !== 'undefined' ? __GOOGLE_MAPS_API_KEY__ : '') ||
  '';

interface RealCityMapProps {
  currentCity: CityConfig;
  tripState: TripState;
  nearbyDrivers: Driver[];
  routeCoordinates: [number, number][];
  isRealRoadRoute: boolean;
  onSelectCoords: (coords: { lat: number; lng: number; name?: string }) => void;
  onGoogleRouteMetrics?: (metrics: {
    coordinates: [number, number][];
    distanceKm: number;
    durationMin: number;
  }) => void;
  selectionMode: 'pickup' | 'destination';
  onSwitchTo2Gis: () => void;
}

type GoogleMapTypeId = 'roadmap' | 'hybrid' | 'terrain';

interface SearchOption {
  id: string;
  title: string;
  subtitle: string;
  source: 'google' | 'local';
  lat?: number;
  lng?: number;
  prediction?: google.maps.places.PlacePrediction;
}

function isQuotaError(err: unknown): boolean {
  const msg = String((err as any)?.message || (err as any)?.status || err || '');
  return (
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('QuotaExceeded') ||
    msg.includes('429')
  );
}

interface InnerGoogleMapProps extends RealCityMapProps {
  mapTypeId: GoogleMapTypeId;
  autoFollowDriver: boolean;
  recenterSignal: number;
  locateMeSignal: number;
  onLocateStatusChange?: (locating: boolean) => void;
}

const InnerGoogleMapContent: React.FC<InnerGoogleMapProps> = ({
  currentCity,
  tripState,
  nearbyDrivers,
  routeCoordinates,
  onSelectCoords,
  onGoogleRouteMetrics,
  mapTypeId,
  autoFollowDriver,
  recenterSignal,
  locateMeSignal,
  onLocateStatusChange
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const geocodingLib = useMapsLibrary('geocoding');
  const isLoaded = useApiIsLoaded();
  const loadingStatus = useApiLoadingStatus();

  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const approachPolylineRef = useRef<google.maps.Polyline | null>(null);
  const lastCityIdRef = useRef<string>(currentCity.id);
  const [googleRoutePath, setGoogleRoutePath] = useState<[number, number][]>([]);

  const cityLat = currentCity.centerCoordinates?.lat || 42.8746;
  const cityLng = currentCity.centerCoordinates?.lng || 74.5698;

  const pickupLat = tripState.pickup.coords.lat ?? cityLat + 0.002;
  const pickupLng = tripState.pickup.coords.lng ?? cityLng + 0.003;
  const destLat = tripState.destination.coords.lat ?? cityLat - 0.018;
  const destLng = tripState.destination.coords.lng ?? cityLng - 0.014;

  const activePath = googleRoutePath.length >= 2 ? googleRoutePath : routeCoordinates;

  // Smooth active driver position along real road polyline
  const driverGeo = useMemo(() => {
    if (!tripState.driver) return null;

    if (tripState.status === 'driver_assigned' || tripState.status === 'driver_arrived') {
      const p = tripState.driverProgress;
      const startLat = pickupLat + 0.009;
      const startLng = pickupLng + 0.009;
      const dLat = startLat + (pickupLat - startLat) * p;
      const dLng = startLng + (pickupLng - startLng) * p;
      const heading = (Math.atan2(pickupLng - startLng, pickupLat - startLat) * 180) / Math.PI;
      return { lat: dLat, lng: dLng, heading: (heading + 360) % 360 };
    }

    if (tripState.status === 'in_trip') {
      if (activePath.length >= 2) {
        return interpolateAlongRoute(activePath, tripState.tripProgress);
      }
      const p = tripState.tripProgress;
      return {
        lat: pickupLat + (destLat - pickupLat) * p,
        lng: pickupLng + (destLng - pickupLng) * p,
        heading: 0
      };
    }

    return { lat: pickupLat, lng: pickupLng, heading: 0 };
  }, [
    tripState.driver,
    tripState.status,
    tripState.driverProgress,
    tripState.tripProgress,
    pickupLat,
    pickupLng,
    destLat,
    destLng,
    activePath
  ]);

  // Pan camera when city switches or user clicks Recenter
  useEffect(() => {
    if (!map) return;
    if (lastCityIdRef.current !== currentCity.id || recenterSignal > 0) {
      lastCityIdRef.current = currentCity.id;
      map.panTo({ lat: cityLat, lng: cityLng });
      map.setZoom(currentCity.id === 'intercity' ? 7 : 13);
    }
  }, [map, currentCity.id, cityLat, cityLng, recenterSignal]);

  // Auto-follow active driver
  useEffect(() => {
    if (!map || !driverGeo || !autoFollowDriver) return;
    if (tripState.status === 'driver_assigned' || tripState.status === 'in_trip') {
      map.panTo({ lat: driverGeo.lat, lng: driverGeo.lng });
    }
  }, [map, driverGeo, autoFollowDriver, tripState.status]);

  // Compute & render route using modern Google Maps Routes API (Route.computeRoutes)
  useEffect(() => {
    if (!map) return;

    const clearPolylines = () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };

    const drawFallbackPolyline = () => {
      if (routeCoordinates.length < 2 || typeof google === 'undefined') return;
      clearPolylines();
      const path = routeCoordinates.map(([lat, lng]) => ({ lat, lng }));
      const poly = new google.maps.Polyline({
        path,
        strokeColor: '#000000',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map
      });
      polylinesRef.current = [poly];

      const bounds = new google.maps.LatLngBounds();
      path.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 80, right: 48, bottom: 140, left: 48 });
    };

    if (!routesLib) {
      drawFallbackPolyline();
      return clearPolylines;
    }

    let cancelled = false;
    clearPolylines();

    const request = {
      origin: { lat: pickupLat, lng: pickupLng },
      destination: { lat: destLat, lng: destLng },
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport']
    };

    // Modern Google Maps Routes API SDK wrapper (bypasses CORS; replaces legacy DirectionsService)
    // Docs: https://developers.google.com/maps/documentation/javascript/routes?utm_campaign=gmp_mcp_codeassist_v1_aistudio
    (routesLib.Route as any)
      .computeRoutes(request)
      .then(({ routes }: { routes?: any[] }) => {
        if (cancelled) return;
        const primaryRoute = routes?.[0];
        if (!primaryRoute) {
          drawFallbackPolyline();
          return;
        }

        const newPolylines: google.maps.Polyline[] = primaryRoute.createPolylines
          ? primaryRoute.createPolylines()
          : [];

        if (newPolylines.length > 0) {
          newPolylines.forEach((polyline: google.maps.Polyline) => {
            polyline.setOptions({
              strokeColor: '#000000',
              strokeWeight: 5,
              strokeOpacity: 0.92
            });
            polyline.setMap(map);
          });
          polylinesRef.current = newPolylines;
        } else {
          drawFallbackPolyline();
        }

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, { top: 80, right: 48, bottom: 140, left: 48 });
        }

        const extractedCoords: [number, number][] = Array.isArray(primaryRoute.path)
          ? primaryRoute.path.map((pt: google.maps.LatLng) => [pt.lat(), pt.lng()])
          : [];

        if (extractedCoords.length >= 2) {
          setGoogleRoutePath(extractedCoords);
        }

        if (onGoogleRouteMetrics && primaryRoute.distanceMeters) {
          const distanceKm = Math.max(0.5, Math.round((primaryRoute.distanceMeters / 1000) * 10) / 10);
          const durationMin = Math.max(2, Math.round((primaryRoute.durationMillis || 300000) / 60000));
          onGoogleRouteMetrics({
            coordinates: extractedCoords.length >= 2 ? extractedCoords : routeCoordinates,
            distanceKm,
            durationMin
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        drawFallbackPolyline();
      });

    return () => {
      cancelled = true;
      clearPolylines();
    };
  }, [map, routesLib, pickupLat, pickupLng, destLat, destLng, routeCoordinates, onGoogleRouteMetrics]);

  // Dashed Uber Blue approach line while driver is heading to pickup
  useEffect(() => {
    if (approachPolylineRef.current) {
      approachPolylineRef.current.setMap(null);
      approachPolylineRef.current = null;
    }

    if (
      !map ||
      !driverGeo ||
      tripState.status !== 'driver_assigned' ||
      typeof google === 'undefined'
    ) {
      return;
    }

    const lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 3
    };

    const approachLine = new google.maps.Polyline({
      path: [
        { lat: driverGeo.lat, lng: driverGeo.lng },
        { lat: pickupLat, lng: pickupLng }
      ],
      strokeOpacity: 0,
      strokeColor: '#276EF1',
      icons: [{ icon: lineSymbol, offset: '0', repeat: '14px' }],
      map
    });

    approachPolylineRef.current = approachLine;

    return () => {
      approachLine.setMap(null);
      approachPolylineRef.current = null;
    };
  }, [map, driverGeo, tripState.status, pickupLat, pickupLng]);

  const resolveAddressName = useCallback(
    async (lat: number, lng: number): Promise<string | undefined> => {
      if (!geocodingLib) return undefined;
      try {
        const geocoder = new geocodingLib.Geocoder();
        const res = await geocoder.geocode({ location: { lat, lng } });
        const best = res.results?.[0];
        if (!best) return undefined;
        // Build a crisp short street address without redundant country/postal codes
        const parts = (best.formatted_address || '').split(',').map((s) => s.trim());
        const shortAddr = parts.slice(0, 2).join(', ');
        return shortAddr || best.formatted_address;
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        return undefined;
      }
    },
    [geocodingLib]
  );

  // Real browser GPS "Locate Me" button handler
  useEffect(() => {
    if (locateMeSignal <= 0 || !map) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    onLocateStatusChange?.(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        // Only pan outside Kyrgyzstan if user is actually nearby; otherwise center smoothly on GPS fix
        map.panTo({ lat, lng });
        map.setZoom(15);
        const resolvedName = await resolveAddressName(lat, lng);
        onSelectCoords({
          lat,
          lng,
          name: resolvedName || `Моё местоположение (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        });
        onLocateStatusChange?.(false);
      },
      () => {
        // Fallback smoothly to current city center landmark if browser blocks geolocation
        map.panTo({ lat: cityLat, lng: cityLng });
        map.setZoom(14);
        onLocateStatusChange?.(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, [locateMeSignal, map, cityLat, cityLng, onSelectCoords, resolveAddressName, onLocateStatusChange]);

  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      const latLng = e.detail.latLng;
      if (!latLng) return;
      const lat = Math.round(latLng.lat * 10000) / 10000;
      const lng = Math.round(latLng.lng * 10000) / 10000;
      const resolvedName = await resolveAddressName(lat, lng);
      onSelectCoords({ lat, lng, name: resolvedName });
    },
    [onSelectCoords, resolveAddressName]
  );

  // Convert normalized nearby driver coordinates to real lat/lng near city center
  const nearbyDriverPositions = useMemo(() => {
    return nearbyDrivers.map((drv) => {
      const pos = drv.position as { x: number; y: number; lat?: number; lng?: number };
      return {
        drv,
        lat: pos.lat ?? cityLat + (pos.y - 50) * 0.0012,
        lng: pos.lng ?? cityLng + (pos.x - 50) * 0.0016
      };
    });
  }, [nearbyDrivers, cityLat, cityLng]);

  const mapFailed =
    loadingStatus === APILoadingStatus.FAILED || loadingStatus === APILoadingStatus.AUTH_FAILURE;

  return (
    <div className="absolute inset-0 w-full h-full">
      {!isLoaded && !mapFailed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#f3f3f3]">
          <div className="flex items-center gap-2.5 bg-white px-4 py-3 rounded-xl shadow-md border border-neutral-200 text-xs font-semibold text-black">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Загрузка Google Карт...</span>
          </div>
        </div>
      )}

      {mapFailed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#f3f3f3] p-6">
          <div className="max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 text-center shadow-lg space-y-2">
            <p className="text-sm font-bold text-black">Не удалось загрузить Google Карту</p>
            <p className="text-xs text-neutral-600">
              Проверьте подключение к сети или квоту Google Maps Platform. Вы можете продолжить оформление поездки.
            </p>
          </div>
        </div>
      )}

      <GoogleMap
        defaultCenter={{ lat: cityLat, lng: cityLng }}
        defaultZoom={currentCity.id === 'intercity' ? 7 : 13}
        mapId="DEMO_MAP_ID"
        mapTypeId={mapTypeId}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        zoomControl={true}
        clickableIcons={false}
        onClick={handleMapClick}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Pickup Pin (A) */}
        <AdvancedMarker position={{ lat: pickupLat, lng: pickupLng }} zIndex={50}>
          <div className="flex flex-col items-center -translate-y-1">
            <div className="bg-black text-white px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold max-w-[175px] truncate border border-white/20 mb-1">
              А · {tripState.pickup.name}
            </div>
            <div className="w-6 h-6 rounded-full bg-black border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        </AdvancedMarker>

        {/* Destination Pin (B) */}
        <AdvancedMarker position={{ lat: destLat, lng: destLng }} zIndex={50}>
          <div className="flex flex-col items-center -translate-y-1">
            <div className="bg-white text-black px-2.5 py-1 rounded-lg shadow-lg text-[11px] font-bold max-w-[175px] truncate border-2 border-black mb-1">
              Б · {tripState.destination.name}
            </div>
            <div className="w-6 h-6 rounded-md bg-[#276EF1] border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white" />
            </div>
          </div>
        </AdvancedMarker>

        {/* Nearby Free Drivers */}
        {(tripState.status === 'idle' ||
          tripState.status === 'searching' ||
          tripState.status === 'bidding') &&
          nearbyDriverPositions.map(({ drv, lat, lng }) => (
            <AdvancedMarker key={drv.id} position={{ lat, lng }} zIndex={20}>
              <div
                className="w-8 h-8 rounded-full bg-white border border-neutral-300 shadow-md flex items-center justify-center"
                title={`${drv.carModel} · ${drv.carPlate}`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  style={{ transform: `rotate(${drv.heading}deg)` }}
                >
                  <rect x="6" y="3" width="12" height="18" rx="4" fill="#111111" />
                  <rect x="8" y="6" width="8" height="4" rx="1" fill="#ffffff" opacity="0.85" />
                  <rect x="8" y="14" width="8" height="3" rx="1" fill="#ffffff" opacity="0.55" />
                </svg>
              </div>
            </AdvancedMarker>
          ))}

        {/* Active Assigned Driver Vehicle */}
        {driverGeo &&
          tripState.driver &&
          (tripState.status === 'driver_assigned' ||
            tripState.status === 'driver_arrived' ||
            tripState.status === 'in_trip') && (
            <AdvancedMarker position={{ lat: driverGeo.lat, lng: driverGeo.lng }} zIndex={100}>
              <div className="flex flex-col items-center">
                <div className="bg-black text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg mb-1 whitespace-nowrap border border-white/20">
                  {tripState.driver.carPlate}
                  {tripState.status === 'in_trip' ? ` · ${tripState.currentSpeed} км/ч` : ''}
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 rounded-full bg-[#276EF1]/25 animate-ping" />
                  <div className="w-10 h-10 rounded-full bg-black border-2 border-white shadow-xl flex items-center justify-center relative">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      style={{ transform: `rotate(${driverGeo.heading}deg)` }}
                    >
                      <rect x="6" y="2" width="12" height="20" rx="4" fill="#ffffff" />
                      <rect x="8" y="5" width="8" height="4.5" rx="1" fill="#111111" />
                      <rect x="8" y="14.5" width="8" height="3" rx="1" fill="#111111" opacity="0.7" />
                    </svg>
                  </div>
                </div>
              </div>
            </AdvancedMarker>
          )}
      </GoogleMap>
    </div>
  );
};

interface GooglePlacesSearchBarProps {
  currentCity: CityConfig;
  selectionMode: 'pickup' | 'destination';
  onSelectCoords: (coords: { lat: number; lng: number; name?: string }) => void;
}

const GooglePlacesSearchBar: React.FC<GooglePlacesSearchBarProps> = ({
  currentCity,
  selectionMode,
  onSelectCoords
}) => {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setOptions([]);
      return;
    }

    const qLower = trimmed.toLowerCase();
    const localOptions: SearchOption[] = currentCity.landmarks
      .filter(
        (lm) =>
          lm.name.ru.toLowerCase().includes(qLower) ||
          lm.name.kg.toLowerCase().includes(qLower) ||
          lm.address.toLowerCase().includes(qLower)
      )
      .slice(0, 3)
      .map((lm) => ({
        id: `local_${lm.id}`,
        title: lm.name.ru,
        subtitle: `${lm.address}, ${currentCity.name.ru}`,
        source: 'local',
        lat: lm.lat,
        lng: lm.lng
      }));

    if (!placesLib) {
      setOptions(localOptions);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        // Modern Places API (New): AutocompleteSuggestion.fetchAutocompleteSuggestions
        // Docs: https://developers.google.com/maps/documentation/javascript/place-autocomplete-data?utm_campaign=gmp_mcp_codeassist_v1_aistudio
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: currentCity.id === 'intercity' ? trimmed : `${trimmed}, ${currentCity.name.ru}`,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ['kg']
        });

        if (cancelled) return;

        const googleOptions: SearchOption[] = (res?.suggestions || [])
          .filter((s) => Boolean(s.placePrediction))
          .slice(0, 5)
          .map((s, idx) => ({
            id: `google_${s.placePrediction?.placeId || idx}`,
            title: s.placePrediction?.mainText?.text || s.placePrediction?.text?.text || trimmed,
            subtitle: s.placePrediction?.secondaryText?.text || 'Кыргызстан · Google',
            source: 'google',
            prediction: s.placePrediction || undefined
          }));

        setOptions([...localOptions, ...googleOptions].slice(0, 6));
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!cancelled) {
          setOptions(localOptions);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, placesLib, currentCity]);

  const handleSelectOption = async (opt: SearchOption) => {
    if (opt.source === 'local' && typeof opt.lat === 'number' && typeof opt.lng === 'number') {
      onSelectCoords({ lat: opt.lat, lng: opt.lng, name: opt.title });
      setQuery('');
      setOptions([]);
      return;
    }

    if (opt.prediction) {
      try {
        const place = opt.prediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location']
        });
        const loc = place.location;
        if (loc) {
          onSelectCoords({
            lat: loc.lat(),
            lng: loc.lng(),
            name: place.displayName || opt.title
          });
        }
        // Reset session token after Place Details fetch for optimal session billing
        sessionTokenRef.current = null;
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      } finally {
        setQuery('');
        setOptions([]);
      }
    }
  };

  return (
    <div className="relative w-full max-w-[330px]">
      <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2.5 shadow-lg">
        <Search className="w-4 h-4 text-neutral-500 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            selectionMode === 'pickup'
              ? `Поиск адреса подачи (${currentCity.name.ru})...`
              : `Поиск места назначения (${currentCity.name.ru})...`
          }
          className="w-full text-xs text-black placeholder:text-neutral-400 focus:outline-none bg-transparent"
        />
        {isSearching ? (
          <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin shrink-0" />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setOptions([]);
              }}
              className="text-neutral-400 hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      {options.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden z-40">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => void handleSelectOption(opt)}
              className="w-full px-3 py-2.5 text-left hover:bg-[#f6f6f6] flex items-start gap-2.5 border-b border-neutral-100 last:border-b-0 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-black shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-black truncate">{opt.title}</div>
                <div className="text-[11px] text-neutral-500 truncate">{opt.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const RealCityMap: React.FC<RealCityMapProps> = (props) => {
  const {
    currentCity,
    tripState,
    isRealRoadRoute,
    onSelectCoords,
    selectionMode,
    onSwitchTo2Gis
  } = props;

  const [mapTypeId, setMapTypeId] = useState<GoogleMapTypeId>('roadmap');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [autoFollowDriver, setAutoFollowDriver] = useState(true);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [locateMeSignal, setLocateMeSignal] = useState(0);
  const [isLocating, setIsLocating] = useState(false);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#f3f3f3] overflow-hidden">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="ru" region="KG">
        <InnerGoogleMapContent
          {...props}
          mapTypeId={mapTypeId}
          autoFollowDriver={autoFollowDriver}
          recenterSignal={recenterSignal}
          locateMeSignal={locateMeSignal}
          onLocateStatusChange={setIsLocating}
        />

        {/* Top-Left: Google Places Autocomplete Search + Selection Mode Hint */}
        <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex flex-col gap-2 pointer-events-auto">
          <GooglePlacesSearchBar
            currentCity={currentCity}
            selectionMode={selectionMode}
            onSelectCoords={onSelectCoords}
          />

          <div className="inline-flex items-center gap-2 self-start bg-white/95 backdrop-blur-xs border border-neutral-200 px-3 py-1.5 rounded-lg shadow-md text-[11px] font-semibold text-black">
            <span
              className={`w-2 h-2 rounded-full ${
                selectionMode === 'pickup' ? 'bg-black' : 'bg-[#276EF1]'
              }`}
            />
            <span>
              {selectionMode === 'pickup'
                ? 'Нажмите на Google Карту: точка А (Подача)'
                : 'Нажмите на Google Карту: точка Б (Куда)'}
            </span>
          </div>
        </div>

        {/* Top-Right: Map Controls (Layers, Recenter, Follow Driver, 2GIS) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowLayerMenu((v) => !v)}
              className="h-9 px-3 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 shadow-md text-xs font-bold text-black flex items-center gap-1.5 transition-colors"
              title="Слои Google Карты"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {mapTypeId === 'roadmap'
                  ? 'Google Схема'
                  : mapTypeId === 'hybrid'
                  ? 'Спутник'
                  : 'Рельеф'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLocateMeSignal((n) => n + 1)}
              className="w-9 h-9 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 shadow-md text-[#276EF1] flex items-center justify-center transition-colors"
              title="Определить моё местоположение (GPS)"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LocateFixed className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setRecenterSignal((n) => n + 1)}
              className="w-9 h-9 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 shadow-md text-black flex items-center justify-center transition-colors"
              title="Центрировать город"
            >
              <Compass className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onSwitchTo2Gis}
              className="h-9 px-2.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 shadow-md text-[11px] font-bold text-black flex items-center gap-1 transition-colors"
              title="Открыть справочник 2ГИС"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2ГИС</span>
            </button>
          </div>

          {showLayerMenu && (
            <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl p-1.5 w-44 space-y-1">
              {(
                [
                  { id: 'roadmap', label: 'Google Карта (Схема)' },
                  { id: 'hybrid', label: 'Google Спутник' },
                  { id: 'terrain', label: 'Google Рельеф (Горы КР)' }
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMapTypeId(item.id);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    mapTypeId === item.id
                      ? 'bg-black text-white'
                      : 'text-black hover:bg-[#f3f3f3]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {(tripState.status === 'driver_assigned' || tripState.status === 'in_trip') && (
            <button
              type="button"
              onClick={() => setAutoFollowDriver((v) => !v)}
              className={`h-8 px-3 rounded-lg border shadow-md text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                autoFollowDriver
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-neutral-200'
              }`}
            >
              {autoFollowDriver ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{autoFollowDriver ? 'Слежение за авто' : 'Свободная карта'}</span>
            </button>
          )}
        </div>

        {/* Bottom-Left Compact Route Summary Pill (desktop only to stay clear of mobile bottom sheet) */}
        <div className="hidden lg:flex absolute bottom-4 left-4 z-20 items-center gap-2 bg-white/95 backdrop-blur-xs border border-neutral-200 px-3.5 py-2 rounded-xl shadow-lg text-xs font-semibold text-black pointer-events-auto">
          <Navigation className="w-3.5 h-3.5 text-[#276EF1]" />
          <span>{tripState.distanceKm} км</span>
          <span className="text-neutral-300">·</span>
          <span>~{tripState.estimatedMinutes} мин</span>
          {isRealRoadRoute && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="text-[#05944F]">Google Маршрут</span>
            </>
          )}
        </div>
      </APIProvider>
    </div>
  );
};
