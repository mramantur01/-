import React, { useState, useEffect } from 'react';
import {
  PassengerProfile,
  SavedCard,
  SafetySettings,
  FamilyMember,
  BusinessProfile,
  Language
} from '../../types/taxi';
import {
  User,
  CreditCard,
  ShieldCheck,
  Plus,
  Trash2,
  Phone,
  Lock,
  CheckCircle2,
  LogIn,
  LogOut,
  Users,
  Briefcase,
  Navigation
} from 'lucide-react';

interface PassengerProfileModalProps {
  profile: PassengerProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updated: PassengerProfile) => void;
  isSignedIn?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  lang: Language;
}

export const PassengerProfileModal: React.FC<PassengerProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdateProfile,
  isSignedIn = false,
  onGoogleLogin,
  onGoogleLogout
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'cards' | 'family' | 'safety'>('cards');
  const [showAddCardForm, setShowAddCardForm] = useState(false);

  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');
  const [newCardholder, setNewCardholder] = useState('');
  const [newCardBank, setNewCardBank] = useState('MBank (Коммерческий банк КР)');
  const [cardError, setCardError] = useState('');
  const [cardAddedSuccess, setCardAddedSuccess] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Family / Uber Teen state
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'teen' | 'parent'>('teen');
  const [newMemberLimit, setNewMemberLimit] = useState(4000);
  const [newMemberPin, setNewMemberPin] = useState(true);
  const [newMemberTracking, setNewMemberTracking] = useState(true);

  // Business / Uber for Business state
  const defaultBusiness: BusinessProfile = profile.businessProfile || {
    enabled: true,
    companyName: 'ОсОО «Ала-Тоо Тех»',
    inn: '01408201910234',
    corporateEmail: 'finance@alatoo-tech.kg',
    monthlyLimitKgs: 25000,
    activeMode: 'personal'
  };
  const [business, setBusiness] = useState<BusinessProfile>(defaultBusiness);

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [homeAddress, setHomeAddress] = useState(profile.homeAddress || '');
  const [workAddress, setWorkAddress] = useState(profile.workAddress || '');
  const [safety, setSafety] = useState<SafetySettings>(profile.safetySettings);

  useEffect(() => {
    setName(profile.name);
    setPhone(profile.phone);
    setHomeAddress(profile.homeAddress || '');
    setWorkAddress(profile.workAddress || '');
    setSafety(profile.safetySettings);
    if (profile.businessProfile) {
      setBusiness(profile.businessProfile);
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newCardNumber.replace(/\s/g, '');
    if (cleanNum.length < 16) {
      setCardError('Введите корректный 16-значный номер карты');
      return;
    }
    setCardError('');

    const masked = `${cleanNum.slice(0, 4)} •••• •••• ${cleanNum.slice(12)}`;

    let cardType: SavedCard['cardType'] = 'visa';
    if (cleanNum.startsWith('9496') || cleanNum.startsWith('9417')) {
      cardType = cleanNum.startsWith('9417') ? 'mbank' : 'elkart';
    } else if (cleanNum.startsWith('5')) {
      cardType = 'mastercard';
    }

    const newCard: SavedCard = {
      id: `card_${Date.now()}`,
      cardNumber: masked,
      rawCardNumber: cleanNum,
      expiry: newCardExpiry || '12/28',
      cardholderName: newCardholder.toUpperCase() || 'KG PASSENGER',
      cardType,
      bankName: newCardBank,
      isDefault: profile.savedCards.length === 0
    };

    onUpdateProfile({
      ...profile,
      savedCards: [...profile.savedCards, newCard]
    });

    setCardAddedSuccess(true);
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCvv('');
    setNewCardholder('');
    setTimeout(() => {
      setCardAddedSuccess(false);
      setShowAddCardForm(false);
    }, 1200);
  };

  const handleSetDefaultCard = (cardId: string) => {
    onUpdateProfile({
      ...profile,
      savedCards: profile.savedCards.map((c) => ({ ...c, isDefault: c.id === cardId }))
    });
  };

  const handleDeleteCard = (cardId: string) => {
    const filtered = profile.savedCards.filter((c) => c.id !== cardId);
    if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
      filtered[0].isDefault = true;
    }
    onUpdateProfile({ ...profile, savedCards: filtered });
  };

  const handleSaveInfo = () => {
    onUpdateProfile({
      ...profile,
      name,
      phone,
      homeAddress,
      workAddress,
      safetySettings: safety,
      businessProfile: business
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const member: FamilyMember = {
      id: `fam_${Date.now()}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim() || '+996 (700) 00-00-00',
      role: newMemberRole,
      monthlyLimitKgs: Math.max(500, Number(newMemberLimit) || 3000),
      requirePin: newMemberPin,
      liveTracking: newMemberTracking
    };
    onUpdateProfile({
      ...profile,
      familyMembers: [...(profile.familyMembers || []), member]
    });
    setNewMemberName('');
    setNewMemberPhone('');
    setShowAddMemberForm(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleRemoveFamilyMember = (id: string) => {
    onUpdateProfile({
      ...profile,
      familyMembers: (profile.familyMembers || []).filter((m) => m.id !== id)
    });
  };

  const handleToggleFamilyRule = (id: string, key: 'requirePin' | 'liveTracking') => {
    onUpdateProfile({
      ...profile,
      familyMembers: (profile.familyMembers || []).map((m) =>
        m.id === id ? { ...m, [key]: !m[key] } : m
      )
    });
  };

  const formatCardInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Uber Profile Header */}
        <div className="p-5 bg-black text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-white text-black font-bold text-lg flex items-center justify-center">
              {profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{profile.name}</h3>
                <span className="text-xs text-neutral-300 font-semibold">
                  ★ {profile.safetyRating}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {profile.phone} · {profile.totalCompletedRides} поездок · {profile.plusPointsBalance ?? 240} бонусов
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

        {/* Google Cloud Sync Bar */}
        <div className="px-5 py-3 bg-[#f6f6f6] border-b border-neutral-200 flex items-center justify-between gap-3 shrink-0">
          {isSignedIn ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#05944F] shrink-0" />
                <span className="text-xs font-semibold text-black truncate">
                  Google аккаунт: {profile.email || 'Синхронизировано'}
                </span>
              </div>
              {onGoogleLogout && (
                <button
                  type="button"
                  onClick={onGoogleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-300 hover:bg-neutral-100 text-xs font-semibold text-black shrink-0 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти</span>
                </button>
              )}
            </>
          ) : (
            <>
              <div className="min-w-0">
                <p className="text-xs font-bold text-black">Облачная синхронизация</p>
                <p className="text-[11px] text-neutral-500 truncate">
                  Сохраняйте карты, историю и живые заказы через Google
                </p>
              </div>
              {onGoogleLogin && (
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold shrink-0 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Войти</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Uber Tabs */}
        <div className="grid grid-cols-4 bg-white border-b border-neutral-200 text-[11px] sm:text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`py-3 flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'cards'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Кошелек</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('family')}
            className={`py-3 flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'family'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Семья / Бизнес</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`py-3 flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'safety'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Защита</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Профиль</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto uber-scroll p-5 space-y-4">
          {savedNotice && (
            <div className="p-3 rounded-xl bg-[#05944F]/10 text-[#05944F] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Изменения сохранены</span>
            </div>
          )}

          {/* TAB 1: CARDS */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-black">Привязанные карты КР</h4>
                  <p className="text-xs text-neutral-500">Безналичная оплата поездок</p>
                </div>
                {!showAddCardForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddCardForm(true)}
                    className="flex items-center gap-1 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-semibold rounded-full text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить карту</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {profile.savedCards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      card.isDefault ? 'bg-white border-2 border-black' : 'bg-[#f6f6f6] border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {card.cardType === 'mbank' ? 'MB' : card.cardType === 'elkart' ? 'ЭЛ' : 'VISA'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-black truncate">
                              {card.cardNumber}
                            </span>
                            {card.isDefault && (
                              <span className="text-[11px] font-semibold text-[#05944F] shrink-0">
                                · Основная
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 truncate">
                            {card.bankName} · {card.expiry}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!card.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultCard(card.id)}
                            className="text-xs text-neutral-600 hover:text-black font-semibold"
                          >
                            Выбрать
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className="w-8 h-8 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-[#E11900] flex items-center justify-center transition-colors"
                          title="Удалить карту"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showAddCardForm && (
                <form
                  onSubmit={handleAddCard}
                  className="bg-[#f6f6f6] border border-neutral-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <span className="text-xs font-bold text-black">Новая карта банка КР</span>
                    <button
                      type="button"
                      onClick={() => setShowAddCardForm(false)}
                      className="text-xs text-neutral-500 hover:text-black font-medium"
                    >
                      Отмена
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-600 font-medium block mb-1">Номер карты</label>
                    <input
                      type="text"
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(formatCardInput(e.target.value))}
                      placeholder="9417 0000 0000 0000"
                      required
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-black font-mono focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-600 font-medium block mb-1">Срок (ММ/ГГ)</label>
                      <input
                        type="text"
                        value={newCardExpiry}
                        onChange={(e) => setNewCardExpiry(formatExpiryInput(e.target.value))}
                        placeholder="12/28"
                        required
                        className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-black font-mono focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-600 font-medium block mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={3}
                        value={newCardCvv}
                        onChange={(e) => setNewCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="•••"
                        required
                        className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-black font-mono focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-600 font-medium block mb-1">Владелец карты</label>
                    <input
                      type="text"
                      value={newCardholder}
                      onChange={(e) => setNewCardholder(e.target.value.toUpperCase())}
                      placeholder="AMANTUR KASYMOV"
                      required
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-black uppercase focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-600 font-medium block mb-1">Банк КР</label>
                    <select
                      value={newCardBank}
                      onChange={(e) => setNewCardBank(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-black focus:outline-none focus:border-black"
                    >
                      <option value="MBank (Коммерческий банк КР)">MBank (Коммерческий банк КР)</option>
                      <option value="Элкарт (ЗАО «МПЦ» КР)">Элкарт (Национальная карта КР)</option>
                      <option value="Оптима Банк">Оптима Банк (Optima24)</option>
                      <option value="Демир Банк">Демир Банк (DemirBank)</option>
                      <option value="Бакай Банк">Бакай Банк (Bakai Bank)</option>
                      <option value="Эльдик Банк (РСК Банк)">Эльдик Банк (РСК Банк)</option>
                      <option value="KICB">KICB</option>
                    </select>
                  </div>

                  {cardError && <p className="text-xs text-[#E11900] font-medium">{cardError}</p>}

                  {cardAddedSuccess && (
                    <div className="flex items-center gap-1.5 text-xs text-[#05944F] font-bold justify-center py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Карта привязана (3D Secure)</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Сохранить карту
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: FAMILY (UBER TEEN) & CORPORATE (UBER FOR BUSINESS) */}
          {activeTab === 'family' && (
            <div className="space-y-5">
              {/* Uber Teen / Family Profile Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-black flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#276EF1]" />
                      <span>Семейный профиль · Uber Teen</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Общая карта для детей (13–17 лет) и родителей · Живой GPS + PIN
                    </p>
                  </div>
                  {!showAddMemberForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddMemberForm(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-semibold rounded-full text-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Добавить</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {(profile.familyMembers || []).length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#f6f6f6] text-xs text-neutral-500 text-center">
                      Участники семейного профиля ещё не добавлены
                    </div>
                  ) : (
                    (profile.familyMembers || []).map((member) => (
                      <div
                        key={member.id}
                        className="p-3.5 rounded-xl bg-[#f6f6f6] border border-neutral-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-black truncate">
                                {member.name}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black text-white shrink-0">
                                {member.role === 'teen' ? 'Teen 13–17' : 'Родитель'}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {member.phone} · Лимит:{' '}
                              <strong className="text-black tabular-nums">
                                {member.monthlyLimitKgs.toLocaleString('ru-RU')} сом/мес
                              </strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFamilyMember(member.id)}
                            className="w-7 h-7 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-[#E11900] flex items-center justify-center shrink-0"
                            title="Удалить участника"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-neutral-200">
                          <button
                            type="button"
                            onClick={() => handleToggleFamilyRule(member.id, 'requirePin')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                              member.requirePin
                                ? 'bg-black text-white'
                                : 'bg-white text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            <Lock className="w-3 h-3" />
                            <span>Обязательный PIN</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFamilyRule(member.id, 'liveTracking')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                              member.liveTracking
                                ? 'bg-[#05944F] text-white'
                                : 'bg-white text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            <Navigation className="w-3 h-3" />
                            <span>GPS-трекинг</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {showAddMemberForm && (
                  <form
                    onSubmit={handleAddFamilyMember}
                    className="p-3.5 rounded-xl bg-white border-2 border-black space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-black">
                      <span>Новый участник семьи</span>
                      <button
                        type="button"
                        onClick={() => setShowAddMemberForm(false)}
                        className="text-neutral-500 hover:text-black font-medium"
                      >
                        Отмена
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Имя (напр. Алия, 14 лет)"
                        className="h-9 bg-[#f6f6f6] border border-neutral-200 rounded-lg px-2.5 text-xs text-black focus:outline-none focus:border-black"
                      />
                      <input
                        type="text"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="+996 700 12-34-56"
                        className="h-9 bg-[#f6f6f6] border border-neutral-200 rounded-lg px-2.5 text-xs text-black focus:outline-none focus:border-black"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as 'teen' | 'parent')}
                        className="h-9 bg-[#f6f6f6] border border-neutral-200 rounded-lg px-2.5 text-xs text-black focus:outline-none focus:border-black"
                      >
                        <option value="teen">Подросток (13–17 лет)</option>
                        <option value="parent">Родитель / Супруг(а)</option>
                      </select>
                      <input
                        type="number"
                        min={500}
                        step={500}
                        value={newMemberLimit}
                        onChange={(e) => setNewMemberLimit(Number(e.target.value))}
                        placeholder="Лимит сом/мес"
                        className="h-9 bg-[#f6f6f6] border border-neutral-200 rounded-lg px-2.5 text-xs text-black focus:outline-none focus:border-black"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-700 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMemberPin}
                          onChange={(e) => setNewMemberPin(e.target.checked)}
                          className="accent-black"
                        />
                        <span>PIN-код посадки</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMemberTracking}
                          onChange={(e) => setNewMemberTracking(e.target.checked)}
                          className="accent-black"
                        />
                        <span>Живой GPS</span>
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs"
                    >
                      Пригласить в семейный аккаунт
                    </button>
                  </form>
                )}
              </div>

              {/* Uber for Business Corporate Profile Section */}
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-black flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#276EF1]" />
                      <span>Корпоративный профиль · Business</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Разделяйте личные и рабочие поездки · Авто-чеки с ИНН КР
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#f3f3f3] rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBusiness({ ...business, activeMode: 'personal' })}
                    className={`py-2 rounded-lg transition-colors ${
                      business.activeMode === 'personal'
                        ? 'bg-black text-white'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    Личный профиль
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusiness({ ...business, activeMode: 'business', enabled: true })}
                    className={`py-2 rounded-lg transition-colors ${
                      business.activeMode === 'business'
                        ? 'bg-[#276EF1] text-white'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    Бизнес-профиль
                  </button>
                </div>

                <div className="space-y-2.5 bg-[#f6f6f6] p-3.5 rounded-xl border border-neutral-200">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Название компании (ОсОО / ОАО / ИП)
                    </label>
                    <input
                      type="text"
                      value={business.companyName}
                      onChange={(e) => setBusiness({ ...business, companyName: e.target.value })}
                      className="w-full h-9 bg-white border border-neutral-200 rounded-lg px-3 text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                        ИНН КР
                      </label>
                      <input
                        type="text"
                        value={business.inn}
                        onChange={(e) => setBusiness({ ...business, inn: e.target.value })}
                        className="w-full h-9 bg-white border border-neutral-200 rounded-lg px-3 text-xs font-mono text-black focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                        Лимит в месяц (сом)
                      </label>
                      <input
                        type="number"
                        step={1000}
                        value={business.monthlyLimitKgs}
                        onChange={(e) =>
                          setBusiness({ ...business, monthlyLimitKgs: Number(e.target.value) || 0 })
                        }
                        className="w-full h-9 bg-white border border-neutral-200 rounded-lg px-3 text-xs font-mono text-black focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                      Email бухгалтерии для авто-чеков
                    </label>
                    <input
                      type="email"
                      value={business.corporateEmail}
                      onChange={(e) => setBusiness({ ...business, corporateEmail: e.target.value })}
                      className="w-full h-9 bg-white border border-neutral-200 rounded-lg px-3 text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveInfo}
                  className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Сохранить корпоративный профиль
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="bg-[#f6f6f6] p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-black font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-[#276EF1]" />
                  <span>Центр безопасности KG Taxi</span>
                </div>
                <p className="text-xs text-neutral-600">
                  Защита пассажира и водителя в каждой поездке по Кыргызстану.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-black shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-black">PIN-код проверки посадки</h5>
                      <p className="text-[11px] text-neutral-500">
                        Поездка начнется только после подтверждения 4-значного кода
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={safety.safetyPinEnabled}
                    onChange={(e) => setSafety({ ...safety, safetyPinEnabled: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </div>

                {safety.safetyPinEnabled && (
                  <div className="pt-2 flex items-center justify-between border-t border-neutral-100 text-xs">
                    <span className="text-neutral-500">Ваш PIN-код:</span>
                    <span className="font-mono font-bold text-black text-sm tracking-widest bg-[#f3f3f3] px-3 py-1 rounded-md">
                      7429
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-black" />
                  <div>
                    <h5 className="text-xs font-bold text-black">Доверенный контакт</h5>
                    <p className="text-[11px] text-neutral-500">
                      Автоматическая отправка маршрута и GPS близкому человеку
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    value={safety.emergencyContactName}
                    onChange={(e) => setSafety({ ...safety, emergencyContactName: e.target.value })}
                    placeholder="Имя контакта"
                    className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:border-black"
                  />
                  <input
                    type="text"
                    value={safety.emergencyContactPhone}
                    onChange={(e) => setSafety({ ...safety, emergencyContactPhone: e.target.value })}
                    placeholder="+996 700 12-34-56"
                    className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3 py-2 text-black focus:outline-none focus:border-black"
                  />
                </div>

                <label className="flex items-center justify-between pt-1 cursor-pointer">
                  <span className="text-xs text-neutral-700">Делиться поездкой автоматически</span>
                  <input
                    type="checkbox"
                    checked={safety.autoShareTripWithContact}
                    onChange={(e) =>
                      setSafety({ ...safety, autoShareTripWithContact: e.target.checked })
                    }
                    className="w-4 h-4 accent-black"
                  />
                </label>
              </div>

              <label className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <h5 className="text-xs font-bold text-black">Защитная аудиозапись поездки</h5>
                  <p className="text-[11px] text-neutral-500">
                    Зашифрована на устройстве и доступна только при обращении в службу безопасности
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={safety.isAudioRecordingEnabled}
                  onChange={(e) =>
                    setSafety({ ...safety, isAudioRecordingEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-black shrink-0"
                />
              </label>

              <button
                type="button"
                onClick={handleSaveInfo}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Сохранить настройки безопасности
              </button>
            </div>
          )}

          {/* TAB 3: PERSONAL INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">ФИО</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">Телефон</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">Дом</label>
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    placeholder="мкр. Джал-29, дом 14"
                    className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-600 block mb-1">Работа</label>
                  <input
                    type="text"
                    value={workAddress}
                    onChange={(e) => setWorkAddress(e.target.value)}
                    placeholder="пр. Чуй 155 (ЦУМ Айчүрөк)"
                    className="w-full bg-[#f6f6f6] border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveInfo}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Сохранить профиль
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
