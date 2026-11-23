import React, { useState } from 'react';
import { FoodRestaurant, FoodDish, Language } from '../../types/taxi';
import { BISHKEK_RESTAURANTS } from '../../data/kyrgyzstanData';
import { Utensils, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

interface FoodDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderDelivery: (
    restaurant: FoodRestaurant,
    cart: Array<{ dish: FoodDish; count: number }>,
    total: number
  ) => void;
  lang: Language;
}

export const FoodDeliveryModal: React.FC<FoodDeliveryModalProps> = ({
  isOpen,
  onClose,
  onOrderDelivery
}) => {
  const [selectedRest, setSelectedRest] = useState<FoodRestaurant>(BISHKEK_RESTAURANTS[0]);
  const [cart, setCart] = useState<Record<string, number>>({ f1: 1, f2: 1 });
  const [orderDone, setOrderDone] = useState(false);

  if (!isOpen) return null;

  const updateDishCount = (dishId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[dishId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return { ...prev, [dishId]: next };
    });
  };

  const dishesTotal = selectedRest.popularDishes.reduce((sum, d) => {
    const count = cart[d.id] || 0;
    return sum + d.price * count;
  }, 0);

  const grandTotal = dishesTotal > 0 ? dishesTotal + selectedRest.deliveryFee : 0;

  const handleConfirm = () => {
    if (dishesTotal === 0) return;

    const items = selectedRest.popularDishes
      .filter((d) => (cart[d.id] || 0) > 0)
      .map((d) => ({ dish: d, count: cart[d.id] }));

    setOrderDone(true);
    setTimeout(() => {
      onOrderDelivery(selectedRest, items, grandTotal);
      setOrderDone(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Uber Eats Style Header */}
        <div className="p-5 bg-white border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black">
                KG Eats · Доставка еды (Бишкек)
              </h3>
              <p className="text-xs text-neutral-500">
                Популярные заведения города · Быстрая курьерская доставка
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Restaurants Tabs */}
        <div className="flex items-center gap-2 p-3 bg-[#f6f6f6] border-b border-neutral-200 overflow-x-auto uber-scroll shrink-0">
          {BISHKEK_RESTAURANTS.map((rest) => {
            const isSelected = selectedRest.id === rest.id;
            return (
              <button
                key={rest.id}
                type="button"
                onClick={() => {
                  setSelectedRest(rest);
                  setCart({});
                }}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                <span>{rest.name}</span>
                <span className={isSelected ? 'text-neutral-300' : 'text-neutral-500'}>
                  ★ {rest.rating}
                </span>
              </button>
            );
          })}
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto uber-scroll p-5 space-y-4">
          <div className="flex items-center justify-between text-xs bg-[#f6f6f6] p-3.5 rounded-xl">
            <div>
              <span className="font-bold text-black text-sm block">{selectedRest.name}</span>
              <span className="text-neutral-500">{selectedRest.cuisine}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 block">Доставка</span>
              <span className="font-bold text-black">
                {selectedRest.deliveryFee} сом · {selectedRest.deliveryTime}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {selectedRest.popularDishes.map((dish) => {
              const count = cart[dish.id] || 0;
              return (
                <div
                  key={dish.id}
                  className="bg-white border border-neutral-200 hover:border-black rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h4 className="font-bold text-sm text-black">{dish.name}</h4>
                      <span className="text-xs text-neutral-500">{dish.weight}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                      {dish.description}
                    </p>
                    <span className="text-sm font-bold text-black mt-1 block tabular-nums">
                      {dish.price} сом
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {count > 0 ? (
                      <div className="flex items-center gap-2 bg-[#f3f3f3] p-1 rounded-full">
                        <button
                          type="button"
                          onClick={() => updateDishCount(dish.id, -1)}
                          className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs text-black tabular-nums">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateDishCount(dish.id, 1)}
                          className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateDishCount(dish.id, 1)}
                        className="px-3.5 py-1.5 bg-[#f3f3f3] hover:bg-black hover:text-white text-black text-xs font-semibold rounded-full transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checkout Footer */}
        <div className="p-5 bg-white border-t border-neutral-200 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs">
            <span className="text-neutral-500 block">Итого с доставкой</span>
            <span className="text-lg font-bold text-black tabular-nums">{grandTotal} сом</span>
          </div>

          {orderDone ? (
            <div className="px-6 py-3 bg-[#05944F] text-white font-bold rounded-xl text-xs flex items-center gap-1.5">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Заказ принят! Курьер выехал</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={dishesTotal === 0}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${
                dishesTotal > 0
                  ? 'bg-black hover:bg-neutral-800 text-white'
                  : 'bg-[#eeeeee] text-neutral-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Оформить заказ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
