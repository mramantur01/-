export type Language = 'ru' | 'kg' | 'en';

export type CityId =
  | 'bishkek'
  | 'osh'
  | 'jalal-abad'
  | 'cholpon-ata'
  | 'karakol'
  | 'naryn'
  | 'talas'
  | 'batken'
  | 'intercity';

export type MapLayerProvider =
  | 'google_streets'
  | 'google_satellite'
  | 'yandex'
  | 'twogis'
  | 'carto_dark';

export interface CityLandmark {
  id: string;
  name: {
    ru: string;
    kg: string;
    en: string;
  };
  address: string;
  category: 'transit' | 'shopping' | 'landmark' | 'resort' | 'living';
  x: number;
  y: number;
  lat: number;
  lng: number;
}

export interface CityConfig {
  id: CityId;
  name: {
    ru: string;
    kg: string;
    en: string;
  };
  regionName: string;
  centerCoordinates: { lat: number; lng: number };
  basePriceMultiplier: number;
  landmarks: CityLandmark[];
  mapCenter: { x: number; y: number };
}

export type TariffId =
  | 'economy'
  | 'together'
  | 'green'
  | 'ladies'
  | 'comfort'
  | 'comfort_plus'
  | 'business'
  | 'hourly'
  | 'minivan'
  | 'cargo'
  | 'delivery'
  | 'intercity_seat';

export interface Tariff {
  id: TariffId;
  name: {
    ru: string;
    kg: string;
    en: string;
  };
  description: {
    ru: string;
    kg: string;
    en: string;
  };
  carModels: string[];
  basePrice: number;
  pricePerKm: number;
  pricePerMin: number;
  etaMinutes: number;
  capacity: number;
  iconName: string;
  badge?: string;
}

export type PaymentMethodId = 'mbank' | 'elkart' | 'odengi' | 'optima' | 'cash';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  iconType: 'mbank' | 'card' | 'odengi' | 'optima' | 'cash';
  badge?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  photoUrl: string;
  carModel: string;
  carColor: string;
  carPlate: string;
  rating: number;
  totalTrips: number;
  position: { x: number; y: number };
  heading: number;
  gender?: 'male' | 'female';
  isBusy?: boolean;
}

export type TripStatus =
  | 'idle'
  | 'searching'
  | 'bidding'
  | 'driver_assigned'
  | 'driver_arrived'
  | 'in_trip'
  | 'completed';

export type PricingMode = 'fixed' | 'bidding';

export type PickupSpeedMode = 'wait_save' | 'standard' | 'priority';

export interface ComfortPreferences {
  temperature: 'cool' | 'standard' | 'warm';
  conversation: 'quiet' | 'no_preference' | 'chatty';
  luggageHelp: boolean;
}

export interface SplitFareParticipant {
  id: string;
  name: string;
  phone: string;
  paid: boolean;
}

export interface BidOffer {
  id: string;
  rideId: string;
  driverUid: string;
  driverName: string;
  carModel: string;
  carPlate: string;
  rating: number;
  etaMinutes: number;
  price: number;
  status: 'pending' | 'accepted' | 'declined';
  isLiveFirestore?: boolean;
}

export interface GeoSearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  source: 'local' | 'osm';
}

export interface TripState {
  id: string;
  liveRideId?: string;
  cityId: CityId;
  pickup: {
    name: string;
    coords: { x: number; y: number; lat?: number; lng?: number };
  };
  destination: {
    name: string;
    coords: { x: number; y: number; lat?: number; lng?: number };
  };
  tariff: Tariff;
  paymentMethod: PaymentMethodId;
  pricingMode?: PricingMode;
  offeredFare?: number;
  distanceKm: number;
  estimatedMinutes: number;
  totalFare: number;
  status: TripStatus;
  driver?: Driver;
  driverProgress: number;
  tripProgress: number;
  currentSpeed: number;
  currentStreetName?: string;
  promoDiscount: number;
  safetyPin?: string;
  shareCode?: string;
  surgeMultiplier?: number;
  driverComment?: string;
  intermediateStop?: {
    name: string;
    coords: { x: number; y: number; lat?: number; lng?: number };
  } | null;
  orderForOther?: {
    enabled: boolean;
    name: string;
    phone: string;
  };
  cargoLoaders?: number;
  options: {
    childSeat: boolean;
    childSeatType?: 'infant' | 'toddler' | 'booster';
    luggage: boolean;
    pet: boolean;
    airConditioning: boolean;
    silentRide: boolean;
    noPhoneCalls?: boolean;
    cashChangeFrom?: number;
    intercitySeatsCount?: number;
    intercitySeats?: string[];
    intercityDepartureTime?: string;
    intercityStation?: string;
    intercityRideType?: 'per_seat' | 'full_car';
  };
  scheduledTime?: string;
  isScheduled?: boolean;
  flightNumber?: string;
  pickupSpeedMode?: PickupSpeedMode;
  comfortPrefs?: ComfortPreferences;
  kgOneActive?: boolean;
  hourlyHours?: number;
  hourlyPreset?: string;
  billingProfile?: 'personal' | 'business';
  priorityBoostFee?: number;
  usePlusPoints?: boolean;
  plusPointsApplied?: number;
  tipAmount?: number;
  deliveryDetails?: {
    recipientName?: string;
    recipientPhone?: string;
    packageType?: string;
    doorToDoor?: boolean;
  };
  cashChangeFrom?: number;
  createdAt: string;
}

