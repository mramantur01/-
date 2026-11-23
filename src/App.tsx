import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  CityId,
  TariffId,
  Driver,
  TripState,
  Language,
  TripHistoryItem,
  PassengerProfile,
  DriverProfile,
  IntercityRoute,
  FoodRestaurant,
  FoodDish,
  PricingMode,
  PickupSpeedMode,
  ComfortPreferences,
  BidOffer,
  LiveRideDoc,
  FleetCitySetting
} from './types/taxi';
import {
  CITIES,
  TARIFFS,
  PAYMENT_METHODS,
  INITIAL_DRIVERS,
  FEMALE_DRIVERS,
  EV_DRIVERS,
  INITIAL_PASSENGER_PROFILE,
  INITIAL_DRIVER_PROFILE,
  INITIAL_FLEET_SETTINGS,
  INITIAL_DRIVER_APPLICATIONS
} from './data/kyrgyzstanData';
import { auth, googleProvider, isBootstrappedAdminUser } from './firebase';
import {
  syncUserProfileOnLogin,
  updateUserProfileInFirestore,
  subscribeUserCards,
  addUserCardToFirestore,
  deleteUserCardFromFirestore,
  subscribeUserTripHistory,
  saveTripHistoryToFirestore,
  createLiveRideInFirestore,
  subscribeToSingleRide,
  subscribeToOpenRides,
  subscribeToAllRidesAdmin,
  acceptLiveRideAsDriver,
  updateLiveRideStatusByDriver,
  cancelLiveRideByPassenger,
  acceptBidOnRideByPassenger,
  submitDriverBidInFirestore,
  subscribeToRideBids,
  submitDriverApplicationInFirestore,
  subscribeToAllDriversAdmin,
  updateDriverVerificationAdmin,
  subscribeToFleetSettings,
  saveFleetCitySettingAdmin
} from './services/firestoreService';
import { fetchRoadRoute } from './services/geoService';
import { playRideChime } from './utils/soundEffects';
import { TopBar } from './components/Navbar/TopBar';
import { RealCityMap } from './components/Map/RealCityMap';
import { TwoGisEmbed } from './components/Map/TwoGisEmbed';
import { BookingForm } from './components/Booking/BookingForm';
import { BiddingOffersPanel } from './components/Booking/BiddingOffersPanel';
import { ActiveTripPanel } from './components/ActiveTrip/ActiveTripPanel';
import { PaymentSelector } from './components/Booking/PaymentSelector';
import { QrPaymentModal } from './components/Booking/QrPaymentModal';
import { RideOptionsModal } from './components/Booking/RideOptionsModal';
import { TripCompletedModal } from './components/ActiveTrip/TripCompletedModal';
import { DriverDashboard } from './components/DriverMode/DriverDashboard';
import { DriverRegistrationModal } from './components/DriverMode/DriverRegistrationModal';
import { PassengerProfileModal } from './components/Profile/PassengerProfileModal';
import { IntercityModal } from './components/Intercity/IntercityModal';
import { FoodDeliveryModal } from './components/Food/FoodDeliveryModal';
import { TripHistoryModal } from './components/History/TripHistoryModal';
import { DispatcherDashboard } from './components/Dispatcher/DispatcherDashboard';
import { OfflineIndicator } from './components/PWA/PWAInstallButton';

const KG_PLACE_COORDS: Record<string, { lat: number; lng: number }> = {
  Бишкек: { lat: 42.8765, lng: 74.6037 },
  Ош: { lat: 40.514, lng: 72.8161 },
  'Чолпон-Ата': { lat: 42.6494, lng: 77.0822 },
  Каракол: { lat: 42.4907, lng: 78.3936 },
  'Жалал-Абад': { lat: 40.9333, lng: 73.0 },
  Нарын: { lat: 41.4287, lng: 75.9911 },
  Талас: { lat: 42.5228, lng: 72.2427 },
  Баткен: { lat: 40.0626, lng: 70.8194 },
  'Аэропорт Манас': { lat: 43.0613, lng: 74.4776 },
  'ГЛБ Каракол': { lat: 42.406, lng: 78.4638 }
};

