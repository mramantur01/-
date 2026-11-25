import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from 'firebase/auth';
import { CITIES } from '../../data/kyrgyzstanData';
import { CityConfig } from '../../types/taxi';
import { searchKyrgyzstanAddresses, fetchRoadRoute } from '../../services/geoService';
import {
  AppConfig,
  AppRide,
  APP_TARIFFS,
  DEFAULT_CONFIG,
  DriverApplication,
  DriverBalance,
  DriverRow,
  PHOTO_TITLES,
  SupportTicket,
  addDriverPayment,
  approveApplication,
  cancelOwnRide,
  createPhoneOrder,
  fetchDriverBalance,
  fetchMyRole,
  fetchPhotos,
  rejectApplication,
  resolveTicket,
  saveConfig,
  setDriverBlocked,
  watchActiveRides,
  watchApplications,
  watchConfig,
  watchDrivers,
  watchRidesSince,
  watchTickets
} from '../../services/ownerService';

type Tab = 'live' | 'apps' | 'drivers' | 'prices' | 'support' | 'stats';

const STATUS_RU: Record<string, string> = {
  SEARCHING: 'Ищет водителя',
  BOOKED: 'Предзаказ принят',
  ASSIGNED: 'Водитель едет',
  ARRIVED: 'Водитель на месте',
  IN_PROGRESS: 'В поездке',
  COMPLETED: 'Выполнен',
  CANCELLED: 'Отменён'
};

