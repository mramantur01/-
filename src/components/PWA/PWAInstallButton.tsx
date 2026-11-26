import React, { useState } from 'react';
import { Download, Smartphone, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'dark' | 'light' }> = ({ variant = 'dark' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  const buttonClass =
    variant === 'dark'
      ? 'h-9 px-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0'
      : 'h-9 px-3.5 rounded-full bg-[#eeeeee] hover:bg-[#e2e2e2] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0';

  // On Android and computers: the real KG Taxi app (APK) instead of a home-screen shortcut.
  if (!isIOS) {
    return (
      <a href="/download.html" className={buttonClass} title="Скачать приложение KG Taxi для Android">
        <Download className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Приложение</span>
      </a>
    );
  }

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button type="button" onClick={install} className={buttonClass} title="Установить приложение KG Taxi">
        <Download className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Приложение</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className={buttonClass}
        title="Установить KG Taxi на телефон"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden xl:inline">Приложение</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white text-black border border-neutral-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-black text-white font-bold text-sm flex items-center justify-center">
                  KG
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Установить KG Taxi</h3>
                  <p className="text-[11px] text-neutral-500">Как нативное приложение на экран</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black text-xs font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {isIOS ? (
              <div className="bg-[#f6f6f6] rounded-xl p-3.5 text-xs text-neutral-700 space-y-2">
                <p className="font-bold text-black">Установка на iPhone / iPad (Safari):</p>
                <p>1. Нажмите кнопку <strong>«Поделиться»</strong> внизу экрана Safari.</p>
                <p>2. Прокрутите вниз и выберите <strong>«На экран „Домой“»</strong>.</p>
                <p>3. Нажмите <strong>«Добавить»</strong> — иконка KG Taxi появится на рабочем столе.</p>
              </div>
            ) : (
              <div className="bg-[#f6f6f6] rounded-xl p-3.5 text-xs text-neutral-700 space-y-2">
                <p className="font-bold text-black">Установка на Android / Chrome:</p>
                <p>1. Откройте меню браузера (три точки в углу).</p>
                <p>2. Выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.</p>
                <p>3. Запускайте KG Taxi в полноэкранном режиме без адресной строки.</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-black text-white px-3.5 py-2 text-xs font-semibold shadow-xl border border-neutral-700">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Офлайн-режим · Используются сохранённые данные</span>
    </div>
  );
};
