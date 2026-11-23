import {
  CityConfig,
  Tariff,
  Driver,
  PaymentMethod,
  IntercityRoute,
  PassengerProfile,
  DriverProfile,
  FoodRestaurant,
  FleetCitySetting
} from '../types/taxi';

export const CITIES: CityConfig[] = [
  {
    id: 'bishkek',
    name: { ru: 'Бишкек', kg: 'Бишкек', en: 'Bishkek' },
    regionName: 'г. Бишкек (01 KG)',
    centerCoordinates: { lat: 42.8746, lng: 74.5698 },
    basePriceMultiplier: 1.0,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'ala_too',
        name: { ru: 'Площадь Ала-Тоо', kg: 'Ала-Тоо аянты', en: 'Ala-Too Square' },
        address: 'пр. Чуй / бул. Эркиндик',
        category: 'landmark',
        x: 48,
        y: 45,
        lat: 42.8765,
        lng: 74.6037
      },
      {
        id: 'asia_mall',
        name: { ru: 'ТРЦ Asia Mall', kg: 'Asia Mall соода борбору', en: 'Asia Mall' },
        address: 'пр. Чынгыза Айтматова 3',
        category: 'shopping',
        x: 35,
        y: 62,
        lat: 42.8553,
        lng: 74.5866
      },
      {
        id: 'manas_airport',
        name: { ru: 'Аэропорт «Манас» (FRU)', kg: '«Манас» Эл аралык Аэропорту', en: 'Manas Int Airport' },
        address: 'Трасса аэропорта Манас, 25 км',
        category: 'transit',
        x: 18,
        y: 12,
        lat: 43.0612,
        lng: 74.4776
      },
      {
        id: 'tsum',
        name: { ru: 'ЦУМ «Айчүрөк»', kg: 'ЦУМ «Айчүрөк»', en: 'TSUM Aichurok' },
        address: 'пр. Чуй 155',
        category: 'shopping',
        x: 58,
        y: 44,
        lat: 42.8756,
        lng: 74.6143
      },
      {
        id: 'osh_bazaar',
        name: { ru: 'Ошский рынок', kg: 'Ош базары', en: 'Osh Bazaar' },
        address: 'ул. Киевская / ул. Бейшеналиевой',
        category: 'shopping',
        x: 32,
        y: 42,
        lat: 42.8751,
        lng: 74.5689
      },
      {
        id: 'djal',
        name: { ru: 'мкр. Джал-29', kg: 'Жал-29 кичи району', en: 'Djal-29 Microdistrict' },
        address: 'ул. Ахунбаева / ул. Тыналиева',
        category: 'living',
        x: 28,
        y: 78,
        lat: 42.8335,
        lng: 74.5645
      },
      {
        id: 'asanbay',
        name: { ru: 'мкр. Асанбай', kg: 'Асанбай кичи району', en: 'Asanbay Microdistrict' },
        address: 'ул. Аалы Токомбаева 21',
        category: 'living',
        x: 72,
        y: 82,
        lat: 42.8197,
        lng: 74.6183
      },
      {
        id: 'bishkek_park',
        name: { ru: 'ТРЦ Bishkek Park', kg: 'Bishkek Park соода борбору', en: 'Bishkek Park Mall' },
        address: 'ул. Киевская 148',
        category: 'shopping',
        x: 42,
        y: 46,
        lat: 42.8748,
        lng: 74.5908
      },
      {
        id: 'dordoi',
        name: { ru: 'Рынок «Дордой»', kg: '«Дордой» соода базары', en: 'Dordoi Bazaar' },
        address: 'Северная объездная трасса',
        category: 'shopping',
        x: 65,
        y: 20,
        lat: 42.9298,
        lng: 74.6305
      },
      {
        id: 'syntymak',
        name: { ru: 'Парк «Ынтымак» / Магистраль', kg: '«Ынтымак» эс алуу багы', en: 'Yntymak Park' },
        address: 'ул. Аалы Токомбаева / пр. Айтматова',
        category: 'resort',
        x: 42,
        y: 84,
        lat: 42.8242,
        lng: 74.5888
      }
    ]
  },
  {
    id: 'osh',
    name: { ru: 'Ош', kg: 'Ош', en: 'Osh' },
    regionName: 'г. Ош (02 KG)',
    centerCoordinates: { lat: 40.514, lng: 72.8161 },
    basePriceMultiplier: 0.9,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'sulaiman_too',
        name: { ru: 'Гора Сулайман-Тоо', kg: 'Сулайман-Тоо ыйык тоосу', en: 'Sulaiman-Too Sacred Mountain' },
        address: 'ул. Курманжан Датка',
        category: 'landmark',
        x: 44,
        y: 48,
        lat: 40.5306,
        lng: 72.7825
      },
      {
        id: 'osh_airport',
        name: { ru: 'Аэропорт Ош (OSS)', kg: 'Ош Эл аралык Аэропорту', en: 'Osh Int Airport' },
        address: 'Северная часть города Ош',
        category: 'transit',
        x: 52,
        y: 18,
        lat: 40.609,
        lng: 72.7933
      },
      {
        id: 'kelechek_bazaar',
        name: { ru: 'Рынок Келечек', kg: 'Келечек базары', en: 'Kelechek Bazaar' },
        address: 'ул. Касымбекова',
        category: 'shopping',
        x: 62,
        y: 55,
        lat: 40.5262,
        lng: 72.8017
      },
      {
        id: 'navoi_park',
        name: { ru: 'Парк им. Навои', kg: 'Навои атындагы эс алуу багы', en: 'Navoi Park' },
        address: 'ул. Ленина',
        category: 'resort',
        x: 48,
        y: 60,
        lat: 40.5276,
        lng: 72.7966
      },
      {
        id: 'osh_stadium',
        name: { ru: 'Стадион им. А. Суюмбаева', kg: 'А. Сүйүмбаев атындагы стадион', en: 'Suyumbaev Stadium' },
        address: 'ул. Ленина 221',
        category: 'landmark',
        x: 38,
        y: 42,
        lat: 40.5179,
        lng: 72.8058
      }
    ]
  },
  {
    id: 'jalal-abad',
    name: { ru: 'Жалал-Абад', kg: 'Жалал-Абад', en: 'Jalal-Abad' },
    regionName: 'Жалал-Абад обл. (04 KG)',
    centerCoordinates: { lat: 40.9333, lng: 72.9833 },
    basePriceMultiplier: 0.88,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'kurort_jalal_abad',
        name: { ru: 'Санаторий Жалал-Абад (Минводы)', kg: 'Жалал-Абад курорту', en: 'Jalal-Abad Mineral Spa' },
        address: 'Гора Аюб-Тоо',
        category: 'resort',
        x: 58,
        y: 35,
        lat: 40.9465,
        lng: 73.0195
      },
      {
        id: 'barpy_theatre',
        name: { ru: 'Театр им. Барпы', kg: 'Барпы атындагы драма театры', en: 'Barpy Drama Theater' },
        address: 'ул. Токтогула 40',
        category: 'landmark',
        x: 48,
        y: 52,
        lat: 40.9339,
        lng: 72.9896
      },
      {
        id: 'toktogul_park',
        name: { ru: 'Парк Токтогул', kg: 'Токтогул паркы', en: 'Toktogul Central Park' },
        address: 'ул. Ленина',
        category: 'resort',
        x: 42,
        y: 48,
        lat: 40.9351,
        lng: 72.9814
      },
      {
        id: 'shabdaly_bazaar',
        name: { ru: 'Центральный базар Шабдалы', kg: 'Борбордук Шабдалы базары', en: 'Central Bazaar' },
        address: 'ул. Ленина / Базарная',
        category: 'shopping',
        x: 52,
        y: 62,
        lat: 40.9278,
        lng: 72.9945
      }
    ]
  },
  {
    id: 'cholpon-ata',
    name: { ru: 'Чолпон-Ата (Иссык-Куль)', kg: 'Чолпон-Ата (Ысык-Көл)', en: 'Cholpon-Ata (Issyk-Kul)' },
    regionName: 'Ысык-Көл обл. (09 KG)',
    centerCoordinates: { lat: 42.65, lng: 77.0833 },
    basePriceMultiplier: 0.95,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'rukh_ordo',
        name: { ru: 'Культурный центр «Рух Ордо»', kg: '«Рух Ордо» маданий борбору', en: 'Rukh Ordo Cultural Center' },
        address: 'ул. Советская, побережье озера',
        category: 'landmark',
        x: 55,
        y: 65,
        lat: 42.6461,
        lng: 77.0942
      },
      {
        id: 'tamchy_airport',
        name: { ru: 'Аэропорт «Иссык-Куль» (Тамчы)', kg: '«Ысык-Көл» (Тамчы) аэропорту', en: 'Issyk-Kul (Tamchy) Airport' },
        address: 'с. Тамчы, трасса А363',
        category: 'transit',
        x: 15,
        y: 35,
        lat: 42.5872,
        lng: 76.7131
      },
      {
        id: 'bosteri_fair',
        name: { ru: 'Бостери (Золотые пески)', kg: 'Бостери («Алтын кумдар»)', en: 'Bosteri Golden Sands' },
        address: 'с. Бостери, северный берег',
        category: 'resort',
        x: 78,
        y: 50,
        lat: 42.6485,
        lng: 77.1912
      },
      {
        id: 'raduga_resort',
        name: { ru: 'Пансионат Радуга (Сары-Ой)', kg: 'Радуга эс алуу жайы (Сары-Ой)', en: 'Raduga Resort Sary-Oi' },
        address: 'с. Сары-Ой, трасса',
        category: 'resort',
        x: 32,
        y: 55,
        lat: 42.6289,
        lng: 76.9532
      },
      {
        id: 'hippodrome',
        name: { ru: 'Ипподром Чолпон-Ата (ВИК)', kg: 'Чолпон-Ата Ат майданы', en: 'Cholpon-Ata Hippodrome' },
        address: 'с. Бактуу-Долоноту',
        category: 'landmark',
        x: 65,
        y: 42,
        lat: 42.6584,
        lng: 77.1361
      }
    ]
  },
  {
    id: 'karakol',
    name: { ru: 'Каракол', kg: 'Каракол', en: 'Karakol' },
    regionName: 'Ысык-Көл обл. (09 KG)',
    centerCoordinates: { lat: 42.49, lng: 78.39 },
    basePriceMultiplier: 0.9,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'ski_karakol',
        name: { ru: 'Горнолыжная база «Каракол»', kg: '«Каракол» тоо лыжа базасы', en: 'Karakol Ski Resort' },
        address: 'Ущелье Каракол, 2300 м',
        category: 'resort',
        x: 68,
        y: 82,
        lat: 42.4087,
        lng: 78.4631
      },
      {
        id: 'dungan_mosque',
        name: { ru: 'Дунганская мечеть', kg: 'Дунган мечити', en: 'Dungan Mosque' },
        address: 'ул. Абдрахманова',
        category: 'landmark',
        x: 48,
        y: 45,
        lat: 42.4876,
        lng: 78.3879
      },
      {
        id: 'karakol_bazaar',
        name: { ru: 'Базар Ак-Тилек (Каракол)', kg: 'Ак-Тилек базары', en: 'Ak-Tilek Central Bazaar' },
        address: 'ул. Торговая',
        category: 'shopping',
        x: 52,
        y: 52,
        lat: 42.4938,
        lng: 78.3947
      }
    ]
  },
  {
    id: 'naryn',
    name: { ru: 'Нарын', kg: 'Нарын', en: 'Naryn' },
    regionName: 'Нарын обл. (05 KG)',
    centerCoordinates: { lat: 41.4286, lng: 75.9911 },
    basePriceMultiplier: 0.85,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'uca_campus',
        name: { ru: 'Кампус УЦА (Университет ЦА)', kg: 'Борбордук Азия Университети (БАУ)', en: 'UCA University Campus' },
        address: 'ул. Ленина 310',
        category: 'landmark',
        x: 62,
        y: 45,
        lat: 41.4302,
        lng: 75.9308
      },
      {
        id: 'naryn_square',
        name: { ru: 'Центральная площадь Нарын', kg: 'Нарын борбордук аянты', en: 'Naryn Central Square' },
        address: 'ул. Ленина',
        category: 'landmark',
        x: 45,
        y: 50,
        lat: 41.4289,
        lng: 75.9991
      }
    ]
  },
  {
    id: 'talas',
    name: { ru: 'Талас', kg: 'Талас', en: 'Talas' },
    regionName: 'Талас обл. (07 KG)',
    centerCoordinates: { lat: 42.5228, lng: 72.2428 },
    basePriceMultiplier: 0.85,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'manas_ordo',
        name: { ru: 'Комплекс «Манас Ордо» (Күмбөз)', kg: '«Манас Ордо» улуттук комплекси', en: 'Manas Ordo National Complex' },
        address: 'с. Таш-Арык',
        category: 'landmark',
        x: 65,
        y: 35,
        lat: 42.5257,
        lng: 72.3712
      },
      {
        id: 'talas_center',
        name: { ru: 'Центр Таласа / ул. Бердике Баатыра', kg: 'Талас борбору', en: 'Talas City Center' },
        address: 'ул. Бердике Баатыра 290',
        category: 'landmark',
        x: 45,
        y: 50,
        lat: 42.5228,
        lng: 72.2428
      }
    ]
  },
  {
    id: 'batken',
    name: { ru: 'Баткен', kg: 'Баткен', en: 'Batken' },
    regionName: 'Баткен обл. (03 KG)',
    centerCoordinates: { lat: 40.0553, lng: 70.8194 },
    basePriceMultiplier: 0.85,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'aigul_too',
        name: { ru: 'Гора Айгүл-Тоо', kg: 'Айгүл-Тоо (Айгүл гүлү)', en: 'Aigul Mountain' },
        address: 'Окрестности города Баткен',
        category: 'landmark',
        x: 60,
        y: 40,
        lat: 40.0365,
        lng: 70.9371
      },
      {
        id: 'batken_airport',
        name: { ru: 'Аэропорт Баткен', kg: 'Баткен аэропорту', en: 'Batken Regional Airport' },
        address: 'Трасса Баткен',
        category: 'transit',
        x: 35,
        y: 45,
        lat: 40.0431,
        lng: 70.8384
      }
    ]
  },
  {
    id: 'intercity',
    name: { ru: 'Межгород (Кыргызстан)', kg: 'Шаар аралык (Кыргызстан)', en: 'Intercity (Kyrgyzstan)' },
    regionName: 'Все регионы КР',
    centerCoordinates: { lat: 41.8, lng: 74.6 },
    basePriceMultiplier: 1.2,
    mapCenter: { x: 50, y: 50 },
    landmarks: [
      {
        id: 'route_bishkek_osh',
        name: { ru: 'Бишкек (Западный автовокзал)', kg: 'Бишкек (Батыш автобекети)', en: 'Bishkek West Bus Station' },
        address: 'пр. Жибек-Жолу 263',
        category: 'transit',
        x: 38,
        y: 35,
        lat: 42.8856,
        lng: 74.5582
      },
      {
        id: 'route_bishkek_issyk_kul',
        name: { ru: 'Чолпон-Ата (Автовокзал)', kg: 'Чолпон-Ата (Автобекет)', en: 'Cholpon-Ata Station' },
        address: 'Боомское ущелье, трасса А365',
        category: 'transit',
        x: 62,
        y: 38,
        lat: 42.6512,
        lng: 77.0846
      },
      {
        id: 'route_bishkek_karakol',
        name: { ru: 'Каракол / ГЛБ Каракол', kg: 'Каракол / Тоо лыжа базасы', en: 'Karakol / Ski Base' },
        address: 'Северное кольцо Ысык-Көл',
        category: 'transit',
        x: 75,
        y: 45,
        lat: 42.4906,
        lng: 78.3936
      },
      {
        id: 'route_osh_center',
        name: { ru: 'Ош (Центральный автовокзал)', kg: 'Ош (Борбордук автобекет)', en: 'Osh Central Station' },
        address: 'Трасса М41 Бишкек - Ош',
        category: 'transit',
        x: 42,
        y: 65,
        lat: 40.5283,
        lng: 72.7985
      }
    ]
  }
];