export interface TripHistoryItem {
  id: string;
  date: string;
  cityName: string;
  pickup: string;
  destination: string;
  tariffName: string;
  carInfo: string;
  fare: number;
  paymentMethod: string;
  rating?: number;
  safetyPin?: string;
  billingProfile?: 'personal' | 'business';
  lostItemReported?: string;
}

export interface SavedCard {
  id: string;
  cardNumber: string;
  rawCardNumber?: string;
  expiry: string;
  cardholderName: string;
  cardType: 'elkart' | 'visa' | 'mastercard' | 'mbank';
  bankName: string;
  isDefault: boolean;
}

export interface SafetySettings {
  emergencyContactName: string;
  emergencyContactPhone: string;
  isAudioRecordingEnabled: boolean;
  safetyPinEnabled: boolean;
  autoShareTripWithContact: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  role: 'teen' | 'parent';
  monthlyLimitKgs: number;
  requirePin: boolean;
  liveTracking: boolean;
}

export interface BusinessProfile {
  enabled: boolean;
  companyName: string;
  inn: string;
  corporateEmail: string;
  monthlyLimitKgs: number;
  activeMode: 'personal' | 'business';
}

export interface PassengerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  defaultCity: CityId;
  savedCards: SavedCard[];
  safetySettings: SafetySettings;
  homeAddress?: string;
  workAddress?: string;
  totalCompletedRides: number;
  safetyRating: number;
  plusPointsBalance?: number;
  isKgOneMember?: boolean;
  familyMembers?: FamilyMember[];
  businessProfile?: BusinessProfile;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  city: CityId;
  carBrand: string;
  carModel: string;
  carColor: string;
  carPlate: string;
  carYear: number;
  licenseNumber: string;
  gender?: 'male' | 'female';
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  balanceKgs: number;
  payoutMbankPhone: string;
}

export interface IntercityRoute {
  id: string;
  fromCity: string;
  toCity: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  distanceKm: number;
  approxHours: number;
  pricePerSeat: number;
  priceFullCar: number;
  popularCars: string[];
  description: string;
  keyPass: string;
  category: 'intercity' | 'airport' | 'resort';
  stations: string[];
}

export interface FoodDish {
  id: string;
  name: string;
  price: number;
  weight: string;
  description: string;
}

export interface FoodRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  popularDishes: FoodDish[];
}

export interface LiveRideDoc {
  id: string;
  passengerUid: string;
  passengerName: string;
  driverUid?: string;
  driverName?: string;
  driverCarModel?: string;
  driverCarPlate?: string;
  driverRating?: number;
  cityId: CityId;
  pickupName: string;
  pickupLat: number;
  pickupLng: number;
  destName: string;
  destLat: number;
  destLng: number;
  tariffId: TariffId;
  tariffName: string;
  paymentMethod: PaymentMethodId;
  pricingMode: PricingMode;
  fare: number;
  offeredFare?: number;
  distanceKm: number;
  estimatedMinutes: number;
  status: 'searching' | 'bidding' | 'driver_assigned' | 'driver_arrived' | 'in_trip' | 'completed' | 'cancelled';
  driverLat?: number;
  driverLng?: number;
  safetyPin?: string;
  shareCode?: string;
  intercitySeats?: string;
}

export interface FleetCitySetting {
  cityId: CityId;
  surgeMultiplier: number;
  commissionPercent: number;
  ladiesModeEnabled: boolean;
  biddingEnabled: boolean;
}
