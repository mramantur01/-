import React, { useState, useEffect } from 'react';
import {
  CityConfig,
  Tariff,
  TariffId,
  TripState,
  Language,
  PricingMode,
  GeoSearchResult,
  PickupSpeedMode,
  ComfortPreferences
} from '../../types/taxi';
import { TRANSLATIONS } from '../../utils/translations';
import { searchKyrgyzstanAddresses } from '../../services/geoService';
import { TariffSelector } from './TariffSelector';
import {
  ArrowUpDown,
  CreditCard,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  X,
  User,
  Clock,
  Truck,
  Flame,
  MapPin,
  Zap,
  Sparkles,
  Compass,
  Utensils,
  QrCode,
  Plane,
  Crown,
  Thermometer,
  VolumeX,
  Briefcase,
  Leaf,
  Home,
  Info
} from 'lucide-react';

interface BookingFormProps {
  currentCity: CityConfig;
  allCities: CityConfig[];
  tariffs: Tariff[];
  onSelectCity: (cityId: any) => void;
  tripState: TripState;
  onUpdatePickup: (name: string, coords?: { x: number; y: number; lat?: number; lng?: number }) => void;
  onUpdateDestination: (name: string, coords?: { x: number; y: number; lat?: number; lng?: number }) => void;
  onUpdateIntermediateStop?: (name: string) => void;
  onRemoveIntermediateStop?: () => void;
  onSwapLocations: () => void;
  onSelectTariff: (tariff: Tariff) => void;
  calculatedPrices: Record<TariffId, number>;
  onOpenPaymentModal: () => void;
  onOpenQrPayment: () => void;
  onOpenOptionsModal: () => void;
  onRequestRide: () => void;
  selectionMode: 'pickup' | 'destination';
  onSetSelectionMode: (mode: 'pickup' | 'destination') => void;
  lang: Language;
  onOpenIntercity?: () => void;
  onOpenProfile?: () => void;
  onOpenFoodDelivery?: () => void;
  surgeMultiplier: number;
  onToggleSurge: () => void;
  driverComment: string;
  onUpdateDriverComment: (comment: string) => void;
  orderForOther: { enabled: boolean; name: string; phone: string };
  onUpdateOrderForOther: (data: { enabled: boolean; name: string; phone: string }) => void;
  cargoLoaders: number;
  onUpdateCargoLoaders: (count: number) => void;
  plusPointsBalance?: number;
  usePlusPoints?: boolean;
  onToggleUsePlusPoints?: () => void;
  scheduledTime?: string;
  onUpdateScheduledTime?: (time: string) => void;
  flightNumber?: string;
  onUpdateFlightNumber?: (flight: string) => void;
  pickupSpeedMode: PickupSpeedMode;
  onChangePickupSpeedMode: (mode: PickupSpeedMode) => void;
  comfortPrefs: ComfortPreferences;
  onUpdateComfortPrefs: (prefs: ComfortPreferences) => void;
  isKgOneMember?: boolean;
  onToggleKgOne?: () => void;
  priorityBoost?: number;
  onTogglePriorityBoost?: () => void;
  pricingMode: PricingMode;
  onChangePricingMode: (mode: PricingMode) => void;
  offeredFare: number;
  onChangeOfferedFare: (val: number) => void;
  biddingEnabled?: boolean;
  ladiesModeEnabled?: boolean;
  hourlyHours: number;
  onChangeHourlyHours: (hours: number) => void;
  hourlyPreset: string;
  onChangeHourlyPreset: (preset: string) => void;
  billingProfile: 'personal' | 'business';
  onChangeBillingProfile: (mode: 'personal' | 'business') => void;
  businessCompanyName?: string;
  homeAddress?: string;
  workAddress?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  currentCity,
  allCities,
  tariffs,
  onSelectCity,
  tripState,
  onUpdatePickup,
  onUpdateDestination,
  onUpdateIntermediateStop,
  onRemoveIntermediateStop,
  onSwapLocations,
  onSelectTariff,
  calculatedPrices,
  onOpenPaymentModal,
  onOpenQrPayment,
  onOpenOptionsModal,
  onRequestRide,
  selectionMode,
  onSetSelectionMode,
  lang,
  onOpenIntercity,
  onOpenFoodDelivery,
  surgeMultiplier,
  onToggleSurge,
  driverComment,
  onUpdateDriverComment,
  orderForOther,
  onUpdateOrderForOther,
  cargoLoaders,
  onUpdateCargoLoaders,
  plusPointsBalance = 240,
  usePlusPoints = false,
  onToggleUsePlusPoints,
  scheduledTime = 'now',
  onUpdateScheduledTime,
  flightNumber = '',
  onUpdateFlightNumber,
  pickupSpeedMode,
  onChangePickupSpeedMode,
  comfortPrefs,
  onUpdateComfortPrefs,
  isKgOneMember = false,
  onToggleKgOne,
  pricingMode,
  onChangePricingMode,
  offeredFare,
  onChangeOfferedFare,
  biddingEnabled = true,
  ladiesModeEnabled = true,
  hourlyHours,
  onChangeHourlyHours,
  hourlyPreset,
  onChangeHourlyPreset,
  billingProfile,
  onChangeBillingProfile,
  businessCompanyName = 'ОсОО «Ала-Тоо Тех»',
  homeAddress,
  workAddress
}) => {
  const t = TRANSLATIONS[lang];
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showStopInput, setShowStopInput] = useState(false);
  const [stopName, setStopName] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [focusedField, setFocusedField] = useState<'pickup' | 'destination' | null>(null);
  const [geoSuggestions, setGeoSuggestions] = useState<GeoSearchResult[]>([]);

  // Live address suggestions for focused input
  useEffect(() => {
    if (!focusedField) {
      setGeoSuggestions([]);
      return;
    }
    const queryText =
      focusedField === 'pickup' ? tripState.pickup.name : tripState.destination.name;
    if (queryText.trim().length < 2) {
      setGeoSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchKyrgyzstanAddresses(queryText, currentCity);
      setGeoSuggestions(results);
    }, 350);
    return () => clearTimeout(timer);
  }, [focusedField, tripState.pickup.name, tripState.destination.name, currentCity]);

  const activeServiceCategory = () => {
    if (tripState.tariff.id === 'delivery') return 'delivery';
    if (tripState.tariff.id === 'cargo') return 'cargo';
    if (currentCity.id === 'intercity') return 'intercity';
    return 'taxi';
  };

  const handleSelectServiceCategory = (cat: 'taxi' | 'delivery' | 'cargo' | 'food' | 'intercity') => {
    if (cat === 'food') {
      onOpenFoodDelivery?.();
      return;
    }
    if (cat === 'intercity') {
      onOpenIntercity?.();
      return;
    }
    if (cat === 'delivery') {
      const delivTariff = tariffs.find((item) => item.id === 'delivery') || tariffs[0];
      onSelectTariff(delivTariff);
      return;
    }
    if (cat === 'cargo') {
      const cargoTariff = tariffs.find((item) => item.id === 'cargo') || tariffs[0];
      onSelectTariff(cargoTariff);
      return;
    }
    const defTariff = tariffs.find((item) => item.id === 'economy') || tariffs[0];
    onSelectTariff(defTariff);
  };

  const activePaymentName = () => {
    switch (tripState.paymentMethod) {
      case 'mbank':
        return 'MBank · QR';
      case 'odengi':
        return 'О!Деньги · QR';
      case 'optima':
        return 'Optima24';
      case 'elkart':
        return 'Элкарт / Visa';
      case 'cash':
      default:
        return 'Наличные';
    }
  };

  const baseDisplayedTariffs =
    currentCity.id === 'intercity'
      ? tariffs.filter((item) => item.id === 'intercity_seat' || item.id === 'minivan' || item.id === 'comfort_plus')
      : tariffs;

  // "Вместе" (shared ride) is not available in the app yet.
  const displayedTariffs = (ladiesModeEnabled
    ? baseDisplayedTariffs
    : baseDisplayedTariffs.filter((item) => item.id !== 'ladies')).filter((item) => item.id !== 'together');

  const currentTab = activeServiceCategory();

  const applySuggestion = (item: GeoSearchResult) => {
    const cityLat = currentCity.centerCoordinates.lat;
    const cityLng = currentCity.centerCoordinates.lng;
    const estX = Math.max(5, Math.min(95, 50 + (item.lng - cityLng) * 400));
    const estY = Math.max(5, Math.min(95, 50 + (item.lat - cityLat) * 400));
    const coords = { x: estX, y: estY, lat: item.lat, lng: item.lng };

    if (focusedField === 'pickup') {
      onUpdatePickup(item.name, coords);
      onSetSelectionMode('destination');
    } else {
      onUpdateDestination(item.name, coords);
    }
    setFocusedField(null);
    setGeoSuggestions([]);
  };

  const activeCtaFare = pricingMode === 'bidding' ? offeredFare : tripState.totalFare;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header Row: Title + City Selector */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-black">
          {t.bookRideTitle}
        </h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCityPicker(!showCityPicker)}
            className="h-9 px-3 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-black" />
            <span>{currentCity.name[lang] || currentCity.name.ru}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
          </button>

          {showCityPicker && (
            <div className="absolute right-0 top-full mt-2 w-60 z-40 bg-white border border-neutral-200 rounded-xl p-1.5 shadow-xl max-h-64 overflow-y-auto uber-scroll">
              <div className="text-[11px] font-medium text-neutral-500 px-3 py-1.5">
                {t.allCities}
              </div>
              {allCities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectCity(c.id);
                    setShowCityPicker(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                    c.id === currentCity.id
                      ? 'bg-black text-white font-semibold'
                      : 'text-black hover:bg-[#f3f3f3] font-medium'
                  }`}
                >
                  <span>{c.name[lang] || c.name.ru}</span>
                  <span className={`text-[11px] ${c.id === currentCity.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {c.regionName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Uber Segmented Service Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-[#f3f3f3] rounded-xl text-center">
        {[
          { id: 'taxi', label: t.tabTaxi },
          { id: 'delivery', label: t.tabCourier },
          { id: 'cargo', label: t.tabCargo },
          { id: 'intercity', label: t.tabIntercity },
          { id: 'food', label: t.tabFood }
        ].map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectServiceCategory(item.id as any)}
              className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive ? 'bg-white text-black shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Iconic Uber A-to-B Route Input Block with Live Autocomplete */}
      <div className="relative">
        <div className="flex gap-3 items-stretch">
          <div className="flex flex-col items-center py-3.5 pl-1 shrink-0" aria-hidden="true">
            <span
              className={`w-2.5 h-2.5 rounded-full border-2 ${
                selectionMode === 'pickup' ? 'bg-black border-black ring-4 ring-black/10' : 'bg-black border-black'
              }`}
            />
            <span className="w-[1.5px] flex-1 bg-black my-1 min-h-[24px]" />
            {showStopInput && (
              <>
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span className="w-[1.5px] flex-1 bg-black my-1 min-h-[20px]" />
              </>
            )}
            <span
              className={`w-2.5 h-2.5 bg-black ${
                selectionMode === 'destination' ? 'ring-4 ring-black/10' : ''
              }`}
            />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={tripState.pickup.name}
                onFocus={() => {
                  onSetSelectionMode('pickup');
                  setFocusedField('pickup');
                }}
                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                onChange={(e) => onUpdatePickup(e.target.value)}
                placeholder={t.pickupPlace}
                className={`w-full h-11 rounded-lg px-3.5 pr-9 text-sm font-medium text-black placeholder-neutral-500 transition-all focus:outline-none ${
                  selectionMode === 'pickup'
                    ? 'bg-white ring-2 ring-black'
                    : 'bg-[#eeeeee] hover:bg-[#e5e5e5]'
                }`}
              />
              <button
                type="button"
                onClick={onSwapLocations}
                title="Поменять местами"
                className="absolute right-2 w-7 h-7 rounded-md hover:bg-neutral-200 text-neutral-600 hover:text-black flex items-center justify-center transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {showStopInput && (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={stopName}
                  onChange={(e) => {
                    setStopName(e.target.value);
                    onUpdateIntermediateStop?.(e.target.value);
                  }}
                  placeholder="Остановка по пути (например, ЦУМ)"
                  className="w-full h-10 rounded-lg bg-[#eeeeee] focus:bg-white focus:ring-2 focus:ring-black px-3.5 pr-9 text-xs font-medium text-black placeholder-neutral-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowStopInput(false);
                    setStopName('');
                    onRemoveIntermediateStop?.();
                  }}
                  className="absolute right-2 w-7 h-7 rounded-md hover:bg-neutral-200 text-neutral-500 hover:text-black flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="relative flex items-center">
              <input
                type="text"
                value={tripState.destination.name}
                onFocus={() => {
                  onSetSelectionMode('destination');
                  setFocusedField('destination');
                }}
                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
                onChange={(e) => onUpdateDestination(e.target.value)}
                placeholder={t.whereTo}
                className={`w-full h-11 rounded-lg px-3.5 pr-9 text-sm font-medium text-black placeholder-neutral-500 transition-all focus:outline-none ${
                  selectionMode === 'destination'
                    ? 'bg-white ring-2 ring-black'
                    : 'bg-[#eeeeee] hover:bg-[#e5e5e5]'
                }`}
              />
              {!showStopInput && (
                <button
                  type="button"
                  onClick={() => setShowStopInput(true)}
                  title="Добавить остановку по пути"
                  className="absolute right-2 w-7 h-7 rounded-full bg-white hover:bg-neutral-200 border border-neutral-300 text-black flex items-center justify-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Geocoding Autocomplete Dropdown */}
        {focusedField && geoSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl z-40 overflow-hidden">
            {geoSuggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySuggestion(item);
                }}
                className="w-full px-3.5 py-2.5 hover:bg-[#f6f6f6] text-left flex items-start gap-2.5 border-b border-neutral-100 last:border-b-0"
              >
                <MapPin className="w-3.5 h-3.5 text-black mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-black truncate">{item.name}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{item.address}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Mode Toggle: Fixed Uber vs Offer Your Price (inDrive) */}
      {biddingEnabled && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#f3f3f3] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onChangePricingMode('fixed')}
              className={`py-2 rounded-lg transition-all ${
                pricingMode === 'fixed' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              Фикс. цена (Uber)
            </button>
            <button
              type="button"
              onClick={() => onChangePricingMode('bidding')}
              className={`py-2 rounded-lg transition-all ${
                pricingMode === 'bidding' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              Своя цена (Торг)
            </button>
          </div>

          {pricingMode === 'bidding' && (
            <div className="p-3 bg-[#f6f6f6] border border-neutral-200 rounded-xl flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onChangeOfferedFare(Math.max(50, offeredFare - 20))}
                className="w-9 h-9 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-black flex items-center justify-center shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="text-center flex-1">
                <div className="text-[11px] text-neutral-500">Предложите цену водителю</div>
                <div className="text-lg font-bold text-black tabular-nums">
                  {offeredFare} сом
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeOfferedFare(offeredFare + 20)}
                className="w-9 h-9 rounded-lg bg-black hover:bg-neutral-800 text-white flex items-center justify-center shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Uber Action Chips Row: Schedule Time · For Me / Other · Surge Demand */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 uber-scroll">
        <button
          type="button"
          onClick={() => setShowSchedulePicker(!showSchedulePicker)}
          className={`h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            scheduledTime !== 'now'
              ? 'bg-black text-white'
              : 'bg-[#eeeeee] hover:bg-[#e2e2e2] text-black'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{scheduledTime === 'now' ? 'Сейчас' : scheduledTime}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() =>
            onUpdateOrderForOther({
              ...orderForOther,
              enabled: !orderForOther.enabled
            })
          }
          className={`h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            orderForOther.enabled
              ? 'bg-black text-white'
              : 'bg-[#eeeeee] hover:bg-[#e2e2e2] text-black'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{orderForOther.enabled ? 'Другому человеку' : 'Для себя'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleSurge}
          className={`h-9 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            surgeMultiplier > 1
              ? 'bg-black text-white'
              : 'bg-[#eeeeee] hover:bg-[#e2e2e2] text-black'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{surgeMultiplier > 1 ? `Спрос ×${surgeMultiplier.toFixed(1)}` : 'Цена фиксируется при заказе'}</span>
        </button>
      </div>

      {/* Inline Schedule Selector */}
      {showSchedulePicker && (
        <div className="p-3 bg-[#f6f6f6] rounded-xl border border-neutral-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-black">
            <span>Запланировать подачу</span>
            <button
              type="button"
              onClick={() => setShowSchedulePicker(false)}
              className="text-neutral-500 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'now', label: 'Сейчас (~3 мин)' },
              { id: 'Через 20 мин', label: 'Через 20 мин' },
              { id: 'Сегодня 19:30', label: 'Сегодня 19:30' },
              { id: 'Завтра 04:30', label: 'Завтра 04:30 (Манас)' }
            ].map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  onUpdateScheduledTime?.(slot.id);
                  setShowSchedulePicker(false);
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                  scheduledTime === slot.id
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>

          {/* Uber Reserve Flight Tracking (Manas FRU / Osh OSS) */}
          <div className="pt-2 border-t border-neutral-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-black flex items-center gap-1">
                <Plane className="w-3.5 h-3.5 text-[#276EF1]" />
                <span>Uber Reserve · Рейс (Манас / Ош)</span>
              </span>
              <span className="text-[#05944F] font-semibold">45 мин ожидания</span>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => onUpdateFlightNumber?.(e.target.value.toUpperCase())}
                placeholder="Номер рейса (напр. KC 109, TK 345)"
                className="flex-1 h-8 bg-white border border-neutral-300 rounded-lg px-2.5 text-xs font-mono text-black uppercase focus:outline-none focus:border-black"
              />
              {['KC 109', 'TK 345', 'FZ 745'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onUpdateFlightNumber?.(code)}
                  className="px-2 h-8 rounded-lg bg-white border border-neutral-200 hover:border-black text-[10px] font-mono font-bold text-black"
                >
                  {code}
                </button>
              ))}
            </div>
            {flightNumber && (
              <p className="text-[11px] text-[#05944F] font-medium">
                Отслеживание рейса {flightNumber} активно — время подачи скорректируется при задержке
              </p>
            )}
          </div>
        </div>
      )}

      {/* Inline Order For Another Person Inputs */}
      {orderForOther.enabled && (
        <div className="p-3 bg-[#f6f6f6] rounded-xl border border-neutral-200 grid grid-cols-2 gap-2">
          <input
            type="text"
            value={orderForOther.name}
            onChange={(e) => onUpdateOrderForOther({ ...orderForOther, name: e.target.value })}
            placeholder="Имя пассажира"
            className="h-9 bg-white border border-neutral-300 rounded-lg px-3 text-xs text-black focus:outline-none focus:border-black"
          />
          <input
            type="text"
            value={orderForOther.phone}
            onChange={(e) => onUpdateOrderForOther({ ...orderForOther, phone: e.target.value })}
            placeholder="+996 700 00-00-00"
            className="h-9 bg-white border border-neutral-300 rounded-lg px-3 text-xs text-black focus:outline-none focus:border-black"
          />
        </div>
      )}

      {/* One-Tap Uber Saved Places (Home & Work) */}
      {(homeAddress || workAddress) && (
        <div className="grid grid-cols-2 gap-2">
          {homeAddress && (
            <button
              type="button"
              onClick={() => {
                const coords = {
                  x: 34,
                  y: 68,
                  lat: currentCity.centerCoordinates.lat - 0.032,
                  lng: currentCity.centerCoordinates.lng - 0.025
                };
                if (selectionMode === 'pickup') {
                  onUpdatePickup(homeAddress, coords);
                  onSetSelectionMode('destination');
                } else {
                  onUpdateDestination(homeAddress, coords);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f6f6f6] hover:bg-[#eeeeee] border border-neutral-200/80 text-left transition-colors min-w-0"
            >
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                <Home className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-black leading-tight">{t.homeLabel}</div>
                <div className="text-[10px] text-neutral-500 truncate">{homeAddress}</div>
              </div>
            </button>
          )}

          {workAddress && (
            <button
              type="button"
              onClick={() => {
                const coords = {
                  x: 52,
                  y: 46,
                  lat: currentCity.centerCoordinates.lat + 0.002,
                  lng: currentCity.centerCoordinates.lng + 0.014
                };
                if (selectionMode === 'pickup') {
                  onUpdatePickup(workAddress, coords);
                  onSetSelectionMode('destination');
                } else {
                  onUpdateDestination(workAddress, coords);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f6f6f6] hover:bg-[#eeeeee] border border-neutral-200/80 text-left transition-colors min-w-0"
            >
              <div className="w-7 h-7 rounded-full bg-[#276EF1] text-white flex items-center justify-center shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-black leading-tight">{t.workLabel}</div>
                <div className="text-[10px] text-neutral-500 truncate">{workAddress}</div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Quick Landmarks Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 uber-scroll">
        {currentCity.landmarks.slice(0, 5).map((lm) => (
          <button
            key={lm.id}
            type="button"
            onClick={() => {
              const coords = { x: lm.x, y: lm.y, lat: lm.lat, lng: lm.lng };
              if (selectionMode === 'pickup') {
                onUpdatePickup(lm.name.ru, coords);
                onSetSelectionMode('destination');
              } else {
                onUpdateDestination(lm.name.ru, coords);
              }
            }}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f3f3f3] border border-neutral-200 text-neutral-700 hover:text-black text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
          >
            {lm.name.ru}
          </button>
        ))}
      </div>

      {/* Ride Selection List */}
      <div className="pt-1 border-t border-neutral-200 space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="font-semibold text-black text-sm">{t.chooseRide}</span>
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {tripState.distanceKm} км · {tripState.estimatedMinutes} мин
            </span>
            {pricingMode === 'fixed' && (
              <button
                type="button"
                onClick={() => setShowFareBreakdown((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#276EF1] hover:underline"
              >
                <Info className="w-3 h-3" />
                <span>{t.fareDetails}</span>
              </button>
            )}
          </div>
        </div>

        {/* Transparent US Uber Fare Breakdown Card */}
        {showFareBreakdown && pricingMode === 'fixed' && (
          <div className="p-3 bg-[#f6f6f6] border border-neutral-200 rounded-xl text-[11px] space-y-1.5">
            <div className="flex justify-between text-neutral-600">
              <span>
                {tripState.tariff.id === 'hourly'
                  ? `Аренда (${hourlyHours} ч × 650 сом)`
                  : `Подача (${tripState.tariff.name.ru})`}
              </span>
              <span className="font-semibold text-black tabular-nums">
                {tripState.tariff.id === 'hourly'
                  ? `${hourlyHours * 650} сом`
                  : `${tripState.tariff.basePrice} сом`}
              </span>
            </div>
            {tripState.tariff.id !== 'hourly' && (
              <div className="flex justify-between text-neutral-600">
                <span>Путь ({tripState.distanceKm} км × {tripState.tariff.pricePerKm} с/км)</span>
                <span className="font-semibold text-black tabular-nums">
                  {Math.round(tripState.distanceKm * tripState.tariff.pricePerKm * currentCity.basePriceMultiplier)} сом
                </span>
              </div>
            )}
            {surgeMultiplier > 1 && tripState.tariff.id !== 'hourly' && (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Повышенный спрос (Surge)</span>
                <span>×{surgeMultiplier.toFixed(1)}</span>
              </div>
            )}
            {pickupSpeedMode === 'wait_save' && tripState.tariff.id !== 'hourly' && (
              <div className="flex justify-between text-[#05944F] font-semibold">
                <span>Режим «Подождать»</span>
                <span>−15%</span>
              </div>
            )}
            {pickupSpeedMode === 'priority' && (
              <div className="flex justify-between text-black font-semibold">
                <span>Приоритетная подача</span>
                <span>+30 сом</span>
              </div>
            )}
            {isKgOneMember && (
              <div className="flex justify-between text-[#05944F] font-semibold">
                <span>Подписка KG One</span>
                <span>−7%</span>
              </div>
            )}
            {tripState.promoDiscount > 0 && (
              <div className="flex justify-between text-[#05944F] font-semibold">
                <span>Промокод</span>
                <span>−{tripState.promoDiscount} сом</span>
              </div>
            )}
            {usePlusPoints && (
              <div className="flex justify-between text-[#05944F] font-semibold">
                <span>Списание бонусов Plus</span>
                <span>−{Math.min(plusPointsBalance, 100)} сом</span>
              </div>
            )}
            <div className="pt-1.5 border-t border-neutral-200 flex justify-between font-bold text-black text-xs">
              <span>Итого к оплате</span>
              <span className="tabular-nums">{tripState.totalFare} сом</span>
            </div>
          </div>
        )}

        <TariffSelector
          tariffs={displayedTariffs}
          selectedTariffId={tripState.tariff.id}
          onSelectTariff={onSelectTariff}
          calculatedPrices={calculatedPrices}
          lang={lang}
        />
      </div>

      {/* Cargo Loaders Selector if Cargo selected */}
      {tripState.tariff.id === 'cargo' && (
        <div className="p-3 bg-[#f6f6f6] rounded-xl border border-neutral-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-black flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              <span>Грузчики (Hyundai Porter)</span>
            </span>
            <span className="text-neutral-600 font-medium">+200 сом / чел</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onUpdateCargoLoaders(num)}
                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                  cargoLoaders === num
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-black hover:bg-neutral-100'
                }`}
              >
                {num === 0 ? 'Без грузчиков' : `${num} ${num === 1 ? 'грузчик' : 'грузчика'}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Uber Hourly: Duration & Kyrgyzstan Excursion Presets */}
      {tripState.tariff.id === 'hourly' && (
        <div className="p-3 bg-[#f6f6f6] rounded-xl border border-neutral-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-black flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#276EF1]" />
              <span>Почасовая аренда (Uber Hourly)</span>
            </span>
            <span className="text-[11px] font-semibold text-[#05944F]">
              {hourlyHours * 20} км включено
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[2, 3, 4, 6, 8].map((hrs) => (
              <button
                key={hrs}
                type="button"
                onClick={() => onChangeHourlyHours(hrs)}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  hourlyHours === hrs
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-black hover:bg-neutral-100'
                }`}
              >
                {hrs} ч
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-neutral-500 font-medium block">
              Популярные сценарии по Кыргызстану:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Деловой день · Бишкек', hours: 3 },
                { label: 'Ущелье Ала-Арча', hours: 4 },
                { label: 'Чункурчак / Супара', hours: 6 },
                { label: 'Озеро Иссык-Куль', hours: 8 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChangeHourlyPreset(preset.label);
                    onChangeHourlyHours(preset.hours);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold text-left truncate transition-colors ${
                    hourlyPreset === preset.label
                      ? 'bg-black text-white'
                      : 'bg-white border border-neutral-200 text-black hover:bg-neutral-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Uber Green EV Zero-Emission Callout */}
      {tripState.tariff.id === 'green' && (
        <div className="px-3 py-2.5 bg-[#05944F]/10 border border-[#05944F]/25 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#05944F] font-bold">
            <Leaf className="w-4 h-4 shrink-0" />
            <span>100% электромобиль · 0 г CO₂</span>
          </div>
          <span className="text-[11px] text-neutral-700 font-medium shrink-0">
            BYD · Zeekr · Tesla
          </span>
        </div>
      )}

      {/* US Uber 3-Way Pickup Speed: Wait & Save / Standard / Priority */}
      {pricingMode === 'fixed' && (
        <div className="grid grid-cols-3 gap-1.5 bg-[#f6f6f6] p-1 rounded-xl border border-neutral-200">
          <button
            type="button"
            onClick={() => onChangePickupSpeedMode('wait_save')}
            className={`py-2 px-2 rounded-lg text-center transition-all ${
              pickupSpeedMode === 'wait_save'
                ? 'bg-black text-white shadow-xs'
                : 'text-black hover:bg-white'
            }`}
          >
            <div className="text-[11px] font-bold flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Подождать</span>
            </div>
            <div
              className={`text-[10px] font-semibold ${
                pickupSpeedMode === 'wait_save' ? 'text-[#05944F]' : 'text-[#05944F]'
              }`}
            >
              −15% · +5 мин
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangePickupSpeedMode('standard')}
            className={`py-2 px-2 rounded-lg text-center transition-all ${
              pickupSpeedMode === 'standard'
                ? 'bg-black text-white shadow-xs'
                : 'text-black hover:bg-white'
            }`}
          >
            <div className="text-[11px] font-bold">Стандарт</div>
            <div
              className={`text-[10px] ${
                pickupSpeedMode === 'standard' ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              Обычная подача
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangePickupSpeedMode('priority')}
            className={`py-2 px-2 rounded-lg text-center transition-all ${
              pickupSpeedMode === 'priority'
                ? 'bg-black text-white shadow-xs'
                : 'text-black hover:bg-white'
            }`}
          >
            <div className="text-[11px] font-bold flex items-center justify-center gap-1">
              <Flame className="w-3 h-3" />
              <span>Приоритет</span>
            </div>
            <div
              className={`text-[10px] ${
                pickupSpeedMode === 'priority' ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              +30 сом · Быстрее
            </div>
          </button>
        </div>
      )}

      {/* Uber Comfort Preferences (Temperature & Conversation) */}
      {(tripState.tariff.id === 'comfort' ||
        tripState.tariff.id === 'comfort_plus' ||
        tripState.tariff.id === 'business') && (
        <div className="p-3 bg-[#f6f6f6] rounded-xl border border-neutral-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-black flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-[#276EF1]" />
              <span>Настройки салона (Uber Comfort)</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold">Передаётся водителю</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'cool', label: '19°C Прохладно' },
                { id: 'standard', label: '22°C Комфорт' },
                { id: 'warm', label: '25°C Тепло' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateComfortPrefs({ ...comfortPrefs, temperature: opt.id })}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
                  comfortPrefs.temperature === opt.id
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-black hover:bg-neutral-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'quiet', label: 'Тихая поездка' },
                { id: 'no_preference', label: 'Не важно' },
                { id: 'chatty', label: 'Пообщаться' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateComfortPrefs({ ...comfortPrefs, conversation: opt.id })}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                  comfortPrefs.conversation === opt.id
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-black hover:bg-neutral-100'
                }`}
              >
                {opt.id === 'quiet' && <VolumeX className="w-3 h-3 shrink-0" />}
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compact Plus Points & KG One (Uber One) Row — hidden until real bonuses exist */}
      <div className="hidden grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onToggleUsePlusPoints}
          className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between ${
            usePlusPoints
              ? 'bg-black text-white border-black'
              : 'bg-[#f6f6f6] text-black border-transparent hover:bg-[#eeeeee]'
          }`}
        >
          <div className="min-w-0">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Бонусы Plus</span>
            </span>
            <span className={`text-[11px] block truncate ${usePlusPoints ? 'text-neutral-300' : 'text-neutral-500'}`}>
              {usePlusPoints ? `Списано -${Math.min(plusPointsBalance, 100)} с` : `Доступно ${plusPointsBalance} б.`}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onToggleKgOne}
          className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between ${
            isKgOneMember
              ? 'bg-black text-white border-black'
              : 'bg-[#f6f6f6] text-black border-transparent hover:bg-[#eeeeee]'
          }`}
        >
          <div className="min-w-0">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>KG One</span>
            </span>
            <span className={`text-[11px] block truncate ${isKgOneMember ? 'text-[#05944F] font-semibold' : 'text-neutral-500'}`}>
              {isKgOneMember ? 'Активна · −7% и 10%' : '−7% и 0с доставка'}
            </span>
          </div>
        </button>
      </div>

      {/* Driver Comment Input */}
      <input
        type="text"
        value={driverComment}
        onChange={(e) => onUpdateDriverComment(e.target.value)}
        placeholder="Комментарий водителю (подъезд, шлагбаум...)"
        className="w-full h-10 bg-[#f6f6f6] focus:bg-white border border-transparent focus:border-black rounded-lg px-3.5 text-xs text-black placeholder-neutral-500 focus:outline-none transition-colors"
      />

      {/* Quick Links for Mobile (Intercity & Food) */}
      {(onOpenIntercity || onOpenFoodDelivery) && (
        <div className="flex md:hidden items-center gap-2">
          {onOpenIntercity && (
            <button
              type="button"
              onClick={onOpenIntercity}
              className="flex-1 py-2 px-3 rounded-lg bg-[#f6f6f6] text-black text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Межгород КР</span>
            </button>
          )}
          {onOpenFoodDelivery && (
            <button
              type="button"
              onClick={onOpenFoodDelivery}
              className="flex-1 py-2 px-3 rounded-lg bg-[#f6f6f6] text-black text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Еда Бишкек</span>
            </button>
          )}
        </div>
      )}

      {/* Uber for Business: Personal / Corporate Billing Switcher */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#f6f6f6] rounded-xl border border-neutral-200">
        <div className="flex items-center gap-2 min-w-0">
          {billingProfile === 'business' ? (
            <Briefcase className="w-4 h-4 text-[#276EF1] shrink-0" />
          ) : (
            <User className="w-4 h-4 text-black shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold text-black truncate">
              {billingProfile === 'business' ? businessCompanyName : 'Личный профиль'}
            </div>
            <div className="text-[10px] text-neutral-500 truncate">
              {billingProfile === 'business'
                ? 'Корпоративный счёт · Авто-чек с ИНН'
                : 'Оплата личной картой или наличными'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-neutral-200 shrink-0">
          <button
            type="button"
            onClick={() => onChangeBillingProfile('personal')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              billingProfile === 'personal'
                ? 'bg-black text-white'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Личный
          </button>
          <button
            type="button"
            onClick={() => onChangeBillingProfile('business')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              billingProfile === 'business'
                ? 'bg-[#276EF1] text-white'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            Бизнес
          </button>
        </div>
      </div>

      {/* Payment, QR & Options Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-200 gap-1.5">
        <button
          type="button"
          onClick={onOpenPaymentModal}
          className="flex items-center gap-1.5 py-2 px-2 rounded-lg hover:bg-[#f3f3f3] transition-colors text-left min-w-0"
        >
          <CreditCard className="w-4 h-4 text-black shrink-0" />
          <span className="text-xs font-semibold text-black truncate">{activePaymentName()}</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenQrPayment}
            className="flex items-center gap-1 py-2 px-2.5 rounded-lg bg-[#f3f3f3] hover:bg-[#e5e5e5] transition-colors text-xs font-semibold text-black"
            title="QR-оплата MBank / О!Деньги"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR</span>
          </button>

          <button
            type="button"
            onClick={onOpenOptionsModal}
            className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg hover:bg-[#f3f3f3] transition-colors text-xs font-semibold text-black"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{tripState.promoDiscount > 0 ? `-${tripState.promoDiscount} с` : 'Опции'}</span>
          </button>
        </div>
      </div>

      {/* Primary Uber Pure Black CTA Button */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onRequestRide}
          className="w-full h-13 px-5 rounded-xl bg-black hover:bg-neutral-800 active:scale-[0.99] text-white font-bold text-base flex items-center justify-between transition-all"
        >
          <span className="truncate pr-2">
            {pricingMode === 'bidding'
              ? 'Предложить цену водителям'
              : currentCity.id === 'intercity'
              ? t.orderIntercity
              : tripState.tariff.id === 'delivery'
              ? 'Вызвать курьера'
              : tripState.tariff.id === 'cargo'
              ? 'Заказать Портер'
              : tripState.tariff.id === 'hourly'
              ? `Арендовать на ${hourlyHours} ч`
              : tripState.tariff.id === 'green'
              ? 'Заказать Green EV'
              : `Заказать ${tripState.tariff.name[lang] || tripState.tariff.name.ru}`}
          </span>
          <span className="tabular-nums font-bold shrink-0">
            {activeCtaFare} {t.som}
          </span>
        </button>

        <p className="text-[11px] text-neutral-500 text-center">
          {pricingMode === 'bidding'
            ? 'Водители предложат свои цены · Выбирайте по рейтингу и авто'
            : billingProfile === 'business'
            ? `Оплата с корпоративного счёта · ${businessCompanyName}`
            : 'Фиксированная цена · Страхование поездки · 24/7 поддержка КР'}
        </p>
      </div>
    </div>
  );
};