export const TARIFFS: Tariff[] = [
  {
    id: 'economy',
    name: { ru: 'Эконом', kg: 'Эконом', en: 'Economy' },
    description: { ru: 'Быстро и выгодно на каждый день', kg: 'Күнүмдүк ыңгайлуу сапар', en: 'Everyday affordable rides' },
    carModels: ['Toyota Prius', 'Honda Fit', 'Daewoo Nexia 3', 'Hyundai Solaris'],
    basePrice: 70,
    pricePerKm: 14,
    pricePerMin: 2,
    etaMinutes: 2,
    capacity: 4,
    iconName: 'car'
  },
  {
    id: 'together',
    name: { ru: 'Вместе', kg: 'Бирге (Попутчик)', en: 'Together' },
    description: { ru: 'Поездка с попутчиком со скидкой 30%', kg: 'Жолдош менен арзан сапар (-30%)', en: 'Shared ride (-30%)' },
    carModels: ['Toyota Prius', 'Honda Fit', 'Chevrolet Cobalt'],
    basePrice: 50,
    pricePerKm: 10,
    pricePerMin: 1.5,
    etaMinutes: 3,
    capacity: 2,
    iconName: 'users',
    badge: '-30%'
  },
  {
    id: 'green',
    name: { ru: 'Green · Электро', kg: 'Green · Электро', en: 'Uber Green EV' },
    description: { ru: '100% электромобили без выхлопов (BYD, Zeekr, Tesla)', kg: '100% электрунаалар, таза аба', en: 'Zero-emission electric vehicles' },
    carModels: ['BYD Song Plus EV', 'Zeekr 001', 'Tesla Model 3', 'Honda e:NS1'],
    basePrice: 115,
    pricePerKm: 17,
    pricePerMin: 2.5,
    etaMinutes: 4,
    capacity: 4,
    iconName: 'leaf',
    badge: 'Эко EV'
  },
  {
    id: 'ladies',
    name: { ru: 'Женское такси', kg: 'Айымдар таксиси', en: 'Ladies Taxi' },
    description: { ru: 'За рулём только проверенные женщины-водители', kg: 'Айдоочулар — тажрыйбалуу айымдар гана', en: 'Verified female drivers only' },
    carModels: ['Kia K5', 'Toyota Corolla', 'Hyundai Elantra', 'Honda Fit'],
    basePrice: 105,
    pricePerKm: 17,
    pricePerMin: 2.5,
    etaMinutes: 4,
    capacity: 4,
    iconName: 'shield',
    badge: 'Только женщины'
  },
  {
    id: 'comfort',
    name: { ru: 'Комфорт', kg: 'Комфорт', en: 'Comfort' },
    description: { ru: 'Просторный салон с кондиционером', kg: 'Кенен салон, кондиционер', en: 'Spacious cars with AC' },
    carModels: ['Toyota Camry 50/55', 'Kia K5', 'Hyundai Sonata', 'Skoda Octavia'],
    basePrice: 110,
    pricePerKm: 18,
    pricePerMin: 3,
    etaMinutes: 4,
    capacity: 4,
    iconName: 'zap',
    badge: 'Популярно'
  },
  {
    id: 'comfort_plus',
    name: { ru: 'Комфорт+', kg: 'Комфорт+', en: 'Comfort+' },
    description: { ru: 'Свежие седаны и электромобили', kg: 'Жаңы седандар жана электрунаалар', en: 'Premium sedans & EVs' },
    carModels: ['Toyota Camry 70', 'BYD Song Plus', 'Lexus ES 300h', 'Kia K8'],
    basePrice: 160,
    pricePerKm: 24,
    pricePerMin: 4,
    etaMinutes: 5,
    capacity: 4,
    iconName: 'sparkles'
  },
  {
    id: 'business',
    name: { ru: 'Бизнес', kg: 'Бизнес VIP', en: 'Business' },
    description: { ru: 'Премиальные авто с топ-водителями', kg: 'Премиум класс VIP', en: 'Executive cars' },
    carModels: ['Mercedes-Benz E-Class W213', 'BMW 5-Series G30', 'Toyota Camry 75 VIP'],
    basePrice: 250,
    pricePerKm: 34,
    pricePerMin: 6,
    etaMinutes: 6,
    capacity: 3,
    iconName: 'crown',
    badge: 'VIP'
  },
  {
    id: 'hourly',
    name: { ru: 'Почасовая (Hourly)', kg: 'Сааттык ижара', en: 'Hourly Charter' },
    description: { ru: 'Авто с водителем от 2 до 8 ч · 20 км/ч включено', kg: 'Айдоочу менен 2–8 саат · 20 км/саат', en: 'Chauffeur by the hour · 20 km/h included' },
    carModels: ['Toyota Camry 70', 'Kia K5', 'Hyundai Staria', 'BYD Han EV'],
    basePrice: 650,
    pricePerKm: 0,
    pricePerMin: 0,
    etaMinutes: 5,
    capacity: 4,
    iconName: 'clock',
    badge: '2–8 часов'
  },
  {
    id: 'minivan',
    name: { ru: 'Минивэн (6-7 мест)', kg: 'Минивэн (6-7 орун)', en: 'Minivan (6-7 seats)' },
    description: { ru: 'Для больших компаний и на Иссык-Куль', kg: 'Үй-бүлө жана чоң компаниялар үчүн', en: 'Large families & luggage' },
    carModels: ['Toyota Alphard', 'Honda Stepwgn Spada', 'Toyota Estima'],
    basePrice: 190,
    pricePerKm: 22,
    pricePerMin: 3,
    etaMinutes: 7,
    capacity: 7,
    iconName: 'users',
    badge: '7 мест'
  },
  {
    id: 'cargo',
    name: { ru: 'Грузовой (Портер)', kg: 'Жүк ташуу (Портер)', en: 'Cargo (Porter)' },
    description: { ru: 'Перевозка мебели и грузов с грузчиками', kg: 'Эмерек жана жүктөрдү ташуу', en: 'Cargo van with loaders' },
    carModels: ['Hyundai Porter II', 'Kia Bongo III', 'ГАЗель'],
    basePrice: 380,
    pricePerKm: 28,
    pricePerMin: 4,
    etaMinutes: 10,
    capacity: 2,
    iconName: 'truck',
    badge: 'Грузчики'
  },
  {
    id: 'delivery',
    name: { ru: 'Доставка / Курьер', kg: 'Жеткирүү / Курьер', en: 'Fast Delivery' },
    description: { ru: 'Передача документов и посылок до двери', kg: 'Документ жана посылка жеткирүү', en: 'Door-to-door courier' },
    carModels: ['Курьер на авто / скутере'],
    basePrice: 85,
    pricePerKm: 13,
    pricePerMin: 1.5,
    etaMinutes: 3,
    capacity: 1,
    iconName: 'package'
  },
  {
    id: 'intercity_seat',
    name: { ru: 'Межгород (1 место / салон)', kg: 'Шаар аралык (1 орун же салон)', en: 'Intercity Ride' },
    description: { ru: 'Поездки между городами КР (Ош, Иссык-Куль, Нарын)', kg: 'Кыргызстандын шаарларынын ортосунда', en: 'City-to-city rides across KG' },
    carModels: ['Toyota Alphard VIP', 'Lexus GX470', 'Toyota Camry 70'],
    basePrice: 450,
    pricePerKm: 8,
    pricePerMin: 0.5,
    etaMinutes: 12,
    capacity: 6,
    iconName: 'navigation',
    badge: 'Кыргызстан'
  }
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mbank',
    name: 'MBank / QR',
    description: 'Оплата через MBank или сканирование QR',
    iconType: 'mbank',
    badge: '0% комиссия'
  },
  {
    id: 'odengi',
    name: 'О!Деньги / MegaPay QR',
    description: 'Кошелек Мой О! и мгновенный QR-платеж',
    iconType: 'odengi'
  },
  {
    id: 'elkart',
    name: 'Элкарт / Visa / Master',
    description: 'Банковская карта любого банка КР',
    iconType: 'card'
  },
  {
    id: 'optima',
    name: 'Optima24',
    description: 'Оптима Банк Кыргызстан',
    iconType: 'optima'
  },
  {
    id: 'cash',
    name: 'Наличные',
    description: 'Оплата водителю сомами (сом)',
    iconType: 'cash'
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv_1',
    name: 'Азамат Ибраимов',
    phone: '+996 (555) 12-34-56',
    photoUrl: '',
    carModel: 'Toyota Camry 70 (белый)',
    carColor: 'Белый жемчуг',
    carPlate: '01 KG 789 AGH',
    rating: 4.97,
    totalTrips: 2480,
    position: { x: 45, y: 47 },
    heading: 45,
    gender: 'male'
  },
  {
    id: 'drv_2',
    name: 'Бакытбек Асанов',
    phone: '+996 (700) 88-99-00',
    photoUrl: '',
    carModel: 'Toyota Prius (серебристый)',
    carColor: 'Серебристый',
    carPlate: '01 KG 334 BSK',
    rating: 4.92,
    totalTrips: 1850,
    position: { x: 54, y: 43 },
    heading: 120,
    gender: 'male'
  },
  {
    id: 'drv_3',
    name: 'Нурлан Касымов',
    phone: '+996 (772) 45-67-89',
    photoUrl: '',
    carModel: 'Toyota Alphard (черный VIP)',
    carColor: 'Черный',
    carPlate: '01 KG 007 VIP',
    rating: 4.99,
    totalTrips: 3120,
    position: { x: 38, y: 55 },
    heading: 270,
    gender: 'male'
  },
  {
    id: 'drv_4',
    name: 'Эркин Маматов',
    phone: '+996 (505) 33-22-11',
    photoUrl: '',
    carModel: 'BYD Song Plus EV (серый)',
    carColor: 'Графит',
    carPlate: '02 KG 555 OSH',
    rating: 4.95,
    totalTrips: 1420,
    position: { x: 62, y: 50 },
    heading: 180,
    gender: 'male'
  },
  {
    id: 'drv_5',
    name: 'Руслан Жумабеков',
    phone: '+996 (709) 11-44-77',
    photoUrl: '',
    carModel: 'Mercedes-Benz E-Class W213',
    carColor: 'Черный обсидиан',
    carPlate: '01 KG 999 LUX',
    rating: 4.98,
    totalTrips: 2750,
    position: { x: 42, y: 38 },
    heading: 315,
    gender: 'male'
  }
];

