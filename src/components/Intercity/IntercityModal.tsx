import React, { useState } from 'react';
import { IntercityRoute, Language } from '../../types/taxi';
import { INTERCITY_ROUTES } from '../../data/kyrgyzstanData';
import { Users, Car, ArrowRight, Compass, Plane, Mountain, Clock, MapPin } from 'lucide-react';

interface IntercityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookRoute: (
    route: IntercityRoute,
    rideType: 'per_seat' | 'full_car',
    seatsCount: number,
    selectedSeats: string[],
    departureTime: string,
    station: string
  ) => void;
  lang: Language;
}

const CABIN_SEATS = [
  { id: '1A', label: 'Переднее (VIP)', row: 1, extraPrice: 100, occupied: false },
  { id: '2A', label: '2 ряд · Окно', row: 2, extraPrice: 0, occupied: true },
  { id: '2B', label: '2 ряд · Центр', row: 2, extraPrice: 0, occupied: false },
  { id: '2C', label: '2 ряд · Окно', row: 2, extraPrice: 0, occupied: false },
  { id: '3A', label: '3 ряд · Лево', row: 3, extraPrice: 0, occupied: false },
  { id: '3B', label: '3 ряд · Право', row: 3, extraPrice: 0, occupied: false }
];

const DEPARTURE_SLOTS = ['07:00', '09:30', '12:00', '15:00', '18:30', '21:00'];

