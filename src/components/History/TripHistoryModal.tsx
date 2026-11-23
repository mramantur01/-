import React, { useState } from 'react';
import { TripHistoryItem, Language } from '../../types/taxi';
import { TRANSLATIONS } from '../../utils/translations';
import {
  Clock,
  RotateCcw,
  Receipt,
  PackageSearch,
  Copy,
  Check,
  Download,
  PhoneCall,
  Briefcase,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

interface TripHistoryModalProps {
  history: TripHistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onRepeatTrip: (item: TripHistoryItem) => void;
  onReportLostItem?: (tripId: string, summary: string) => void;
  businessCompanyName?: string;
  businessInn?: string;
  lang: Language;
}

const LOST_ITEM_CATEGORIES = [
  'Телефон / Наушники',
  'Ключи',
  'Сумка / Кошелёк',
  'Документы / Паспорт',
  'Одежда / Зонт',
  'Другое'
];

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({
  history,
  isOpen,
  onClose,
  onRepeatTrip,
  onReportLostItem,
  businessCompanyName = 'ОсОО «Ала-Тоо Тех»',
  businessInn = '01408201910234',
  lang
}) => {
  const [receiptTrip, setReceiptTrip] = useState<TripHistoryItem | null>(null);
  const [lostItemTrip, setLostItemTrip] = useState<TripHistoryItem | null>(null);
  const [lostCategory, setLostCategory] = useState<string>(LOST_ITEM_CATEGORIES[0]);
  const [lostNote, setLostNote] = useState('');
  const [lostSubmitted, setLostSubmitted] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  if (!isOpen) return null;
  const t = TRANSLATIONS[lang];

  const buildReceiptText = (item: TripHistoryItem) => {
    const isBiz = item.billingProfile === 'business';
    const receiptNo = `KG-${item.id.slice(-6).toUpperCase()}`;
    return [
      '==============================',
      isBiz ? 'KG TAXI BUSINESS · КОРП. ЧЕК' : 'KG TAXI · ЭЛЕКТРОННЫЙ ЧЕК',
      '==============================',
      `Чек №: ${receiptNo}`,
      `Дата: ${item.date}`,
      `Город: ${item.cityName}`,
      isBiz ? `Компания: ${businessCompanyName}` : 'Профиль: Личный',
      ...(isBiz ? [`ИНН КР: ${businessInn}`] : []),
      '------------------------------',
      `Откуда: ${item.pickup}`,
      `Куда: ${item.destination}`,
      `Тариф: ${item.tariffName}`,
      `Автомобиль: ${item.carInfo}`,
      `Оплата: ${item.paymentMethod}`,
      '------------------------------',
      `ИТОГО ОПЛАЧЕНО: ${item.fare} сом`,
      '==============================',
      'Спасибо за поездку с KG Taxi!'
    ].join('\n');
  };

  const handleCopyReceipt = async (item: TripHistoryItem) => {
    try {
      await navigator.clipboard.writeText(buildReceiptText(item));
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    } catch {
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    }
  };

  const handleDownloadReceipt = (item: TripHistoryItem) => {
    const blob = new Blob([buildReceiptText(item)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KG-Taxi-Receipt-${item.id.slice(-6)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmitLostItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostItemTrip) return;
    const summary = lostNote.trim() ? `${lostCategory}: ${lostNote.trim()}` : lostCategory;
    onReportLostItem?.(lostItemTrip.id, summary);
    setLostSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[88vh]">
        {/* RECEIPT SUB-VIEW */}
        {receiptTrip ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setReceiptTrip(null);
                  setCopiedReceipt(false);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад к истории</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto uber-scroll py-4 space-y-4">
              <div className="bg-[#f6f6f6] border border-neutral-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-dashed border-neutral-300 pb-3">
                  <div>
                    <div className="text-base font-black text-black tracking-tight">KG Taxi</div>
                    <div className="text-[11px] text-neutral-500">
                      {receiptTrip.billingProfile === 'business'
                        ? 'Корпоративный электронный чек'
                        : 'Официальный электронный чек'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-black">
                      № KG-{receiptTrip.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-[11px] text-neutral-500">{receiptTrip.date}</div>
                  </div>
                </div>

                {receiptTrip.billingProfile === 'business' && (
                  <div className="bg-white border border-neutral-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#276EF1]">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{businessCompanyName}</span>
                    </div>
                    <div className="text-[11px] text-neutral-600 font-mono">
                      ИНН КР: {businessInn}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500">Город</span>
                    <span className="font-semibold text-black">{receiptTrip.cityName}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Подача</span>
                    <span className="font-semibold text-black text-right">{receiptTrip.pickup}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500 shrink-0">Назначение</span>
                    <span className="font-semibold text-black text-right">{receiptTrip.destination}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500">Тариф</span>
                    <span className="font-semibold text-black">{receiptTrip.tariffName}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500">Автомобиль</span>
                    <span className="font-semibold text-black text-right">{receiptTrip.carInfo}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-neutral-500">Способ оплаты</span>
                    <span className="font-semibold text-black uppercase">{receiptTrip.paymentMethod}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-dashed border-neutral-300 flex items-center justify-between">
                  <span className="text-sm font-bold text-black">Итого оплачено</span>
                  <span className="text-xl font-extrabold text-black tabular-nums">
                    {receiptTrip.fare} сом
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyReceipt(receiptTrip)}
                  className="py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedReceipt ? <Check className="w-4 h-4 text-[#05944F]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedReceipt ? 'Скопировано' : 'Скопировать чек'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(receiptTrip)}
                  className="py-3 px-4 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Скачать (.txt)</span>
                </button>
              </div>
            </div>
          </div>
        ) : lostItemTrip ? (
          /* LOST ITEM FLOW SUB-VIEW */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setLostItemTrip(null);
                  setLostSubmitted(false);
                  setLostNote('');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-black hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад к истории</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto uber-scroll py-4 space-y-4">
              <div>
                <h3 className="text-base font-bold text-black flex items-center gap-2">
                  <PackageSearch className="w-5 h-5 text-[#276EF1]" />
                  <span>Бюро находок · Забытая вещь</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Поездка: {lostItemTrip.pickup} → {lostItemTrip.destination} ({lostItemTrip.carInfo})
                </p>
              </div>

              {lostSubmitted ? (
                <div className="bg-[#f6f6f6] border border-neutral-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2.5 text-[#05944F]">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-black">Заявка отправлена водителю</div>
                      <div className="text-xs text-neutral-600">
                        Водитель получил уведомление о «{lostCategory}» и скоро свяжется с вами
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-neutral-500">Защищённый номер связи с водителем</div>
                      <div className="text-sm font-mono font-bold text-black">+996 (555) •••-89</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-xs font-bold">
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Маскировка активна</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLostItemTrip(null);
                      setLostSubmitted(false);
                      setLostNote('');
                    }}
                    className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs"
                  >
                    Вернуться в историю
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitLostItem} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-black block">
                      Что вы забыли в автомобиле?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {LOST_ITEM_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setLostCategory(cat)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-colors ${
                            lostCategory === cat
                              ? 'bg-black text-white'
                              : 'bg-[#f6f6f6] text-black hover:bg-[#eeeeee]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-black block">
                      Описание и где примерно оставили
                    </label>
                    <textarea
                      rows={3}
                      value={lostNote}
                      onChange={(e) => setLostNote(e.target.value)}
                      placeholder="Например: iPhone в чёрном чехле на заднем сиденье справа..."
                      className="w-full bg-[#f6f6f6] focus:bg-white border border-neutral-200 focus:border-black rounded-xl p-3 text-xs text-black placeholder-neutral-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#f6f6f6] text-[11px] text-neutral-600">
                    Водитель получит мгновенное пуш-уведомление. Ваш личный номер телефона скрыт — связь работает через безопасный подменный номер KG Taxi.
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Связаться с водителем и сообщить о находке
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* DEFAULT HISTORY LIST VIEW */
          <>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <h3 className="text-lg font-bold text-black">{t.tripHistory}</h3>
                <p className="text-xs text-neutral-500">
                  Завершённые поездки · Чеки и бюро находок
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto uber-scroll py-4 space-y-3 pr-1">
              {history.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-neutral-400" />
                  <p className="text-sm">{t.noTripsYet}</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#f6f6f6] rounded-xl p-4 space-y-3 border border-neutral-200/80"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-neutral-500 truncate">
                          {item.date} · {item.cityName}
                        </span>
                        {item.billingProfile === 'business' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#276EF1] bg-[#276EF1]/10 px-1.5 py-0.5 rounded shrink-0">
                            <Briefcase className="w-2.5 h-2.5" />
                            <span>Бизнес</span>
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-black tabular-nums text-sm shrink-0">
                        {item.fare} сом
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-black font-medium">
                        <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                        <span className="truncate">{item.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2 text-black font-medium">
                        <span className="w-2 h-2 bg-black shrink-0" />
                        <span className="truncate">{item.destination}</span>
                      </div>
                    </div>

                    {item.lostItemReported && (
                      <div className="text-[11px] font-semibold text-[#276EF1] bg-[#276EF1]/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                        <PackageSearch className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Заявка водителю: {item.lostItemReported}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200 gap-2 text-xs text-neutral-500">
                      <span className="truncate">
                        {item.tariffName} · {item.carInfo}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setReceiptTrip(item)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-neutral-300 hover:border-black text-black font-semibold transition-colors"
                          title="Открыть электронный чек"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Чек</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setLostItemTrip(item);
                            setLostSubmitted(false);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-neutral-300 hover:border-black text-black font-semibold transition-colors"
                          title="Сообщить о забытой вещи"
                        >
                          <PackageSearch className="w-3 h-3" />
                          <span>Вещь</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onRepeatTrip(item);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-full bg-black hover:bg-neutral-800 text-white font-semibold transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Повторить</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-[#eeeeee] hover:bg-[#e2e2e2] text-black font-semibold rounded-xl text-xs transition-colors mt-2"
            >
              Закрыть
            </button>
          </>
        )}
      </div>
    </div>
  );
};