function resolveIntercityCoords(name: string, fallback: { lat: number; lng: number }) {
  for (const [key, coords] of Object.entries(KG_PLACE_COORDS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }
  return fallback;
}

const STORAGE_KEYS = {
  passengerProfile: 'kgtaxi_passenger_profile_v1',
  driverProfile: 'kgtaxi_driver_profile_v1',
  tripHistory: 'kgtaxi_trip_history_v1'
} as const;

function loadStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const [selectedCityId, setSelectedCityId] = useState<CityId>('bishkek');
  const [appMode, setAppMode] = useState<'passenger' | 'driver' | 'dispatcher'>('passenger');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [completedTripForModal, setCompletedTripForModal] = useState<TripState | null>(null);
  const [selectionMode, setSelectionMode] = useState<'pickup' | 'destination'>('pickup');
  const [activeView, setActiveView] = useState<'map' | '2gis'>('map');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  // Firebase Auth state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const isAdminUser = useMemo(
    () => isBootstrappedAdminUser(authUser?.email, authUser?.emailVerified),
    [authUser]
  );

  // Profiles & Feature Modals (hydrated from localStorage for instant offline/guest persistence)
  const [passengerProfile, setPassengerProfile] = useState<PassengerProfile>(() => {
    const stored = loadStoredJson<Partial<PassengerProfile>>(STORAGE_KEYS.passengerProfile, {});
    return {
      ...INITIAL_PASSENGER_PROFILE,
      ...stored,
      safetySettings: {
        ...INITIAL_PASSENGER_PROFILE.safetySettings,
        ...(stored.safetySettings || {})
      },
      businessProfile: {
        ...(INITIAL_PASSENGER_PROFILE.businessProfile!),
        ...(stored.businessProfile || {})
      }
    };
  });
  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() => ({
    ...INITIAL_DRIVER_PROFILE,
    ...loadStoredJson<Partial<DriverProfile>>(STORAGE_KEYS.driverProfile, {})
  }));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevTripStatusRef = useRef<TripState['status']>('idle');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDriverRegisterOpen, setIsDriverRegisterOpen] = useState(false);
  const [isIntercityModalOpen, setIsIntercityModalOpen] = useState(false);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);

  // Fleet & Dispatcher State
  const [fleetSettings, setFleetSettings] = useState<FleetCitySetting[]>(INITIAL_FLEET_SETTINGS);
  const [driverApplications, setDriverApplications] = useState<DriverProfile[]>(INITIAL_DRIVER_APPLICATIONS);
  const [liveOpenRides, setLiveOpenRides] = useState<LiveRideDoc[]>([]);
  const [allLiveRides, setAllLiveRides] = useState<LiveRideDoc[]>([]);

  // Ride Modifiers & Bidding State
  const [surgeMultiplier, setSurgeMultiplier] = useState(1);
  const [driverComment, setDriverComment] = useState('');
  const [orderForOther, setOrderForOther] = useState({ enabled: false, name: '', phone: '' });
  const [cargoLoaders, setCargoLoaders] = useState(0);
  const [usePlusPoints, setUsePlusPoints] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('now');
  const [flightNumber, setFlightNumber] = useState('');
  const [pickupSpeedMode, setPickupSpeedMode] = useState<PickupSpeedMode>('standard');
  const [comfortPrefs, setComfortPrefs] = useState<ComfortPreferences>({
    temperature: 'standard',
    conversation: 'no_preference',
    luggageHelp: false
  });
  const [intermediateStop, setIntermediateStop] = useState<string | null>(null);
  const [hourlyHours, setHourlyHours] = useState<number>(3);
  const [hourlyPreset, setHourlyPreset] = useState<string>('Деловой день · Бишкек');
  const [billingProfile, setBillingProfile] = useState<'personal' | 'business'>(
    () => passengerProfile.businessProfile?.activeMode || 'personal'
  );
  const priorityBoost = pickupSpeedMode === 'priority' ? 30 : 0;

  const [pricingMode, setPricingMode] = useState<PricingMode>('fixed');
  const [offeredFare, setOfferedFare] = useState<number>(150);
  const [simulatedBids, setSimulatedBids] = useState<BidOffer[]>([]);
  const [firestoreBids, setFirestoreBids] = useState<BidOffer[]>([]);
  const [declinedBidIds, setDeclinedBidIds] = useState<string[]>([]);
  const [activeFirestoreRideId, setActiveFirestoreRideId] = useState<string | null>(null);

  // OSRM Real Road Route State
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isRealRoadRoute, setIsRealRoadRoute] = useState(false);
  const [realRouteMetrics, setRealRouteMetrics] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // Draggable Mobile Bottom Sheet State
  const [sheetSnap, setSheetSnap] = useState<'collapsed' | 'half' | 'expanded'>('half');
  const dragStartYRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Tier 1/2 Google Maps Platform quota listener
  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  const handleGoogleRouteMetrics = useCallback(
    (metrics: { coordinates: [number, number][]; distanceKm: number; durationMin: number }) => {
      if (metrics.coordinates.length >= 2) {
        setRouteCoordinates(metrics.coordinates);
      }
      setIsRealRoadRoute(true);
      setRealRouteMetrics({
        distanceKm: metrics.distanceKm + (intermediateStop ? 1.5 : 0),
        durationMin: metrics.durationMin + (intermediateStop ? 4 : 0)
      });
    },
    [intermediateStop]
  );

  const currentCity = useMemo(() => {
    return CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  }, [selectedCityId]);

  const currentCityFleetSetting = useMemo(() => {
    return (
      fleetSettings.find((s) => s.cityId === selectedCityId) || {
        cityId: selectedCityId,
        surgeMultiplier: 1.0,
        commissionPercent: 12,
        ladiesModeEnabled: true,
        biddingEnabled: true
      }
    );
  }, [fleetSettings, selectedCityId]);

  // Sync city surge multiplier when switching cities or updating dispatcher settings
  useEffect(() => {
    setSurgeMultiplier(currentCityFleetSetting.surgeMultiplier);
    if (!currentCityFleetSetting.biddingEnabled && pricingMode === 'bidding') {
      setPricingMode('fixed');
    }
  }, [currentCityFleetSetting, pricingMode]);

  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>(INITIAL_DRIVERS);

  const [tripHistory, setTripHistory] = useState<TripHistoryItem[]>(() =>
    loadStoredJson<TripHistoryItem[]>(STORAGE_KEYS.tripHistory, [
      {
        id: 'hist_1',
        date: 'Вчера, 18:40',
        cityName: 'Бишкек',
        pickup: 'ТРЦ Bishkek Park',
        destination: 'мкр. Джал-29',
        tariffName: 'Комфорт',
        carInfo: 'Toyota Camry 55 (01 KG 334 BSK)',
        fare: 220,
        paymentMethod: 'MBank',
        rating: 5
      },
      {
        id: 'hist_2',
        date: '04.10.2026',
        cityName: 'Ош',
        pickup: 'Аэропорт Ош (OSS)',
        destination: 'Гора Сулайман-Тоо',
        tariffName: 'Эконом',
        carInfo: 'Honda Fit (02 KG 555 OSH)',
        fare: 180,
        paymentMethod: 'Наличные',
        rating: 5
      }
    ])
  );

  // Persist local state cleanly to localStorage so Family, Business, Lost Items & History survive refresh
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.passengerProfile, JSON.stringify(passengerProfile));
    } catch {
      // ignore quota errors
    }
  }, [passengerProfile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.driverProfile, JSON.stringify(driverProfile));
    } catch {
      // ignore quota errors
    }
  }, [driverProfile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.tripHistory, JSON.stringify(tripHistory));
    } catch {
      // ignore quota errors
    }
  }, [tripHistory]);

  const defaultPickup = currentCity.landmarks[0] || {
    name: { ru: 'Центр', kg: 'Борбор', en: 'Center' },
    x: 45,
    y: 45,
    lat: 42.8765,
    lng: 74.6037
  };
  const defaultDest = currentCity.landmarks[1] || {
    name: { ru: 'Аэропорт', kg: 'Аэропорт', en: 'Airport' },
    x: 30,
    y: 60,
    lat: 42.8553,
    lng: 74.5866
  };

  const [tripState, setTripState] = useState<TripState>({
    id: `trip_${Date.now()}`,
    cityId: currentCity.id,
    pickup: {
      name: defaultPickup.name.ru,
      coords: { x: defaultPickup.x, y: defaultPickup.y, lat: defaultPickup.lat, lng: defaultPickup.lng }
    },
    destination: {
      name: defaultDest.name.ru,
      coords: { x: defaultDest.x, y: defaultDest.y, lat: defaultDest.lat, lng: defaultDest.lng }
    },
    tariff: TARIFFS[0],
    paymentMethod: 'mbank',
    distanceKm: 4.8,
    estimatedMinutes: 11,
    totalFare: 137,
    status: 'idle',
    driverProgress: 0,
    tripProgress: 0,
    currentSpeed: 0,
    promoDiscount: 0,
    options: {
      childSeat: false,
      luggage: false,
      pet: false,
      airConditioning: false,
      silentRide: false
    },
    createdAt: new Date().toISOString()
  });

  // ==================== FIREBASE AUTH & REAL-TIME SYNC ====================
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const synced = await syncUserProfileOnLogin(
            user.uid,
            user.displayName || 'Пассажир KG',
            user.email || '',
            INITIAL_PASSENGER_PROFILE
          );
          setPassengerProfile(synced);
        } catch (err) {
          console.error('Profile sync error:', err);
        }
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authUser) return;

    const unsubCards = subscribeUserCards(authUser.uid, (cards) => {
      setPassengerProfile((prev) => ({
        ...prev,
        savedCards: cards.length > 0 ? cards : prev.savedCards
      }));
    });

    const unsubTrips = subscribeUserTripHistory(authUser.uid, (items) => {
      if (items.length > 0) {
        setTripHistory(items);
      }
    });

    const unsubOpenRides = subscribeToOpenRides((rides) => {
      setLiveOpenRides(rides);
    });

    const unsubFleet = subscribeToFleetSettings((settings) => {
      if (settings.length > 0) {
        setFleetSettings((prev) => {
          const map = new Map(prev.map((s) => [s.cityId, s]));
          settings.forEach((s) => map.set(s.cityId, s));
          return Array.from(map.values());
        });
      }
    });

    let unsubAdminRides: (() => void) | undefined;
    let unsubAdminDrivers: (() => void) | undefined;
    if (isAdminUser) {
      unsubAdminRides = subscribeToAllRidesAdmin((rides) => {
        setAllLiveRides(rides);
      });
      unsubAdminDrivers = subscribeToAllDriversAdmin((drivers) => {
        if (drivers.length > 0) {
          setDriverApplications((prev) => {
            const byId = new Map(prev.map((d) => [d.id, d]));
            drivers.forEach((d) => byId.set(d.id, d));
            return Array.from(byId.values());
          });
        }
      });
    }

    return () => {
      unsubCards();
      unsubTrips();
      unsubOpenRides();
      unsubFleet();
      unsubAdminRides?.();
      unsubAdminDrivers?.();
    };
  }, [authUser, isAdminUser]);

  // Subscribe to active live Firestore ride & its bids when signed in
  useEffect(() => {
    if (!activeFirestoreRideId || !authUser) return;

    const unsubRide = subscribeToSingleRide(activeFirestoreRideId, (ride) => {
      if (!ride) return;
      if (ride.status === 'driver_assigned' && ride.driverName) {
        setTripState((prev) => {
          if (prev.status === 'driver_assigned' || prev.status === 'in_trip' || prev.status === 'completed') {
            return prev;
          }
          return {
            ...prev,
            status: 'driver_assigned',
            totalFare: ride.fare || prev.totalFare,
            driver: {
              id: ride.driverUid || 'live_drv',
              name: ride.driverName || 'Водитель KG',
              rating: ride.driverRating || 4.96,
              totalTrips: 840,
              photoUrl: '',
              carModel: ride.driverCarModel || 'Toyota Camry',
              carColor: 'Белый',
              carPlate: ride.driverCarPlate || '01 KG 777 BSK',
              phone: '+996 555 00-11-22',
              position: {
                x: prev.pickup.coords.x + 8,
                y: prev.pickup.coords.y - 8,
                lat: ride.driverLat || (prev.pickup.coords.lat ?? 42.8765) + 0.008,
                lng: ride.driverLng || (prev.pickup.coords.lng ?? 74.6037) + 0.008
              },
              heading: 45
            },
            driverProgress: 0
          };
        });
      } else if (ride.status === 'driver_arrived') {
        setTripState((prev) => ({ ...prev, status: 'driver_arrived', driverProgress: 1 }));
      } else if (ride.status === 'in_trip') {
        setTripState((prev) => ({ ...prev, status: 'in_trip', currentSpeed: 48 }));
      } else if (ride.status === 'completed') {
        setTripState((prev) => {
          if (prev.status !== 'completed') {
            setCompletedTripForModal(prev);
          }
          return { ...prev, status: 'completed', tripProgress: 1, currentSpeed: 0 };
        });
      }
    });

    const unsubBids = subscribeToRideBids(activeFirestoreRideId, authUser.uid, (bids) => {
      setFirestoreBids(bids);
    });

    return () => {
      unsubRide();
      unsubBids();
    };
  }, [activeFirestoreRideId, authUser]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Вы вошли через Google · Облако синхронизировано');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error('Google Sign-In error:', err);
        showToast('Не удалось открыть окно входа Google');
      }
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
      setPassengerProfile(INITIAL_PASSENGER_PROFILE);
      showToast('Вы вышли из аккаунта Google');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleUpdateProfile = async (updated: PassengerProfile) => {
    const prevCards = passengerProfile.savedCards;
    setPassengerProfile(updated);
    if (updated.businessProfile?.activeMode) {
      setBillingProfile(updated.businessProfile.activeMode);
    }

    if (!authUser) return;
    try {
      await updateUserProfileInFirestore(authUser.uid, updated);

      // Sync newly added cards
      const prevIds = new Set(prevCards.map((c) => c.id));
      for (const card of updated.savedCards) {
        if (!prevIds.has(card.id)) {
          await addUserCardToFirestore(authUser.uid, card);
        }
      }
      // Sync removed cards
      const newIds = new Set(updated.savedCards.map((c) => c.id));
      for (const oldCard of prevCards) {
        if (!newIds.has(oldCard.id)) {
          await deleteUserCardFromFirestore(authUser.uid, oldCard.id);
        }
      }
    } catch (err) {
      console.error('Profile save error:', err);
    }
  };

  // ==================== REAL OSRM ROAD ROUTING ====================
  const pickupLat = tripState.pickup.coords.lat ?? currentCity.centerCoordinates.lat;
  const pickupLng = tripState.pickup.coords.lng ?? currentCity.centerCoordinates.lng;
  const destLat = tripState.destination.coords.lat ?? currentCity.centerCoordinates.lat - 0.015;
  const destLng = tripState.destination.coords.lng ?? currentCity.centerCoordinates.lng + 0.015;

  useEffect(() => {
    let cancelled = false;
    fetchRoadRoute({ lat: pickupLat, lng: pickupLng }, { lat: destLat, lng: destLng }).then((res) => {
      if (cancelled) return;
      setRouteCoordinates(res.coordinates);
      setIsRealRoadRoute(res.isRealRoad);
      setRealRouteMetrics({
        distanceKm: res.distanceKm + (intermediateStop ? 1.5 : 0),
        durationMin: res.durationMin + (intermediateStop ? 4 : 0)
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pickupLat, pickupLng, destLat, destLng, intermediateStop]);

  // ==================== DYNAMIC FARE CALCULATION ====================
  const calculateDistance = useCallback(
    (p1: { x: number; y: number }, p2: { x: number; y: number }, cityId: CityId) => {
      if (realRouteMetrics) return realRouteMetrics.distanceKm;
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const euclidean = Math.sqrt(dx * dx + dy * dy);
      if (cityId === 'intercity') {
        return Math.round(euclidean * 6.5 + 180);
      }
      const dist = euclidean * 0.18 + 1.2 + (intermediateStop ? 1.5 : 0);
      return Math.round(dist * 10) / 10;
    },
    [intermediateStop, realRouteMetrics]
  );

  const plusDiscount = usePlusPoints ? Math.min(passengerProfile.plusPointsBalance || 0, 100) : 0;
  const speedMultiplier = pickupSpeedMode === 'wait_save' ? 0.85 : 1;
  const kgOneMultiplier = passengerProfile.isKgOneMember ? 0.93 : 1;

  useEffect(() => {
    if (tripState.status !== 'idle') return;
    const dist = calculateDistance(tripState.pickup.coords, tripState.destination.coords, selectedCityId);
    const waitExtraMin = pickupSpeedMode === 'wait_save' ? 5 : 0;
    const estMin =
      (realRouteMetrics
        ? realRouteMetrics.durationMin + (surgeMultiplier > 1 ? 3 : 0)
        : selectedCityId === 'intercity'
        ? Math.round((dist / 60) * 60)
        : Math.round(dist * 2.3 + 3 + (surgeMultiplier > 1 ? 4 : 0))) + waitExtraMin;

    const loadersFee = tripState.tariff.id === 'cargo' ? cargoLoaders * 200 : 0;
    const isHourly = tripState.tariff.id === 'hourly';
    const baseFare = isHourly
      ? hourlyHours * 650 * currentCity.basePriceMultiplier * kgOneMultiplier + priorityBoost
      : (tripState.tariff.basePrice + dist * tripState.tariff.pricePerKm * currentCity.basePriceMultiplier) *
          surgeMultiplier *
          speedMultiplier *
          kgOneMultiplier +
        loadersFee +
        priorityBoost;
    const finalFare = Math.max(50, Math.round(baseFare - tripState.promoDiscount - plusDiscount));

    setTripState((prev) => ({
      ...prev,
      cityId: selectedCityId,
      distanceKm: isHourly ? hourlyHours * 20 : dist,
      estimatedMinutes: isHourly ? hourlyHours * 60 : estMin,
      totalFare: finalFare,
      surgeMultiplier,
      driverComment,
      orderForOther,
      cargoLoaders,
      priorityBoostFee: priorityBoost,
      pickupSpeedMode,
      flightNumber: flightNumber || undefined,
      comfortPrefs,
      kgOneActive: Boolean(passengerProfile.isKgOneMember),
      hourlyHours: isHourly ? hourlyHours : undefined,
      hourlyPreset: isHourly ? hourlyPreset : undefined,
      billingProfile,
      usePlusPoints,
      scheduledTime,
      pricingMode
    }));
    setOfferedFare(Math.max(50, Math.round((finalFare * 0.9) / 10) * 10));
  }, [
    tripState.pickup.coords,
    tripState.destination.coords,
    tripState.tariff,
    tripState.promoDiscount,
    tripState.status,
    selectedCityId,
    currentCity.basePriceMultiplier,
    surgeMultiplier,
    speedMultiplier,
    kgOneMultiplier,
    pickupSpeedMode,
    flightNumber,
    comfortPrefs,
    passengerProfile.isKgOneMember,
    hourlyHours,
    hourlyPreset,
    billingProfile,
    cargoLoaders,
    priorityBoost,
    plusDiscount,
    usePlusPoints,
    driverComment,
    orderForOther,
    scheduledTime,
    pricingMode,
    realRouteMetrics,
    calculateDistance
  ]);

  const calculatedPrices = useMemo(() => {
    const res: Record<TariffId, number> = {} as Record<TariffId, number>;
    const dist = tripState.distanceKm;
    TARIFFS.forEach((t) => {
      if (t.id === 'hourly') {
        const hourlyBase = hourlyHours * 650 * currentCity.basePriceMultiplier * kgOneMultiplier + priorityBoost;
        res[t.id] = Math.max(50, Math.round(hourlyBase - tripState.promoDiscount - plusDiscount));
        return;
      }
      const loadersFee = t.id === 'cargo' ? cargoLoaders * 200 : 0;
      const base =
        (t.basePrice + dist * t.pricePerKm * currentCity.basePriceMultiplier) *
          surgeMultiplier *
          speedMultiplier *
          kgOneMultiplier +
        loadersFee +
        priorityBoost;
      res[t.id] = Math.max(50, Math.round(base - tripState.promoDiscount - plusDiscount));
    });
    return res;
  }, [
    tripState.distanceKm,
    tripState.promoDiscount,
    currentCity.basePriceMultiplier,
    surgeMultiplier,
    speedMultiplier,
    kgOneMultiplier,
    hourlyHours,
    cargoLoaders,
    priorityBoost,
    plusDiscount
  ]);

  // Subtle roaming of nearby drivers
  useEffect(() => {
    const interval = setInterval(() => {
      setNearbyDrivers((prev) =>
        prev.map((drv) => {
          const deltaX = (Math.random() - 0.5) * 1.2;
          const deltaY = (Math.random() - 0.5) * 1.2;
          const newX = Math.max(10, Math.min(90, drv.position.x + deltaX));
          const newY = Math.max(10, Math.min(90, drv.position.y + deltaY));
          const newHeading = (drv.heading + (Math.random() - 0.5) * 20 + 360) % 360;
          return {
            ...drv,
            position: { x: newX, y: newY },
            heading: newHeading
          };
        })
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Driver search and automatic match (respects Ladies Taxi & Green EV pools)
  useEffect(() => {
    if (tripState.status !== 'searching') return;

    const timer = setTimeout(() => {
      const pool =
        tripState.tariff.id === 'ladies'
          ? FEMALE_DRIVERS
          : tripState.tariff.id === 'green'
          ? EV_DRIVERS
          : nearbyDrivers;
      const driver = pool[Math.floor(Math.random() * pool.length)] || INITIAL_DRIVERS[0];
      setTripState((prev) => ({
        ...prev,
        status: 'driver_assigned',
        driver: {
          ...driver,
          position: {
            x: Math.max(15, prev.pickup.coords.x + (Math.random() - 0.5) * 15),
            y: Math.max(15, prev.pickup.coords.y + (Math.random() - 0.5) * 15),
            lat: (prev.pickup.coords.lat ?? currentCity.centerCoordinates.lat) + 0.008,
            lng: (prev.pickup.coords.lng ?? currentCity.centerCoordinates.lng) + 0.008
          }
        },
        driverProgress: 0
      }));
    }, priorityBoost > 0 ? 1800 : 2800);

    return () => clearTimeout(timer);
  }, [tripState.status, tripState.tariff.id, nearbyDrivers, priorityBoost, currentCity.centerCoordinates]);

  // Bidding Mode: spawn realistic nearby driver counter-offers
  useEffect(() => {
    if (tripState.status !== 'bidding') return;

    const pool =
      tripState.tariff.id === 'ladies'
        ? FEMALE_DRIVERS
        : tripState.tariff.id === 'green'
        ? EV_DRIVERS
        : INITIAL_DRIVERS;
    const t1 = setTimeout(() => {
      const drv = pool[0];
      setSimulatedBids((prev) => {
        if (prev.some((b) => b.driverUid === drv.id)) return prev;
        return [
          ...prev,
          {
            id: `sim_bid_1_${Date.now()}`,
            rideId: tripState.id,
            driverUid: drv.id,
            driverName: drv.name,
            carModel: drv.carModel,
            carPlate: drv.carPlate,
            rating: drv.rating,
            etaMinutes: 3,
            price: offeredFare + 20,
            status: 'pending'
          }
        ];
      });
    }, 1100);

    const t2 = setTimeout(() => {
      const drv = pool[1] || pool[0];
      setSimulatedBids((prev) => {
        if (prev.some((b) => b.driverUid === drv.id)) return prev;
        return [
          ...prev,
          {
            id: `sim_bid_2_${Date.now()}`,
            rideId: tripState.id,
            driverUid: drv.id,
            driverName: drv.name,
            carModel: drv.carModel,
            carPlate: drv.carPlate,
            rating: drv.rating,
            etaMinutes: 2,
            price: offeredFare,
            status: 'pending'
          }
        ];
      });
    }, 2400);

    const t3 = setTimeout(() => {
      const drv = pool[2] || pool[0];
      setSimulatedBids((prev) => {
        if (prev.some((b) => b.driverUid === drv.id)) return prev;
        return [
          ...prev,
          {
            id: `sim_bid_3_${Date.now()}`,
            rideId: tripState.id,
            driverUid: drv.id,
            driverName: drv.name,
            carModel: drv.carModel,
            carPlate: drv.carPlate,
            rating: drv.rating,
            etaMinutes: 5,
            price: Math.max(50, offeredFare + 10),
            status: 'pending'
          }
        ];
      });
    }, 3900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [tripState.status, tripState.tariff.id, tripState.id, offeredFare]);

  // Live progress ticker along real road route
  useEffect(() => {
    if (tripState.status === 'driver_assigned') {
      const interval = setInterval(() => {
        setTripState((prev) => {
          if (prev.driverProgress >= 1) {
            return { ...prev, status: 'driver_arrived', driverProgress: 1 };
          }
          return { ...prev, driverProgress: prev.driverProgress + 0.08 };
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    if (tripState.status === 'driver_arrived') {
      const timeout = setTimeout(() => {
        setTripState((prev) => ({
          ...prev,
          status: 'in_trip',
          tripProgress: 0,
          currentSpeed: 45
        }));
      }, 3500);
      return () => clearTimeout(timeout);
    }

    if (tripState.status === 'in_trip') {
      const interval = setInterval(() => {
        setTripState((prev) => {
          if (prev.tripProgress >= 1) {
            setCompletedTripForModal(prev);
            return { ...prev, status: 'completed', tripProgress: 1, currentSpeed: 0 };
          }
          const randomSpeed = Math.floor(Math.random() * 20) + 42;
          return {
            ...prev,
            tripProgress: prev.tripProgress + 0.06,
            currentSpeed: randomSpeed
          };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [tripState.status]);

  // Subtle Uber audio chimes when ride status progresses
  useEffect(() => {
    const prev = prevTripStatusRef.current;
    const curr = tripState.status;
    prevTripStatusRef.current = curr;
    if (!soundEnabled || prev === curr) return;
    if (curr === 'driver_assigned') playRideChime('matched');
    else if (curr === 'driver_arrived') playRideChime('arrived');
    else if (curr === 'completed') playRideChime('completed');
  }, [tripState.status, soundEnabled]);

  // Combined live Firestore + simulated bids
  const allActiveBids = useMemo(() => {
    const merged = [...firestoreBids, ...simulatedBids].filter(
      (b) => !declinedBidIds.includes(b.id)
    );
    return merged.sort((a, b) => a.price - b.price);
  }, [firestoreBids, simulatedBids, declinedBidIds]);

  // ==================== HANDLERS ====================
  const handleSelectCity = (cityId: CityId) => {
    setSelectedCityId(cityId);
    const newCity = CITIES.find((c) => c.id === cityId) || CITIES[0];
    const p1 = newCity.landmarks[0] || { name: { ru: 'Центр', kg: 'Борбор', en: 'Center' }, x: 45, y: 45, lat: newCity.centerCoordinates.lat, lng: newCity.centerCoordinates.lng };
    const p2 = newCity.landmarks[1] || { name: { ru: 'Вокзал / Аэропорт', kg: 'Вокзал', en: 'Airport' }, x: 30, y: 65, lat: newCity.centerCoordinates.lat - 0.015, lng: newCity.centerCoordinates.lng + 0.015 };

    setTripState((prev) => ({
      ...prev,
      cityId,
      pickup: {
        name: p1.name[lang] || p1.name.ru,
        coords: { x: p1.x, y: p1.y, lat: p1.lat, lng: p1.lng }
      },
      destination: {
        name: p2.name[lang] || p2.name.ru,
        coords: { x: p2.x, y: p2.y, lat: p2.lat, lng: p2.lng }
      },
      status: 'idle',
      driverProgress: 0,
      tripProgress: 0
    }));
  };

  const handleSwapLocations = () => {
    setTripState((prev) => ({
      ...prev,
      pickup: prev.destination,
      destination: prev.pickup
    }));
  };

  const handleRequestRide = async () => {
    const nextStatus = pricingMode === 'bidding' ? 'bidding' : 'searching';
    setSimulatedBids([]);
    setFirestoreBids([]);
    setDeclinedBidIds([]);
    setSheetSnap('half');

    const newTripId = `trip_${Date.now()}`;
    const shareCode = `KG-${Math.floor(100000 + Math.random() * 900000)}`;

    setTripState((prev) => ({
      ...prev,
      id: newTripId,
      status: nextStatus,
      pricingMode,
      offeredFare: pricingMode === 'bidding' ? offeredFare : undefined,
      shareCode,
      driverProgress: 0,
      tripProgress: 0
    }));

    const localRideRecord: LiveRideDoc = {
      id: newTripId,
      passengerUid: authUser?.uid || passengerProfile.id,
      passengerName: passengerProfile.name,
      cityId: selectedCityId,
      pickupName: tripState.pickup.name,
      pickupLat,
      pickupLng,
      destName: tripState.destination.name,
      destLat,
      destLng,
      tariffId: tripState.tariff.id,
      tariffName: tripState.tariff.name.ru,
      paymentMethod: tripState.paymentMethod,
      pricingMode,
      fare: pricingMode === 'bidding' ? offeredFare : tripState.totalFare,
      offeredFare: pricingMode === 'bidding' ? offeredFare : undefined,
      distanceKm: tripState.distanceKm,
      estimatedMinutes: tripState.estimatedMinutes,
      status: nextStatus,
      safetyPin: '7429',
      shareCode
    };

    setAllLiveRides((prev) => [localRideRecord, ...prev]);
    setLiveOpenRides((prev) => [localRideRecord, ...prev]);

    if (authUser) {
      try {
        const fsRideId = await createLiveRideInFirestore({
          passengerUid: authUser.uid,
          passengerName: passengerProfile.name,
          cityId: selectedCityId,
          pickupName: tripState.pickup.name,
          pickupLat,
          pickupLng,
          destName: tripState.destination.name,
          destLat,
          destLng,
          tariffId: tripState.tariff.id,
          tariffName: tripState.tariff.name.ru,
          paymentMethod: tripState.paymentMethod,
          pricingMode,
          fare: pricingMode === 'bidding' ? offeredFare : tripState.totalFare,
          offeredFare: pricingMode === 'bidding' ? offeredFare : undefined,
          distanceKm: tripState.distanceKm,
          estimatedMinutes: tripState.estimatedMinutes,
          status: nextStatus,
          safetyPin: '7429',
          shareCode
        });
        setActiveFirestoreRideId(fsRideId);
      } catch (err) {
        console.error('Live ride create error:', err);
      }
    }
  };

  const handleAdjustOffer = (delta: number) => {
    const nextPrice = Math.max(50, offeredFare + delta);
    setOfferedFare(nextPrice);
    if (delta > 0 && tripState.status === 'bidding') {
      const pool =
        tripState.tariff.id === 'ladies'
          ? FEMALE_DRIVERS
          : tripState.tariff.id === 'green'
          ? EV_DRIVERS
          : INITIAL_DRIVERS;
      const drv = pool[Math.floor(Math.random() * pool.length)];
      setTimeout(() => {
        setSimulatedBids((prev) => [
          {
            id: `sim_bid_boost_${Date.now()}`,
            rideId: tripState.id,
            driverUid: drv.id,
            driverName: drv.name,
            carModel: drv.carModel,
            carPlate: drv.carPlate,
            rating: drv.rating,
            etaMinutes: 2,
            price: nextPrice,
            status: 'pending'
          },
          ...prev.filter((b) => b.driverUid !== drv.id)
        ]);
      }, 900);
    }
  };

  const handleAcceptBid = async (bid: BidOffer) => {
    setTripState((prev) => ({
      ...prev,
      status: 'driver_assigned',
      totalFare: bid.price,
      driver: {
        id: bid.driverUid,
        name: bid.driverName,
        rating: bid.rating,
        totalTrips: 920,
        photoUrl: '',
        carModel: bid.carModel,
        carColor: 'Белый',
        carPlate: bid.carPlate,
        phone: '+996 555 77-88-99',
        position: {
          x: Math.max(15, prev.pickup.coords.x + 10),
          y: Math.max(15, prev.pickup.coords.y - 10),
          lat: pickupLat + 0.008,
          lng: pickupLng + 0.008
        },
        heading: 60
      },
      driverProgress: 0
    }));

    if (activeFirestoreRideId && authUser) {
      try {
        await acceptBidOnRideByPassenger(activeFirestoreRideId, bid);
      } catch (err) {
        console.error('Accept bid Firestore error:', err);
      }
    }
  };

  const handleDeclineBid = (bidId: string) => {
    setDeclinedBidIds((prev) => [...prev, bidId]);
  };

  const handleCancelTrip = async () => {
    if (activeFirestoreRideId && authUser) {
      try {
        await cancelLiveRideByPassenger(activeFirestoreRideId);
      } catch (err) {
        console.error('Cancel ride Firestore error:', err);
      }
    }
    setActiveFirestoreRideId(null);
    setSimulatedBids([]);
    setFirestoreBids([]);
    setTripState((prev) => ({
      ...prev,
      status: 'idle',
      driver: undefined,
      driverProgress: 0,
      tripProgress: 0
    }));
  };

  const handleSimulateArrival = () => {
    if (tripState.status === 'driver_assigned') {
      setTripState((prev) => ({ ...prev, status: 'driver_arrived', driverProgress: 1 }));
    } else if (tripState.status === 'in_trip') {
      setCompletedTripForModal(tripState);
      setTripState((prev) => ({ ...prev, status: 'completed', tripProgress: 1 }));
    }
  };

  const handleApplyPromo = (code: string) => {
    const validCodes = ['SALAM', 'BISHKEK', 'OSH', 'UBERKG', 'KGTAXI'];
    if (validCodes.includes(code.toUpperCase())) {
      setTripState((prev) => ({ ...prev, promoDiscount: 45 }));
      return true;
    }
    return false;
  };

  const handleFinishRating = async (rating: number, tip: number) => {
    if (completedTripForModal) {
      const historyItem: TripHistoryItem = {
        id: `hist_${Date.now()}`,
        date: 'Только что',
        cityName: currentCity.name.ru,
        pickup: completedTripForModal.pickup.name,
        destination: completedTripForModal.destination.name,
        tariffName: completedTripForModal.tariff.name.ru,
        carInfo: completedTripForModal.driver?.carModel || 'Toyota Camry',
        fare: completedTripForModal.totalFare + tip,
        paymentMethod: completedTripForModal.paymentMethod.toUpperCase(),
        rating,
        billingProfile: completedTripForModal.billingProfile || billingProfile
      };
      setTripHistory((prev) => [historyItem, ...prev]);

      const cashbackRate = passengerProfile.isKgOneMember ? 0.1 : 0.05;
      const cashbackEarned = Math.round(completedTripForModal.totalFare * cashbackRate);
      const updatedProfile: PassengerProfile = {
        ...passengerProfile,
        totalCompletedRides: passengerProfile.totalCompletedRides + 1,
        plusPointsBalance: Math.max(0, (passengerProfile.plusPointsBalance || 0) - plusDiscount + cashbackEarned)
      };
      setPassengerProfile(updatedProfile);

      if (authUser) {
        try {
          await saveTripHistoryToFirestore(authUser.uid, historyItem);
          await updateUserProfileInFirestore(authUser.uid, updatedProfile);
        } catch (err) {
          console.error('Trip history save error:', err);
        }
      }
    }
    setUsePlusPoints(false);
    setCompletedTripForModal(null);
    setActiveFirestoreRideId(null);
    setTripState((prev) => ({
      ...prev,
      status: 'idle',
      driver: undefined,
      driverProgress: 0,
      tripProgress: 0
    }));
  };

  const handleRepeatTrip = (item: TripHistoryItem) => {
    setTripState((prev) => ({
      ...prev,
      pickup: { ...prev.pickup, name: item.pickup },
      destination: { ...prev.destination, name: item.destination },
      status: 'idle'
    }));
  };

  const handleReportLostItem = (tripId: string, summary: string) => {
    setTripHistory((prev) =>
      prev.map((item) => (item.id === tripId ? { ...item, lostItemReported: summary } : item))
    );
    showToast(`Заявка о забытой вещи отправлена водителю (${summary})`);
  };

  const handleRealCoordsSelect = (point: { lat: number; lng: number; name?: string }) => {
    const cityLat = currentCity.centerCoordinates.lat;
    const cityLng = currentCity.centerCoordinates.lng;
    const estimatedX = Math.max(5, Math.min(95, 50 + (point.lng - cityLng) * 400));
    const estimatedY = Math.max(5, Math.min(95, 50 + (point.lat - cityLat) * 400));

    if (selectionMode === 'pickup') {
      setTripState((prev) => ({
        ...prev,
        pickup: {
          name: point.name || `Точка (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`,
          coords: { x: estimatedX, y: estimatedY, lat: point.lat, lng: point.lng }
        }
      }));
      setSelectionMode('destination');
    } else {
      setTripState((prev) => ({
        ...prev,
        destination: {
          name: point.name || `Точка (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`,
          coords: { x: estimatedX, y: estimatedY, lat: point.lat, lng: point.lng }
        }
      }));
    }
  };

  const handleSelectFrom2Gis = (name: string, coords?: { lat: number; lng: number }) => {
    const lat = coords?.lat || 42.8756;
    const lng = coords?.lng || 74.6143;
    handleRealCoordsSelect({ lat, lng, name });
    setActiveView('map');
  };

  const handleBookIntercityRoute = (
    route: IntercityRoute,
    rideType: 'per_seat' | 'full_car',
    seatsCount: number,
    selectedSeats: string[],
    departureTime: string,
    station: string
  ) => {
    const vipExtra = rideType === 'per_seat' && selectedSeats.includes('1A') ? 100 : 0;
    const fare =
      rideType === 'per_seat'
        ? route.pricePerSeat * seatsCount + vipExtra
        : route.priceFullCar;

    const fromCoords = resolveIntercityCoords(route.fromCity, { lat: 42.8765, lng: 74.6037 });
    const toCoords = resolveIntercityCoords(route.toCity, { lat: 40.514, lng: 72.8161 });
    const seatsSummary =
      rideType === 'full_car' ? 'Вся машина' : `Места: ${selectedSeats.join(', ')}`;

    setSelectedCityId('intercity');
    setAppMode('passenger');
    setTripState((prev) => ({
      ...prev,
      cityId: 'intercity',
      pickup: {
        name: `${route.fromCity} · ${station} (${departureTime})`,
        coords: { x: 35, y: 35, lat: fromCoords.lat, lng: fromCoords.lng }
      },
      destination: {
        name: `${route.toCity} (${seatsSummary})`,
        coords: { x: 75, y: 70, lat: toCoords.lat, lng: toCoords.lng }
      },
      distanceKm: route.distanceKm,
      estimatedMinutes: Math.round(route.approxHours * 60),
      totalFare: fare,
      status: 'searching',
      options: {
        ...prev.options,
        intercitySeatsCount: seatsCount,
        intercityRideType: rideType
      }
    }));
    setActiveView('map');
    showToast(`Межгород: ${route.fromCity} → ${route.toCity} · ${departureTime}`);
  };

  const handleOrderFoodDelivery = (
    restaurant: FoodRestaurant,
    cart: Array<{ dish: FoodDish; count: number }>,
    total: number
  ) => {
    const summary = cart.map((c) => `${c.dish.name} ×${c.count}`).join(', ');
    const deliveryTariff = TARIFFS.find((t) => t.id === 'delivery') || TARIFFS[0];
    setSelectedCityId('bishkek');
    setAppMode('passenger');
    setTripState((prev) => ({
      ...prev,
      cityId: 'bishkek',
      tariff: deliveryTariff,
      pickup: {
        name: `${restaurant.name} (${summary.slice(0, 26)})`,
        coords: { x: 52, y: 46, lat: 42.875, lng: 74.618 }
      },
      destination: {
        name: passengerProfile.homeAddress || 'Ваш адрес доставки',
        coords: { x: 32, y: 72, lat: 42.8335, lng: 74.5645 }
      },
      totalFare: total,
      status: 'searching'
    }));
    setActiveView('map');
  };

  // ==================== DRIVER & DISPATCHER HANDLERS ====================
  const handleRegisterDriver = async (newDrv: DriverProfile) => {
    setDriverProfile(newDrv);
    setDriverApplications((prev) => [newDrv, ...prev.filter((d) => d.id !== newDrv.id)]);
    setAppMode('driver');
    showToast('Анкета водителя отправлена диспетчеру на проверку');

    if (authUser) {
      try {
        await submitDriverApplicationInFirestore(authUser.uid, newDrv);
      } catch (err) {
        console.error('Driver application Firestore error:', err);
      }
    }
  };

  const handleDriverAcceptLiveRide = async (ride: LiveRideDoc) => {
    if (authUser) {
      await acceptLiveRideAsDriver(
        ride.id,
        authUser.uid,
        driverProfile,
        ride.fare,
        currentCity.centerCoordinates.lat,
        currentCity.centerCoordinates.lng
      );
    }
    setLiveOpenRides((prev) => prev.filter((r) => r.id !== ride.id));
    setAllLiveRides((prev) =>
      prev.map((r) =>
        r.id === ride.id ? { ...r, status: 'driver_assigned', driverName: driverProfile.name } : r
      )
    );
  };

  const handleDriverSendCounterBid = async (ride: LiveRideDoc, price: number) => {
    if (authUser) {
      await submitDriverBidInFirestore(
        ride.id,
        ride.passengerUid,
        authUser.uid,
        driverProfile,
        price
      );
    }
    showToast(`Встречная цена ${price} сом отправлена пассажиру`);
  };

  const handleDriverUpdateRideStatus = async (
    rideId: string,
    status: 'driver_arrived' | 'in_trip' | 'completed'
  ) => {
    if (authUser) {
      await updateLiveRideStatusByDriver(rideId, status);
    }
    setAllLiveRides((prev) => prev.map((r) => (r.id === rideId ? { ...r, status } : r)));
  };

  const handleUpdateCitySetting = async (setting: FleetCitySetting) => {
    setFleetSettings((prev) =>
      prev.map((item) => (item.cityId === setting.cityId ? setting : item))
    );
    if (setting.cityId === selectedCityId) {
      setSurgeMultiplier(setting.surgeMultiplier);
    }
    if (isAdminUser) {
      try {
        await saveFleetCitySettingAdmin(setting);
      } catch (err) {
        console.error('Save fleet settings error:', err);
      }
    }
  };

  const handleApproveDriver = async (driverId: string, status: 'approved' | 'rejected') => {
    setDriverApplications((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? { ...d, verificationStatus: status, isVerified: status === 'approved' }
          : d
      )
    );
    if (driverProfile.id === driverId) {
      setDriverProfile((prev) => ({
        ...prev,
        verificationStatus: status,
        isVerified: status === 'approved'
      }));
    }
    showToast(status === 'approved' ? 'Водитель одобрен и допущен на линию' : 'Заявка водителя отклонена');
    if (isAdminUser) {
      try {
        await updateDriverVerificationAdmin(driverId, status);
      } catch (err) {
        console.error('Approve driver Firestore error:', err);
      }
    }
  };

  // ==================== DRAGGABLE MOBILE BOTTOM SHEET ====================
  const cycleSheetSnap = () => {
    setSheetSnap((prev) =>
      prev === 'collapsed' ? 'half' : prev === 'half' ? 'expanded' : 'collapsed'
    );
  };

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
  };

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    if (dragStartYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - dragStartYRef.current;
    dragStartYRef.current = null;
    if (deltaY < -35) {
      setSheetSnap((prev) => (prev === 'collapsed' ? 'half' : 'expanded'));
    } else if (deltaY > 35) {
      setSheetSnap((prev) => (prev === 'expanded' ? 'half' : 'collapsed'));
    }
  };

  const mobileSheetHeightClass =
    sheetSnap === 'collapsed'
      ? 'h-[31vh]'
      : sheetSnap === 'expanded'
      ? 'h-[84vh]'
      : 'h-[56vh]';

  return (
    <div className="h-screen overflow-hidden bg-white text-black flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm shrink-0">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Pure Black Uber Header */}
      <TopBar
        currentCity={currentCity}
        cities={CITIES}
        onSelectCity={handleSelectCity}
        lang={lang}
        onSelectLang={setLang}
        appMode={appMode}
        onSelectAppMode={setAppMode}
        onOpenHistory={() => setIsHistoryOpen(true)}
        activeView={activeView}
        onToggle2GisView={() => setActiveView((prev) => (prev === 'map' ? '2gis' : 'map'))}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenIntercity={() => setIsIntercityModalOpen(true)}
        onOpenFoodDelivery={() => setIsFoodModalOpen(true)}
        userName={passengerProfile.name}
        isSignedIn={Boolean(authUser)}
        onGoogleLogin={handleGoogleLogin}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Subtle Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1200] px-4 py-2.5 rounded-full bg-black text-white text-xs font-semibold shadow-2xl border border-neutral-700 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {appMode === 'driver' ? (
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto uber-scroll bg-[#f6f6f6]">
            <DriverDashboard
              currentCity={currentCity}
              driverProfile={driverProfile}
              lang={lang}
              liveOpenRides={liveOpenRides}
              onAcceptLiveRide={handleDriverAcceptLiveRide}
              onSendCounterBid={handleDriverSendCounterBid}
              onUpdateLiveRideStatus={handleDriverUpdateRideStatus}
              onExitDriverMode={() => setAppMode('passenger')}
              onOpenRegister={() => setIsDriverRegisterOpen(true)}
            />
          </div>
        ) : appMode === 'dispatcher' ? (
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto uber-scroll bg-[#f6f6f6]">
            <DispatcherDashboard
              cities={CITIES}
              fleetSettings={fleetSettings}
              driverApplications={driverApplications}
              liveRides={allLiveRides}
              isAdminUser={isAdminUser}
              onUpdateCitySetting={handleUpdateCitySetting}
              onApproveDriver={handleApproveDriver}
              onSelectCityOnMap={(cityId) => {
                handleSelectCity(cityId);
                setAppMode('passenger');
              }}
              onExitDispatcher={() => setAppMode('passenger')}
            />
          </div>
        ) : (
          <>
            {/* Left Uber Panel (Desktop) / Draggable Bottom Sheet (Mobile < lg) */}
            <aside
              className={`fixed inset-x-0 bottom-0 z-30 flex flex-col bg-white rounded-t-3xl shadow-[0_-12px_36px_rgba(0,0,0,0.18)] border-t border-neutral-200 transition-[height] duration-300 ease-out ${mobileSheetHeightClass} lg:static lg:h-[calc(100vh-64px)] lg:w-[440px] xl:w-[470px] lg:shrink-0 lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r lg:z-20`}
            >
              {/* Tactile Mobile Drag Handle */}
              <div
                onTouchStart={handleSheetTouchStart}
                onTouchEnd={handleSheetTouchEnd}
                onClick={cycleSheetSnap}
                className="lg:hidden pt-2.5 pb-2 px-4 flex flex-col items-center justify-center cursor-pointer shrink-0 select-none border-b border-neutral-100"
              >
                <div className="w-11 h-1.5 rounded-full bg-neutral-300 mb-1" />
                <div className="flex items-center gap-2 text-[11px] font-semibold text-neutral-500">
                  <span>
                    {tripState.status === 'idle'
                      ? `${currentCity.name.ru} · от ${tripState.totalFare} сом`
                      : tripState.status === 'bidding'
                      ? `Торг · ${allActiveBids.length} предложений`
                      : `Поездка · ${tripState.totalFare} сом`}
                  </span>
                  <span className="text-neutral-400">
                    ({sheetSnap === 'expanded' ? 'свернуть' : 'потяните'})
                  </span>
                </div>
              </div>

              {/* Scrollable Sheet Body */}
              <div className="flex-1 overflow-y-auto uber-scroll p-3 sm:p-5">
                {tripState.status === 'idle' ? (
                  <BookingForm
                    currentCity={currentCity}
                    allCities={CITIES}
                    tariffs={TARIFFS}
                    onSelectCity={handleSelectCity}
                    tripState={tripState}
                    onUpdatePickup={(name, coords) =>
                      setTripState((prev) => ({
                        ...prev,
                        pickup: { name, coords: coords || prev.pickup.coords }
                      }))
                    }
                    onUpdateDestination={(name, coords) =>
                      setTripState((prev) => ({
                        ...prev,
                        destination: { name, coords: coords || prev.destination.coords }
                      }))
                    }
                    onUpdateIntermediateStop={(name) => setIntermediateStop(name || null)}
                    onRemoveIntermediateStop={() => setIntermediateStop(null)}
                    onSwapLocations={handleSwapLocations}
                    onSelectTariff={(tariff) => setTripState((prev) => ({ ...prev, tariff }))}
                    calculatedPrices={calculatedPrices}
                    onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                    onOpenQrPayment={() => setIsQrModalOpen(true)}
                    onOpenOptionsModal={() => setIsOptionsModalOpen(true)}
                    onRequestRide={handleRequestRide}
                    selectionMode={selectionMode}
                    onSetSelectionMode={setSelectionMode}
                    lang={lang}
                    onOpenIntercity={() => setIsIntercityModalOpen(true)}
                    onOpenProfile={() => setIsProfileModalOpen(true)}
                    onOpenFoodDelivery={() => setIsFoodModalOpen(true)}
                    surgeMultiplier={surgeMultiplier}
                    onToggleSurge={() => setSurgeMultiplier((prev) => (prev > 1 ? 1 : 1.3))}
                    driverComment={driverComment}
                    onUpdateDriverComment={setDriverComment}
                    orderForOther={orderForOther}
                    onUpdateOrderForOther={setOrderForOther}
                    cargoLoaders={cargoLoaders}
                    onUpdateCargoLoaders={setCargoLoaders}
                    plusPointsBalance={passengerProfile.plusPointsBalance ?? 240}
                    usePlusPoints={usePlusPoints}
                    onToggleUsePlusPoints={() => setUsePlusPoints((prev) => !prev)}
                    scheduledTime={scheduledTime}
                    onUpdateScheduledTime={setScheduledTime}
                    flightNumber={flightNumber}
                    onUpdateFlightNumber={setFlightNumber}
                    pickupSpeedMode={pickupSpeedMode}
                    onChangePickupSpeedMode={setPickupSpeedMode}
                    comfortPrefs={comfortPrefs}
                    onUpdateComfortPrefs={setComfortPrefs}
                    isKgOneMember={Boolean(passengerProfile.isKgOneMember)}
                    onToggleKgOne={() => {
                      const nextVal = !passengerProfile.isKgOneMember;
                      setPassengerProfile((prev) => ({ ...prev, isKgOneMember: nextVal }));
                      showToast(
                        nextVal
                          ? 'Подписка KG One активна: −7% на поездки и 10% кешбэк'
                          : 'Подписка KG One отключена'
                      );
                    }}
                    priorityBoost={priorityBoost}
                    pricingMode={pricingMode}
                    onChangePricingMode={setPricingMode}
                    offeredFare={offeredFare}
                    onChangeOfferedFare={setOfferedFare}
                    biddingEnabled={currentCityFleetSetting.biddingEnabled}
                    ladiesModeEnabled={currentCityFleetSetting.ladiesModeEnabled}
                    hourlyHours={hourlyHours}
                    onChangeHourlyHours={setHourlyHours}
                    hourlyPreset={hourlyPreset}
                    onChangeHourlyPreset={setHourlyPreset}
                    billingProfile={billingProfile}
                    onChangeBillingProfile={(mode) => {
                      setBillingProfile(mode);
                      setPassengerProfile((prev) => ({
                        ...prev,
                        businessProfile: {
                          enabled: true,
                          companyName: prev.businessProfile?.companyName || 'ОсОО «Ала-Тоо Тех»',
                          inn: prev.businessProfile?.inn || '01408201910234',
                          corporateEmail: prev.businessProfile?.corporateEmail || 'finance@alatoo-tech.kg',
                          monthlyLimitKgs: prev.businessProfile?.monthlyLimitKgs || 25000,
                          activeMode: mode
                        }
                      }));
                    }}
                    businessCompanyName={passengerProfile.businessProfile?.companyName}
                    homeAddress={passengerProfile.homeAddress}
                    workAddress={passengerProfile.workAddress}
                  />
                ) : tripState.status === 'bidding' ? (
                  <BiddingOffersPanel
                    offeredPrice={offeredFare}
                    recommendedPrice={tripState.totalFare}
                    pickupName={tripState.pickup.name}
                    destName={tripState.destination.name}
                    bids={allActiveBids}
                    onAdjustOffer={handleAdjustOffer}
                    onAcceptBid={handleAcceptBid}
                    onDeclineBid={handleDeclineBid}
                    onCancelBidding={handleCancelTrip}
                  />
                ) : (
                  <ActiveTripPanel
                    tripState={tripState}
                    onCancelTrip={handleCancelTrip}
                    onSimulateArrival={handleSimulateArrival}
                    onOpenQrPayment={() => setIsQrModalOpen(true)}
                    onUpdateDestinationInTrip={(newDestName) => {
                      setTripState((prev) => ({
                        ...prev,
                        destination: { ...prev.destination, name: newDestName },
                        totalFare: prev.totalFare + 40
                      }));
                      showToast(`Адрес назначения обновлён: ${newDestName}`);
                    }}
                    emergencyContactName={passengerProfile.safetySettings.emergencyContactName}
                    emergencyContactPhone={passengerProfile.safetySettings.emergencyContactPhone}
                    lang={lang}
                  />
                )}
              </div>
            </aside>

            {/* Full-Bleed Map Viewport (Full Height on Mobile & Desktop) */}
            <section className="flex-1 relative h-[calc(100vh-64px)] w-full">
              {activeView === '2gis' ? (
                <TwoGisEmbed onSelectAddress={handleSelectFrom2Gis} />
              ) : (
                <RealCityMap
                  currentCity={currentCity}
                  tripState={tripState}
                  nearbyDrivers={
                    tripState.tariff.id === 'ladies'
                      ? FEMALE_DRIVERS
                      : tripState.tariff.id === 'green'
                      ? EV_DRIVERS
                      : nearbyDrivers
                  }
                  routeCoordinates={routeCoordinates}
                  isRealRoadRoute={isRealRoadRoute}
                  onSelectCoords={handleRealCoordsSelect}
                  onGoogleRouteMetrics={handleGoogleRouteMetrics}
                  selectionMode={selectionMode}
                  onSwitchTo2Gis={() => setActiveView('2gis')}
                />
              )}
            </section>
          </>
        )}
      </main>

      {/* Offline PWA Banner */}
      <OfflineIndicator />

      {/* Modals */}
      <PaymentSelector
        methods={PAYMENT_METHODS}
        selectedMethod={tripState.paymentMethod}
        onSelectMethod={(methodId) => setTripState((prev) => ({ ...prev, paymentMethod: methodId }))}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      <QrPaymentModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        amount={pricingMode === 'bidding' && tripState.status === 'idle' ? offeredFare : tripState.totalFare}
        tripSummary={`${tripState.pickup.name} → ${tripState.destination.name}`}
        onPaymentConfirmed={(provider) => {
          setTripState((prev) => ({ ...prev, paymentMethod: provider }));
          showToast(`Оплата через ${provider === 'mbank' ? 'MBank QR' : 'О!Деньги ELQR'} подтверждена`);
        }}
      />

      <RideOptionsModal
        options={tripState.options}
        promoDiscount={tripState.promoDiscount}
        onOptionsChange={(options) => setTripState((prev) => ({ ...prev, options }))}
        onApplyPromo={handleApplyPromo}
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        lang={lang}
      />

      {completedTripForModal && (
        <TripCompletedModal
          trip={completedTripForModal}
          onFinishRating={handleFinishRating}
          lang={lang}
        />
      )}

      <TripHistoryModal
        history={tripHistory}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRepeatTrip={handleRepeatTrip}
        onReportLostItem={handleReportLostItem}
        businessCompanyName={passengerProfile.businessProfile?.companyName}
        businessInn={passengerProfile.businessProfile?.inn}
        lang={lang}
      />

      <PassengerProfileModal
        profile={passengerProfile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateProfile={handleUpdateProfile}
        isSignedIn={Boolean(authUser)}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
        lang={lang}
      />

      <DriverRegistrationModal
        isOpen={isDriverRegisterOpen}
        onClose={() => setIsDriverRegisterOpen(false)}
        onRegisterDriver={handleRegisterDriver}
        lang={lang}
      />

      <IntercityModal
        isOpen={isIntercityModalOpen}
        onClose={() => setIsIntercityModalOpen(false)}
        onBookRoute={handleBookIntercityRoute}
        lang={lang}
      />

      <FoodDeliveryModal
        isOpen={isFoodModalOpen}
        onClose={() => setIsFoodModalOpen(false)}
        onOrderDelivery={handleOrderFoodDelivery}
        lang={lang}
      />
    </div>
  );
}