export const IntercityModal: React.FC<IntercityModalProps> = ({
  isOpen,
  onClose,
  onBookRoute
}) => {
  const [categoryTab, setCategoryTab] = useState<'all' | 'intercity' | 'airport' | 'resort'>('all');
  const [selectedRoute, setSelectedRoute] = useState<IntercityRoute>(INTERCITY_ROUTES[0]);
  const [rideType, setRideType] = useState<'per_seat' | 'full_car'>('per_seat');
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['2C']);
  const [departureTime, setDepartureTime] = useState('09:30');
  const [selectedStation, setSelectedStation] = useState(INTERCITY_ROUTES[0].stations[0]);

  if (!isOpen) return null;

  const filteredRoutes =
    categoryTab === 'all'
      ? INTERCITY_ROUTES
      : INTERCITY_ROUTES.filter((r) => r.category === categoryTab);

  const toggleSeat = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.length > 1 ? prev.filter((s) => s !== seatId) : prev;
      }
      if (prev.length >= 4) return prev;
      return [...prev, seatId];
    });
  };

  const extraVipFee = selectedSeats.includes('1A') ? 100 : 0;
  const totalPrice =
    rideType === 'per_seat'
      ? selectedRoute.pricePerSeat * selectedSeats.length + extraVipFee
      : selectedRoute.priceFullCar;

  const handleSelectRoute = (route: IntercityRoute) => {
    setSelectedRoute(route);
    setSelectedStation(route.stations[0]);
  };

  const handleConfirm = () => {
    onBookRoute(
      selectedRoute,
      rideType,
      rideType === 'full_car' ? 6 : selectedSeats.length,
      rideType === 'full_car' ? ['Весь салон'] : selectedSeats,
      departureTime,
      selectedStation
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-black text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white text-black flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Межгород, Аэропорт Манас и Иссык-Куль</h3>
              <p className="text-xs text-neutral-400">
                Схема салона · Выбор места · Расписание рейсов по Кыргызстану
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-5 pt-4 pb-2 bg-white border-b border-neutral-200 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'all', label: 'Все направления', icon: Compass },
            { id: 'intercity', label: 'Города КР', icon: Car },
            { id: 'airport', label: 'Аэропорт Манас (FRU)', icon: Plane },
            { id: 'resort', label: 'Иссык-Куль и ГЛБ Каракол', icon: Mountain }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  categoryTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-[#f3f3f3] text-neutral-700 hover:bg-[#e5e5e5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto uber-scroll p-5 space-y-5">
          {/* Routes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredRoutes.map((route) => {
              const isSelected = selectedRoute.id === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => handleSelectRoute(route)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white border-2 border-black shadow-xs'
                      : 'bg-[#f6f6f6] border-transparent hover:bg-[#eeeeee]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-black">
                      {route.fromCity} ↔ {route.toCity}
                    </span>
                    <span className="text-xs font-bold text-black tabular-nums shrink-0">
                      от {route.pricePerSeat} с
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {route.distanceKm} км · ~{route.approxHours} ч · {route.keyPass}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ride Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-[#f3f3f3] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRideType('per_seat')}
              className={`py-3 px-3 rounded-lg font-semibold text-xs flex flex-col items-center gap-0.5 transition-all ${
                rideType === 'per_seat' ? 'bg-black text-white' : 'text-black hover:bg-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Выбор мест в салоне</span>
              </div>
              <span className={`text-[11px] ${rideType === 'per_seat' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                {selectedRoute.pricePerSeat} сом / место
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRideType('full_car')}
              className={`py-3 px-3 rounded-lg font-semibold text-xs flex flex-col items-center gap-0.5 transition-all ${
                rideType === 'full_car' ? 'bg-black text-white' : 'text-black hover:bg-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Car className="w-4 h-4" />
                <span>Весь автомобиль (Индивидуально)</span>
              </div>
              <span className={`text-[11px] ${rideType === 'full_car' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                {selectedRoute.priceFullCar} сом (весь салон)
              </span>
            </button>
          </div>

          {/* Interactive Cabin Seat Map */}
          {rideType === 'per_seat' && (
            <div className="bg-[#f6f6f6] border border-neutral-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-black block">Интерактивная схема салона (Toyota Alphard / Минивэн)</span>
                  <span className="text-[11px] text-neutral-500">
                    Выбрано мест: <strong className="text-black">{selectedSeats.join(', ')}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-neutral-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-white border border-neutral-400 inline-block" /> Свободно</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-black inline-block" /> Выбрано</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-neutral-300 inline-block" /> Занято</span>
                </div>
              </div>

              {/* Car Cabin Outline */}
              <div className="max-w-sm mx-auto bg-white border-2 border-neutral-300 rounded-3xl p-4 space-y-3">
                {/* Row 1: Driver + Front VIP Seat */}
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-dashed border-neutral-200">
                  <div className="py-2.5 px-3 rounded-xl bg-neutral-100 text-neutral-400 text-xs font-semibold text-center border border-neutral-200">
                    Водитель
                  </div>
                  {(() => {
                    const seat = CABIN_SEATS[0];
                    const isPicked = selectedSeats.includes(seat.id);
                    return (
                      <button
                        type="button"
                        onClick={() => toggleSeat(seat.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                          isPicked
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-neutral-300 hover:border-black'
                        }`}
                      >
                        {seat.id} · VIP (+100 с)
                      </button>
                    );
                  })()}
                </div>

                {/* Row 2: 3 Seats */}
                <div className="grid grid-cols-3 gap-2">
                  {CABIN_SEATS.slice(1, 4).map((seat) => {
                    const isPicked = selectedSeats.includes(seat.id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={seat.occupied}
                        onClick={() => toggleSeat(seat.id)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                          seat.occupied
                            ? 'bg-neutral-200 text-neutral-400 border-transparent cursor-not-allowed'
                            : isPicked
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-neutral-300 hover:border-black'
                        }`}
                      >
                        {seat.occupied ? `${seat.id} · Занято` : seat.id}
                      </button>
                    );
                  })}
                </div>

                {/* Row 3: 2 Rear Comfort Seats */}
                <div className="grid grid-cols-2 gap-3">
                  {CABIN_SEATS.slice(4, 6).map((seat) => {
                    const isPicked = selectedSeats.includes(seat.id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => toggleSeat(seat.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                          isPicked
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-neutral-300 hover:border-black'
                        }`}
                      >
                        {seat.id} · {seat.label.split('·')[1]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Departure Time & Station Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-black flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Время выезда</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {DEPARTURE_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setDepartureTime(slot)}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                      departureTime === slot
                        ? 'bg-black text-white'
                        : 'bg-[#f6f6f6] text-black hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-black flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Точка сбора / Автовокзал</span>
              </div>
              <div className="space-y-1.5">
                {selectedRoute.stations.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStation(st)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                      selectedStation === st
                        ? 'bg-black text-white'
                        : 'bg-[#f6f6f6] text-black hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#f6f6f6] p-4 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Маршрут</span>
              <span className="font-bold text-black">
                {selectedRoute.fromCity} ↔ {selectedRoute.toCity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Посадка · Выезд</span>
              <span className="text-black font-semibold">{selectedStation} · {departureTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Места</span>
              <span className="text-black font-semibold">
                {rideType === 'full_car' ? 'Весь автомобиль' : selectedSeats.join(', ')}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm">
              <span className="font-bold text-black">Итого</span>
              <span className="text-lg font-bold text-black tabular-nums">{totalPrice} сом</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-neutral-200 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-neutral-500">
            <div>Оплата: <strong className="text-black">MBank QR / Наличные</strong></div>
            <div className="text-[11px] text-[#05944F]">Проверенные водители · Багаж включён</div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
          >
            <span>Забронировать · {totalPrice} сом</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
