import React from 'react';
import { GameState, CORE_QUOTES, ADDITIONAL_QUOTES } from '../game/logic';
import {
  Play,
  RotateCcw,
  Sparkles,
  Award,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 overflow-y-auto">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative flex flex-col items-center">
        {/* Bespoke inline SVG VAG title lockup */}
        <div className="w-full flex justify-center mb-4">
          <svg viewBox="0 0 380 90" className="w-full max-w-[340px] h-auto">
            <defs>
              <linearGradient id="vagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.6"/>
              </filter>
            </defs>
            {/* Outer badge */}
            <rect x="5" y="5" width="370" height="80" rx="16" fill="url(#vagGrad)" stroke="#67e8f9" strokeWidth="3" filter="url(#shadow)"/>
            {/* Sub banner */}
            <rect x="25" y="14" width="330" height="20" rx="6" fill="#0f172a" fillOpacity="0.8"/>
            <text x="190" y="28" fill="#facc15" fontFamily="'Russo One', sans-serif" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="2">
              ДИЛЕРСКИЙ АНТИСТРЕСС СЕРВИСА
            </text>
            {/* Main title */}
            <text x="190" y="66" fill="#ffffff" fontFamily="'Russo One', Impact, sans-serif" fontSize="30" fontWeight="900" textAnchor="middle" stroke="#000" strokeWidth="1.5">
              БЕЙ ИНЖЕНЕРА VAG!
            </text>
          </svg>
        </div>

        {/* Subtitle / Theme */}
        <p className="text-amber-300 font-display text-sm sm:text-base font-bold mb-4">
          «Главное, чтобы по трассе после 140 держала!»
        </p>

        {/* Caricature teaser box with comic quote */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 text-left relative">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0 text-2xl">
              👨‍🔬
            </div>
            <div>
              <p className="text-xs text-sky-400 font-bold uppercase font-display">
                Херр Инженер Вольфсбург (R&D):
              </p>
              <p className="text-xs sm:text-sm text-slate-200 italic mt-1 font-semibold leading-snug">
                «Если эта деталь выдержит 5 ампер, делаем её на пять ампер! Сделать крепче не позволяет бюджет! Все деньги ушли на устойчивость после 140км/ч!!!»
              </p>
            </div>
          </div>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-3 gap-2 w-full mb-6 text-center text-[11px] text-slate-300 font-medium">
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <span className="text-amber-400 text-base block mb-0.5">🔨</span>
            <span>Кувалда и ключ на 10</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <span className="text-amber-400 text-base block mb-0.5">⚡</span>
            <span>«Сервисный режим»</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <span className="text-amber-400 text-base block mb-0.5">💬</span>
            <span>Крики из ремзоны</span>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onStart}
          data-start="true"
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-display text-lg font-black tracking-wide shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
          <span>НАЧАТЬ ТЕРАПИЮ!</span>
        </button>

        {/* Flat control hint line */}
        <p className="text-[11px] text-slate-400 mt-4 font-mono">
          Тап / Клик · 1-7 Оружие · Пробел / Enter Старт · Esc Пауза
        </p>
      </div>
    </div>
  );
};

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  gameState: GameState;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  isMuted,
  onToggleMute,
  gameState,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="max-w-sm w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl text-center">
        <h2 className="text-2xl font-black font-display text-white mb-2">ПАУЗА В РЕМЗОНЕ</h2>
        <p className="text-xs text-slate-400 mb-4">Инженер переводит дух и ищет специнструмент</p>

        {/* Stats */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6 flex justify-around text-center">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Ударов</span>
            <span className="text-lg font-bold font-mono text-amber-400">{gameState.totalHits}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Макс. комбо</span>
            <span className="text-lg font-bold font-mono text-orange-400">{gameState.maxCombo}x</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Стресс</span>
            <span className="text-lg font-bold font-mono text-sky-400">
              {Math.round((gameState.mechanicStress / gameState.maxStress) * 100)}%
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-sm active:scale-95 transition-all"
          >
            ПРОДОЛЖИТЬ
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Включить звук' : 'Выключить звук'}</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Начать заново</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  gameState: GameState;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ gameState, onRestart }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
      <div className="max-w-md w-full bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center mb-4 text-3xl">
          🧘‍♂️
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-display text-white mb-1">
          ПОЛНЫЙ ДЗЕН!
        </h2>
        <p className="text-emerald-400 font-bold text-sm mb-4 font-display">
          Стресс дилерского механика сведён к 0%!
        </p>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          Инженер Вольфсбурга признал поражение, пообещал ставить нормальные цепи ГРМ,
          не прятать болты за подрамник и рассчитывать проводку минимум на 15 ампер!
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Всего ударов</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{gameState.totalHits}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Рекорд комбо</span>
            <span className="text-xl font-bold font-mono text-amber-400">{gameState.maxCombo}x</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Спасённых нервов</span>
            <span className="text-xl font-bold font-mono text-sky-400">100%</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          data-start="true"
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-display text-base font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>СНЯТЬ СТРЕСС ЕЩЁ РАЗ</span>
        </button>
      </div>
    </div>
  );
};

interface QuotesModalProps {
  onClose: () => void;
  onPlayQuoteSound: () => void;
}

export const QuotesModal: React.FC<QuotesModalProps> = ({ onClose, onPlayQuoteSound }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-display text-white">Золотые цитаты инженера VAG</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <p className="text-xs text-amber-400 font-bold uppercase font-display">
            ★ Главные реплики из Вольфсбурга:
          </p>
          {CORE_QUOTES.map((quote, idx) => (
            <div
              key={idx}
              onClick={onPlayQuoteSound}
              className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 text-xs sm:text-sm text-slate-200 font-medium italic cursor-pointer hover:bg-amber-500/20 transition-all flex items-start gap-2.5"
            >
              <span className="text-amber-400 font-bold text-sm font-mono shrink-0">#{idx + 1}</span>
              <span>«{quote}»</span>
            </div>
          ))}

          <p className="text-xs text-sky-400 font-bold uppercase font-display pt-2">
            ★ Перлы из гарантийной ремзоны:
          </p>
          {ADDITIONAL_QUOTES.map((quote, idx) => (
            <div
              key={idx}
              onClick={onPlayQuoteSound}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 font-medium italic cursor-pointer hover:bg-slate-800 transition-all flex items-start gap-2.5"
            >
              <span className="text-slate-500 font-bold text-xs font-mono shrink-0">•</span>
              <span>«{quote}»</span>
            </div>
          ))}
        </div>

        <div className="pt-4 mt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-display"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