export const FEMALE_DRIVERS: Driver[] = [
  {
    id: 'drv_f1',
    name: 'Асель Токтосунова',
    phone: '+996 (701) 45-22-10',
    photoUrl: '',
    carModel: 'Kia K5 (белый жемчуг)',
    carColor: 'Белый',
    carPlate: '01 KG 412 ADA',
    rating: 4.99,
    totalTrips: 1640,
    position: { x: 47, y: 48 },
    heading: 90,
    gender: 'female'
  },
  {
    id: 'drv_f2',
    name: 'Айгерим Сатыбалдиева',
    phone: '+996 (550) 98-11-34',
    photoUrl: '',
    carModel: 'Hyundai Elantra (серебристый)',
    carColor: 'Серебристый',
    carPlate: '01 KG 820 AID',
    rating: 4.98,
    totalTrips: 1120,
    position: { x: 52, y: 52 },
    heading: 210,
    gender: 'female'
  },
  {
    id: 'drv_f3',
    name: 'Динара Осмонова',
    phone: '+996 (777) 63-40-25',
    photoUrl: '',
    carModel: 'Toyota Corolla Hybrid (серый)',
    carColor: 'Серый',
    carPlate: '01 KG 509 DIN',
    rating: 4.97,
    totalTrips: 930,
    position: { x: 40, y: 56 },
    heading: 30,
    gender: 'female'
  }
];

