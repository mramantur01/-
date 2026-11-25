/**
 * Owner / dispatcher data — the same collections the KG Taxi app's owner panel uses.
 * Access is checked by firestore.rules through roles/{uid} (admin or dispatcher).
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
  writeBatch,
  updateDoc,
  setDoc,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export type AppRole = 'admin' | 'dispatcher' | 'driver' | 'driver_blocked' | 'passenger' | null;

export async function fetchMyRole(uid: string): Promise<AppRole> {
  try {
    const snap = await getDoc(doc(db, 'roles', uid));
    return (snap.data()?.role as AppRole) || null;
  } catch {
    return null;
  }
}

export interface AppRide {
  id: string;
  status: string;
  city: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  driverId: string | null;
  driverName: string;
  driverCar: string;
  driverPlate: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  driverLat?: number;
  driverLng?: number;
  priceSom: number;
  tariffName: string;
  paymentMethod: string;
  comment: string;
  cancelReason: string;
  createdAt: number;
  scheduledAt?: number;
}

const ms = (t: any): number => (t instanceof Timestamp ? t.toMillis() : t?.toMillis ? t.toMillis() : 0);

export function rideFromDoc(id: string, d: any): AppRide {
  return {
    id,
    status: d.status || '',
    city: d.city || '',
    passengerId: d.passengerId || '',
    passengerName: d.passengerName || 'Пассажир',
    passengerPhone: d.passengerPhone || '',
    driverId: d.driverId || null,
    driverName: d.driverName || '',
    driverCar: d.driverCar || '',
    driverPlate: d.driverPlate || '',
    pickupAddress: d.pickupAddress || '',
    dropoffAddress: d.dropoffAddress || '',
    pickupLat: Number(d.pickupLat) || 0,
    pickupLng: Number(d.pickupLng) || 0,
    driverLat: typeof d.driverLat === 'number' ? d.driverLat : undefined,
    driverLng: typeof d.driverLng === 'number' ? d.driverLng : undefined,
    priceSom: Number(d.priceSom) || 0,
    tariffName: d.tariffName || (d.serviceType === 'INTERCITY' ? 'Межгород' : 'Такси'),
    paymentMethod: d.paymentMethod === 'CARD' ? 'Карта' : 'Наличные / QR',
    comment: d.comment || '',
    cancelReason: d.cancelReason || '',
    createdAt: ms(d.createdAt),
    scheduledAt: d.scheduledAt ? ms(d.scheduledAt) : undefined
  };
}

/** Rides created since a moment (stats and the live board). */
export function watchRidesSince(fromMillis: number, onData: (rides: AppRide[]) => void, onError: (e: Error) => void) {
  const q = query(
    collection(db, 'rides'),
    where('createdAt', '>=', Timestamp.fromMillis(fromMillis)),
    orderBy('createdAt', 'desc'),
    limit(1000)
  );
  return onSnapshot(q, (s) => onData(s.docs.map((d) => rideFromDoc(d.id, d.data()))), onError);
}

