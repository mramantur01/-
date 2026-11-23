import React, { useState } from 'react';
import { TripState, Language } from '../../types/taxi';
import { TRANSLATIONS } from '../../utils/translations';
import {
  Baby,
  Briefcase,
  Dog,
  Wind,
  VolumeX,
  Tag,
  Check,
  PhoneOff,
  Banknote
} from 'lucide-react';

interface RideOptionsModalProps {
  options: TripState['options'];
  promoDiscount: number;
  onOptionsChange: (newOptions: TripState['options']) => void;
  onApplyPromo: (code: string) => boolean;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const RideOptionsModal: React.FC<RideOptionsModalProps> = ({
  options,
  promoDiscount,
  onOptionsChange,
  onApplyPromo,
  isOpen,
  onClose,
  lang
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  const toggleOption = (key: keyof TripState['options']) => {
    onOptionsChange({
      ...options,
      [key]: !options[key]
    });
  };

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const ok = onApplyPromo(promoInput.trim());
    if (ok) {
      setPromoMessage({ text: 'Промокод применен (-45 сом)', success: true });
    } else {
      setPromoMessage({ text: 'Попробуйте SALAM, BISHKEK или UBERKG', success: false });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl overflow-y-auto uber-scroll max-h-[90vh] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-lg font-bold text-black">{t.rideOptions}</h3>
            <p className="text-xs text-neutral-500">Настройте параметры вашей поездки</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Promo code */}
        <div className="bg-[#f6f6f6] p-3.5 rounded-xl space-y-2">
          <label className="text-xs font-semibold text-black flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Промокод</span>
          </label>
          <form onSubmit={handlePromoSubmit} className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="SALAM, BISHKEK, UBERKG"
              className="flex-1 bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-black uppercase tracking-wider"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              OK
            </button>
          </form>
          {promoMessage && (
            <p className={`text-xs font-medium ${promoMessage.success ? 'text-[#05944F]' : 'text-[#E11900]'}`}>
              {promoMessage.text}
            </p>
          )}
          {promoDiscount > 0 && (
            <p className="text-xs text-[#05944F] font-semibold">
              Активная скидка: -{promoDiscount} сом
            </p>
          )}
        </div>

        {/* Cash change */}
        <div className="p-3.5 bg-[#f6f6f6] rounded-xl space-y-2">
          <label className="text-xs font-semibold text-black flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5" />
            <span>Сдача с купюры</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onOptionsChange({ ...options, cashChangeFrom: val || undefined })}
                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                  (val === 0 && !options.cashChangeFrom) || options.cashChangeFrom === val
                    ? 'bg-black text-white'
                    : 'bg-white border border-neutral-200 text-black hover:bg-neutral-100'
                }`}
              >
                {val === 0 ? 'Не нужна' : `${val} с`}
              </button>
            ))}
          </div>
        </div>

        {/* Preferences List */}
        <div className="space-y-2">
          {[
            {
              key: 'noPhoneCalls' as const,
              icon: <PhoneOff className="w-4 h-4" />,
              title: 'Не звонить, писать в чат',
              desc: 'Водитель свяжется через чат при подаче'
            },
            {
              key: 'silentRide' as const,
              icon: <VolumeX className="w-4 h-4" />,
              title: t.silentDriver,
              desc: 'Спокойная поездка в тишине'
            },
            {
              key: 'airConditioning' as const,
              icon: <Wind className="w-4 h-4" />,
              title: t.acConditioner,
              desc: 'Кондиционер включен в салоне'
            },
            {
              key: 'luggage' as const,
              icon: <Briefcase className="w-4 h-4" />,
              title: t.luggage,
              desc: 'Свободный багажник для чемоданов'
            },
            {
              key: 'pet' as const,
              icon: <Dog className="w-4 h-4" />,
              title: t.petAllowed,
              desc: 'Поездка с домашним животным'
            }
          ].map((opt) => {
            const active = Boolean(options[opt.key]);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleOption(opt.key)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  active ? 'bg-white border-2 border-black' : 'bg-[#f6f6f6] border-transparent hover:bg-[#eeeeee]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-black">
                    {opt.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-black">{opt.title}</div>
                    <div className="text-[11px] text-neutral-500">{opt.desc}</div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    active ? 'bg-black border-black text-white' : 'bg-white border-neutral-300'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}

          {/* Child seat */}
          <div
            className={`p-3 rounded-xl border transition-all space-y-2 ${
              options.childSeat ? 'bg-white border-2 border-black' : 'bg-[#f6f6f6] border-transparent'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleOption('childSeat')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-black">
                  <Baby className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-black">{t.childSeat}</div>
                  <div className="text-[11px] text-neutral-500">Детское автокресло</div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border ${
                  options.childSeat ? 'bg-black border-black text-white' : 'bg-white border-neutral-300'
                }`}
              >
                {options.childSeat && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>

            {options.childSeat && (
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-neutral-200">
                {[
                  { id: 'infant', label: 'До 1 года' },
                  { id: 'toddler', label: '1-4 года' },
                  { id: 'booster', label: 'Бустер 4+' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onOptionsChange({ ...options, childSeatType: st.id as any })}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      options.childSeatType === st.id || (!options.childSeatType && st.id === 'toddler')
                        ? 'bg-black text-white'
                        : 'bg-[#f3f3f3] text-black hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-sm transition-colors"
        >
          Готово
        </button>
      </div>
    </div>
  );
};
