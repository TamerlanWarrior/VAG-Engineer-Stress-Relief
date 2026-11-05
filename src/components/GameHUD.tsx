import React from 'react';
import { GameState } from '../game/logic';
import { Volume2, VolumeX, Pause, Flame, BookOpen, RotateCcw } from 'lucide-react';

interface GameHUDProps {
  gameState: GameState;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenQuotes: () => void;
  onReset: () => void;
}

const STAGE_LABELS: Record<number, { title: string; shortTitle: string; color: string }> = {
  1: { title: 'Стадия 1: Самодовольный немец', shortTitle: '1: Самодовольный', color: 'text-sky-400 border-sky-500/40 bg-sky-950/60' },
  2: { title: 'Стадия 2: Нервный тик & Пот', shortTitle: '2: Нервный тик', color: 'text-amber-400 border-amber-500/40 bg-amber-950/60' },
  3: { title: 'Стадия 3: Подбитый конструктор', shortTitle: '3: Подбитый', color: 'text-orange-400 border-orange-500/40 bg-orange-950/60' },
  4: { title: 'Стадия 4: Капитуляция & Слезы', shortTitle: '4: Капитуляция', color: 'text-red-400 border-red-500/40 bg-red-950/60' },
};

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  isMuted,
  onToggleMute,
  onPause,
  onOpenQuotes,
  onReset,
}) => {
  const stressPercent = Math.max(0, Math.min(100, (gameState.mechanicStress / gameState.maxStress) * 100));
  const currentStage = STAGE_LABELS[gameState.stage] || STAGE_LABELS[1];

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-700/80 px-2 sm:px-4 py-1.5 sm:py-2 select-none z-20 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Left: Stress Meter & Stage */}
        <div className="flex-1 min-w-0 max-w-xs sm:max-w-md flex flex-col gap-0.5 sm:gap-1">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
            <span className="text-slate-200 font-display flex items-center gap-1 uppercase tracking-wide truncate">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block shrink-0" />
              Стресс мастера:
            </span>
            <span className="font-mono text-amber-400 font-black tabular-nums pl-1">
              {Math.round(stressPercent)}%
            </span>
          </div>

          {/* Stress Progress Bar */}
          <div className="w-full h-2.5 sm:h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                stressPercent > 50
                  ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500'
                  : 'bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400'
              }`}
              style={{ width: `${stressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-[10px] gap-1">
            <span className={`px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded border font-semibold truncate ${currentStage.color}`}>
              <span className="sm:hidden">{currentStage.shortTitle}</span>
              <span className="hidden sm:inline">{currentStage.title}</span>
            </span>
            <span className="text-slate-400 font-mono shrink-0">
              Ударов: <strong className="text-slate-200 font-bold">{gameState.totalHits}</strong>
            </span>
          </div>
        </div>

        {/* Center: Combo Multiplier (if active) */}
        {gameState.combo > 1 && (
          <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/60 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-amber-300 animate-bounce shadow-md shrink-0">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 shrink-0" />
            <span className="font-display font-black text-[11px] sm:text-sm tabular-nums whitespace-nowrap">
              x{gameState.combo}
            </span>
          </div>
        )}

        {/* Right: Controls cluster */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onOpenQuotes}
            title="Все фразы инженера VAG"
            aria-label="Цитаты инженера"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук [M]' : 'Выключить звук [M]'}
            aria-label="Звук"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            title="Сбросить прогресс"
            aria-label="Сброс"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={onPause}
            title="Пауза [P] / [Esc]"
            aria-label="Пауза"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all"
          >
            <Pause className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>
    </header>
  );
};