/** Active and booked rides (whatever their age). */
export function watchActiveRides(onData: (rides: AppRide[]) => void, onError: (e: Error) => void) {
  const q = query(
    collection(db, 'rides'),
    where('status', 'in', ['SEARCHING', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS', 'BOOKED']),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (s) => onData(s.docs.map((d) => rideFromDoc(d.id, d.data()))), onError);
}

// ---------- driver applications ----------
export interface DriverApplication {
  uid: string;
  fullName: string;
  phone: string;
  city: string;
  car: string;
  plate: string;
  licenseNumber: string;
  passportNumber: string;
  experienceYears: number;
  payPhone: string;
  tariffs: string[];
  status: string;
  rejectReason: string;
  birthDate: string;
  workType: string;
  insuranceUntil: string;
  createdAt: number;
}

export function watchApplications(onData: (a: DriverApplication[]) => void, onError: (e: Error) => void) {
  const q = query(collection(db, 'driver_applications'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (s) =>
      onData(
        s.docs.map((d) => {
          const x = d.data();
          return {
            uid: d.id,
            fullName: x.fullName || '',
            phone: x.phone || '',
            city: x.city || '',
            car: x.car || '',
            plate: x.plate || '',
            licenseNumber: x.licenseNumber || '',
            passportNumber: x.passportNumber || '',
            experienceYears: Number(x.experienceYears) || 0,
            payPhone: x.payPhone || '',
            tariffs: Array.isArray(x.tariffs) ? x.tariffs : [],
            status: x.status || 'pending',
            rejectReason: x.rejectReason || '',
            birthDate: x.birthDate || '',
            workType: x.workType || '',
            insuranceUntil: x.insuranceUntil || '',
            createdAt: ms(x.createdAt)
          };
        })
      ),
    onError
  );
}

export const PHOTO_TITLES: Record<string, string> = {
  driver_face: 'Лицо водителя',
  passport: 'Паспорт — лицевая',
  passport_back: 'Паспорт — обратная',
  selfie_passport: 'Селфи с паспортом',
  license: 'Права — лицевая',
  license_back: 'Права — обратная',
  insurance: 'ОСАГО',
  no_criminal: 'Справка о несудимости',
  car_front: 'Авто спереди',
  car_back: 'Авто сзади',
  car_left: 'Авто слева',
  car_right: 'Авто справа',
  car_interior: 'Салон'
};

export async function fetchPhotos(uid: string): Promise<Record<string, string>> {
  const s = await getDocs(collection(db, 'registrations', uid, 'photos'));
  const out: Record<string, string> = {};
  s.docs.forEach((d) => {
    const data = d.data().data;
    if (typeof data === 'string') out[d.id] = data.startsWith('data:') ? data : `data:image/jpeg;base64,${data.replace(/\s/g, '')}`;
  });
  return out;
}

/** Same as the app: role "driver", face photo for passengers, application approved. */
export async function approveApplication(a: DriverApplication): Promise<void> {
  const batch = writeBatch(db);
  try {
    const face = await getDoc(doc(db, 'registrations', a.uid, 'photos', 'driver_face'));
    const data = face.data()?.data;
    if (typeof data === 'string' && data.length > 100) {
      batch.set(doc(db, 'driver_avatars', a.uid), { data, updatedAt: serverTimestamp() });
    }
  } catch {
    /* no face photo: approve anyway */
  }
  batch.set(doc(db, 'roles', a.uid), {
    role: 'driver',
    name: a.fullName,
    car: a.car,
    plate: a.plate,
    payPhone: a.payPhone || a.phone,
    tariffs: a.tariffs,
    blocked: false,
    approvedAt: serverTimestamp()
  });
  batch.update(doc(db, 'driver_applications', a.uid), { status: 'approved', reviewedAt: serverTimestamp() });
  await batch.commit();
}

export async function rejectApplication(uid: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'driver_applications', uid), {
    status: 'rejected',
    rejectReason: reason.slice(0, 200),
    reviewedAt: serverTimestamp()
  });
}

// ---------- drivers, balances ----------
export interface DriverRow {
  uid: string;
  name: string;
  car: string;
  plate: string;
  payPhone: string;
  tariffs: string[];
  blocked: boolean;
}

export function watchDrivers(onData: (d: DriverRow[]) => void, onError: (e: Error) => void) {
  const q = query(collection(db, 'roles'), where('role', 'in', ['driver', 'driver_blocked']), limit(300));
  return onSnapshot(
    q,
    (s) =>
      onData(
        s.docs.map((d) => {
          const x = d.data();
          return {
            uid: d.id,
            name: x.name || '',
            car: x.car || '',
            plate: x.plate || '',
            payPhone: x.payPhone || '',
            tariffs: Array.isArray(x.tariffs) ? x.tariffs : [],
            blocked: x.role === 'driver_blocked'
          };
        })
      ),
    onError
  );
}

export async function setDriverBlocked(uid: string, blocked: boolean): Promise<void> {
  await updateDoc(doc(db, 'roles', uid), { role: blocked ? 'driver_blocked' : 'driver', blocked });
}

export interface DriverBalance {
  trips: number;
  commissionSom: number;
  cardPayoutSom: number;
  bonusSom: number;
  paidSom: number;
  debtSom: number;
  cancelled: number;
}

const driverNet = (price: number, pct: number) => price - Math.min(price, Math.max(0, Math.round(price * (Math.min(35, Math.max(1, pct)) / 100))));

/** Same formula as the app (DriverBalance.compute). */
export async function fetchDriverBalance(uid: string, cfg: AppConfig): Promise<DriverBalance> {
  const rides = await getDocs(query(collection(db, 'rides'), where('driverId', '==', uid), limit(2000)));
  let commission = 0;
  let cardPayout = 0;
  let cancelled = 0;
  const perDay: Record<string, number> = {};
  let trips = 0;
  rides.docs.forEach((d) => {
    const r = d.data();
    if (r.status === 'CANCELLED') cancelled++;
    if (r.status !== 'COMPLETED') return;
    trips++;
    const price = Number(r.priceSom) || 0;
    const net = driverNet(price, cfg.commissionPercent);
    if (r.paymentMethod === 'CARD') cardPayout += net;
    else commission += price - net;
    const day = r.createdAt?.toDate ? r.createdAt.toDate().toDateString() : '';
    perDay[day] = (perDay[day] || 0) + 1;
  });
  const bonusDays =
    cfg.goalTrips > 0 && cfg.goalBonusSom > 0 ? Object.values(perDay).filter((n) => n >= cfg.goalTrips).length : 0;
  const paidSnap = await getDoc(doc(db, 'driver_balances', uid));
  const paid = Number(paidSnap.data()?.paidSom) || 0;
  const bonus = bonusDays * cfg.goalBonusSom;
  return { trips, commissionSom: commission, cardPayoutSom: cardPayout, bonusSom: bonus, paidSom: paid, debtSom: commission - cardPayout - bonus - paid, cancelled };
}

export async function addDriverPayment(uid: string, amountSom: number): Promise<void> {
  await setDoc(doc(db, 'driver_balances', uid), { paidSom: increment(Math.round(amountSom)), updatedAt: serverTimestamp() }, { merge: true });
}

// ---------- prices and settings (config/app) ----------
export interface AppConfig {
  commissionPercent: number;
  tariffs: Record<string, { baseSom: number; perKmSom: number }>;
  promoCode: string;
  promoPercent: number;
  promoActive: boolean;
  intercity: Record<string, number>;
  referralPercent: number;
  goalTrips: number;
  goalBonusSom: number;
  debtLimitSom: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  commissionPercent: 14,
  tariffs: {},
  promoCode: '',
  promoPercent: 0,
  promoActive: false,
  intercity: {},
  referralPercent: 20,
  goalTrips: 0,
  goalBonusSom: 0,
  debtLimitSom: 0
};

/** App tariffs with their default prices (same as the app). */
export const APP_TARIFFS: { id: string; name: string; base: number; perKm: number }[] = [
  ['econom', 'Эконом', 90, 20], ['econom_plus', 'Эконом+', 110, 23], ['comfort', 'Комфорт', 130, 26],
  ['comfort_plus', 'Комфорт+', 170, 32], ['business', 'Бизнес', 250, 42], ['premium', 'Премиум', 420, 60],
  ['minivan', 'Минивэн', 190, 32], ['microbus', 'Микроавтобус', 400, 42], ['airport', 'Аэропорт', 600, 15],
  ['hourly', 'Почасовая', 1400, 0], ['child', 'Детский', 150, 28], ['lady', 'Леди-такси', 145, 26],
  ['green_ev', 'Электро', 110, 22], ['inva', 'Инва-такси', 200, 28], ['courier', 'Курьер', 120, 18],
  ['sober_driver', 'Трезвый водитель', 450, 45], ['wedding', 'Свадебный кортеж', 3000, 60], ['tow', 'Эвакуатор', 1500, 60],
  ['cargo_15', 'Грузовой 1,5 т', 550, 38], ['cargo_35', 'Грузовой 3,5 т', 900, 45], ['cargo_5', 'Грузовой 5 т', 1400, 55],
  ['cargo_10', 'Грузовой 10 т', 2200, 70], ['cargo_loaders', 'Грузчики', 1700, 45]
].map(([id, name, base, perKm]) => ({ id: id as string, name: name as string, base: base as number, perKm: perKm as number }));

export function watchConfig(onData: (c: AppConfig) => void) {
  return onSnapshot(
    doc(db, 'config', 'app'),
    (s) => {
      const d = s.data() || {};
      onData({
        commissionPercent: Number(d.commissionPercent) || 14,
        tariffs: d.tariffs || {},
        promoCode: d.promoCode || '',
        promoPercent: Number(d.promoPercent) || 0,
        promoActive: d.promoActive === true,
        intercity: d.intercity || {},
        referralPercent: typeof d.referralPercent === 'number' ? d.referralPercent : 20,
        goalTrips: Number(d.goalTrips) || 0,
        goalBonusSom: Number(d.goalBonusSom) || 0,
        debtLimitSom: Number(d.debtLimitSom) || 0
      });
    },
    () => onData(DEFAULT_CONFIG)
  );
}

export async function saveConfig(c: AppConfig): Promise<void> {
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
  await setDoc(doc(db, 'config', 'app'), {
    commissionPercent: clamp(c.commissionPercent, 0, 50),
    tariffs: Object.fromEntries(
      Object.entries(c.tariffs).map(([id, p]) => [id, { baseSom: clamp(p.baseSom, 0, 5000), perKmSom: clamp(p.perKmSom, 0, 500) }])
    ),
    promoCode: (c.promoCode || '').trim().toUpperCase().slice(0, 20),
    promoPercent: clamp(c.promoPercent, 0, 90),
    promoActive: Boolean(c.promoActive && c.promoCode),
    intercity: Object.fromEntries(Object.entries(c.intercity).map(([k, v]) => [k, clamp(v, 0, 50000)])),
    referralPercent: clamp(c.referralPercent, 0, 90),
    goalTrips: clamp(c.goalTrips, 0, 100),
    goalBonusSom: clamp(c.goalBonusSom, 0, 100000),
    debtLimitSom: clamp(c.debtLimitSom, 0, 1000000),
    updatedAt: serverTimestamp()
  });
}

// ---------- support ----------
export interface SupportTicket {
  id: string;
  userId: string;
  name: string;
  phone: string;
  text: string;
  rideId: string;
  status: string;
  createdAt: number;
}

export function watchTickets(onData: (t: SupportTicket[]) => void, onError: (e: Error) => void) {
  const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(
    q,
    (s) =>
      onData(
        s.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            userId: x.userId || '',
            name: x.name || '',
            phone: x.phone || '',
            text: x.text || '',
            rideId: x.rideId || '',
            status: x.status || 'open',
            createdAt: ms(x.createdAt)
          };
        })
      ),
    onError
  );
}

