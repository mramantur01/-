/**
 * The website uses the SAME Firestore database as the KG Taxi Android app.
 * All rides are written in the app's format (passengerId, dropoffAddress, priceSom,
 * status SEARCHING/ASSIGNED/...), so orders from the site reach drivers in the app.
 * The functions keep their old names so the rest of the site works unchanged.
 */
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { CITIES } from '../data/kyrgyzstanData';
import {
  PassengerProfile,
  SavedCard,
  TripHistoryItem,
  DriverProfile,
  LiveRideDoc,
  BidOffer,
  FleetCitySetting,
  CityId
} from '../types/taxi';

const clampStr = (val: string | undefined, max: number, fallback = ''): string =>
  ((val || fallback) + '').trim().slice(0, max);

function logError(where: string, error: unknown) {
  console.warn(`[KG Taxi] ${where}:`, (error as Error)?.message || error);
}

// ---------- mapping between the site and the app ----------

export const cityNameRu = (id: CityId | string): string =>
  CITIES.find((c) => c.id === id)?.name.ru || 'Бишкек';

const cityIdFromName = (name: string): CityId =>
  (CITIES.find((c) => c.name.ru === name)?.id || 'bishkek') as CityId;

/** Site tariff id -> app tariff id (the app filters orders by these). */
const APP_TARIFF: Record<string, string> = {
  economy: 'econom',
  together: 'econom',
  green: 'green_ev',
  ladies: 'lady',
  comfort: 'comfort',
  comfort_plus: 'comfort_plus',
  business: 'business',
  hourly: 'hourly',
  minivan: 'minivan',
  cargo: 'cargo_15',
  delivery: 'courier'
};

const STATUS_FROM_APP: Record<string, LiveRideDoc['status']> = {
  SEARCHING: 'searching',
  BOOKED: 'driver_assigned',
  ASSIGNED: 'driver_assigned',
  ARRIVED: 'driver_arrived',
  IN_PROGRESS: 'in_trip',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const STATUS_TO_APP: Record<string, string> = {
  driver_arrived: 'ARRIVED',
  in_trip: 'IN_PROGRESS',
  completed: 'COMPLETED'
};

/** App ride document -> site LiveRideDoc. */
export function rideFromApp(id: string, d: Record<string, any>): LiveRideDoc {
  const pin = String(d.comment || '').match(/PIN (\d{4})/)?.[1];
  return {
    id,
    passengerUid: d.passengerId || '',
    passengerName: d.passengerName || 'Пассажир',
    driverUid: d.driverId || '',
    driverName: d.driverName || undefined,
    driverCarModel: d.driverCar || undefined,
    driverCarPlate: d.driverPlate || undefined,
    driverRating: typeof d.driverRatingAvg === 'number' && d.driverRatingAvg > 0 ? d.driverRatingAvg : undefined,
    cityId: cityIdFromName(d.city || ''),
    pickupName: d.pickupAddress || '',
    pickupLat: Number(d.pickupLat) || 0,
    pickupLng: Number(d.pickupLng) || 0,
    destName: d.dropoffAddress || '',
    destLat: Number(d.dropoffLat) || 0,
    destLng: Number(d.dropoffLng) || 0,
    tariffId: (Object.keys(APP_TARIFF).find((k) => APP_TARIFF[k] === d.tariffId) || 'economy') as any,
    tariffName: d.tariffName || (d.serviceType === 'INTERCITY' ? 'Межгород' : 'Такси'),
    paymentMethod: d.paymentMethod === 'CARD' ? 'elkart' : 'cash',
    pricingMode: 'fixed' as any,
    fare: Number(d.priceSom) || 0,
    distanceKm: 0,
    estimatedMinutes: 0,
    status: STATUS_FROM_APP[d.status] || 'searching',
    driverLat: typeof d.driverLat === 'number' ? d.driverLat : undefined,
    driverLng: typeof d.driverLng === 'number' ? d.driverLng : undefined,
    safetyPin: pin,
    shareCode: id.slice(-8).toUpperCase()
  };
}

// ==================== USER PROFILE (users/{uid}, app format) ====================
export async function syncUserProfileOnLogin(
  uid: string,
  name: string,
  email: string,
  fallbackProfile: PassengerProfile
): Promise<PassengerProfile> {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        ...fallbackProfile,
        id: uid,
        name: d.displayName || name,
        phone: d.phone || fallbackProfile.phone,
        email: d.email || email,
        homeAddress: d.homeAddress || '',
        workAddress: d.workAddress || '',
        defaultCity: cityIdFromName(d.preferredCity || 'Бишкек')
      };
    }
    await setDoc(ref, {
      userId: uid,
      displayName: clampStr(name, 80, 'Пассажир'),
      phone: clampStr(fallbackProfile.phone, 30),
      email: clampStr(email, 120),
      homeAddress: clampStr(fallbackProfile.homeAddress, 160),
      workAddress: clampStr(fallbackProfile.workAddress, 160),
      paymentMethod: 'CASH',
      kgOneActive: false,
      businessProfileActive: false,
      bonusPoints: 0,
      preferredCity: cityNameRu(fallbackProfile.defaultCity || 'bishkek'),
      language: 'RU',
      darkTheme: false,
      soundEnabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    logError('profile', error);
  }
  return { ...fallbackProfile, id: uid, name: clampStr(name, 80, 'Пассажир'), email };
}