export const EV_DRIVERS: Driver[] = [
  {
    id: 'drv_ev1',
    name: 'Эркин Маматов',
    phone: '+996 (505) 33-22-11',
    photoUrl: '',
    carModel: 'BYD Song Plus EV (графит)',
    carColor: 'Графит',
    carPlate: '01 KG 555 EVB',
    rating: 4.98,
    totalTrips: 1420,
    position: { x: 58, y: 48 },
    heading: 180,
    gender: 'male'
  },
  {
    id: 'drv_ev2',
    name: 'Тимур Алымкулов',
    phone: '+996 (702) 41-88-90',
    photoUrl: '',
    carModel: 'Zeekr 001 Electric (белый)',
    carColor: 'Белый перламутр',
    carPlate: '01 KG 001 ZKR',
    rating: 4.99,
    totalTrips: 980,
    position: { x: 44, y: 51 },
    heading: 75,
    gender: 'male'
  },
  {
    id: 'drv_ev3',
    name: 'Дастан Бектуров',
    phone: '+996 (551) 66-20-15',
    photoUrl: '',
    carModel: 'Tesla Model 3 Long Range (черный)',
    carColor: 'Черный',
    carPlate: '01 KG 303 TSL',
    rating: 4.97,
    totalTrips: 1190,
    position: { x: 51, y: 40 },
    heading: 240,
    gender: 'male'
  },
  {
    id: 'drv_ev4',
    name: 'Айжан Кадырова',
    phone: '+996 (708) 91-44-05',
    photoUrl: '',
    carModel: 'Honda e:NS1 Electric (серебристый)',
    carColor: 'Серебристый',
    carPlate: '01 KG 818 ECO',
    rating: 4.99,
    totalTrips: 740,
    position: { x: 39, y: 46 },
    heading: 135,
    gender: 'female'
  }
];

