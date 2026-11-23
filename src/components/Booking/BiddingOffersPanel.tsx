import React from 'react';
import { BidOffer } from '../../types/taxi';
import { Star, Plus, Minus, Clock, Check, X, Sparkles } from 'lucide-react';

interface BiddingOffersPanelProps {
  offeredPrice: number;
  recommendedPrice: number;
  pickupName: string;
  destName: string;
  bids: BidOffer[];
  onAdjustOffer: (delta: number) => void;
  onAcceptBid: (bid: BidOffer) => void;
  onDeclineBid: (bidId: string) => void;
  onCancelBidding: () => void;
}

export const BiddingOffersPanel: React.FC<BiddingOffersPanelProps> = ({
  offeredPrice,
  recommendedPrice,
  pickupName,
  destName,
  bids,
  onAdjustOffer,
  onAcceptBid,
  onDeclineBid,
  onCancelBidding
}) => {
  const pendingBids = bids.filter((b) => b.status === 'pending');

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-200">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#276EF1] uppercase tracking-wide">
            <Sparkles className="w-3 h-3" />
            Торг · Своя цена
          </span>
          <h3 className="text-base font-bold text-black mt-0.5">
            Водители смотрят ваш заказ
          </h3>
          <p className="text-xs text-neutral-500 truncate max-w-[270px]">
            {pickupName} → {destName}
          </p>
        </div>
      </div>

      {/* Passenger Offer Adjuster */}
      <div className="bg-[#f6f6f6] rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Ваше предложение</span>
          <span>Рекомендуем: {recommendedPrice} сом</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onAdjustOffer(-20)}
            disabled={offeredPrice <= 50}
            className="w-10 h-10 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 text-black flex items-center justify-center transition-colors"
            title="-20 сом"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="text-2xl font-bold text-black tabular-nums">{offeredPrice} сом</div>
            <div className="text-[11px] text-neutral-500">Поднимите цену для ускорения</div>
          </div>

          <button
            type="button"
            onClick={() => onAdjustOffer(20)}
            className="w-10 h-10 rounded-xl bg-black hover:bg-neutral-800 text-white flex items-center justify-center transition-colors"
            title="+20 сом"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Incoming Driver Offers List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-black">
            Предложения водителей ({pendingBids.length})
          </span>
          <span className="text-neutral-500">Выберите лучший вариант</span>
        </div>

        {pendingBids.length === 0 ? (
          <div className="bg-[#f6f6f6] rounded-xl p-5 text-center space-y-2">
            <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-black rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-neutral-600 font-medium">
              Ожидаем встречные предложения от водителей рядом...
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[290px] overflow-y-auto uber-scroll pr-1">
            {pendingBids.map((bid) => (
              <div
                key={bid.id}
                className="bg-white border-2 border-neutral-200 hover:border-black rounded-xl p-3.5 space-y-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {bid.driverName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-black truncate">
                          {bid.driverName}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-black shrink-0">
                          <Star className="w-3 h-3 fill-black" />
                          {bid.rating}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {bid.carModel} · <span className="font-mono font-semibold text-black">{bid.carPlate}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-black tabular-nums leading-tight">
                      {bid.price} сом
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{bid.etaMinutes} мин</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onDeclineBid(bid.id)}
                    className="flex-1 py-2 rounded-lg bg-[#eeeeee] hover:bg-[#e2e2e2] text-black text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Отклонить</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAcceptBid(bid)}
                    className="flex-[2] py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Принять · {bid.price} сом</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onCancelBidding}
        className="w-full py-2.5 bg-[#eeeeee] hover:bg-[#e2e2e2] text-black font-semibold rounded-xl text-xs transition-colors"
      >
        Отменить поиск
      </button>
    </div>
  );
};
