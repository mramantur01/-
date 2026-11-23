import React, { useState } from 'react';
import { TripState, Language, SplitFareParticipant } from '../../types/taxi';
import { TRANSLATIONS } from '../../utils/translations';
import {
  Phone,
  MessageSquare,
  ShieldAlert,
  Share2,
  Star,
  Navigation,
  Send,
  AlertTriangle,
  Mic,
  MicOff,
  Check,
  Users,
  ShieldCheck,
  Pencil,
  Plane,
  Thermometer,
  Plus,
  Trash2,
  Leaf,
  Clock,
  Briefcase
} from 'lucide-react';

interface ActiveTripPanelProps {
  tripState: TripState;
  onCancelTrip: () => void;
  onSimulateArrival: () => void;
  onOpenQrPayment?: () => void;
  onUpdateDestinationInTrip?: (newDestName: string) => void;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  lang: Language;
}

export const ActiveTripPanel: React.FC<ActiveTripPanelProps> = ({
  tripState,
  onCancelTrip,
  onSimulateArrival,
  onOpenQrPayment,
  onUpdateDestinationInTrip,
  emergencyContactName = 'Айзада (Супруга)',
  emergencyContactPhone = '+996 (700) 12-34-56',
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showRideCheckAlert, setShowRideCheckAlert] = useState(false);
  const [rideCheckConfirmedOk, setRideCheckConfirmedOk] = useState(false);
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [newDestInput, setNewDestInput] = useState(tripState.destination.name);
  const [splitFriends, setSplitFriends] = useState<SplitFareParticipant[]>([]);
  const [friendNameInput, setFriendNameInput] = useState('');
  const [friendPhoneInput, setFriendPhoneInput] = useState('+996 ');
  const [splitSentNotice, setSplitSentNotice] = useState(false);
  const [sharedToContact, setSharedToContact] = useState(false);
  const [audioRecording, setAudioRecording] = useState(true);
  const [tipSelected, setTipSelected] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'driver'; text: string; time: string }>
  >([
    {
      sender: 'driver',
      text: 'Саламатсызбы! Еду к точке подачи, буду через пару минут.',
      time: '12:04'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [callActive, setCallActive] = useState(false);

  const handleSendMessage = (textToSend?: string) => {
    const msg = (textToSend || inputMsg).trim();
    if (!msg) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: msg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    if (!textToSend) setInputMsg('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'driver',
          text: 'Жакшы, түшүндүм! Азыр жетем (Понял вас, скоро буду).',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  const startCall = () => {
    setShowCall(true);
    setCallActive(false);
    setTimeout(() => {
      setCallActive(true);
    }, 2000);
  };

  if (tripState.status === 'idle') return null;

  // 1. Uber Searching State
  if (tripState.status === 'searching') {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-black">{t.searchingDriver}</h3>
          <p className="text-xs text-neutral-500">{t.searchingHint}</p>
          <div className="w-full h-1.5 bg-[#eeeeee] rounded-full overflow-hidden mt-3">
            <div className="h-full w-1/2 bg-[#276EF1] rounded-full animate-pulse" />
          </div>
        </div>

        <div className="p-3.5 bg-[#f6f6f6] rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-500">Подача</span>
            <span className="font-semibold text-black truncate max-w-[220px]">{tripState.pickup.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Назначение</span>
            <span className="font-semibold text-black truncate max-w-[220px]">{tripState.destination.name}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-neutral-200">
            <span className="text-neutral-500">Тариф {tripState.tariff.name[lang]}</span>
            <span className="font-bold text-black tabular-nums">{tripState.totalFare} сом</span>
          </div>
        </div>

        {tripState.orderForOther?.enabled && (
          <div className="text-xs bg-[#f6f6f6] text-black px-3.5 py-2 rounded-lg">
            Пассажир: <strong>{tripState.orderForOther.name || 'Другой человек'}</strong>{' '}
            {tripState.orderForOther.phone}
          </div>
        )}

        <button
          type="button"
          onClick={onCancelTrip}
          className="w-full py-3 bg-[#eeeeee] hover:bg-[#e2e2e2] text-black font-semibold rounded-xl text-sm transition-colors"
        >
          {t.cancelSearch}
        </button>
      </div>
    );
  }

  const driver = tripState.driver;
  if (!driver) return null;

  const remainingMin =
    tripState.status === 'driver_assigned'
      ? Math.max(1, Math.round((1 - tripState.driverProgress) * 4))
      : Math.max(1, Math.round((1 - tripState.tripProgress) * tripState.estimatedMinutes));

  const progressPct =
    tripState.status === 'in_trip'
      ? Math.round(tripState.tripProgress * 100)
      : Math.round(tripState.driverProgress * 100);

  const shareCode = tripState.shareCode || tripState.id.slice(-6).toUpperCase();
  const shareUrl = `${window.location.origin}/?track=${shareCode}`;
  const liveLat = (tripState.pickup.coords.lat || 42.8746).toFixed(4);
  const liveLng = (tripState.pickup.coords.lng || 74.5698).toFixed(4);

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Uber Status Header + Black ETA Box */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-200">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-black">
              {tripState.status === 'driver_assigned' && 'Водитель едет к вам'}
              {tripState.status === 'driver_arrived' && 'Водитель на месте'}
              {tripState.status === 'in_trip' && 'Вы в пути'}
            </h3>
            {!isEditingDest ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-neutral-500 truncate max-w-[205px]">
                  {tripState.status === 'in_trip' ? tripState.destination.name : tripState.pickup.name}
                </p>
                {onUpdateDestinationInTrip && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewDestInput(tripState.destination.name);
                      setIsEditingDest(true);
                    }}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#276EF1] hover:underline shrink-0"
                    title="Изменить адрес назначения в пути"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Изменить</span>
                  </button>
                )}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newDestInput.trim() && onUpdateDestinationInTrip) {
                    onUpdateDestinationInTrip(newDestInput.trim());
                  }
                  setIsEditingDest(false);
                }}
                className="flex items-center gap-1.5 mt-1.5"
              >
                <input
                  type="text"
                  value={newDestInput}
                  onChange={(e) => setNewDestInput(e.target.value)}
                  placeholder="Новый адрес назначения..."
                  className="flex-1 h-8 bg-[#f6f6f6] border border-black rounded-lg px-2.5 text-xs text-black focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-8 px-2.5 rounded-lg bg-black text-white text-[11px] font-bold"
                >
                  ОК
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDest(false)}
                  className="h-8 px-2 rounded-lg bg-[#eeeeee] text-black text-[11px] font-bold"
                >
                  ✕
                </button>
              </form>
            )}
          </div>

          <div className="bg-black text-white px-3 py-1.5 rounded-lg text-center shrink-0">
            <span className="text-sm font-bold tabular-nums block leading-tight">{remainingMin}</span>
            <span className="text-[10px] text-neutral-300 block leading-tight">мин</span>
          </div>
        </div>

        {/* Tracked Flight, Comfort, Green EV, Hourly & Business Summary Strip */}
        {(tripState.flightNumber ||
          tripState.tariff.id === 'green' ||
          tripState.tariff.id === 'hourly' ||
          tripState.billingProfile === 'business' ||
          tripState.comfortPrefs?.conversation === 'quiet' ||
          tripState.comfortPrefs?.temperature !== 'standard') && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {tripState.tariff.id === 'green' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#05944F]/10 text-[#05944F] font-semibold">
                <Leaf className="w-3 h-3" />
                <span>Green EV · 0 г CO₂</span>
              </span>
            )}
            {tripState.tariff.id === 'hourly' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#276EF1]/10 text-[#276EF1] font-semibold">
                <Clock className="w-3 h-3" />
                <span>
                  Hourly · {tripState.hourlyHours || 3} ч
                  {tripState.hourlyPreset ? ` (${tripState.hourlyPreset})` : ''}
                </span>
              </span>
            )}
            {tripState.billingProfile === 'business' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black text-white font-semibold">
                <Briefcase className="w-3 h-3" />
                <span>Бизнес · Авто-чек</span>
              </span>
            )}
            {tripState.flightNumber && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#276EF1]/10 text-[#276EF1] font-semibold">
                <Plane className="w-3 h-3" />
                <span>Рейс {tripState.flightNumber} · Отслеживается</span>
              </span>
            )}
            {tripState.comfortPrefs &&
              (tripState.comfortPrefs.conversation === 'quiet' ||
                tripState.comfortPrefs.temperature !== 'standard') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f3f3f3] text-black font-semibold">
                  <Thermometer className="w-3 h-3" />
                  <span>
                    {tripState.comfortPrefs.temperature === 'cool'
                      ? '19°C'
                      : tripState.comfortPrefs.temperature === 'warm'
                      ? '25°C'
                      : '22°C'}
                    {tripState.comfortPrefs.conversation === 'quiet'
                      ? ' · Тихая поездка'
                      : tripState.comfortPrefs.conversation === 'chatty'
                      ? ' · Пообщаться'
                      : ''}
                  </span>
                </span>
              )}
          </div>
        )}

        {/* Crisp Progress Line */}
        <div className="w-full h-1 bg-[#eeeeee] rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${Math.max(8, progressPct)}%` }}
          />
        </div>

        {/* Driver & Vehicle Details */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-black text-white font-bold text-xl flex items-center justify-center">
                {driver.name.charAt(0)}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white border border-neutral-200 shadow-xs text-black font-bold text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span>{driver.rating}</span>
                <Star className="w-2.5 h-2.5 fill-black text-black" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center bg-[#f3f3f3] text-black px-2 py-0.5 rounded font-mono font-bold text-xs border border-neutral-300 mb-1">
                <span className="text-[10px] text-red-600 font-extrabold mr-1">KG</span>
                <span>{driver.carPlate}</span>
              </div>
              <h4 className="font-bold text-sm text-black truncate">{driver.carModel}</h4>
              <p className="text-xs text-neutral-500 truncate">{driver.name}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-base font-bold text-black tabular-nums">
              {tripState.totalFare + tipSelected} сом
            </div>
            <button
              type="button"
              onClick={onOpenQrPayment}
              className="text-[11px] text-[#276EF1] font-semibold hover:underline"
            >
              Оплатить QR
            </button>
          </div>
        </div>

        {/* Uber PIN Verification Row */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#f6f6f6] border border-neutral-200">
          <div>
            <span className="text-xs font-bold text-black block">PIN-код посадки</span>
            <span className="text-[11px] text-neutral-500">Назовите код водителю для начала поездки</span>
          </div>
          <div className="flex items-center gap-1">
            {['7', '4', '2', '9'].map((digit, i) => (
              <span
                key={i}
                className="w-7 h-8 rounded-md bg-white border border-neutral-300 text-black font-mono font-bold text-sm flex items-center justify-center"
              >
                {digit}
              </span>
            ))}
          </div>
        </div>

        {/* Live Telemetry & Uber RideCheck when In Trip */}
        {tripState.status === 'in_trip' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 bg-[#f6f6f6] p-3 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-neutral-500 block">Скорость</span>
                <span className="text-sm font-bold text-black tabular-nums">
                  {tripState.currentSpeed} км/ч
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block">Осталось</span>
                <span className="text-sm font-bold text-black tabular-nums">
                  {(tripState.distanceKm * (1 - tripState.tripProgress)).toFixed(1)} км
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block">Маршрут</span>
                <span className="text-sm font-bold text-[#05944F] tabular-nums">{progressPct}%</span>
              </div>
            </div>

            {/* Uber RideCheck Proactive Safety Bar */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#276EF1]/8 border border-[#276EF1]/20 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-[#276EF1] shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-black block leading-tight">RideCheck активен</span>
                  <span className="text-[10px] text-neutral-600 block truncate">
                    {rideCheckConfirmedOk
                      ? 'Вы подтвердили, что поездка проходит безопасно'
                      : 'GPS-контроль отклонений и длительных остановок'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRideCheckAlert(true)}
                className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-black text-[11px] font-bold text-black shrink-0"
              >
                Проверить
              </button>
            </div>
          </div>
        )}

        {/* Audio Safety Toggle */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f6f6f6] text-xs">
          <div className="flex items-center gap-2 text-neutral-700">
            {audioRecording ? (
              <Mic className="w-3.5 h-3.5 text-[#05944F]" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-neutral-400" />
            )}
            <span>{audioRecording ? 'Защитная аудиозапись включена' : 'Аудиозапись выключена'}</span>
          </div>
          <button
            type="button"
            onClick={() => setAudioRecording(!audioRecording)}
            className="text-xs font-semibold text-black hover:underline"
          >
            {audioRecording ? 'Выкл' : 'Вкл'}
          </button>
        </div>

        {/* Quick In-App Messages */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 uber-scroll">
          {['Я выхожу', 'Жду у шлагбаума', 'Оплачу MBank QR', 'Где удобнее сесть?'].map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                handleSendMessage(tmpl);
                setShowChat(true);
              }}
              className="px-3 py-1.5 rounded-full bg-[#eeeeee] hover:bg-[#e2e2e2] text-black text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              {tmpl}
            </button>
          ))}
        </div>

        {/* Tip Strip */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f6f6f6] text-xs">
          <span className="text-neutral-600 font-medium">Чаевые водителю</span>
          <div className="flex gap-1">
            {[0, 20, 50, 100].map((tip) => (
              <button
                key={tip}
                type="button"
                onClick={() => setTipSelected(tip)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                  tipSelected === tip
                    ? 'bg-black text-white'
                    : 'bg-white text-black border border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {tip === 0 ? '0' : `+${tip} с`}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Uber Action Buttons (Call, Chat, Split Fare, Share, SOS) */}
        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={startCall}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-black transition-colors"
          >
            <Phone className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-semibold">{t.callDriver}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowChat(true)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-black transition-colors"
          >
            <MessageSquare className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-semibold">{t.messageDriver}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSplitModal(true)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-black transition-colors"
          >
            <Users className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-semibold">Разделить</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-black transition-colors"
          >
            <Share2 className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-semibold">Поделиться</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSos(true)}
            className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#276EF1]/10 hover:bg-[#276EF1]/20 text-[#276EF1] transition-colors"
          >
            <ShieldAlert className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-semibold">SOS 102</span>
          </button>
        </div>

        {/* Simulation & Cancel Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-neutral-200 text-xs">
          <button
            type="button"
            onClick={onSimulateArrival}
            className="font-semibold text-[#276EF1] hover:underline"
          >
            {tripState.status === 'in_trip' ? 'Завершить поездку' : 'Ускорить прибытие'}
          </button>
          <button
            type="button"
            onClick={onCancelTrip}
            className="font-medium text-neutral-500 hover:text-[#E11900] transition-colors"
          >
            Отменить поездку
          </button>
        </div>
      </div>

      {/* Live Share Trip Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-black">Поделиться поездкой</h3>
                <p className="text-xs text-neutral-500">Близкие увидят маршрут и госномер в реальном времени</p>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black text-xs font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f6f6f6] rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Авто и номер</span>
                <strong className="text-black font-mono">{driver.carPlate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Водитель</span>
                <strong className="text-black">{driver.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">GPS координаты</span>
                <strong className="text-black font-mono">{liveLat}, {liveLng}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Маршрут</span>
                <strong className="text-black truncate max-w-[175px]">{tripState.destination.name}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSharedToContact(true);
                setTimeout(() => setSharedToContact(false), 3000);
              }}
              className="w-full py-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
            >
              {sharedToContact
                ? `Отправлено контакту: ${emergencyContactName}`
                : `Отправить близкому (${emergencyContactName})`}
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl).catch(() => {});
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="w-full py-3 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#05944F]" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Ссылка скопирована' : `Скопировать ссылку (${shareCode})`}</span>
            </button>

            <p className="text-[11px] text-neutral-500 text-center">
              Доверенный номер: {emergencyContactPhone}
            </p>
          </div>
        </div>
      )}

      {/* In-App Chat Modal (Uber White) */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xl flex flex-col h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                  {driver.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-black">{driver.name}</h4>
                  <span className="text-xs text-neutral-500">{driver.carPlate}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 uber-scroll">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-black text-white rounded-tr-xs'
                        : 'bg-[#f3f3f3] text-black rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2 pt-2 border-t border-neutral-200"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Напишите водителю..."
                className="flex-1 bg-[#f3f3f3] rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-black hover:bg-neutral-800 text-white flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-black text-white mx-auto flex items-center justify-center text-2xl font-bold">
              {driver.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-black">{driver.name}</h3>
              <p className="text-xs text-neutral-500">{driver.phone}</p>
              <p className="text-xs text-[#276EF1] mt-2 font-semibold">
                {callActive ? 'Разговор идет...' : 'Соединение с водителем...'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCall(false)}
              className="w-14 h-14 rounded-full bg-[#E11900] hover:bg-red-700 text-white flex items-center justify-center mx-auto shadow-md transition-colors"
            >
              <Phone className="w-6 h-6 rotate-135" />
            </button>
          </div>
        </div>
      )}

      {/* Safety Toolkit Modal (Uber Shield Style) */}
      {showSos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#276EF1]/10 text-[#276EF1] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-black">Центр безопасности</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Экстренные службы Кыргызстана (24/7)
              </p>
            </div>

            <div className="space-y-2">
              <a
                href="tel:102"
                className="w-full p-3.5 rounded-xl bg-[#E11900] hover:bg-red-700 text-white flex items-center justify-between text-xs font-bold"
              >
                <span>Милиция КР</span>
                <span className="font-mono">102</span>
              </a>
              <a
                href="tel:112"
                className="w-full p-3.5 rounded-xl bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-between text-xs font-semibold"
              >
                <span>Служба спасения МЧС</span>
                <span className="font-mono font-bold">112</span>
              </a>
              <a
                href="tel:103"
                className="w-full p-3.5 rounded-xl bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-between text-xs font-semibold"
              >
                <span>Скорая помощь</span>
                <span className="font-mono font-bold">103</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowSos(false)}
              className="w-full py-3 bg-black text-white font-semibold rounded-xl text-xs"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* US Uber Split Fare Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-black">Разделить счёт (Split Fare)</h3>
                <p className="text-xs text-neutral-500">
                  Поделите стоимость поездки поровну с попутчиками
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black text-xs font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Live Per-Person Calculation */}
            <div className="bg-black text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block">
                  Всего: {tripState.totalFare + tipSelected} сом ÷ {splitFriends.length + 1} чел.
                </span>
                <span className="text-xl font-bold tabular-nums">
                  {Math.ceil((tripState.totalFare + tipSelected) / (splitFriends.length + 1))} сом
                </span>
              </div>
              <span className="text-xs font-semibold text-[#05944F]">с каждого</span>
            </div>

            {/* Quick Add Contacts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-500">Быстро добавить:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Бектур', phone: '+996 555 21-34-56' },
                  { name: 'Айдай', phone: '+996 700 44-55-66' },
                  { name: 'Тимур', phone: '+996 772 88-99-00' }
                ].map((preset) => {
                  const alreadyAdded = splitFriends.some((f) => f.name === preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={alreadyAdded || splitFriends.length >= 3}
                      onClick={() =>
                        setSplitFriends((prev) => [
                          ...prev,
                          {
                            id: `sp_${Date.now()}_${preset.name}`,
                            name: preset.name,
                            phone: preset.phone,
                            paid: false
                          }
                        ])
                      }
                      className="px-2.5 py-1.5 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] disabled:opacity-40 text-xs font-semibold text-black flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Friend Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!friendNameInput.trim() || splitFriends.length >= 3) return;
                setSplitFriends((prev) => [
                  ...prev,
                  {
                    id: `sp_${Date.now()}`,
                    name: friendNameInput.trim(),
                    phone: friendPhoneInput.trim() || '+996 700 00-00-00',
                    paid: false
                  }
                ]);
                setFriendNameInput('');
                setFriendPhoneInput('+996 ');
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={friendNameInput}
                onChange={(e) => setFriendNameInput(e.target.value)}
                placeholder="Имя друга"
                className="flex-1 h-9 bg-[#f6f6f6] border border-neutral-200 rounded-lg px-2.5 text-xs text-black focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-lg bg-black text-white text-xs font-bold shrink-0"
              >
                Добавить
              </button>
            </form>

            {/* Participants List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto uber-scroll">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f6f6f6] text-xs">
                <span className="font-bold text-black">Вы (Организатор)</span>
                <span className="font-mono font-bold text-black">
                  {Math.ceil((tripState.totalFare + tipSelected) / (splitFriends.length + 1))} сом
                </span>
              </div>
              {splitFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#f6f6f6] text-xs"
                >
                  <div>
                    <span className="font-bold text-black block">{friend.name}</span>
                    <span className="text-[10px] text-neutral-500">
                      {friend.paid ? 'Доля оплачена (MBank)' : friend.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-black">
                      {Math.ceil((tripState.totalFare + tipSelected) / (splitFriends.length + 1))} с
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSplitFriends((prev) => prev.filter((f) => f.id !== friend.id))
                      }
                      className="text-neutral-400 hover:text-[#E11900]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {splitSentNotice && (
              <div className="p-2.5 rounded-xl bg-[#05944F]/10 text-[#05944F] text-xs font-bold text-center">
                Запросы на оплату через MBank / ELQR отправлены!
              </div>
            )}

            <button
              type="button"
              disabled={splitFriends.length === 0}
              onClick={() => {
                setSplitSentNotice(true);
                setTimeout(() => {
                  setSplitFriends((prev) => prev.map((f) => ({ ...f, paid: true })));
                }, 1200);
                setTimeout(() => setSplitSentNotice(false), 3000);
              }}
              className="w-full py-3 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-bold transition-colors"
            >
              Отправить счета попутчикам ({splitFriends.length})
            </button>
          </div>
        </div>
      )}

      {/* US Uber RideCheck Safety Check-in Modal */}
      {showRideCheckAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#276EF1]/10 text-[#276EF1] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black">Uber RideCheck</h3>
                <p className="text-xs text-neutral-500">Автоматическая проверка безопасности</p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed bg-[#f6f6f6] p-3.5 rounded-xl">
              Мы заметили незапланированную остановку по маршруту к{' '}
              <strong className="text-black">{tripState.destination.name}</strong>. С вами всё в порядке?
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setRideCheckConfirmedOk(true);
                  setShowRideCheckAlert(false);
                }}
                className="w-full py-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
              >
                Да, всё в порядке
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRideCheckAlert(false);
                  setShowSos(true);
                }}
                className="w-full py-3 rounded-xl bg-[#E11900]/10 hover:bg-[#E11900]/20 text-[#E11900] text-xs font-bold transition-colors"
              >
                Мне нужна помощь (SOS 102 / 112)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
