import React from 'react';

export const APK_URL = '/kgtaxi.apk';

const steps = [
  ['Скачайте приложение', 'Установите KG Taxi на Android по кнопке ниже.'],
  ['Войдите через Google', 'Выберите «Водитель» при регистрации.'],
  ['Документы', 'Паспорт и права с двух сторон, селфи с паспортом, ОСАГО, справка о несудимости — только камерой.'],
  ['Автомобиль', 'Выберите марку и модель — тариф подберётся сам. Сфотографируйте машину со всех сторон.'],
  ['Проверка', 'Мы проверим заявку. После одобрения нажмите GO — и вы на линии.']
];

const requirements = [
  'Возраст от 21 года',
  'Стаж вождения от 3 лет',
  'Действующее ОСАГО',
  'Справка о несудимости',
  'Фотоконтроль машины раз в 30 дней'
];

/** "Водителям": how to start driving with KG Taxi. Drivers work in the Android app. */
export const DriversLanding: React.FC<{ onExit: () => void }> = ({ onExit }) => (
  <div className="max-w-3xl mx-auto space-y-5">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h1 className="text-3xl font-black">Работа водителем в KG Taxi</h1>
      <button className="px-3 py-2 rounded-xl text-sm font-semibold border border-neutral-300 hover:bg-white" onClick={onExit}>
        ← К заказу такси
      </button>
    </div>
    <div className="bg-black text-white rounded-3xl p-6">
      <div className="text-lg font-bold">Зарабатывайте на своём авто</div>
      <p className="text-sm text-neutral-300 mt-1">
        Заказы, навигатор, заработок по дням и неделям, предзаказы межгорода, режим «Домой» — всё в приложении водителя.
      </p>
      <a
        href={APK_URL}
        download
        className="inline-block mt-4 px-5 py-3 rounded-2xl bg-white text-black font-bold"
      >
        Скачать приложение для Android
      </a>
      <p className="text-xs text-neutral-400 mt-2">
        Если телефон спросит — разрешите установку из этого источника. Скоро — в Google Play.
      </p>
    </div>
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="font-bold mb-3">Как начать</div>
      <ol className="space-y-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            <div>
              <div className="font-semibold">{t}</div>
              <div className="text-sm text-neutral-600">{d}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="font-bold mb-2">Требования</div>
      <ul className="text-sm space-y-1">
        {requirements.map((r) => <li key={r}>✓ {r}</li>)}
      </ul>
    </div>
    <a href="/privacy.html" className="block text-center text-sm text-neutral-500 underline">Политика конфиденциальности</a>
  </div>
);
