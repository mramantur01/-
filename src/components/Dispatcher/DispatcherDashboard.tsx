import React, { useState } from 'react';
import {
  CityConfig,
  DriverProfile,
  FleetCitySetting,
  LiveRideDoc,
  CityId
} from '../../types/taxi';
import {
  LayoutDashboard,
  Users,
  Sliders,
  CheckCircle2,
  XCircle,
  MapPin,
  TrendingUp,
  Car,
  ShieldCheck,
  Navigation
} from 'lucide-react';

interface DispatcherDashboardProps {
  cities: CityConfig[];
  fleetSettings: FleetCitySetting[];
  driverApplications: DriverProfile[];
  liveRides: LiveRideDoc[];
  isAdminUser: boolean;
  onUpdateCitySetting: (setting: FleetCitySetting) => void;
  onApproveDriver: (driverId: string, status: 'approved' | 'rejected') => void;
  onSelectCityOnMap: (cityId: CityId) => void;
  onExitDispatcher: () => void;
}

export const DispatcherDashboard: React.FC<DispatcherDashboardProps> = ({
  cities,
  fleetSettings,
  driverApplications,
  liveRides,
  isAdminUser,
  onUpdateCitySetting,
  onApproveDriver,
  onSelectCityOnMap,
  onExitDispatcher
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'tariffs'>('overview');
  const [savedCityNotice, setSavedCityNotice] = useState<string | null>(null);

  const pendingDrivers = driverApplications.filter((d) => d.verificationStatus === 'pending');
  const approvedDrivers = driverApplications.filter((d) => d.verificationStatus === 'approved');
  const totalRevenueToday =
    liveRides.reduce((acc, r) => acc + (r.fare || 0), 0) + 148500;
  const activeOrdersCount = liveRides.filter(
    (r) => !['completed', 'cancelled'].includes(r.status)
  ).length;

  const cityNameById = (id: CityId) =>
    cities.find((c) => c.id === id)?.name.ru || id;

  const handleCitySave = (setting: FleetCitySetting) => {
    onUpdateCitySetting(setting);
    setSavedCityNotice(cityNameById(setting.cityId));
    setTimeout(() => setSavedCityNotice(null), 2200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Black Uber Fleet Command Header */}
      <div className="bg-black text-white rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">Диспетчерская KG Taxi</h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-200">
                {isAdminUser ? 'Админ · Облачная синхронизация' : 'Демо-панель таксопарка'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Управление автопарком Кыргызстана: Бишкек, Ош, Жалал-Абад, Чолпон-Ата, Каракол
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExitDispatcher}
          className="px-4 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-colors"
        >
          Вернуться на карту
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Оборот за день</span>
            <TrendingUp className="w-4 h-4 text-[#05944F]" />
          </div>
          <div className="text-2xl font-bold text-black tabular-nums">
            {totalRevenueToday.toLocaleString('ru-RU')} с
          </div>
          <div className="text-[11px] text-[#05944F] font-semibold">+14.2% к вчерашнему дню</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Активные заказы</span>
            <Navigation className="w-4 h-4 text-[#276EF1]" />
          </div>
          <div className="text-2xl font-bold text-black tabular-nums">{activeOrdersCount + 18}</div>
          <div className="text-[11px] text-neutral-500">Live в системе: {liveRides.length}</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Водители на линии</span>
            <Car className="w-4 h-4 text-black" />
          </div>
          <div className="text-2xl font-bold text-black tabular-nums">{approvedDrivers.length + 142}</div>
          <div className="text-[11px] text-neutral-500">Средняя подача: 3.2 мин</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>На проверке</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-black tabular-nums">{pendingDrivers.length}</div>
          <div className="text-[11px] text-neutral-500">Заявок с документами</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: `Заказы и города (${liveRides.length})`, icon: MapPin },
          { id: 'drivers', label: `Проверка водителей (${pendingDrivers.length})`, icon: Users },
          { id: 'tariffs', label: 'Тарифы, спрос и комиссия', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                active
                  ? 'bg-black text-white'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-[#f3f3f3]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {savedCityNotice && (
        <div className="p-3 rounded-xl bg-[#05944F]/10 text-[#05944F] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Настройки тарифов для г. {savedCityNotice} обновлены и применены</span>
        </div>
      )}

      {/* TAB 1: LIVE ORDERS & CITIES OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Orders Table */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-black">Лента заказов в реальном времени</h3>
              <span className="text-xs text-neutral-500">Обновляется автоматически</span>
            </div>

            {liveRides.length === 0 ? (
              <div className="bg-[#f6f6f6] rounded-xl p-6 text-center space-y-1">
                <p className="text-xs font-bold text-black">Пока нет новых заказов в облачной очереди</p>
                <p className="text-xs text-neutral-500">
                  Создайте заказ в режиме пассажира — он мгновенно появится здесь и в кабинете водителя.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {liveRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-3.5 rounded-xl bg-[#f6f6f6] border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-black">{ride.passengerName}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-neutral-300 font-semibold text-black">
                          {cityNameById(ride.cityId)}
                        </span>
                        <span className="text-[11px] font-semibold text-[#276EF1]">
                          {ride.tariffName}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 truncate">
                        {ride.pickupName} → {ride.destName}
                      </p>
                      {ride.driverName && (
                        <p className="text-[11px] text-neutral-500">
                          Водитель: <strong className="text-black">{ride.driverName}</strong> ({ride.driverCarPlate})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 shrink-0">
                      <span className="text-base font-bold text-black tabular-nums">{ride.fare} сом</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          ride.status === 'completed'
                            ? 'bg-[#05944F]/15 text-[#05944F]'
                            : ride.status === 'cancelled'
                            ? 'bg-red-100 text-[#E11900]'
                            : 'bg-black text-white'
                        }`}
                      >
                        {ride.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cities Status Panel */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-black">Города Кыргызстана</h3>
            <div className="space-y-2">
              {fleetSettings.map((fs) => (
                <div
                  key={fs.cityId}
                  className="p-3 rounded-xl bg-[#f6f6f6] flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-black">{cityNameById(fs.cityId)}</div>
                    <div className="text-[11px] text-neutral-500">
                      Спрос ×{fs.surgeMultiplier.toFixed(2)} · Комиссия {fs.commissionPercent}%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCityOnMap(fs.cityId);
                      onExitDispatcher();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:bg-black hover:text-white text-[11px] font-semibold transition-colors"
                  >
                    Карта
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVER VERIFICATION QUEUE */}
      {activeTab === 'drivers' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-black">Верификация водителей и документов</h3>
              <p className="text-xs text-neutral-500">
                Проверка водительского удостоверения, техпаспорта и госномера КР
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {driverApplications.map((drv) => (
              <div
                key={drv.id}
                className="p-4 rounded-xl border border-neutral-200 bg-[#f6f6f6] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-black">{drv.name}</span>
                    <span className="font-mono text-xs font-bold bg-white border border-neutral-300 px-2 py-0.5 rounded">
                      {drv.carPlate}
                    </span>
                    {drv.gender === 'female' && (
                      <span className="text-[11px] font-semibold bg-black text-white px-2 py-0.5 rounded-full">
                        Женское такси
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        drv.verificationStatus === 'approved'
                          ? 'bg-[#05944F]/15 text-[#05944F]'
                          : drv.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-[#E11900]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {drv.verificationStatus === 'approved'
                        ? 'Одобрен'
                        : drv.verificationStatus === 'rejected'
                        ? 'Отклонён'
                        : 'Ожидает проверки'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">
                    {drv.carBrand} {drv.carModel} ({drv.carYear}, {drv.carColor}) · г. {cityNameById(drv.city)}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Тел: {drv.phone} · Права: <strong className="text-black">{drv.licenseNumber}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {drv.verificationStatus !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => onApproveDriver(drv.id, 'approved')}
                      className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Одобрить</span>
                    </button>
                  )}
                  {drv.verificationStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => onApproveDriver(drv.id, 'rejected')}
                      className="px-3.5 py-2 rounded-xl bg-white border border-neutral-300 hover:bg-red-50 hover:text-[#E11900] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Отклонить</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TARIFF, SURGE & COMMISSION CONTROLS */}
      {activeTab === 'tariffs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fleetSettings.map((setting) => (
            <div
              key={setting.cityId}
              className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-black">{cityNameById(setting.cityId)}</h4>
                <span className="text-xs font-mono font-bold bg-[#f3f3f3] px-2.5 py-1 rounded-lg">
                  Коэф. ×{setting.surgeMultiplier.toFixed(2)}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-600">Коэффициент спроса (Surge)</span>
                    <strong className="text-black tabular-nums">×{setting.surgeMultiplier.toFixed(2)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.9"
                    max="2.2"
                    step="0.05"
                    value={setting.surgeMultiplier}
                    onChange={(e) =>
                      handleCitySave({ ...setting, surgeMultiplier: Number(e.target.value) })
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-600">Комиссия таксопарка</span>
                    <strong className="text-black tabular-nums">{setting.commissionPercent}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={setting.commissionPercent}
                    onChange={(e) =>
                      handleCitySave({ ...setting, commissionPercent: Number(e.target.value) })
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.ladiesModeEnabled}
                      onChange={(e) =>
                        handleCitySave({ ...setting, ladiesModeEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-black"
                    />
                    <span className="font-medium text-black">Женское такси</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.biddingEnabled}
                      onChange={(e) =>
                        handleCitySave({ ...setting, biddingEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-black"
                    />
                    <span className="font-medium text-black">Торг (Своя цена)</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
