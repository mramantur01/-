import React from 'react';
import { CityConfig, CityId, Language } from '../../types/taxi';
import { TRANSLATIONS } from '../../utils/translations';
import { User, History, Globe, LogIn, Volume2, VolumeX } from 'lucide-react';
import { PWAInstallButton } from '../PWA/PWAInstallButton';

interface TopBarProps {
  currentCity: CityConfig;
  cities: CityConfig[];
  onSelectCity: (cityId: CityId) => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
  appMode: 'passenger' | 'driver' | 'dispatcher';
  onSelectAppMode: (mode: 'passenger' | 'driver' | 'dispatcher') => void;
  onOpenHistory: () => void;
  activeView: 'map' | '2gis';
  onToggle2GisView: () => void;
  onOpenProfile: () => void;
  onOpenIntercity: () => void;
  onOpenFoodDelivery?: () => void;
  userName?: string;
  isSignedIn: boolean;
  onGoogleLogin: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  onSelectLang,
  appMode,
  onSelectAppMode,
  onOpenHistory,
  activeView,
  onToggle2GisView,
  onOpenProfile,
  onOpenIntercity,
  onOpenFoodDelivery,
  userName = 'Профиль',
  isSignedIn,
  onGoogleLogin,
  soundEnabled = true,
  onToggleSound
}) => {
  const t = TRANSLATIONS[lang];

  const cycleLang = () => {
    const order: Language[] = ['ru', 'kg', 'en'];
    const next = order[(order.indexOf(lang) + 1) % order.length];
    onSelectLang(next);
  };

  return (
    <header className="h-16 bg-black text-white px-4 sm:px-6 flex items-center justify-between gap-3 z-30 sticky top-0 shrink-0 border-b border-neutral-800">
      {/* Zone 1: Minimalist Uber-style single-element wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectAppMode('passenger');
          if (activeView === '2gis') onToggle2GisView();
        }}
        className="text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
      >
        KG Taxi
      </a>

      {/* Zone 2: Clean single-line navigation links */}
      <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-neutral-300">
        <button
          type="button"
          onClick={() => {
            onSelectAppMode('passenger');
            if (activeView === '2gis') onToggle2GisView();
          }}
          className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            appMode === 'passenger' && activeView === 'map'
              ? 'text-white border-white font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          {t.navRide}
        </button>

        <button
          type="button"
          onClick={onOpenIntercity}
          className="py-1 border-b-2 border-transparent hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          {t.navIntercity}
        </button>

        {onOpenFoodDelivery && (
          <button
            type="button"
            onClick={onOpenFoodDelivery}
            className="py-1 border-b-2 border-transparent hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {t.navFood}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onSelectAppMode('passenger');
            onToggle2GisView();
          }}
          className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            appMode === 'passenger' && activeView === '2gis'
              ? 'text-white border-white font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          2ГИС
        </button>

        <button
          type="button"
          onClick={() => onSelectAppMode(appMode === 'driver' ? 'passenger' : 'driver')}
          className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            appMode === 'driver'
              ? 'text-white border-white font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          {t.navDrivers}
        </button>

        <button
          type="button"
          onClick={() => onSelectAppMode(appMode === 'dispatcher' ? 'passenger' : 'dispatcher')}
          className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
            appMode === 'dispatcher'
              ? 'text-white border-white font-semibold'
              : 'border-transparent hover:text-white'
          }`}
        >
          {t.navDispatcher}
        </button>
      </nav>

      {/* Zone 3: Right actions (PWA, Sound, Lang, History, Profile & Auth) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <PWAInstallButton variant="dark" />

        {onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Выключить звуки уведомлений' : 'Включить звуки уведомлений'}
            className="hidden sm:flex w-9 h-9 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white items-center justify-center transition-colors shrink-0"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>
        )}

        <button
          type="button"
          onClick={cycleLang}
          title="Сменить язык (RU / KG / EN)"
          className="h-9 px-2.5 rounded-full hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
        >
          <Globe className="w-4 h-4" />
          <span className="uppercase hidden sm:inline">{lang}</span>
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          title={t.tripHistory}
          className="hidden sm:flex h-9 px-2.5 rounded-full hover:bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <History className="w-4 h-4" />
          <span className="hidden xl:inline">{t.navTrips}</span>
        </button>

        {/* Mobile quick mode toggle */}
        <button
          type="button"
          onClick={() =>
            onSelectAppMode(
              appMode === 'passenger'
                ? 'driver'
                : appMode === 'driver'
                ? 'dispatcher'
                : 'passenger'
            )
          }
          className="md:hidden h-9 px-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          {appMode === 'passenger' ? t.navDrivers : appMode === 'driver' ? t.navDispatcher : t.navRide}
        </button>

        {/* Always-accessible Profile / Wallet / Family & Business button */}
        <button
          type="button"
          onClick={onOpenProfile}
          title="Профиль, Кошелёк, Семья и Бизнес"
          className={`h-9 px-3 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            isSignedIn
              ? 'bg-white hover:bg-neutral-200 text-black'
              : 'bg-neutral-800 hover:bg-neutral-700 text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{userName.split(' ')[0]}</span>
        </button>

        {!isSignedIn && (
          <button
            type="button"
            onClick={onGoogleLogin}
            className="h-9 px-3.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">{t.signIn}</span>
          </button>
        )}
      </div>
    </header>
  );
};
