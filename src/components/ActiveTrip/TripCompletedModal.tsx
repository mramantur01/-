import React, { useState } from 'react';
import { TripState, Language } from '../../types/taxi';
import { TRANSLATIONS } from '../../utils/translations';
import { Star, CheckCircle2, Leaf, Briefcase } from 'lucide-react';

interface TripCompletedModalProps {
  trip: TripState;
  onFinishRating: (rating: number, tip: number) => void;
  lang: Language;
}

export const TripCompletedModal: React.FC<TripCompletedModalProps> = ({
  trip,
  onFinishRating,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [rating, setRating] = useState(5);
  const [selectedTip, setSelectedTip] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Чистый салон']);

  const feedbackTags = [
    'Чистый салон',
    'Вежливый водитель',
    'Комфортное вождение',
    'Отличный маршрут',
    'Быстрая подача'
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const driver = trip.driver;
  const totalWithTip = trip.totalFare + selectedTip;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#05944F]/10 text-[#05944F] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-black">{t.tripCompleted}</h3>
          <p className="text-xs text-neutral-500">
            Чек поездки KG Taxi · {trip.cityId.toUpperCase()}
          </p>
        </div>

        {/* Uber Receipt Box */}
        <div className="bg-[#f6f6f6] rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-500">
            <span>Маршрут</span>
            <span className="text-black font-semibold truncate max-w-[210px]">
              {trip.pickup.name} → {trip.destination.name}
            </span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Тариф</span>
            <span className="text-black font-medium">
              {trip.tariff.name[lang]}
              {trip.tariff.id === 'hourly' && trip.hourlyHours ? ` · ${trip.hourlyHours} ч` : ''}
            </span>
          </div>
          {trip.billingProfile === 'business' && (
            <div className="flex justify-between text-[#276EF1]">
              <span className="flex items-center gap-1 font-semibold">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Профиль оплаты</span>
              </span>
              <span className="font-bold">Бизнес · Чек с ИНН</span>
            </div>
          )}
          <div className="flex justify-between text-neutral-500">
            <span>{trip.tariff.id === 'hourly' ? 'Включено' : 'Расстояние'}</span>
            <span className="text-black font-medium tabular-nums">{trip.distanceKm} км</span>
          </div>
          {trip.promoDiscount > 0 && (
            <div className="flex justify-between text-[#05944F]">
              <span>Скидка</span>
              <span className="font-semibold tabular-nums">-{trip.promoDiscount} сом</span>
            </div>
          )}
          {selectedTip > 0 && (
            <div className="flex justify-between text-black">
              <span>Чаевые</span>
              <span className="font-semibold tabular-nums">+{selectedTip} сом</span>
            </div>
          )}
          <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-black">Итого</span>
            <span className="text-lg font-bold text-black tabular-nums">{totalWithTip} сом</span>
          </div>
        </div>

        {trip.tariff.id === 'green' && (
          <div className="px-3.5 py-2.5 rounded-xl bg-[#05944F]/10 border border-[#05944F]/25 flex items-center gap-2 text-xs text-[#05944F] font-semibold">
            <Leaf className="w-4 h-4 shrink-0" />
            <span>
              Сэкономлено ~{(trip.distanceKm * 0.14).toFixed(1)} кг CO₂ — спасибо за поездку на электромобиле!
            </span>
          </div>
        )}

        {/* Driver Rating */}
        {driver && (
          <div className="text-center space-y-3">
            <div className="text-xs font-semibold text-neutral-600">
              Оцените поездку с <span className="text-black font-bold">{driver.name}</span>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-black text-black' : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {feedbackTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-black text-white'
                      : 'bg-[#f3f3f3] text-neutral-700 hover:bg-[#e5e5e5]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tip Selection */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-black">Добавить чаевые</div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 20, 50, 100].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedTip(amount)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedTip === amount
                    ? 'bg-black text-white'
                    : 'bg-[#f3f3f3] text-black hover:bg-[#e5e5e5]'
                }`}
              >
                {amount === 0 ? 'Без чаевых' : `+${amount} с`}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onFinishRating(rating, selectedTip)}
          className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-sm transition-colors"
        >
          {t.finish}
        </button>
      </div>
    </div>
  );
};