export const INTERCITY_ROUTES: IntercityRoute[] = [
  {
    id: 'route_bishkek_osh',
    fromCity: 'Бишкек',
    toCity: 'Ош',
    fromCoords: { lat: 42.8856, lng: 74.5582 },
    toCoords: { lat: 40.5283, lng: 72.7985 },
    distanceKm: 640,
    approxHours: 11.5,
    pricePerSeat: 1300,
    priceFullCar: 5200,
    popularCars: ['Toyota Alphard VIP', 'Lexus GX470', 'Toyota Camry 70'],
    description: 'Через перевал Төө-Ашуу (3,586 м), долину Суусамыр и Токтогул',
    keyPass: 'пер. Төө-Ашуу (3,586 м)',
    category: 'intercity',
    stations: ['Западный автовокзал', 'Ошский рынок (стоянка)', 'мкр. Джал / Магистраль']
  },
  {
    id: 'route_bishkek_cholpon_ata',
    fromCity: 'Бишкек',
    toCity: 'Чолпон-Ата (Ысык-Көл)',
    fromCoords: { lat: 42.8756, lng: 74.6143 },
    toCoords: { lat: 42.6512, lng: 77.0846 },
    distanceKm: 255,
    approxHours: 3.5,
    pricePerSeat: 450,
    priceFullCar: 2000,
    popularCars: ['Toyota Alphard', 'Honda Stepwgn Spada', 'Toyota Camry 55'],
    description: 'Боомское ущелье, северный берег озера Иссык-Куль и пансионаты',
    keyPass: 'Боомское ущелье',
    category: 'resort',
    stations: ['Западный автовокзал', 'ТРЦ Bishkek Park', 'ТЦ Аю Гранд']
  },
  {
    id: 'route_bishkek_karakol_ski',
    fromCity: 'Бишкек',
    toCity: 'Каракол / ГЛБ «Каракол»',
    fromCoords: { lat: 42.8756, lng: 74.6143 },
    toCoords: { lat: 42.4087, lng: 78.4631 },
    distanceKm: 412,
    approxHours: 5.5,
    pricePerSeat: 700,
    priceFullCar: 3000,
    popularCars: ['Toyota Alphard 4WD', 'Lexus LX470', 'Mercedes Sprinter VIP'],
    description: 'Прямой трансфер с креплением для лыж и сноубордов до базы Каракол',
    keyPass: 'Северное кольцо Ысык-Көл',
    category: 'resort',
    stations: ['ТРЦ Bishkek Park', 'ЦУМ Айчүрөк', 'Западный автовокзал']
  },
  {
    id: 'route_bishkek_manas_airport',
    fromCity: 'Бишкек (Центр)',
    toCity: 'Аэропорт «Манас» (FRU)',
    fromCoords: { lat: 42.8765, lng: 74.6037 },
    toCoords: { lat: 43.0612, lng: 74.4776 },
    distanceKm: 29,
    approxHours: 0.6,
    pricePerSeat: 350,
    priceFullCar: 850,
    popularCars: ['Toyota Camry 70', 'BYD Song Plus EV', 'Mercedes E-Class'],
    description: 'Встреча с табличкой, контроль рейса, бесплатное ожидание 30 мин',
    keyPass: 'Трасса Аэропорт Манас',
    category: 'airport',
    stations: ['Площадь Ала-Тоо', 'ТРЦ Asia Mall', 'мкр. Асанбай / Магистраль']
  },
  {
    id: 'route_manas_issyk_kul',
    fromCity: 'Аэропорт «Манас» (FRU)',
    toCity: 'Чолпон-Ата / Бостери',
    fromCoords: { lat: 43.0612, lng: 74.4776 },
    toCoords: { lat: 42.6485, lng: 77.1912 },
    distanceKm: 280,
    approxHours: 4.0,
    pricePerSeat: 650,
    priceFullCar: 2600,
    popularCars: ['Toyota Alphard VIP', 'Toyota Sienna', 'Kia Carnival'],
    description: 'Прямой курортный трансфер сразу из терминала аэропорта на Иссык-Куль',
    keyPass: 'Объездная · Боомское ущелье',
    category: 'airport',
    stations: ['Терминал прилёта FRU (Выход A)', 'VIP-зал Манас']
  },
  {
    id: 'route_osh_jalal_abad',
    fromCity: 'Ош',
    toCity: 'Жалал-Абад',
    fromCoords: { lat: 40.5283, lng: 72.7985 },
    toCoords: { lat: 40.9339, lng: 72.9896 },
    distanceKm: 105,
    approxHours: 1.5,
    pricePerSeat: 250,
    priceFullCar: 1100,
    popularCars: ['Toyota Prius', 'Kia K5', 'Hyundai Sonata'],
    description: 'Быстрый маршрут между южными центрами через Узген',
    keyPass: 'трасса Ош - Жалал-Абад',
    category: 'intercity',
    stations: ['Ош Автовокзал', 'Аэропорт Ош (OSS)']
  },
  {
    id: 'route_bishkek_naryn',
    fromCity: 'Бишкек',
    toCity: 'Нарын',
    fromCoords: { lat: 42.8856, lng: 74.5582 },
    toCoords: { lat: 41.4289, lng: 75.9991 },
    distanceKm: 320,
    approxHours: 4.5,
    pricePerSeat: 600,
    priceFullCar: 2500,
    popularCars: ['Toyota Land Cruiser Prado', 'Toyota Alphard', 'Camry 55'],
    description: 'Через перевал Долон (3,030 м) и долину Кочкор',
    keyPass: 'пер. Долон (3,030 м)',
    category: 'intercity',
    stations: ['Западный автовокзал', 'ТЦ Аю Гранд']
  },
  {
    id: 'route_bishkek_talas',
    fromCity: 'Бишкек',
    toCity: 'Талас',
    fromCoords: { lat: 42.8856, lng: 74.5582 },
    toCoords: { lat: 42.5228, lng: 72.2428 },
    distanceKm: 295,
    approxHours: 4.0,
    pricePerSeat: 500,
    priceFullCar: 2200,
    popularCars: ['Toyota Alphard', 'Toyota Camry 70', 'Honda Stepwgn'],
    description: 'Через перевалы Төө-Ашуу и Өтмөк (3,330 м) в долину Манас Ордо',
    keyPass: 'пер. Өтмөк (3,330 м)',
    category: 'intercity',
    stations: ['Западный автовокзал', 'Ошский рынок']
  }
];