export async function updateUserProfileInFirestore(uid: string, profile: PassengerProfile): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: clampStr(profile.name, 80, 'Пассажир'),
      phone: clampStr(profile.phone, 30),
      homeAddress: clampStr(profile.homeAddress, 160),
      workAddress: clampStr(profile.workAddress, 160),
      preferredCity: cityNameRu(profile.defaultCity || 'bishkek'),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    logError('profile update', error);
  }
}

// ==================== SAVED CARDS (online payments are not live yet) ====================
export function subscribeUserCards(_uid: string, onData: (cards: SavedCard[]) => void) {
  onData([]);
  return () => {};
}
export async function addUserCardToFirestore(_uid: string, _card: SavedCard): Promise<void> {}
export async function deleteUserCardFromFirestore(_uid: string, _cardId: string): Promise<void> {}

// ==================== TRIP HISTORY = my rides in the shared rides collection ====================
export function subscribeUserTripHistory(uid: string, onData: (items: TripHistoryItem[]) => void) {
  const q = query(collection(db, 'rides'), where('passengerId', '==', uid), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((r) => r.status === 'COMPLETED')
          .map((r) => ({
            id: r.id,
            date: r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('ru-RU') : '',
            cityName: r.city || '',
            pickup: r.pickupAddress || '',
            destination: r.dropoffAddress || '',
            tariffName: r.tariffName || 'Такси',
            carInfo: [r.driverCar, r.driverPlate].filter(Boolean).join(' • '),
            fare: Number(r.priceSom) || 0,
            paymentMethod: r.paymentMethod === 'CARD' ? 'Карта' : 'Наличные / QR',
            rating: r.driverRating
          }))
      );
    },
    (error) => logError('history', error)
  );
}

/** History is built from rides; nothing extra to save. */
export async function saveTripHistoryToFirestore(_uid: string, _item: TripHistoryItem): Promise<void> {}

// ==================== LIVE RIDES ====================
export async function createLiveRideInFirestore(ride: Omit<LiveRideDoc, 'id'>): Promise<string> {
  const ref = doc(collection(db, 'rides'));
  const isIntercity = ride.tariffId === ('intercity_seat' as any);
  const pin = clampStr(ride.safetyPin, 4) || String(1000 + Math.floor(Math.random() * 9000));
  const payload: Record<string, any> = {
    passengerId: ride.passengerUid,
    passengerName: clampStr(ride.passengerName, 80, 'Пассажир'),
    status: 'SEARCHING',
    driverId: null,
    serviceType: isIntercity ? 'INTERCITY' : 'TAXI',
    city: cityNameRu(ride.cityId),
    pickupAddress: clampStr(ride.pickupName, 200, 'Точка на карте'),
    dropoffAddress: clampStr(ride.destName, 200, 'Точка на карте'),
    pickupLat: Number(ride.pickupLat),
    pickupLng: Number(ride.pickupLng),
    dropoffLat: Number(ride.destLat),
    dropoffLng: Number(ride.destLng),
    priceSom: Math.max(1, Math.min(100000, Math.round(ride.fare))),
    paymentMethod: ride.paymentMethod === 'cash' ? 'CASH' : 'CASH',
    comment: `Заказ с сайта • PIN ${pin}`,
    tariffName: clampStr(ride.tariffName, 30, 'Такси'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  if (!isIntercity) payload.tariffId = APP_TARIFF[ride.tariffId] || 'econom';
  if (isIntercity) payload.seats = 1;
  await setDoc(ref, payload);
  return ref.id;
}

export function subscribeToSingleRide(rideId: string, onData: (ride: LiveRideDoc | null) => void) {
  return onSnapshot(
    doc(db, 'rides', rideId),
    (snap) => onData(snap.exists() ? rideFromApp(snap.id, snap.data()) : null),
    (error) => logError('ride', error)
  );
}

/** Open orders (drivers only, by the database rules). */
export function subscribeToOpenRides(onData: (rides: LiveRideDoc[]) => void) {
  const q = query(collection(db, 'rides'), where('status', '==', 'SEARCHING'), limit(50));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => rideFromApp(d.id, d.data()))),
    () => onData([])
  );
}

