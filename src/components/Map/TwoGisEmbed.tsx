import React, { useState } from 'react';
import { ExternalLink, Search, MapPin, Star } from 'lucide-react';

interface TwoGisEmbedProps {
  onSelectAddress?: (name: string, coords?: { lat: number; lng: number }) => void;
}

export const TwoGisEmbed: React.FC<TwoGisEmbedProps> = ({ onSelectAddress }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const popular2GisPlaces = [
    { name: 'ЦУМ «Айчүрөк»', address: 'пр. Чуй, 155', rating: 4.8, category: 'mall', lat: 42.8756, lng: 74.6143 },
    { name: 'ТРЦ «Asia Mall»', address: 'пр. Чынгыза Айтматова, 3', rating: 4.9, category: 'mall', lat: 42.8553, lng: 74.5866 },
    { name: 'ТРЦ «Bishkek Park»', address: 'ул. Киевская, 148', rating: 4.8, category: 'mall', lat: 42.8748, lng: 74.5908 },
    { name: 'Рынок «Дордой»', address: 'Северная объездная трасса, 1', rating: 4.7, category: 'market', lat: 42.9298, lng: 74.6305 },
    { name: 'Ошский рынок', address: 'ул. Киевская / Бейшеналиевой', rating: 4.5, category: 'market', lat: 42.8751, lng: 74.5689 },
    { name: 'Аэропорт «Манас» (FRU)', address: 'Трасса аэропорта Манас, 25 км', rating: 4.6, category: 'transit', lat: 43.0612, lng: 74.4776 },
    { name: 'Площадь «Ала-Тоо»', address: 'пр. Чуй / бул. Эркиндик', rating: 4.9, category: 'sight', lat: 42.8765, lng: 74.6037 },
    { name: 'Парк «Ынтымак»', address: 'ул. Аалы Токомбаева (Магистраль)', rating: 4.9, category: 'park', lat: 42.8242, lng: 74.5888 },
    { name: 'Навват (Чайхана)', address: 'ул. Ибраимова, 42 / пр. Чуй', rating: 4.9, category: 'food', lat: 42.8750, lng: 74.6180 },
    { name: 'Фаиза (Кафе)', address: 'ул. Жибек Жолу, 555', rating: 4.9, category: 'food', lat: 42.8872, lng: 74.5760 }
  ];

  const filteredPlaces = popular2GisPlaces.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full h-full flex flex-col bg-white text-black overflow-hidden relative">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-white border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10">
        <div>
          <h3 className="font-bold text-sm text-black">2ГИС Бишкек · Справочник адресов</h3>
          <p className="text-xs text-neutral-500">Выберите точку для мгновенной подачи такси</p>
        </div>

        <a
          href="https://2gis.kg/bishkek"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black text-xs font-semibold transition-colors"
        >
          <span>2gis.kg</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Search & Categories */}
      <div className="p-3 bg-[#f6f6f6] border-b border-neutral-200 flex flex-col sm:flex-row gap-2 shrink-0 z-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск в 2ГИС: Asia Mall, Дордой, Навват..."
            className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-xs text-black focus:outline-none focus:border-black placeholder-neutral-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs uber-scroll">
          {[
            { id: 'all', label: 'Все' },
            { id: 'mall', label: 'ТРЦ' },
            { id: 'food', label: 'Кафе' },
            { id: 'market', label: 'Рынки' },
            { id: 'park', label: 'Парки' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-black text-white'
                  : 'bg-white text-neutral-700 hover:text-black border border-neutral-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split Directory & Embedded Map */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        <div className="w-full md:w-80 lg:w-96 bg-white border-r border-neutral-200 p-3 overflow-y-auto uber-scroll space-y-2 shrink-0">
          {filteredPlaces.map((place, idx) => (
            <div
              key={idx}
              className="bg-white border border-neutral-200 hover:border-black rounded-xl p-3 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-black">{place.name}</h4>
                  <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-neutral-600 shrink-0" />
                    <span className="truncate">{place.address}</span>
                  </p>
                </div>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-black shrink-0">
                  <Star className="w-3 h-3 fill-black" />
                  {place.rating}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px]">
                <a
                  href={`https://2gis.kg/bishkek/search/${encodeURIComponent(place.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-black flex items-center gap-1"
                >
                  <span>В 2ГИС</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {onSelectAddress && (
                  <button
                    type="button"
                    onClick={() => onSelectAddress(place.name, { lat: place.lat, lng: place.lng })}
                    className="px-3 py-1 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold transition-colors"
                  >
                    Выбрать адрес
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 relative bg-[#f3f3f3] flex flex-col">
          <iframe
            src="https://2gis.kg/bishkek"
            title="2GIS Bishkek Map"
            className="w-full h-full border-0 min-h-[380px]"
            allow="geolocation"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
