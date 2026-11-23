import React, { useState } from 'react';
import { DriverProfile, CityId, Language } from '../../types/taxi';
import { Car, CheckCircle2 } from 'lucide-react';

interface DriverRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterDriver: (driver: DriverProfile) => void;
  lang: Language;
}

export const DriverRegistrationModal: React.FC<DriverRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterDriver
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+996 ');
  const [city, setCity] = useState<CityId>('bishkek');
  const [carBrand] = useState('Toyota');
  const [carModel, setCarModel] = useState('Camry 70');
  const [carColor, setCarColor] = useState('Белый жемчуг');
  const [carPlate, setCarPlate] = useState('01 KG 777 AGH');
  const [carYear, setCarYear] = useState('2021');
  const [licenseNumber] = useState('KG 99887766');
  const [mbankPhone, setMbankPhone] = useState('+996 ');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !carPlate.trim()) {
      setErrorMsg('Заполните обязательные поля: ФИО, телефон и госномер');
      return;
    }
    setErrorMsg('');

    const newDriver: DriverProfile = {
      id: `drv_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      city,
      carBrand,
      carModel,
      carColor,
      carPlate: carPlate.toUpperCase().trim(),
      carYear: parseInt(carYear, 10) || 2020,
      licenseNumber: licenseNumber.trim(),
      gender,
      verificationStatus: 'pending',
      isVerified: false,
      isOnline: true,
      rating: 5.0,
      totalTrips: 0,
      balanceKgs: 500,
      payoutMbankPhone: mbankPhone.trim() || phone.trim()
    };

    setIsSuccess(true);
    setTimeout(() => {
      onRegisterDriver(newDriver);
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 bg-black text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white text-black flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Регистрация водителя
              </h3>
              <p className="text-xs text-neutral-400">
                Работайте в Бишкеке, Оше и на межгороде · Вывод на MBank
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto uber-scroll p-5 space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-black">1. Личные данные</h4>

            <div>
              <label className="text-[11px] text-neutral-600 font-medium block mb-1">ФИО *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ибраимов Азамат Касымович"
                required
                className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-600 font-medium block mb-1">Телефон *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+996 555 12-34-56"
                  required
                  className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-600 font-medium block mb-1">Город *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as CityId)}
                  className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white"
                >
                  <option value="bishkek">Бишкек (01 KG)</option>
                  <option value="osh">Ош (02 KG)</option>
                  <option value="jalal-abad">Жалал-Абад (04 KG)</option>
                  <option value="cholpon-ata">Чолпон-Ата / Ысык-Көл (09 KG)</option>
                  <option value="karakol">Каракол (09 KG)</option>
                  <option value="naryn">Нарын (05 KG)</option>
                  <option value="talas">Талас (07 KG)</option>
                  <option value="batken">Баткен (03 KG)</option>
                  <option value="intercity">Межгород по всему КР</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-600 font-medium block mb-1.5">
                Пол водителя (для тарифа «Женское такси»)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                    gender === 'male'
                      ? 'bg-black text-white border-black'
                      : 'bg-[#f6f6f6] text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                  }`}
                >
                  Мужчина
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                    gender === 'female'
                      ? 'bg-black text-white border-black'
                      : 'bg-[#f6f6f6] text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                  }`}
                >
                  Женщина · Женское такси
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-neutral-200">
            <h4 className="text-xs font-bold text-black">2. Автомобиль</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-600 font-medium block mb-1">Марка и модель *</label>
                <input
                  type="text"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="Toyota Camry 70"
                  required
                  className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-600 font-medium block mb-1">Госномер КР *</label>
                <input
                  type="text"
                  value={carPlate}
                  onChange={(e) => setCarPlate(e.target.value.toUpperCase())}
                  placeholder="01 KG 789 AGH"
                  required
                  className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-black uppercase focus:outline-none focus:border-black focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-600 font-medium block mb-1">Цвет</label>
                <input
                  type="text"
                  value={carColor}
                  onChange={(e) => setCarColor(e.target.value)}
                  className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-600 font-medium block mb-1">Год выпуска</label>
                <input
                  type="text"
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value)}
                  className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-neutral-200">
            <h4 className="text-xs font-bold text-black">3. Выплаты на MBank (0% комиссия)</h4>
            <input
              type="text"
              value={mbankPhone}
              onChange={(e) => setMbankPhone(e.target.value)}
              placeholder="+996 555 12-34-56 (MBank)"
              className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black focus:bg-white"
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span className="text-xs text-neutral-600">
                Согласен с правилами перевозок и стандартами безопасности КР
              </span>
            </label>
          </div>

          {errorMsg && <p className="text-xs text-[#E11900] font-medium">{errorMsg}</p>}

          {isSuccess && (
            <div className="p-3 bg-[#05944F]/10 rounded-xl flex items-center gap-2 text-[#05944F] text-xs font-bold justify-center">
              <CheckCircle2 className="w-4 h-4" />
              <span>Заявка отправлена диспетчеру! Бонус 500 сом готов</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold text-sm rounded-xl transition-colors"
          >
            Зарегистрироваться и выйти на линию
          </button>
        </form>
      </div>
    </div>
  );
};