export async function resolveTicket(id: string): Promise<void> {
  await updateDoc(doc(db, 'support_tickets', id), { status: 'resolved', resolvedAt: serverTimestamp() });
}

// ---------- dispatcher actions on rides ----------
/** Phone order: the dispatcher's account places the order for a caller (name and phone go to the driver). */
export async function createPhoneOrder(p: {
  dispatcherUid: string;
  clientName: string;
  clientPhone: string;
  city: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  priceSom: number;
  tariffId: string;
  tariffName: string;
}): Promise<string> {
  const ref = doc(collection(db, 'rides'));
  const pin = String(1000 + Math.floor(Math.random() * 9000));
  await setDoc(ref, {
    passengerId: p.dispatcherUid,
    passengerName: p.clientName.trim().slice(0, 80) || 'Клиент',
    passengerPhone: p.clientPhone.trim().slice(0, 20),
    status: 'SEARCHING',
    driverId: null,
    serviceType: 'TAXI',
    city: p.city,
    pickupAddress: p.pickupAddress.slice(0, 200),
    dropoffAddress: p.dropoffAddress.slice(0, 200),
    pickupLat: p.pickupLat,
    pickupLng: p.pickupLng,
    dropoffLat: p.dropoffLat,
    dropoffLng: p.dropoffLng,
    priceSom: Math.max(1, Math.min(100000, Math.round(p.priceSom))),
    paymentMethod: 'CASH',
    comment: `Заказ по телефону • PIN ${pin}`,
    tariffId: p.tariffId,
    tariffName: p.tariffName.slice(0, 30),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

/** Only the passenger (or the dispatcher who placed a phone order) can cancel by the rules. */
export async function cancelOwnRide(rideId: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'rides', rideId), { status: 'CANCELLED', cancelReason: reason.slice(0, 100), updatedAt: serverTimestamp() });
}