export const INITIAL_FLEET_SETTINGS: FleetCitySetting[] = [
  { cityId: 'bishkek', surgeMultiplier: 1.0, commissionPercent: 12, ladiesModeEnabled: true, biddingEnabled: true },
  { cityId: 'osh', surgeMultiplier: 1.0, commissionPercent: 10, ladiesModeEnabled: true, biddingEnabled: true },
  { cityId: 'jalal-abad', surgeMultiplier: 1.0, commissionPercent: 10, ladiesModeEnabled: true, biddingEnabled: true },
  { cityId: 'cholpon-ata', surgeMultiplier: 1.15, commissionPercent: 11, ladiesModeEnabled: true, biddingEnabled: true },
  { cityId: 'karakol', surgeMultiplier: 1.05, commissionPercent: 10, ladiesModeEnabled: true, biddingEnabled: true },
  { cityId: 'naryn', surgeMultiplier: 1.0, commissionPercent: 9, ladiesModeEnabled: false, biddingEnabled: true },
  { cityId: 'talas', surgeMultiplier: 1.0, commissionPercent: 9, ladiesModeEnabled: false, biddingEnabled: true },
  { cityId: 'batken', surgeMultiplier: 1.0, commissionPercent: 9, ladiesModeEnabled: false, biddingEnabled: true }
];