const fmt = (t: number) => (t ? new Date(t).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const som = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} сом`;

const card = 'bg-white rounded-2xl border border-neutral-200 p-4';
const btn = 'px-3 py-2 rounded-xl text-sm font-semibold border border-neutral-300 hover:bg-neutral-50';
const btnDark = 'px-3 py-2 rounded-xl text-sm font-semibold bg-black text-white hover:bg-neutral-800';
const input = 'w-full px-3 py-2 rounded-xl border border-neutral-300 text-sm';

interface Props {
  authUser: User | null;
  onGoogleLogin: () => void;
  onExit: () => void;
}

/** Dispatcher / owner panel on the website, working with the KG Taxi app's live data. */
export const OwnerWebPanel: React.FC<Props> = ({ authUser, onGoogleLogin, onExit }) => {
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('live');
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<AppRide[]>([]);
  const [recent, setRecent] = useState<AppRide[]>([]);
  const [days, setDays] = useState(1);
  const [apps, setApps] = useState<DriverApplication[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [cfg, setCfg] = useState<AppConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (!authUser) { setRole(null); return; }
    setRole(undefined);
    fetchMyRole(authUser.uid).then(setRole);
  }, [authUser]);

  const isAdmin = role === 'admin';
  const isStaff = role === 'admin' || role === 'dispatcher';
  const onErr = (e: Error) => setError(e.message);

  useEffect(() => {
    if (!isStaff) return;
    const u1 = watchActiveRides(setActive, onErr);
    return () => u1();
  }, [isStaff]);

  useEffect(() => {
    if (!isStaff) return;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));
    const u = watchRidesSince(from.getTime(), setRecent, onErr);
    return () => u();
  }, [isStaff, days]);

  useEffect(() => {
    if (!isAdmin) return;
    const us = [watchApplications(setApps, onErr), watchDrivers(setDrivers, onErr), watchTickets(setTickets, onErr), watchConfig(setCfg)];
    return () => us.forEach((u) => u());
  }, [isAdmin]);

  if (!authUser) {
    return (
      <Gate title="Вход для владельца и диспетчеров" onExit={onExit}>
        <p className="text-sm text-neutral-600 mb-4">Войдите тем же Google-аккаунтом, что и в приложении KG Taxi.</p>
        <button className={btnDark} onClick={onGoogleLogin}>Войти через Google</button>
      </Gate>
    );
  }
  if (role === undefined) return <Gate title="Проверяем доступ…" onExit={onExit} />;
  if (!isStaff) {
    return (
      <Gate title="Нет доступа" onExit={onExit}>
        <p className="text-sm text-neutral-600">
          Панель открыта только владельцу и диспетчерам. Владелец выдаёт доступ в базе Firebase: коллекция <code>roles</code>,
          документ с вашим uid, поле <code>role</code> = <code>admin</code> или <code>dispatcher</code>.
        </p>
        <p className="text-xs text-neutral-500 mt-3 break-all">Ваш uid: {authUser.uid}</p>
      </Gate>
    );
  }

  const pendingApps = apps.filter((a) => a.status === 'pending').length;
  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const tabs: [Tab, string][] = [
    ['live', `Заказы сейчас (${active.length})`],
    ['stats', 'Статистика'],
    ...(isAdmin
      ? ([
          ['apps', `Заявки (${pendingApps})`],
          ['drivers', `Водители (${drivers.length})`],
          ['prices', 'Цены и правила'],
          ['support', `Поддержка (${openTickets})`]
        ] as [Tab, string][])
      : [])
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">Диспетчерская KG Taxi</h1>
          <p className="text-sm text-neutral-500">{isAdmin ? 'Владелец' : 'Диспетчер'} • данные приложения в реальном времени</p>
        </div>
        <button className={btn} onClick={onExit}>← К заказу такси</button>
      </div>
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">
          Часть данных не загрузилась: {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>Скрыть</button>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto mb-4">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${tab === id ? 'bg-black text-white' : 'bg-white border border-neutral-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'live' && <LiveTab rides={active} dispatcherUid={authUser.uid} cfg={cfg} />}
      {tab === 'stats' && <StatsTab rides={recent} days={days} setDays={setDays} cfg={cfg} />}
      {tab === 'apps' && isAdmin && <AppsTab apps={apps} />}
      {tab === 'drivers' && isAdmin && <DriversTab drivers={drivers} cfg={cfg} />}
      {tab === 'prices' && isAdmin && <PricesTab cfg={cfg} />}
      {tab === 'support' && isAdmin && <SupportTab tickets={tickets} />}
    </div>
  );
};

const Gate: React.FC<{ title: string; onExit: () => void; children?: React.ReactNode }> = ({ title, onExit, children }) => (
  <div className={`${card} max-w-lg mx-auto mt-10`}>
    <h2 className="text-xl font-black mb-3">{title}</h2>
    {children}
    <div><button className={`${btn} mt-4`} onClick={onExit}>← К заказу такси</button></div>
  </div>
);

// ------------------------------------------------------------------ live board + map + phone order
const LiveTab: React.FC<{ rides: AppRide[]; dispatcherUid: string; cfg: AppConfig }> = ({ rides, dispatcherUid, cfg }) => {
  const [showPhone, setShowPhone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const searching = rides.filter((r) => r.status === 'SEARCHING');
  const onWay = rides.filter((r) => ['ASSIGNED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
  const now = Date.now();
  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
      <div className="space-y-4">
        <RidesMap rides={rides} />
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Ищут водителя" value={searching.length} warn={searching.some((r) => now - r.createdAt > 5 * 60_000)} />
          <Stat label="В пути" value={onWay.length} />
          <Stat label="Предзаказы" value={rides.filter((r) => r.status === 'BOOKED' || r.scheduledAt).length} />
        </div>
      </div>
      <div className="space-y-3">
        <button className={`${btnDark} w-full py-3`} onClick={() => setShowPhone(true)}>+ Заказ по телефону</button>
        {msg && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm">{msg}</div>}
        {rides.length === 0 && <div className={`${card} text-sm text-neutral-500`}>Сейчас активных заказов нет.</div>}
        {rides.map((r) => {
          const waitMin = Math.round((now - r.createdAt) / 60000);
          const late = r.status === 'SEARCHING' && waitMin >= 5 && !r.scheduledAt;
          return (
            <div key={r.id} className={`${card} ${late ? 'border-red-300 bg-red-50' : ''}`}>
              <div className="flex justify-between gap-2">
                <div className="font-bold">{r.tariffName} • {r.city}</div>
                <div className="font-black">{som(r.priceSom)}</div>
              </div>
              <div className="text-sm mt-1">{r.pickupAddress}</div>
              <div className="text-sm text-neutral-500">→ {r.dropoffAddress}</div>
              <div className="text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <span className={late ? 'text-red-700 font-bold' : 'text-neutral-600'}>
                  {STATUS_RU[r.status] || r.status}
                  {r.status === 'SEARCHING' && !r.scheduledAt ? ` • ${waitMin} мин` : ''}
                  {r.scheduledAt ? ` • на ${fmt(r.scheduledAt)}` : ''}
                </span>
                <span>Пассажир: {r.passengerName}{r.passengerPhone ? ` • ${r.passengerPhone}` : ''}</span>
                {r.driverName && <span>Водитель: {r.driverName} {r.driverCar} {r.driverPlate}</span>}
              </div>
              {r.comment && <div className="text-xs text-amber-700 mt-1">{r.comment.replace(/ • PIN \d{4}/, '')}</div>}
              {r.passengerId === dispatcherUid && ['SEARCHING', 'BOOKED', 'ASSIGNED', 'ARRIVED'].includes(r.status) && (
                <button
                  className={`${btn} mt-2 text-red-700`}
                  onClick={async () => {
                    try { await cancelOwnRide(r.id, 'Отменил диспетчер'); setMsg('Заказ отменён'); } catch (e: any) { setMsg(e.message); }
                  }}
                >
                  Отменить
                </button>
              )}
            </div>
          );
        })}
        <p className="text-xs text-neutral-500">
          Красным — заказ ждёт водителя больше 5 минут: позвоните пассажиру или водителям рядом.
          Отменить можно заказы, которые создал диспетчер по телефону; заказ пассажира отменяет сам пассажир.
        </p>
      </div>
      {showPhone && (
        <PhoneOrderDialog
          dispatcherUid={dispatcherUid}
          cfg={cfg}
          onClose={() => setShowPhone(false)}
          onDone={(t) => { setShowPhone(false); setMsg(t); }}
        />
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode; warn?: boolean }> = ({ label, value, warn }) => (
  <div className={`rounded-2xl p-3 ${warn ? 'bg-red-50 text-red-800' : 'bg-white border border-neutral-200'}`}>
    <div className="text-xs text-neutral-500">{label}</div>
    <div className="text-xl font-black">{value}</div>
  </div>
);

/** Map of active orders: pickup points and cars that share their position during a trip. */
const RidesMap: React.FC<{ rides: AppRide[] }> = ({ rides }) => {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: true }).setView([42.8746, 74.6122], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!layer.current || !map.current) return;
    layer.current.clearLayers();
    const pts: L.LatLngExpression[] = [];
    rides.forEach((r) => {
      if (r.pickupLat) {
        const color = r.status === 'SEARCHING' ? '#d32f2f' : '#0097a7';
        L.circleMarker([r.pickupLat, r.pickupLng], { radius: 8, color, fillColor: color, fillOpacity: 0.8 })
          .bindTooltip(`${STATUS_RU[r.status] || r.status}: ${r.pickupAddress}`)
          .addTo(layer.current!);
        pts.push([r.pickupLat, r.pickupLng]);
      }
      if (r.driverLat && r.driverLng) {
        L.marker([r.driverLat, r.driverLng], {
          icon: L.divIcon({ className: '', html: '<div style="font-size:22px">🚕</div>', iconSize: [24, 24], iconAnchor: [12, 12] })
        })
          .bindTooltip(`${r.driverName} ${r.driverPlate}`)
          .addTo(layer.current!);
        pts.push([r.driverLat, r.driverLng]);
      }
    });
    if (pts.length > 0) map.current.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 14 });
  }, [rides]);
  return (
    <div className={card}>
      <div className="text-sm font-bold mb-2">Карта: <span className="text-red-700">● ищут водителя</span> <span className="text-cyan-700">● в работе</span> 🚕 машина в поездке</div>
      <div ref={el} style={{ height: 380, borderRadius: 12 }} />
    </div>
  );
};

const PhoneOrderDialog: React.FC<{ dispatcherUid: string; cfg: AppConfig; onClose: () => void; onDone: (m: string) => void }> = ({
  dispatcherUid, cfg, onClose, onDone
}) => {
  const [city, setCity] = useState<CityConfig>(CITIES[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+996 ');
  const [from, setFrom] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [to, setTo] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [tariff, setTariff] = useState('econom');
  const [km, setKm] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const t = APP_TARIFFS.find((x) => x.id === tariff)!;
  const priceCfg = cfg.tariffs[tariff];
  const base = priceCfg?.baseSom ?? t.base;
  const perKm = priceCfg?.perKmSom ?? t.perKm;
  const price = km != null ? Math.round(base + km * perKm) : null;
  useEffect(() => {
    if (!from || !to) { setKm(null); return; }
    fetchRoadRoute(from, to).then((r) => setKm(Math.round(r.distanceKm * 10) / 10)).catch(() => setKm(null));
  }, [from, to]);
  const submit = async () => {
    if (!from || !to || price == null) { setErr('Укажите откуда и куда'); return; }
    if (phone.replace(/\D/g, '').length < 9) { setErr('Введите телефон клиента'); return; }
    setBusy(true);
    try {
      await createPhoneOrder({
        dispatcherUid, clientName: name, clientPhone: phone.trim(), city: city.name.ru,
        pickupAddress: from.name, pickupLat: from.lat, pickupLng: from.lng,
        dropoffAddress: to.name, dropoffLat: to.lat, dropoffLng: to.lng,
        priceSom: price, tariffId: tariff, tariffName: t.name
      });
      onDone(`Заказ для ${name || 'клиента'} отправлен водителям • ${price} сом`);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black">Заказ по телефону</h3>
        <select className={input} value={city.id} onChange={(e) => setCity(CITIES.find((c) => c.id === e.target.value) || CITIES[0])}>
          {CITIES.filter((c) => c.id !== 'intercity').map((c) => <option key={c.id} value={c.id}>{c.name.ru}</option>)}
        </select>
        <input className={input} placeholder="Имя клиента" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={input} placeholder="Телефон клиента" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <AddressSearch label="Откуда" city={city} value={from} onPick={setFrom} />
        <AddressSearch label="Куда" city={city} value={to} onPick={setTo} />
        <select className={input} value={tariff} onChange={(e) => setTariff(e.target.value)}>
          {APP_TARIFFS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <div className="text-sm">{km != null ? `${km} км • цена ${price} сом (оплата наличными водителю)` : 'Цена появится после выбора адресов'}</div>
        {err && <div className="text-sm text-red-700">{err}</div>}
        <div className="flex gap-2 justify-end">
          <button className={btn} onClick={onClose}>Отмена</button>
          <button className={btnDark} disabled={busy} onClick={submit}>{busy ? 'Отправляем…' : 'Отправить водителям'}</button>
        </div>
      </div>
    </div>
  );
};

const AddressSearch: React.FC<{
  label: string;
  city: CityConfig;
  value: { name: string } | null;
  onPick: (p: { name: string; lat: number; lng: number }) => void;
}> = ({ label, city, value, onPick }) => {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ name: string; address: string; lat: number; lng: number }[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return; }
    const id = setTimeout(() => searchKyrgyzstanAddresses(q, city).then((r) => setRes(r as any)).catch(() => setRes([])), 350);
    return () => clearTimeout(id);
  }, [q, city]);
  return (
    <div>
      <input className={input} placeholder={value ? `${label}: ${value.name}` : `${label}: улица, дом или место`} value={q} onChange={(e) => setQ(e.target.value)} />
      {res.length > 0 && (
        <div className="border border-neutral-200 rounded-xl mt-1 max-h-48 overflow-y-auto">
          {res.map((r, i) => (
            <button
              key={i}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-50"
              onClick={() => { onPick({ name: r.name, lat: r.lat, lng: r.lng }); setQ(''); setRes([]); }}
            >
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-neutral-500">{r.address}</div>
            </button>
          ))}
        </div>
      )}
      {value && <div className="text-xs text-emerald-700 mt-1">✓ {label}: {value.name}</div>}
    </div>
  );
};

// ------------------------------------------------------------------ stats
const StatsTab: React.FC<{ rides: AppRide[]; days: number; setDays: (d: number) => void; cfg: AppConfig }> = ({ rides, days, setDays, cfg }) => {
  const done = rides.filter((r) => r.status === 'COMPLETED');
  const revenue = done.reduce((s, r) => s + r.priceSom, 0);
  const commission = Math.round((revenue * cfg.commissionPercent) / 100);
  const cancelled = rides.filter((r) => r.status === 'CANCELLED');
  const reasons = useMemo(() => {
    const m: Record<string, number> = {};
    cancelled.forEach((r) => { const k = r.cancelReason || 'Без причины'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [cancelled]);
  const top = useMemo(() => {
    const m: Record<string, { trips: number; sum: number }> = {};
    done.forEach((r) => { const k = r.driverName || 'Без имени'; m[k] = m[k] || { trips: 0, sum: 0 }; m[k].trips++; m[k].sum += r.priceSom; });
    return Object.entries(m).sort((a, b) => b[1].trips - a[1].trips).slice(0, 10);
  }, [done]);
  const exportCsv = () => {
    const head = ['Дата', 'Город', 'Откуда', 'Куда', 'Тариф', 'Цена', 'Статус', 'Оплата', 'Пассажир', 'Водитель', 'Причина отмены'];
    const rows = rides.map((r) => [fmt(r.createdAt), r.city, r.pickupAddress, r.dropoffAddress, r.tariffName, r.priceSom, STATUS_RU[r.status] || r.status, r.paymentMethod, r.passengerName, r.driverName, r.cancelReason]);
    const csv = '﻿' + [head, ...rows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `kgtaxi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[[1, 'Сегодня'], [7, '7 дней'], [30, '30 дней']].map(([d, l]) => (
          <button key={d} onClick={() => setDays(d as number)} className={`px-4 py-2 rounded-full text-sm font-semibold ${days === d ? 'bg-black text-white' : 'bg-white border border-neutral-200'}`}>{l}</button>
        ))}
        <button className={`${btn} ml-auto`} onClick={exportCsv}>Скачать Excel (CSV)</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Заказов" value={rides.length} />
        <Stat label="Выполнено" value={done.length} />
        <Stat label="Выручка" value={som(revenue)} />
        <Stat label={`Комиссия ${cfg.commissionPercent}%`} value={som(commission)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className={card}>
          <div className="font-bold mb-2">Лучшие водители</div>
          {top.length === 0 && <div className="text-sm text-neutral-500">Пока нет выполненных поездок.</div>}
          {top.map(([n, v], i) => <div key={n} className="flex justify-between text-sm py-1"><span>{i + 1}. {n}</span><span>{v.trips} поезд. • {som(v.sum)}</span></div>)}
        </div>
        <div className={card}>
          <div className="font-bold mb-2">Причины отмен ({cancelled.length})</div>
          {reasons.length === 0 && <div className="text-sm text-neutral-500">Отмен нет.</div>}
          {reasons.map(([k, n]) => <div key={k} className="flex justify-between text-sm py-1"><span>{k}</span><span className="font-bold">{n}</span></div>)}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ applications
const AppsTab: React.FC<{ apps: DriverApplication[] }> = ({ apps }) => {
  const [open, setOpen] = useState<DriverApplication | null>(null);
  if (apps.length === 0) return <div className={`${card} text-sm text-neutral-500`}>Заявок пока нет.</div>;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {apps.map((a) => (
        <button key={a.uid} onClick={() => setOpen(a)} className={`${card} text-left hover:border-neutral-400`}>
          <div className="flex justify-between">
            <span className="font-bold">{a.fullName}</span>
            <span className={`text-xs font-bold ${a.status === 'pending' ? 'text-amber-700' : a.status === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
              {a.status === 'pending' ? 'На проверке' : a.status === 'approved' ? 'Одобрен' : 'Отклонён'}
            </span>
          </div>
          <div className="text-sm text-neutral-600">{a.car} • {a.plate}</div>
          <div className="text-xs text-neutral-500">{a.city} • {fmt(a.createdAt)}</div>
        </button>
      ))}
      {open && <ApplicationDialog app={open} onClose={() => setOpen(null)} />}
    </div>
  );
};

const ApplicationDialog: React.FC<{ app: DriverApplication; onClose: () => void }> = ({ app, onClose }) => {
  const [photos, setPhotos] = useState<Record<string, string> | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [big, setBig] = useState<string | null>(null);
  useEffect(() => { fetchPhotos(app.uid).then(setPhotos).catch((e) => { setErr(e.message); setPhotos({}); }); }, [app.uid]);
  const act = async (f: () => Promise<void>) => {
    setBusy(true);
    try { await f(); onClose(); } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-black">{app.fullName}</h3>
        <div className="grid sm:grid-cols-2 gap-x-6 text-sm mt-2">
          <div>Телефон: {app.phone}</div>
          <div>Город: {app.city}</div>
          <div>Дата рождения: {app.birthDate || '—'}</div>
          <div>Работает: {app.workType || '—'}</div>
          <div>Паспорт: {app.passportNumber}</div>
          <div>Права: {app.licenseNumber} • стаж {app.experienceYears} лет</div>
          <div>Авто: {app.car} • {app.plate}</div>
          <div>ОСАГО до: {app.insuranceUntil || '—'}</div>
          <div className="sm:col-span-2">Тарифы: {app.tariffs.map((t) => APP_TARIFFS.find((x) => x.id === t)?.name || t).join(', ') || '—'}</div>
          {app.payPhone && <div>Для переводов: {app.payPhone}</div>}
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {photos === null && <div className="text-sm text-neutral-500">Загружаем фото…</div>}
          {photos && Object.keys(PHOTO_TITLES).filter((k) => photos[k]).map((k) => (
            <button key={k} onClick={() => setBig(photos[k])} className="text-left">
              <img src={photos[k]} alt={PHOTO_TITLES[k]} className="w-full h-28 object-cover rounded-xl border" />
              <div className="text-xs mt-1">{PHOTO_TITLES[k]}</div>
            </button>
          ))}
        </div>
        {err && <div className="text-sm text-red-700 mt-2">{err}</div>}
        {app.status === 'pending' && (
          <div className="mt-4 space-y-2">
            <button className={`${btnDark} w-full py-3`} disabled={busy} onClick={() => act(() => approveApplication(app))}>Одобрить — открыть режим водителя</button>
            <div className="flex gap-2">
              <input className={input} placeholder="Причина отказа (увидит водитель)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <button className={`${btn} text-red-700`} disabled={busy || !reason.trim()} onClick={() => act(() => rejectApplication(app.uid, reason))}>Отклонить</button>
            </div>
          </div>
        )}
        <button className={`${btn} mt-3`} onClick={onClose}>Закрыть</button>
        {big && (
          <div className="fixed inset-0 z-[2100] bg-black/80 flex items-center justify-center p-4" onClick={() => setBig(null)}>
            <img src={big} alt="" className="max-h-full max-w-full rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ drivers + debts
const DriversTab: React.FC<{ drivers: DriverRow[]; cfg: AppConfig }> = ({ drivers, cfg }) => {
  const [bal, setBal] = useState<Record<string, DriverBalance>>({});
  const [pay, setPay] = useState<DriverRow | null>(null);
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const load = () => {
    drivers.forEach((d) => fetchDriverBalance(d.uid, cfg).then((b) => setBal((p) => ({ ...p, [d.uid]: b }))).catch(() => {}));
  };
  useEffect(load, [drivers.length, cfg.commissionPercent, cfg.goalTrips, cfg.goalBonusSom]);
  const totalDebt = Object.values(bal).reduce((s, b) => s + Math.max(0, b.debtSom), 0);
  if (drivers.length === 0) return <div className={`${card} text-sm text-neutral-500`}>Водителей пока нет.</div>;
  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <Stat label="Водителей" value={drivers.filter((d) => !d.blocked).length} />
        <Stat label="Заблокировано" value={drivers.filter((d) => d.blocked).length} />
        <Stat label="Общий долг водителей" value={som(totalDebt)} warn={totalDebt > 0} />
      </div>
      {msg && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm">{msg}</div>}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-500">
            <tr><th className="p-3">Водитель</th><th className="p-3">Авто</th><th className="p-3">Поездок</th><th className="p-3">Отмен</th><th className="p-3">Долг</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const b = bal[d.uid];
              const limitHit = b && cfg.debtLimitSom > 0 && b.debtSom > cfg.debtLimitSom;
              return (
                <tr key={d.uid} className="border-t border-neutral-100">
                  <td className="p-3"><div className={`font-semibold ${d.blocked ? 'text-neutral-400' : ''}`}>{d.name || d.uid.slice(0, 8)}</div><div className="text-xs text-neutral-500">{d.payPhone}</div></td>
                  <td className="p-3">{d.car}<div className="text-xs text-neutral-500">{d.plate}</div></td>
                  <td className="p-3">{b ? b.trips : '…'}</td>
                  <td className="p-3">{b ? b.cancelled : '…'}</td>
                  <td className={`p-3 font-bold ${b && b.debtSom > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {b ? (b.debtSom > 0 ? som(b.debtSom) : 'нет') : '…'}
                    {limitHit && <div className="text-xs font-normal">выше лимита — GO закрыт</div>}
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-2">
                    {b && b.debtSom > 0 && <button className={btn} onClick={() => { setPay(d); setAmount(String(b.debtSom)); }}>Принять оплату</button>}
                    <button className={`${btn} ${d.blocked ? '' : 'text-red-700'}`} onClick={() => setDriverBlocked(d.uid, !d.blocked)}>
                      {d.blocked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pay && (
        <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center p-4" onClick={() => setPay(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black">Оплата от {pay.name}</h3>
            <input className={input} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
            <div className="flex gap-2 justify-end">
              <button className={btn} onClick={() => setPay(null)}>Отмена</button>
              <button
                className={btnDark}
                disabled={!Number(amount)}
                onClick={async () => {
                  try {
                    await addDriverPayment(pay.uid, Number(amount));
                    setMsg(`Оплата ${amount} сом от ${pay.name} записана`);
                    setPay(null);
                    load();
                  } catch (e: any) { setMsg(e.message); }
                }}
              >
                Записать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ prices
const PricesTab: React.FC<{ cfg: AppConfig }> = ({ cfg }) => {
  const [c, setC] = useState<AppConfig>(cfg);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setC(cfg), [cfg]);
  const num = (v: string) => Number(v.replace(/\D/g, '')) || 0;
  const setT = (id: string, k: 'baseSom' | 'perKmSom', v: number) => {
    const t = APP_TARIFFS.find((x) => x.id === id)!;
    const cur = c.tariffs[id] || { baseSom: t.base, perKmSom: t.perKm };
    setC({ ...c, tariffs: { ...c.tariffs, [id]: { ...cur, [k]: v } } });
  };
  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="font-bold mb-3">Цены тарифов (сом)</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {APP_TARIFFS.map((t) => {
            const p = c.tariffs[t.id];
            return (
              <div key={t.id} className="flex items-center gap-2">
                <span className="w-32 text-sm">{t.name}</span>
                <input className={input} title="Посадка" value={p?.baseSom ?? t.base} onChange={(e) => setT(t.id, 'baseSom', num(e.target.value))} />
                <input className={input} title="За км" value={p?.perKmSom ?? t.perKm} onChange={(e) => setT(t.id, 'perKmSom', num(e.target.value))} />
              </div>
            );
          })}
        </div>
        <div className="text-xs text-neutral-500 mt-2">Первое поле — посадка, второе — за километр.</div>
      </div>
      <div className={`${card} grid sm:grid-cols-2 gap-3`}>
        <Field label="Комиссия сервиса, %" value={c.commissionPercent} onChange={(v) => setC({ ...c, commissionPercent: v })} />
        <Field label="«Пригласи друга»: скидка, %" value={c.referralPercent} onChange={(v) => setC({ ...c, referralPercent: v })} />
        <Field label="Цель дня: поездок" value={c.goalTrips} onChange={(v) => setC({ ...c, goalTrips: v })} />
        <Field label="Цель дня: бонус, сом" value={c.goalBonusSom} onChange={(v) => setC({ ...c, goalBonusSom: v })} />
        <Field label="Макс. долг для выхода на линию, сом (0 — без лимита)" value={c.debtLimitSom} onChange={(v) => setC({ ...c, debtLimitSom: v })} />
        <div>
          <div className="text-xs text-neutral-500 mb-1">Промокод на первую поездку</div>
          <div className="flex gap-2">
            <input className={input} placeholder="Код" value={c.promoCode} onChange={(e) => setC({ ...c, promoCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20) })} />
            <input className={`${input} w-24`} placeholder="%" value={c.promoPercent} onChange={(e) => setC({ ...c, promoPercent: num(e.target.value) })} />
          </div>
          <label className="text-sm flex items-center gap-2 mt-2">
            <input type="checkbox" checked={c.promoActive} onChange={(e) => setC({ ...c, promoActive: e.target.checked })} /> Промокод включён
          </label>
        </div>
      </div>
      {msg && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm">{msg}</div>}
      <button
        className={`${btnDark} w-full py-3`}
        onClick={async () => {
          try { await saveConfig(c); setMsg('Сохранено. Новые цены сразу видят все пассажиры и водители.'); } catch (e: any) { setMsg(`Не удалось сохранить: ${e.message}`); }
        }}
      >
        Сохранить для всех
      </button>
    </div>
  );
};

const Field: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <label className="block">
    <div className="text-xs text-neutral-500 mb-1">{label}</div>
    <input className={input} inputMode="numeric" value={value} onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)} />
  </label>
);

// ------------------------------------------------------------------ support
const SupportTab: React.FC<{ tickets: SupportTicket[] }> = ({ tickets }) => {
  if (tickets.length === 0) return <div className={`${card} text-sm text-neutral-500`}>Обращений пока нет.</div>;
  return (
    <div className="space-y-2">
      {tickets.map((t) => (
        <div key={t.id} className={`${card} ${t.status === 'open' ? 'border-amber-300 bg-amber-50' : ''}`}>
          <div className="flex justify-between text-sm">
            <span className="font-bold">{t.name || 'Без имени'} {t.phone && <a className="underline ml-1" href={`tel:${t.phone}`}>{t.phone}</a>}</span>
            <span className="text-neutral-500">{fmt(t.createdAt)}</span>
          </div>
          <div className="text-sm mt-1 whitespace-pre-wrap">{t.text}</div>
          {t.rideId && <div className="text-xs text-neutral-500 mt-1">Поездка: {t.rideId}</div>}
          {t.status === 'open' ? (
            <button className={`${btn} mt-2`} onClick={() => resolveTicket(t.id)}>Решено</button>
          ) : (
            <div className="text-xs text-emerald-700 mt-2">Решено</div>
          )}
        </div>
      ))}
    </div>
  );
};
