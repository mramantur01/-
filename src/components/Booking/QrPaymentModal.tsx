import React, { useState } from 'react';
import { QrCode, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';

interface QrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  tripSummary: string;
  onPaymentConfirmed: (provider: 'mbank' | 'odengi') => void;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  tripSummary,
  onPaymentConfirmed
}) => {
  const [provider, setProvider] = useState<'mbank' | 'odengi' | 'megapay'>('mbank');
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrSeed = `${provider}-${amount}-kgtaxi`;
  const merchantPhone = '+996 555 00-11-22';

  // Deterministic crisp 15x15 QR matrix SVG for visual authenticity
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      const isCorner =
        (x < 4 && y < 4) ||
        (x > 10 && y < 4) ||
        (x < 4 && y > 10);
      if (isCorner) continue;
      const hash = (x * 31 + y * 17 + qrSeed.length * 13 + amount) % 7;
      if (hash === 0 || hash === 2 || hash === 5) {
        cells.push({ x, y });
      }
    }
  }

  const handleConfirm = () => {
    setPaid(true);
    setTimeout(() => {
      onPaymentConfirmed(provider === 'mbank' ? 'mbank' : 'odengi');
      setPaid(false);
      onClose();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">QR-оплата КР</h3>
              <p className="text-[11px] text-neutral-500">Единый ELQR · 0% комиссия</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e5e5e5] text-black text-xs font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Provider Switcher */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#f3f3f3] p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'mbank', label: 'MBank' },
            { id: 'odengi', label: 'О!Деньги' },
            { id: 'megapay', label: 'MegaPay' }
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id as 'mbank' | 'odengi' | 'megapay')}
              className={`py-2 rounded-lg transition-colors ${
                provider === p.id ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Scannable QR Card */}
        <div className="bg-[#f6f6f6] border border-neutral-200 rounded-2xl p-5 flex flex-col items-center gap-3">
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
            <svg viewBox="0 0 150 150" className="w-40 h-40">
              <rect width="150" height="150" fill="#ffffff" />
              {/* Three QR finder corners */}
              {[
                [4, 4],
                [106, 4],
                [4, 106]
              ].map(([cx, cy], idx) => (
                <g key={idx}>
                  <rect x={cx} y={cy} width="38" height="38" rx="4" fill="#000000" />
                  <rect x={cx + 6} y={cy + 6} width="26" height="26" rx="2" fill="#ffffff" />
                  <rect x={cx + 12} y={cy + 12} width="14" height="14" rx="2" fill="#000000" />
                </g>
              ))}
              {cells.map((c, idx) => (
                <rect
                  key={idx}
                  x={c.x * 10 + 2}
                  y={c.y * 10 + 2}
                  width="7.5"
                  height="7.5"
                  rx="1.5"
                  fill="#000000"
                />
              ))}
            </svg>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-black tabular-nums">{amount} сом</div>
            <p className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-[260px]">
              {tripSummary}
            </p>
          </div>

          <div className="w-full flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs">
            <span className="text-neutral-500">Получатель: <strong className="text-black">{merchantPhone}</strong></span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(merchantPhone).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="text-black hover:opacity-75"
              title="Скопировать номер"
            >
              {copied ? <Check className="w-4 h-4 text-[#05944F]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {paid ? (
          <div className="py-3.5 rounded-xl bg-[#05944F] text-white text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Оплата через {provider.toUpperCase()} подтверждена!</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-bold transition-colors"
          >
            Я оплатил(а) {amount} сом
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#05944F]" />
          <span>Стандарт ELQR Национального банка КР</span>
        </div>
      </div>
    </div>
  );
};