export const INITIAL_DRIVER_APPLICATIONS: DriverProfile[] = [
  {
    id: 'drv_app_1',
    name: 'Талантбек Эргешов',
    phone: '+996 (702) 44-18-92',
    city: 'bishkek',
    carBrand: 'Kia',
    carModel: 'K5 Hybrid',
    carColor: 'Белый',
    carPlate: '01 KG 512 TAL',
    carYear: 2022,
    licenseNumber: 'KG 88412093',
    gender: 'male',
    verificationStatus: 'pending',
    isVerified: false,
    isOnline: false,
    rating: 5.0,
    totalTrips: 0,
    balanceKgs: 0,
    payoutMbankPhone: '+996 (702) 44-18-92'
  },
  {
    id: 'drv_app_2',
    name: 'Асель Токтосунова',
    phone: '+996 (701) 45-22-10',
    city: 'bishkek',
    carBrand: 'Kia',
    carModel: 'K5',
    carColor: 'Белый жемчуг',
    carPlate: '01 KG 412 ADA',
    carYear: 2021,
    licenseNumber: 'KG 55410287',
    gender: 'female',
    verificationStatus: 'approved',
    isVerified: true,
    isOnline: true,
    rating: 4.99,
    totalTrips: 1640,
    balanceKgs: 6120,
    payoutMbankPhone: '+996 (701) 45-22-10'
  },
  {
    id: 'drv_app_3',
    name: 'Эрмек Султанов',
    phone: '+996 (557) 19-30-77',
    city: 'osh',
    carBrand: 'BYD',
    carModel: 'Song Plus EV',
    carColor: 'Серый',
    carPlate: '02 KG 771 ERM',
    carYear: 2024,
    licenseNumber: 'KG 77903412',
    gender: 'male',
    verificationStatus: 'pending',
    isVerified: false,
    isOnline: false,
    rating: 5.0,
    totalTrips: 0,
    balanceKgs: 0,
    payoutMbankPhone: '+996 (557) 19-30-77'
  }
];

