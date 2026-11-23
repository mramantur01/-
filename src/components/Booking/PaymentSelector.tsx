import React from 'react';
import { PaymentMethod, PaymentMethodId } from '../../types/taxi';
import { CreditCard, Banknote, Check, ShieldCheck } from 'lucide-react';

interface PaymentSelectorProps {
  methods: PaymentMethod[];
  selectedMethod: PaymentMethodId;
  onSelectMethod: (methodId: PaymentMethodId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  methods,
  selectedMethod,
  onSelectMethod,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'mbank':
        return (
          <div className="w-9 h-9 rounded-lg bg-[#05944F]/10 text-[#05944F] font-bold text-xs flex items-center justify-center">
            MB
          </div>
        );
      case 'odengi':
        return (
          <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 font-bold text-xs flex items-center justify-center">
            О!
          </div>
        );
      case 'optima':
        return (
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-600 font-bold text-xs flex items-center justify-center">
            OPT
          </div>
        );
      case 'card':
        return (
          <div className="w-9 h-9 rounded-lg bg-[#f3f3f3] text-black flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        );
      case 'cash':
      default:
        return (
          <div className="w-9 h-9 rounded-lg bg-[#f3f3f3] text-black flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-lg font-bold text-black">Способ оплаты</h3>
            <p className="text-xs text-neutral-500">Платежные сервисы Кыргызстана</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {methods.map((m) => {
            const isSelected = m.id === selectedMethod;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelectMethod(m.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-white border-2 border-black'
                    : 'bg-[#f6f6f6] border-transparent hover:bg-[#eeeeee]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {renderIcon(m.iconType)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-black">{m.name}</span>
                      {m.badge && (
                        <span className="text-[11px] font-semibold text-[#05944F]">
                          · {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">{m.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center pt-1">
          <ShieldCheck className="w-4 h-4 text-[#05944F]" />
          <span>Защищенные платежи по стандартам НБ КР</span>
        </div>
      </div>
    </div>
  );
};
