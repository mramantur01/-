import React from 'react';
import { Tariff, TariffId, Language } from '../../types/taxi';
import { User } from 'lucide-react';

interface TariffSelectorProps {
  tariffs: Tariff[];
  selectedTariffId: TariffId;
  onSelectTariff: (tariff: Tariff) => void;
  calculatedPrices: Record<TariffId, number>;
  lang: Language;
}

/* Crisp Uber-style monochrome vector vehicle side silhouettes */
const UberVehicleSvg: React.FC<{ tariffId: TariffId }> = ({ tariffId }) => {
  if (tariffId === 'cargo') {
    return (
      <svg viewBox="0 0 88 44" className="w-16 h-9 shrink-0" aria-hidden="true">
        <rect x="6" y="10" width="44" height="22" rx="3" fill="#171717" />
        <path d="M52 14h15c3 0 6 3 8 8l3 4v6H52V14z" fill="#262626" />
        <path d="M56 17h10l5 6H56v-6z" fill="#e5e5e5" />
        <circle cx="22" cy="34" r="6" fill="#000" />
        <circle cx="22" cy="34" r="2.6" fill="#d4d4d4" />
        <circle cx="66" cy="34" r="6" fill="#000" />
        <circle cx="66" cy="34" r="2.6" fill="#d4d4d4" />
      </svg>
    );
  }

  if (tariffId === 'delivery') {
    return (
      <svg viewBox="0 0 88 44" className="w-16 h-9 shrink-0" aria-hidden="true">
        <rect x="20" y="9" width="38" height="26" rx="4" fill="#171717" />
        <path d="M20 18h38" stroke="#ffffff" strokeWidth="2" />
        <rect x="35" y="9" width="8" height="12" fill="#525252" />
        <circle cx="64" cy="31" r="6" fill="#276EF1" />
        <path d="M61 31h6M64 28v6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (tariffId === 'minivan' || tariffId === 'intercity_seat') {
    return (
      <svg viewBox="0 0 88 44" className="w-16 h-9 shrink-0" aria-hidden="true">
        <path d="M8 29V17c0-4 3-7 8-7h40c5 0 11 4 16 10l6 2c2 .7 3 2 3 4v4H8v-1z" fill="#171717" />
        <path d="M16 13h14v8H14v-6c0-1.2.8-2 2-2zm18 0h16v8H34v-8zm20 0h7l7 8H54v-8z" fill="#e5e5e5" />
        <circle cx="23" cy="33" r="6" fill="#000" />
        <circle cx="23" cy="33" r="2.5" fill="#d4d4d4" />
        <circle cx="65" cy="33" r="6" fill="#000" />
        <circle cx="65" cy="33" r="2.5" fill="#d4d4d4" />
      </svg>
    );
  }

  if (tariffId === 'business') {
    return (
      <svg viewBox="0 0 88 44" className="w-16 h-9 shrink-0" aria-hidden="true">
        <path d="M6 28c0-3 2-5 6-6l12-8c3-2 7-3 12-3h18c5 0 9 1.5 13 5l9 6c3 1 5 3 5 6v3H6v-3z" fill="#000000" />
        <path d="M27 14h15v7H19l8-7zm19 0h11l8 7H46v-7z" fill="#404040" />
        <rect x="6" y="27" width="75" height="1.5" fill="#525252" />
        <circle cx="22" cy="33" r="6" fill="#000" />
        <circle cx="22" cy="33" r="2.8" fill="#a3a3a3" />
        <circle cx="66" cy="33" r="6" fill="#000" />
        <circle cx="66" cy="33" r="2.8" fill="#a3a3a3" />
      </svg>
    );
  }

  if (tariffId === 'green') {
    return (
      <svg viewBox="0 0 88 44" className="w-16 h-9 shrink-0" aria-hidden="true">
        <path d="M8 29c0-3 2-5 6-6l10-8c3-2.5 7-3.5 12-3.5h15c5 0 9 1.5 13 5l8 5.5c3 1 5 3 5 6v3H8v-2z" fill="#171717" />
        <path d="M26 14.5h14v6.5H19l7-6.5zm18 0h10l7 6.5H44v-6.5z" fill="#dcfce7" />
        <circle cx="66" cy="11" r="6" fill="#05944F" />
        <path d="M66.5 7.8L63.5 11.4h2.6l-.6 3 3-3.6h-2.6l.6-3z" fill="#ffffff" />
        <circle cx="23" cy="33" r="5.8" fill="#000" />
        <circle cx="23" cy="33" r="2.4" fill="#d4d4d4" />
        <circle cx="65" cy="33" r="5.8" fill="#000" />
        <circle cx="65" cy="33" r="2.4" fill="#d4d4d4" />
      </svg>
    );
  }

  if (tariffId === 'hourly') {
    return (
      <svg viewBox="0 0 88 44" className="w-16 h-9 shrink-0" aria-hidden="true">
        <path d="M6 28c0-3 2-5 6-6l12-8c3-2 7-3 12-3h18c5 0 9 1.5 13 5l9 6c3 1 5 3 5 6v3H6v-3z" fill="#111111" />
        <path d="M27 14h15v7H19l8-7zm19 0h11l8 7H46v-7z" fill="#e5e5e5" />
        <circle cx="68" cy="11" r="6.5" fill="#276EF1" />
        <path d="M68 7.8V11l2.4 1.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <circle cx="22" cy="33" r="6" fill="#000" />
        <circle cx="22" cy="33" r="2.6" fill="#a3a3a3" />
        <circle cx="66" cy="33" r="6" fill="#000" />
        <circle cx="66" cy="33" r="2.6" fill="#a3a3a3" />
      </svg>
    );
  }

  if (tariffId === 'ladies') {
    return (
      <svg viewBox="0 0 88 44" className="w-16 h-9 shrink-0" aria-hidden="true">
        <path d="M8 29c0-3 2-5 6-6l10-8c3-2.5 7-3.5 12-3.5h15c5 0 9 1.5 13 5l8 5.5c3 1 5 3 5 6v3H8v-2z" fill="#18181b" />
        <path d="M26 14.5h14v6.5H19l7-6.5zm18 0h10l7 6.5H44v-6.5z" fill="#fce7f3" />
        <circle cx="23" cy="33" r="5.8" fill="#000" />
        <circle cx="23" cy="33" r="2.4" fill="#d4d4d4" />
        <circle cx="65" cy="33" r="5.8" fill="#000" />
        <circle cx="65" cy="33" r="2.4" fill="#d4d4d4" />
      </svg>
    );
  }

  // Economy / Together / Comfort / Comfort+ sleek sedan
  const bodyFill =
    tariffId === 'comfort_plus'
      ? '#1f2937'
      : tariffId === 'comfort'
      ? '#262626'
      : '#3f3f46';

  return (
    <svg viewBox="0 0 88 44" className="w-16 h-9 shrink-0" aria-hidden="true">
      <path d="M8 29c0-3 2-5 6-6l10-8c3-2.5 7-3.5 12-3.5h15c5 0 9 1.5 13 5l8 5.5c3 1 5 3 5 6v3H8v-2z" fill={bodyFill} />
      <path d="M26 14.5h14v6.5H19l7-6.5zm18 0h10l7 6.5H44v-6.5z" fill="#f5f5f5" />
      <circle cx="23" cy="33" r="5.8" fill="#000" />
      <circle cx="23" cy="33" r="2.4" fill="#d4d4d4" />
      <circle cx="65" cy="33" r="5.8" fill="#000" />
      <circle cx="65" cy="33" r="2.4" fill="#d4d4d4" />
    </svg>
  );
};

export const TariffSelector: React.FC<TariffSelectorProps> = ({
  tariffs,
  selectedTariffId,
  onSelectTariff,
  calculatedPrices,
  lang
}) => {
  const getEtaClock = (etaMin: number) => {
    const d = new Date(Date.now() + (etaMin + 12) * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-1.5 max-h-[268px] overflow-y-auto uber-scroll pr-1">
      {tariffs.map((t) => {
        const isSelected = t.id === selectedTariffId;
        const price = calculatedPrices[t.id] || t.basePrice;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTariff(t)}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-150 ${
              isSelected
                ? 'bg-white border-2 border-black shadow-sm'
                : 'bg-white border border-transparent hover:bg-[#f6f6f6]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <UberVehicleSvg tariffId={t.id} />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[15px] text-black truncate">
                    {t.name[lang] || t.name.ru}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-xs text-neutral-600 font-medium shrink-0">
                    <User className="w-3 h-3 fill-neutral-600" />
                    <span>{t.capacity}</span>
                  </span>
                  {t.badge && (
                    <span className="text-[11px] font-semibold text-[#05944F] shrink-0">
                      · {t.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-500 truncate mt-0.5">
                  через {t.etaMinutes} мин · {getEtaClock(t.etaMinutes)} · {t.carModels[0]}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 pl-3">
              <div className="text-base font-bold text-black tabular-nums leading-tight">
                {price} сом
              </div>
              {t.id === 'together' && (
                <div className="text-[11px] text-[#05944F] font-medium">Выгодно</div>
              )}
              {t.id === 'green' && (
                <div className="text-[11px] text-[#05944F] font-medium">0 г CO₂</div>
              )}
              {t.id === 'hourly' && (
                <div className="text-[11px] text-[#276EF1] font-medium">650 с/час</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