export const INITIAL_PASSENGER_PROFILE: PassengerProfile = {
  id: 'usr_amantur',
  name: 'Амантур Касымов',
  phone: '+996 (555) 77-88-99',
  email: 'mr.amantur@gmail.com',
  avatarUrl: '',
  defaultCity: 'bishkek',
  savedCards: [
    {
      id: 'card_mbank_1',
      cardNumber: '9417 •••• •••• 4521',
      rawCardNumber: '9417 1234 5678 4521',
      expiry: '09/28',
      cardholderName: 'AMANTUR KASYMOV',
      cardType: 'mbank',
      bankName: 'MBank (Коммерческий банк КР)',
      isDefault: true
    },
    {
      id: 'card_elkart_2',
      cardNumber: '9496 •••• •••• 8820',
      rawCardNumber: '9496 9876 5432 8820',
      expiry: '11/27',
      cardholderName: 'AMANTUR KASYMOV',
      cardType: 'elkart',
      bankName: 'Элкарт (ЗАО «МПЦ» КР)',
      isDefault: false
    }
  ],
  safetySettings: {
    emergencyContactName: 'Айзада (Супруга)',
    emergencyContactPhone: '+996 (700) 12-34-56',
    isAudioRecordingEnabled: true,
    safetyPinEnabled: true,
    autoShareTripWithContact: true
  },
  homeAddress: 'мкр. Джал-29, дом 14',
  workAddress: 'пр. Чуй 155 (ЦУМ Айчүрөк)',
  totalCompletedRides: 48,
  safetyRating: 4.98,
  plusPointsBalance: 240,
  familyMembers: [
    {
      id: 'fam_teen_1',
      name: 'Эмир (Сын, 15 лет)',
      phone: '+996 (705) 31-42-88',
      role: 'teen',
      monthlyLimitKgs: 4500,
      requirePin: true,
      liveTracking: true
    }
  ],
  businessProfile: {
    enabled: true,
    companyName: 'ОсОО «Ала-Тоо Тех»',
    inn: '01408201910234',
    corporateEmail: 'finance@alatoo-tech.kg',
    monthlyLimitKgs: 25000,
    activeMode: 'personal'
  }
};

export const INITIAL_DRIVER_PROFILE: DriverProfile = {
  id: 'drv_my_profile',
  name: 'Азамат Ибраимов',
  phone: '+996 (555) 12-34-56',
  city: 'bishkek',
  carBrand: 'Toyota',
  carModel: 'Camry 70',
  carColor: 'Белый жемчуг',
  carPlate: '01 KG 789 AGH',
  carYear: 2021,
  licenseNumber: 'KG 12345678',
  gender: 'male',
  verificationStatus: 'approved',
  isVerified: true,
  isOnline: true,
  rating: 4.97,
  totalTrips: 2480,
  balanceKgs: 4850,
  payoutMbankPhone: '+996 (555) 12-34-56'
};

export const BISHKEK_RESTAURANTS: FoodRestaurant[] = [
  {
    id: 'rest_faiza',
    name: 'Кафе «Фаиза»',
    cuisine: 'Национальная & Дунганская кухня',
    rating: 4.9,
    deliveryTime: '25-35 мин',
    deliveryFee: 120,
    minOrder: 300,
    popularDishes: [
      { id: 'f1', name: 'Лагман жареный (Босо)', price: 290, weight: '450 г', description: 'Тянутая вручную лапша с сочной говядиной и сельдереем' },
      { id: 'f2', name: 'Манты с мясом (5 шт)', price: 260, weight: '400 г', description: 'Традиционные сочные манты с рубленым мясом' },
      { id: 'f3', name: 'Плов Ташкентский', price: 310, weight: '420 г', description: 'Рис лазер, нежная говядина, нут и изюм' }
    ]
  },
  {
    id: 'rest_navvat',
    name: 'Чайхана «Navvat»',
    cuisine: 'Восточная & Шашлыки',
    rating: 4.8,
    deliveryTime: '30-40 мин',
    deliveryFee: 140,
    minOrder: 400,
    popularDishes: [
      { id: 'n1', name: 'Шашлык из баранины', price: 340, weight: '220 г', description: 'Нежная маринованная баранина на углях с луком' },
      { id: 'n2', name: 'Самса тандырная (2 шт)', price: 220, weight: '300 г', description: 'Слоеная горячая самса с говядиной' },
      { id: 'n3', name: 'Шорпо из ягненка', price: 280, weight: '450 мл', description: 'Наваристый прозрачный бульон с овощами' }
    ]
  },
  {
    id: 'rest_dodo',
    name: 'Додо Пицца Бишкек',
    cuisine: 'Пицца, закуски, десерты',
    rating: 4.8,
    deliveryTime: '25-30 мин',
    deliveryFee: 90,
    minOrder: 350,
    popularDishes: [
      { id: 'd1', name: 'Пицца Пепперони (30 см)', price: 545, weight: '560 г', description: 'Пикантная пепперони, моцарелла, томатный соус' },
      { id: 'd2', name: 'Додстер горячий', price: 210, weight: '210 г', description: 'Цыпленок, томаты, моцарелла в лаваше' }
    ]
  },
  {
    id: 'rest_bublik',
    name: 'Кофейня «Бублик»',
    cuisine: 'Завтраки, кофе, бейглы',
    rating: 4.9,
    deliveryTime: '20-30 мин',
    deliveryFee: 110,
    minOrder: 300,
    popularDishes: [
      { id: 'b1', name: 'Бейгл с лососем и крем-чизом', price: 390, weight: '280 г', description: 'Свежеиспеченный бейгл, слабосоленый лосось' },
      { id: 'b2', name: 'Капучино гранде (400 мл)', price: 210, weight: '400 мл', description: 'Классический кофе на зернах 100% арабика' }
    ]
  }
];