/** All active rides (dispatchers and the owner). */
export function subscribeToAllRidesAdmin(onData: (rides: LiveRideDoc[]) => void) {
  const q = query(collection(db, 'rides'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => rideFromApp(d.id, d.data()))),
    (error) => logError('all rides', error)
  );
}

/** Drivers take orders in the KG Taxi app (registration, photo check, PIN). */
export async function acceptLiveRideAsDriver(
  _rideId: string, _driverUid: string, _driverProfile: DriverProfile, _finalFare: number, _lat: number, _lng: number
): Promise<void> {
  throw new Error('Водители принимают заказы в приложении KG Taxi');
}

export async function updateLiveRideStatusByDriver(
  rideId: string,
  status: 'driver_assigned' | 'driver_arrived' | 'in_trip' | 'completed'
): Promise<void> {
  const app = STATUS_TO_APP[status];
  if (!app) return;
  await updateDoc(doc(db, 'rides', rideId), { status: app, updatedAt: serverTimestamp() });
}

export async function cancelLiveRideByPassenger(rideId: string, reason = 'Отменил на сайте'): Promise<void> {
  await updateDoc(doc(db, 'rides', rideId), {
    status: 'CANCELLED',
    cancelReason: reason.slice(0, 100),
    updatedAt: serverTimestamp()
  });
}

// ==================== BIDDING ("своя цена") is turned off: prices are set by the owner ====================
export async function acceptBidOnRideByPassenger(_rideId: string, _bid: BidOffer): Promise<void> {}
export async function submitDriverBidInFirestore(
  _rideId: string, _passengerUid: string, _driverUid: string, _profile: DriverProfile, _price: number
): Promise<void> {}
export function subscribeToRideBids(_rideId: string, _uid: string, onData: (bids: BidOffer[]) => void) {
  onData([]);
  return () => {};
}

// ==================== DRIVERS ====================
/** Driver registration needs documents and a photo check: it is done in the app. */
export async function submitDriverApplicationInFirestore(_uid: string, _drv: DriverProfile): Promise<void> {
  throw new Error('Регистрация водителя — в приложении KG Taxi: паспорт, права, ОСАГО и фотоконтроль.');
}

export function subscribeToAllDriversAdmin(onData: (drivers: DriverProfile[]) => void) {
  const q = query(collection(db, 'roles'), where('role', 'in', ['driver', 'driver_blocked']), limit(300));
  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const r = d.data();
          const [brand, ...model] = String(r.car || '').split(' ');
          return {
            id: d.id,
            name: r.name || 'Водитель',
            phone: r.payPhone || '',
            city: 'bishkek' as CityId,
            carBrand: brand || '',
            carModel: model.join(' '),
            carColor: '',
            carPlate: r.plate || '',
            carYear: 2020,
            licenseNumber: '',
            verificationStatus: r.role === 'driver' ? 'approved' : 'rejected',
            isVerified: r.role === 'driver',
            isOnline: false,
            rating: 5,
            totalTrips: 0,
            balanceKgs: 0,
            payoutMbankPhone: r.payPhone || ''
          } as DriverProfile;
        })
      ),
    () => onData([])
  );
}

/** Block or unblock a driver (approval of new drivers is in the dispatcher panel). */
export async function updateDriverVerificationAdmin(driverId: string, status: 'approved' | 'rejected'): Promise<void> {
  await updateDoc(doc(db, 'roles', driverId), {
    role: status === 'approved' ? 'driver' : 'driver_blocked',
    blocked: status !== 'approved'
  });
}

// ==================== FLEET SETTINGS = config/app commission ====================
export function subscribeToFleetSettings(onData: (settings: FleetCitySetting[]) => void) {
  return onSnapshot(
    doc(db, 'config', 'app'),
    (snap) => {
      const commission = Number(snap.data()?.commissionPercent) || 14;
      onData(
        CITIES.map((c) => ({
          cityId: c.id as CityId,
          surgeMultiplier: 1,
          commissionPercent: commission,
          ladiesModeEnabled: true,
          biddingEnabled: false
        }))
      );
    },
    () => onData([])
  );
}

export async function saveFleetCitySettingAdmin(setting: FleetCitySetting): Promise<void> {
  await updateDoc(doc(db, 'config', 'app'), {
    commissionPercent: Math.max(0, Math.min(50, Math.round(setting.commissionPercent))),
    updatedAt: serverTimestamp()
  });
}

export { Timestamp };
