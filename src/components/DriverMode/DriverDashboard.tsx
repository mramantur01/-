import React, { useState, useEffect, useMemo } from 'react';
import { Language, CityConfig, DriverProfile, LiveRideDoc } from '../../types/taxi';
import { TRANSLATIONS } from '../../utils/translations';
import {
  Power,
  Wallet,
  TrendingUp,
  Navigation,
  Award,
  Car,
  Radio,
  Flame,
  Trophy,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface DriverDashboardProps {
  currentCity: CityConfig;
  driverProfile: DriverProfile;
  lang: Language;
  liveOpenRides: LiveRideDoc[];
  onAcceptLiveRide?: (ride: LiveRideDoc) => Promise<void>;
  onSendCounterBid?: (ride: LiveRideDoc, price: number) => Promise<void>;
  onUpdateLiveRideStatus?: (
    rideId: string,
    status: 'driver_arrived' | 'in_trip' | 'completed'
  ) => Promise<void>;
  onExitDriverMode: () => void;
  onOpenRegister: () => void;
}

interface IncomingOrder {
  id: string;
  liveRide?: LiveRideDoc;
  clientName: string;
  clientRating: number;
  pickup: string;
  destination: string;
  distanceKm: number;
  fare: number;
  tariffName: string;
  paymentType: string;
  isIntercity?: boolean;
  isBidding?: boolean;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  currentCity,
  driverProfile,
  lang,
  liveOpenRides,
  onAcceptLiveRide,
  onSendCounterBid,
  onUpdateLiveRideStatus,
  onExitDriverMode,
  onOpenRegister
}) => {
  const t = TRANSLATIONS[lang];
  const [isOnline, setIsOnline] = useState(driverProfile.isOnline);
  const [dailyEarnings, setDailyEarnings] = useState(driverProfile.balanceKgs || 4850);
  const [completedCount, setCompletedCount] = useState(driverProfile.totalTrips || 14);
  const [incomingOrder, setIncomingOrder] = useState<IncomingOrder | null>(null);
  const [activeDriverTrip, setActiveDriverTrip] = useState<IncomingOrder | null>(null);
  const [activeTripStage, setActiveTripStage] = useState<'assigned' | 'arrived' | 'in_trip'>('assigned');
  const [cashoutSuccess, setCashoutSuccess] = useState(false);
  const [orderTimeoutSec, setOrderTimeoutSec] = useState(20);
  const [bidPriceInput, setBidPriceInput] = useState<number>(200);
  const [bidSentNotice, setBidSentNotice] = useState<string | null>(null);
  const [weeklyQuestTrips, setWeeklyQuestTrips] = useState<number>(17);
  const [claimedTier1, setClaimedTier1] = useState(false);
  const [claimedTier2, setClaimedTier2] = useState(false);
  const [selectedSurgeZone, setSelectedSurgeZone] = useState<string | null>(null);

  const surgeZones = useMemo(() => {
    if (currentCity.id === 'bishkek') {
      return [
        { id: 'manas', name: 'Аэропорт Манас (FRU)', multiplier: 1.6, bonusKgs: 180, level: 'hot' as const },
        { id: 'tsum', name: 'Центр / ЦУМ Айчүрөк', multiplier: 1.4, bonusKgs: 95, level: 'high' as const },
        { id: 'asia_mall', name: 'ТРЦ Asia Mall', multiplier: 1.3, bonusKgs: 70, level: 'medium' as const },
        { id: 'jal', name: 'мкр. Джал / Юж. магистраль', multiplier: 1.2, bonusKgs: 50, level: 'medium' as const }
      ];
    }
    if (currentCity.id === 'osh') {
      return [
        { id: 'osh_air', name: 'Аэропорт Ош (OSS)', multiplier: 1.5, bonusKgs: 140, level: 'hot' as const },
        { id: 'osh_bazaar', name: 'Центральный рынок Ош', multiplier: 1.4, bonusKgs: 85, level: 'high' as const },
        { id: 'sulaiman', name: 'Гора Сулайман-Тоо', multiplier: 1.3, bonusKgs: 65, level: 'medium' as const },
        { id: 'osh_center', name: 'Центр / пл. Ленина', multiplier: 1.2, bonusKgs: 45, level: 'medium' as const }
      ];
    }
    const mults = [1.5, 1.4, 1.3, 1.2];
    const bonuses = [120, 85, 65, 45];
    return currentCity.landmarks.slice(0, 4).map((lm, idx) => ({
      id: lm.id,
      name: lm.name.ru,
      multiplier: mults[idx] || 1.2,
      bonusKgs: bonuses[idx] || 40,
      level: idx === 0 ? ('hot' as const) : idx === 1 ? ('high' as const) : ('medium' as const)
    }));
  }, [currentCity]);

  // Simulated fallback order when no live cloud rides are pending
  useEffect(() => {
    if (!isOnline || activeDriverTrip || incomingOrder || liveOpenRides.length > 0) return;

    const timer = setTimeout(() => {
      const isIntercityChance = Math.random() > 0.7;
      if (isIntercityChance) {
        setIncomingOrder({
          id: `ord_intercity_${Date.now()}`,
          clientName: 'Бексултан (Межгород)',
          clientRating: 4.98,
          pickup: 'г. Бишкек (Западный автовокзал)',
          destination: 'г. Ош (через перевал Төө-Ашуу)',
          distanceKm: 640,
          fare: 5200,
          tariffName: 'Межгород (Салон)',
          paymentType: 'MBank',
          isIntercity: true
        });
      } else {
        const lms = currentCity.landmarks;
        const p1 = lms[Math.floor(Math.random() * lms.length)];
        const p2 = lms.find((l) => l.id !== p1.id) || lms[0];
        const clientNames = ['Айпери', 'Нурбек', 'Чынгыз', 'Гульзат', 'Алмаз', 'Бакыт'];
        const fare = Math.floor(Math.random() * 200) + 160;

        setIncomingOrder({
          id: `ord_${Date.now()}`,
          clientName: clientNames[Math.floor(Math.random() * clientNames.length)],
          clientRating: 4.95,
          pickup: p1.name.ru,
          destination: p2.name.ru,
          distanceKm: Number((Math.random() * 5 + 2).toFixed(1)),
          fare,
          tariffName: 'Комфорт',
          paymentType: 'MBank'
        });
      }
      setOrderTimeoutSec(20);
    }, 5500);

    return () => clearTimeout(timer);
  }, [isOnline, activeDriverTrip, incomingOrder, currentCity, liveOpenRides.length]);

  useEffect(() => {
    if (!incomingOrder) return;
    if (orderTimeoutSec <= 0) {
      setIncomingOrder(null);
      return;
    }
    const interval = setInterval(() => {
      setOrderTimeoutSec((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingOrder, orderTimeoutSec]);

  const acceptOrder = async (order: IncomingOrder) => {
    if (order.liveRide && onAcceptLiveRide) {
      await onAcceptLiveRide(order.liveRide);
    }
    setActiveDriverTrip(order);
    setActiveTripStage('assigned');
    setIncomingOrder(null);
  };

  const handleStageAdvance = async () => {
    if (!activeDriverTrip) return;
    if (activeTripStage === 'assigned') {
      setActiveTripStage('arrived');
      if (activeDriverTrip.liveRide && onUpdateLiveRideStatus) {
        await onUpdateLiveRideStatus(activeDriverTrip.liveRide.id, 'driver_arrived');
      }
      return;
    }
    if (activeTripStage === 'arrived') {
      setActiveTripStage('in_trip');
      if (activeDriverTrip.liveRide && onUpdateLiveRideStatus) {
        await onUpdateLiveRideStatus(activeDriverTrip.liveRide.id, 'in_trip');
      }
      return;
    }
    // Complete trip
    if (activeDriverTrip.liveRide && onUpdateLiveRideStatus) {
      await onUpdateLiveRideStatus(activeDriverTrip.liveRide.id, 'completed');
    }
    const netDriverPay = Math.round(activeDriverTrip.fare * 0.88);
    setDailyEarnings((prev) => prev + netDriverPay);
    setCompletedCount((prev) => prev + 1);
    setWeeklyQuestTrips((prev) => prev + 1);
    setActiveDriverTrip(null);
    setActiveTripStage('assigned');
  };

  const handleCounterBid = async (ride: LiveRideDoc) => {
    if (!onSendCounterBid) return;
    const price = bidPriceInput > 30 ? bidPriceInput : ride.fare + 30;
    await onSendCounterBid(ride, price);
    setBidSentNotice(`Предложение ${price} сом отправлено пассажиру ${ride.passengerName}`);
    setTimeout(() => setBidSentNotice(null), 3000);
  };

  const handleCashout = () => {
    setCashoutSuccess(true);
    setTimeout(() => setCashoutSuccess(false), 4000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Uber Driver Partner Header */}
      <div className="bg-black text-white rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white text-black font-bold text-xl flex items-center justify-center shrink-0">
            {driverProfile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{driverProfile.name}</h2>
              <span className="text-xs font-mono font-bold bg-neutral-800 text-white px-2 py-0.5 rounded">
                {driverProfile.carPlate}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {driverProfile.carBrand} {driverProfile.carModel} · {currentCity.name.ru} ·{' '}
              {isOnline ? 'На линии' : 'Офлайн'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenRegister}
            className="px-4 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Car className="w-4 h-4" />
            <span>Регистрация / Авто</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${
              isOnline
                ? 'bg-[#276EF1] hover:bg-blue-600 text-white'
                : 'bg-white hover:bg-neutral-200 text-black'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'На линии' : 'Выйти на линию'}</span>
          </button>

          <button
            type="button"
            onClick={onExitDriverMode}
            className="px-4 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
          >
            Режим пассажира
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>{t.todayEarnings}</span>
            <Wallet className="w-4 h-4 text-black" />
          </div>
          <div className="text-2xl font-bold text-black tabular-nums">
            {dailyEarnings.toLocaleString('ru-RU')} сом
          </div>
          <button
            type="button"
            onClick={handleCashout}
            className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            {t.withdrawMbank}
          </button>
          {cashoutSuccess && (
            <p className="text-xs text-[#05944F] font-semibold text-center">
              Перевод {dailyEarnings} сом отправлен на MBank
            </p>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Выполнено поездок</span>
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          <div className="text-2xl font-bold text-black tabular-nums">{completedCount}</div>
          <div className="text-xs text-neutral-500">
            Средний чек: <strong className="text-black">346 сом</strong>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Рейтинг водителя</span>
            <Award className="w-4 h-4 text-black" />
          </div>
          <div className="text-2xl font-bold text-black tabular-nums">
            {driverProfile.rating} <span className="text-sm text-neutral-400 font-normal">/ 5.0</span>
          </div>
          <div className="text-xs text-[#05944F] font-semibold">
            {driverProfile.verificationStatus === 'pending'
              ? 'Документы на проверке'
              : 'Платиновый статус партнера'}
          </div>
        </div>
      </div>

      {/* Uber Driver Quests & Surge Demand Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Driver Quests */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Квесты недели (Uber Quests)</h3>
                <p className="text-[11px] text-neutral-500">
                  Выполняйте поездки и получайте гарантированный бонус
                </p>
              </div>
            </div>
            <span className="text-xs font-bold tabular-nums bg-[#f3f3f3] px-2.5 py-1 rounded-full text-black shrink-0">
              {weeklyQuestTrips} / 35
            </span>
          </div>

          {/* Tier 1: 20 rides -> +1500 som */}
          <div className="p-3 bg-[#f6f6f6] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-black">Цель 1: 20 поездок</span>
              <span className="font-bold text-[#05944F]">+1 500 сом</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (weeklyQuestTrips / 20) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">
                {weeklyQuestTrips >= 20
                  ? 'Цель выполнена!'
                  : `Осталось ${20 - weeklyQuestTrips} поездок до бонуса`}
              </span>
              {weeklyQuestTrips >= 20 && !claimedTier1 && (
                <button
                  type="button"
                  onClick={() => {
                    setClaimedTier1(true);
                    setDailyEarnings((prev) => prev + 1500);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#05944F] text-white font-bold"
                >
                  Забрать +1 500 с
                </button>
              )}
              {claimedTier1 && (
                <span className="text-[#05944F] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Зачислено
                </span>
              )}
            </div>
          </div>

          {/* Tier 2: 35 rides -> +3500 som */}
          <div className="p-3 bg-[#f6f6f6] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-black">Цель 2: 35 поездок</span>
              <span className="font-bold text-[#276EF1]">+3 500 сом</span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#276EF1] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (weeklyQuestTrips / 35) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">
                {weeklyQuestTrips >= 35
                  ? 'Максимальная цель выполнена!'
                  : `Осталось ${35 - weeklyQuestTrips} поездок`}
              </span>
              {weeklyQuestTrips >= 35 && !claimedTier2 && (
                <button
                  type="button"
                  onClick={() => {
                    setClaimedTier2(true);
                    setDailyEarnings((prev) => prev + 3500);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#276EF1] text-white font-bold"
                >
                  Забрать +3 500 с
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Surge Demand Heatmap */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E11900] text-white flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black">Тепловая карта спроса · {currentCity.name.ru}</h3>
                <p className="text-[11px] text-neutral-500">
                  Повышенные коэффициенты прямо сейчас · Нажмите, чтобы ехать в зону
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {surgeZones.map((zone) => {
              const isSelected = selectedSurgeZone === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedSurgeZone(isSelected ? null : zone.id)}
                  className={`p-3 rounded-xl border text-left transition-all space-y-1 ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-[#f6f6f6] hover:bg-[#eeeeee] text-black border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full tabular-nums ${
                        zone.level === 'hot'
                          ? 'bg-[#E11900] text-white'
                          : zone.level === 'high'
                          ? 'bg-amber-500 text-white'
                          : 'bg-[#276EF1] text-white'
                      }`}
                    >
                      ×{zone.multiplier.toFixed(1)}
                    </span>
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
                        isSelected ? 'text-[#05944F]' : 'text-[#05944F]'
                      }`}
                    >
                      +{zone.bonusKgs} сом
                    </span>
                  </div>
                  <div className="text-xs font-bold truncate flex items-center gap-1 pt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{zone.name}</span>
                  </div>
                  <div className={`text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {isSelected ? 'Навигация в зону активна' : 'Нажмите для маршрута'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {bidSentNotice && (
        <div className="p-3.5 rounded-xl bg-[#05944F]/10 text-[#05944F] text-xs font-bold">
          {bidSentNotice}
        </div>
      )}

      {/* LIVE FIRESTORE ORDERS FROM PASSENGERS (REAL-TIME SYNC) */}
      {isOnline && !activeDriverTrip && liveOpenRides.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-black">
            <Radio className="w-4 h-4 text-[#05944F] animate-pulse" />
            <span>Живые заказы пассажиров в реальном времени ({liveOpenRides.length})</span>
          </div>

          {liveOpenRides.map((ride) => (
            <div
              key={ride.id}
              className="bg-black text-white rounded-2xl p-5 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 block">
                    {ride.tariffName} · {ride.pricingMode === 'bidding' ? 'Своя цена (Торг)' : 'Фикс. тариф'}
                  </span>
                  <h3 className="font-bold text-xl text-white tabular-nums">{ride.fare} сом</h3>
                </div>
                <span className="text-[11px] font-bold bg-[#05944F] text-white px-2.5 py-1 rounded-full">
                  LIVE ЗАКАЗ
                </span>
              </div>

              <div className="space-y-2 bg-neutral-900 p-3.5 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                  <span className="font-medium text-white truncate">{ride.pickupName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white shrink-0" />
                  <span className="font-medium text-neutral-300 truncate">{ride.destName}</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between text-neutral-400">
                  <span>Пассажир: {ride.passengerName}</span>
                  <span>{ride.distanceKm} км · {ride.estimatedMinutes} мин</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">
                    Комиссия 12%: −{Math.round(ride.fare * 0.12)} сом
                  </span>
                  <span className="font-bold text-[#05944F] tabular-nums">
                    Чистыми водителю: {Math.round(ride.fare * 0.88)} сом
                  </span>
                </div>
              </div>

              {ride.pricingMode === 'bidding' && onSendCounterBid ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      acceptOrder({
                        id: ride.id,
                        liveRide: ride,
                        clientName: ride.passengerName,
                        clientRating: 4.98,
                        pickup: ride.pickupName,
                        destination: ride.destName,
                        distanceKm: ride.distanceKm,
                        fare: ride.fare,
                        tariffName: ride.tariffName,
                        paymentType: ride.paymentMethod,
                        isBidding: true
                      })
                    }
                    className="flex-1 py-3 bg-[#276EF1] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Принять за {ride.fare} сом
                  </button>
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      min={50}
                      step={10}
                      value={bidPriceInput}
                      onChange={(e) => setBidPriceInput(Number(e.target.value))}
                      className="w-24 py-3 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleCounterBid(ride)}
                      className="flex-1 py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl text-xs transition-colors"
                    >
                      Предложить цену
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    acceptOrder({
                      id: ride.id,
                      liveRide: ride,
                      clientName: ride.passengerName,
                      clientRating: 4.98,
                      pickup: ride.pickupName,
                      destination: ride.destName,
                      distanceKm: ride.distanceKm,
                      fare: ride.fare,
                      tariffName: ride.tariffName,
                      paymentType: ride.paymentMethod
                    })
                  }
                  className="w-full py-3.5 bg-[#276EF1] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  {t.acceptOrder} · {ride.fare} сом
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Active Driver Trip */}
      {activeDriverTrip && (
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div>
              <span className="text-sm font-bold text-black block">Активный заказ</span>
              <span className="text-xs text-[#276EF1] font-semibold">
                {activeTripStage === 'assigned'
                  ? 'Едете к пассажиру'
                  : activeTripStage === 'arrived'
                  ? 'Ожидаете пассажира на точке'
                  : 'Поездка выполняется'}
              </span>
            </div>
            <span className="text-base font-bold text-black tabular-nums">
              +{activeDriverTrip.fare} сом
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-black mt-1.5 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-500">Посадка</span>
                <p className="text-sm font-bold text-black">{activeDriverTrip.pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 bg-black mt-1.5 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-500">Назначение</span>
                <p className="text-sm font-bold text-black">{activeDriverTrip.destination}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-600 bg-[#f6f6f6] p-3.5 rounded-xl">
            <span>
              Пассажир: <strong className="text-black">{activeDriverTrip.clientName}</strong>
            </span>
            <span>
              Оплата: <strong className="text-black uppercase">{activeDriverTrip.paymentType}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleStageAdvance}
            className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-sm transition-colors"
          >
            {activeTripStage === 'assigned'
              ? 'Я на месте (Уведомить пассажира)'
              : activeTripStage === 'arrived'
              ? 'Начать поездку (Поехали)'
              : 'Завершить поездку'}
          </button>
        </div>
      )}

      {/* Incoming Simulated Order Request */}
      {incomingOrder && !activeDriverTrip && liveOpenRides.length === 0 && (
        <div className="bg-black text-white rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-neutral-400 block">{incomingOrder.tariffName}</span>
              <h3 className="font-bold text-xl text-white tabular-nums">
                {incomingOrder.fare} сом
              </h3>
            </div>
            <div className="text-xs font-mono font-bold bg-white text-black px-3 py-1.5 rounded-full">
              {orderTimeoutSec} сек
            </div>
          </div>

          <div className="space-y-2.5 bg-neutral-900 p-4 rounded-xl text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              <span className="font-medium text-white truncate">{incomingOrder.pickup}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-white shrink-0" />
              <span className="font-medium text-neutral-300 truncate">
                {incomingOrder.destination}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-800 flex justify-between text-neutral-400">
              <span>{incomingOrder.clientName} · ★ {incomingOrder.clientRating}</span>
              <span className="tabular-nums">{incomingOrder.distanceKm} км</span>
            </div>
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">
                Upfront · Комиссия 12%: −{Math.round(incomingOrder.fare * 0.12)} сом
              </span>
              <span className="font-bold text-[#05944F] tabular-nums">
                Чистыми вам: {Math.round(incomingOrder.fare * 0.88)} сом
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIncomingOrder(null)}
              className="flex-1 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {t.declineOrder}
            </button>
            <button
              type="button"
              onClick={() => acceptOrder(incomingOrder)}
              className="flex-[2] py-3.5 bg-[#276EF1] hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {t.acceptOrder}
            </button>
          </div>
        </div>
      )}

      {/* Waiting Radar */}
      {isOnline && !incomingOrder && !activeDriverTrip && liveOpenRides.length === 0 && (
        <div className="bg-[#f6f6f6] border border-neutral-200 rounded-2xl p-8 text-center space-y-2">
          <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center mx-auto">
            <Navigation className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-black">
            Поиск заказов в г. {currentCity.name.ru}...
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Вы на линии. Все живые заказы из режима пассажира и ближайшие клиенты появятся здесь автоматически.
          </p>
        </div>
      )}
    </div>
  );
};
