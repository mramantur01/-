import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
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
  (val || fallback).trim().slice(0, max);

const safeId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.replace(/[^a-zA-Z0-9_-]/g, '');

// ==================== USER PROFILE ====================
export async function syncUserProfileOnLogin(
  uid: string,
  name: string,
  email: string,
  fallbackProfile: PassengerProfile
): Promise<PassengerProfile> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...fallbackProfile,
        id: uid,
        name: data.name || name,
        phone: data.phone || fallbackProfile.phone,
        email: data.email || email,
        defaultCity: data.defaultCity || fallbackProfile.defaultCity,
        homeAddress: data.homeAddress || '',
        workAddress: data.workAddress || '',
        totalCompletedRides: typeof data.totalCompletedRides === 'number' ? data.totalCompletedRides : 0,
        safetyRating: typeof data.safetyRating === 'number' ? data.safetyRating : 5.0,
        plusPointsBalance: typeof data.plusPointsBalance === 'number' ? data.plusPointsBalance : 240,
        safetySettings: {
          emergencyContactName: data.emergencyContactName || fallbackProfile.safetySettings.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone || fallbackProfile.safetySettings.emergencyContactPhone,
          safetyPinEnabled: data.safetyPinEnabled ?? true,
          isAudioRecordingEnabled: data.isAudioRecordingEnabled ?? true,
          autoShareTripWithContact: data.autoShareTripWithContact ?? true
        }
      };
    }

    await setDoc(ref, {
      uid,
      name: clampStr(name, 100, 'Пассажир KG'),
      phone: clampStr(fallbackProfile.phone, 32),
      email: clampStr(email, 120, 'user@kgtaxi.kg'),
      defaultCity: fallbackProfile.defaultCity || 'bishkek',
      homeAddress: clampStr(fallbackProfile.homeAddress, 160),
      workAddress: clampStr(fallbackProfile.workAddress, 160),
      totalCompletedRides: fallbackProfile.totalCompletedRides || 0,
      safetyRating: 5.0,
      plusPointsBalance: fallbackProfile.plusPointsBalance ?? 240,
      safetyPinEnabled: fallbackProfile.safetySettings.safetyPinEnabled,
      isAudioRecordingEnabled: fallbackProfile.safetySettings.isAudioRecordingEnabled,
      autoShareTripWithContact: fallbackProfile.safetySettings.autoShareTripWithContact,
      emergencyContactName: clampStr(fallbackProfile.safetySettings.emergencyContactName, 80),
      emergencyContactPhone: clampStr(fallbackProfile.safetySettings.emergencyContactPhone, 32),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      ...fallbackProfile,
      id: uid,
      name: clampStr(name, 100, 'Пассажир KG'),
      email: clampStr(email, 120)
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfileInFirestore(uid: string, profile: PassengerProfile): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      name: clampStr(profile.name, 100, 'Пассажир KG'),
      phone: clampStr(profile.phone, 32),
      defaultCity: profile.defaultCity,
      homeAddress: clampStr(profile.homeAddress, 160),
      workAddress: clampStr(profile.workAddress, 160),
      totalCompletedRides: Math.max(0, Math.min(100000, profile.totalCompletedRides || 0)),
      plusPointsBalance: Math.max(0, Math.min(1000000, profile.plusPointsBalance || 0)),
      safetyPinEnabled: Boolean(profile.safetySettings.safetyPinEnabled),
      isAudioRecordingEnabled: Boolean(profile.safetySettings.isAudioRecordingEnabled),
      autoShareTripWithContact: Boolean(profile.safetySettings.autoShareTripWithContact),
      emergencyContactName: clampStr(profile.safetySettings.emergencyContactName, 80),
      emergencyContactPhone: clampStr(profile.safetySettings.emergencyContactPhone, 32),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==================== SAVED CARDS ====================
export function subscribeUserCards(uid: string, onData: (cards: SavedCard[]) => void) {
  const path = `users/${uid}/cards`;
  const q = query(collection(db, 'users', uid, 'cards'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const cards: SavedCard[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          cardNumber: data.cardNumber,
          expiry: data.expiry,
          cardholderName: data.cardholderName,
          cardType: data.cardType,
          bankName: data.bankName,
          isDefault: Boolean(data.isDefault)
        };
      });
      onData(cards);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function addUserCardToFirestore(uid: string, card: SavedCard): Promise<void> {
  const cardId = safeId('card');
  const path = `users/${uid}/cards/${cardId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'cards', cardId), {
      uid,
      cardNumber: clampStr(card.cardNumber, 32),
      expiry: clampStr(card.expiry, 8, '12/28'),
      cardholderName: clampStr(card.cardholderName, 80, 'KG PASSENGER'),
      cardType: card.cardType,
      bankName: clampStr(card.bankName, 80, 'MBank'),
      isDefault: Boolean(card.isDefault),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteUserCardFromFirestore(uid: string, cardId: string): Promise<void> {
  const path = `users/${uid}/cards/${cardId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'cards', cardId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==================== TRIP HISTORY ====================
export function subscribeUserTripHistory(uid: string, onData: (items: TripHistoryItem[]) => void) {
  const path = `users/${uid}/trips`;
  const q = query(collection(db, 'users', uid, 'trips'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items: TripHistoryItem[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          date: data.date,
          cityName: data.cityName,
          pickup: data.pickup,
          destination: data.destination,
          tariffName: data.tariffName,
          carInfo: data.carInfo,
          fare: Number(data.fare) || 0,
          paymentMethod: data.paymentMethod,
          rating: data.rating
        };
      });
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function saveTripHistoryToFirestore(uid: string, item: TripHistoryItem): Promise<void> {
  const tripId = safeId('trip');
  const path = `users/${uid}/trips/${tripId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'trips', tripId), {
      uid,
      date: clampStr(item.date, 40, 'Сегодня'),
      cityName: clampStr(item.cityName, 60, 'Бишкек'),
      pickup: clampStr(item.pickup, 160),
      destination: clampStr(item.destination, 160),
      tariffName: clampStr(item.tariffName, 60),
      carInfo: clampStr(item.carInfo, 100),
      fare: Math.max(0, Math.min(500000, Number(item.fare) || 0)),
      paymentMethod: clampStr(item.paymentMethod, 40),
      rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ==================== LIVE RIDES (PASSENGER <-> DRIVER <-> DISPATCHER) ====================
export async function createLiveRideInFirestore(
  ride: Omit<LiveRideDoc, 'id'>
): Promise<string> {
  const rideId = safeId('ride');
  const path = `rides/${rideId}`;
  try {
    await setDoc(doc(db, 'rides', rideId), {
      passengerUid: ride.passengerUid,
      passengerName: clampStr(ride.passengerName, 80, 'Пассажир'),
      driverUid: '',
      cityId: ride.cityId,
      pickupName: clampStr(ride.pickupName, 160),
      pickupLat: Math.max(38, Math.min(45, ride.pickupLat)),
      pickupLng: Math.max(68, Math.min(82, ride.pickupLng)),
      destName: clampStr(ride.destName, 160),
      destLat: Math.max(38, Math.min(45, ride.destLat)),
      destLng: Math.max(68, Math.min(82, ride.destLng)),
      tariffId: clampStr(ride.tariffId, 32, 'economy'),
      tariffName: clampStr(ride.tariffName, 60, 'Эконом'),
      paymentMethod: ride.paymentMethod,
      pricingMode: ride.pricingMode,
      fare: Math.max(30, Math.min(500000, Math.round(ride.fare))),
      ...(ride.offeredFare ? { offeredFare: Math.max(30, Math.min(500000, Math.round(ride.offeredFare))) } : {}),
      distanceKm: Math.max(0, Math.min(2500, Number(ride.distanceKm) || 1)),
      estimatedMinutes: Math.max(1, Math.min(3000, Math.round(ride.estimatedMinutes) || 5)),
      status: ride.status,
      safetyPin: clampStr(ride.safetyPin || '7429', 6),
      shareCode: clampStr(ride.shareCode || rideId.slice(-8).toUpperCase(), 24),
      ...(ride.intercitySeats ? { intercitySeats: clampStr(ride.intercitySeats, 40) } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return rideId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToSingleRide(rideId: string, onData: (ride: LiveRideDoc | null) => void) {
  const path = `rides/${rideId}`;
  return onSnapshot(
    doc(db, 'rides', rideId),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData({ id: snap.id, ...(snap.data() as Omit<LiveRideDoc, 'id'>) });
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

export function subscribeToOpenRides(onData: (rides: LiveRideDoc[]) => void) {
  const path = 'rides';
  const q = query(collection(db, 'rides'), where('status', 'in', ['searching', 'bidding']));
  return onSnapshot(
    q,
    (snap) => {
      const rides = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LiveRideDoc, 'id'>)
      }));
      onData(rides);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeToAllRidesAdmin(onData: (rides: LiveRideDoc[]) => void) {
  const path = 'rides';
  return onSnapshot(
    collection(db, 'rides'),
    (snap) => {
      const rides = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LiveRideDoc, 'id'>)
      }));
      onData(rides);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function acceptLiveRideAsDriver(
  rideId: string,
  driverUid: string,
  driverProfile: DriverProfile,
  finalFare: number,
  driverLat: number,
  driverLng: number
): Promise<void> {
  const path = `rides/${rideId}`;
  try {
    await updateDoc(doc(db, 'rides', rideId), {
      driverUid,
      driverName: clampStr(driverProfile.name, 80),
      driverCarModel: clampStr(`${driverProfile.carBrand} ${driverProfile.carModel}`, 80),
      driverCarPlate: clampStr(driverProfile.carPlate, 24),
      driverRating: Math.max(1, Math.min(5, driverProfile.rating || 4.95)),
      fare: Math.max(30, Math.min(500000, Math.round(finalFare))),
      status: 'driver_assigned',
      driverLat: Math.max(38, Math.min(45, driverLat)),
      driverLng: Math.max(68, Math.min(82, driverLng)),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateLiveRideStatusByDriver(
  rideId: string,
  status: 'driver_assigned' | 'driver_arrived' | 'in_trip' | 'completed',
  driverLat?: number,
  driverLng?: number
): Promise<void> {
  const path = `rides/${rideId}`;
  try {
    const payload: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp()
    };
    if (typeof driverLat === 'number' && typeof driverLng === 'number') {
      payload.driverLat = Math.max(38, Math.min(45, driverLat));
      payload.driverLng = Math.max(68, Math.min(82, driverLng));
    }
    await updateDoc(doc(db, 'rides', rideId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelLiveRideByPassenger(rideId: string): Promise<void> {
  const path = `rides/${rideId}`;
  try {
    await updateDoc(doc(db, 'rides', rideId), {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function acceptBidOnRideByPassenger(
  rideId: string,
  bid: BidOffer
): Promise<void> {
  const path = `rides/${rideId}`;
  try {
    await updateDoc(doc(db, 'rides', rideId), {
      status: 'driver_assigned',
      fare: Math.max(30, Math.min(500000, Math.round(bid.price))),
      driverUid: clampStr(bid.driverUid, 128),
      driverName: clampStr(bid.driverName, 80),
      driverCarModel: clampStr(bid.carModel, 80),
      driverCarPlate: clampStr(bid.carPlate, 24),
      driverRating: Math.max(1, Math.min(5, bid.rating || 4.95)),
      updatedAt: serverTimestamp()
    });
    if (bid.isLiveFirestore) {
      await updateDoc(doc(db, 'rides', rideId, 'bids', bid.id), {
        status: 'accepted'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==================== LIVE BIDS ====================
export async function submitDriverBidInFirestore(
  rideId: string,
  passengerUid: string,
  driverUid: string,
  driverProfile: DriverProfile,
  price: number
): Promise<void> {
  const bidId = safeId('bid');
  const path = `rides/${rideId}/bids/${bidId}`;
  try {
    await setDoc(doc(db, 'rides', rideId, 'bids', bidId), {
      rideId,
      passengerUid,
      driverUid,
      driverName: clampStr(driverProfile.name, 80),
      carModel: clampStr(`${driverProfile.carBrand} ${driverProfile.carModel}`, 80),
      carPlate: clampStr(driverProfile.carPlate, 24),
      rating: Math.max(1, Math.min(5, driverProfile.rating || 4.95)),
      etaMinutes: 3,
      price: Math.max(30, Math.min(500000, Math.round(price))),
      status: 'pending',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToRideBids(
  rideId: string,
  passengerUid: string,
  onData: (bids: BidOffer[]) => void
) {
  const path = `rides/${rideId}/bids`;
  const q = query(
    collection(db, 'rides', rideId, 'bids'),
    where('passengerUid', '==', passengerUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const bids: BidOffer[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          rideId: data.rideId,
          driverUid: data.driverUid,
          driverName: data.driverName,
          carModel: data.carModel,
          carPlate: data.carPlate,
          rating: Number(data.rating) || 4.9,
          etaMinutes: Number(data.etaMinutes) || 3,
          price: Number(data.price) || 150,
          status: data.status,
          isLiveFirestore: true
        };
      });
      onData(bids);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

// ==================== DRIVER APPLICATIONS & DISPATCHER ====================
export async function submitDriverApplicationInFirestore(
  uid: string,
  drv: DriverProfile
): Promise<void> {
  const path = `drivers/${uid}`;
  try {
    const ref = doc(db, 'drivers', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        name: clampStr(drv.name, 100),
        phone: clampStr(drv.phone, 32),
        city: drv.city,
        carBrand: clampStr(drv.carBrand, 40),
        carModel: clampStr(drv.carModel, 60),
        carColor: clampStr(drv.carColor, 40),
        carPlate: clampStr(drv.carPlate, 24),
        carYear: Math.max(1990, Math.min(2030, Number(drv.carYear) || 2020)),
        gender: drv.gender || 'male',
        isOnline: Boolean(drv.isOnline),
        payoutMbankPhone: clampStr(drv.payoutMbankPhone, 32),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(ref, {
        uid,
        name: clampStr(drv.name, 100),
        phone: clampStr(drv.phone, 32),
        city: drv.city,
        carBrand: clampStr(drv.carBrand, 40),
        carModel: clampStr(drv.carModel, 60),
        carColor: clampStr(drv.carColor, 40),
        carPlate: clampStr(drv.carPlate, 24),
        carYear: Math.max(1990, Math.min(2030, Number(drv.carYear) || 2020)),
        licenseNumber: clampStr(drv.licenseNumber, 40, 'KG 00000000'),
        gender: drv.gender || 'male',
        verificationStatus: 'pending',
        isOnline: false,
        rating: 5.0,
        totalTrips: 0,
        balanceKgs: 0,
        payoutMbankPhone: clampStr(drv.payoutMbankPhone, 32),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToAllDriversAdmin(onData: (drivers: DriverProfile[]) => void) {
  const path = 'drivers';
  return onSnapshot(
    collection(db, 'drivers'),
    (snap) => {
      const list: DriverProfile[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          phone: data.phone,
          city: data.city,
          carBrand: data.carBrand,
          carModel: data.carModel,
          carColor: data.carColor || '',
          carPlate: data.carPlate,
          carYear: Number(data.carYear) || 2020,
          licenseNumber: data.licenseNumber,
          gender: data.gender || 'male',
          verificationStatus: data.verificationStatus || 'pending',
          isVerified: data.verificationStatus === 'approved',
          isOnline: Boolean(data.isOnline),
          rating: Number(data.rating) || 5.0,
          totalTrips: Number(data.totalTrips) || 0,
          balanceKgs: Number(data.balanceKgs) || 0,
          payoutMbankPhone: data.payoutMbankPhone || data.phone
        };
      });
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function updateDriverVerificationAdmin(
  driverId: string,
  verificationStatus: 'approved' | 'rejected'
): Promise<void> {
  const path = `drivers/${driverId}`;
  try {
    await updateDoc(doc(db, 'drivers', driverId), {
      verificationStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==================== FLEET SETTINGS ====================
export function subscribeToFleetSettings(onData: (settings: FleetCitySetting[]) => void) {
  const path = 'fleet_settings';
  return onSnapshot(
    collection(db, 'fleet_settings'),
    (snap) => {
      const items: FleetCitySetting[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          cityId: d.id as CityId,
          surgeMultiplier: Number(data.surgeMultiplier) || 1.0,
          commissionPercent: Number(data.commissionPercent) || 12,
          ladiesModeEnabled: data.ladiesModeEnabled ?? true,
          biddingEnabled: data.biddingEnabled ?? true
        };
      });
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function saveFleetCitySettingAdmin(setting: FleetCitySetting): Promise<void> {
  const path = `fleet_settings/${setting.cityId}`;
  try {
    await setDoc(doc(db, 'fleet_settings', setting.cityId), {
      cityId: setting.cityId,
      surgeMultiplier: Math.max(0.8, Math.min(3.0, Number(setting.surgeMultiplier) || 1.0)),
      commissionPercent: Math.max(0, Math.min(35, Number(setting.commissionPercent) || 12)),
      ladiesModeEnabled: Boolean(setting.ladiesModeEnabled),
      biddingEnabled: Boolean(setting.biddingEnabled),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
