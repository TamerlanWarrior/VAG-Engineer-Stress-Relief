import React from 'react';
import { TOOLS, SPECIAL_TOOL, ToolDef } from '../game/logic';
import {
  Hand,
  Wrench,
  Hammer,
  Zap,
  Flame,
  Package,
  SprayCan,
  AlertTriangle,
} from 'lucide-react';

interface ToolDockProps {
  activeTool: ToolDef;
  onSelectTool: (tool: ToolDef) => void;
  rage: number;
  maxRage: number;
  onTriggerSpecial: () => void;
  isSpecialActive: boolean;
}

const ICONS: Record<string, React.ReactNode> = {
  hand: <Hand className="w-5 h-5 sm:w-6 sm:h-6" />,
  wrench: <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />,
  hammer: <Hammer className="w-5 h-5 sm:w-6 sm:h-6" />,
  zap: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
  spray: <SprayCan className="w-5 h-5 sm:w-6 sm:h-6" />,
  flame: <Flame className="w-5 h-5 sm:w-6 sm:h-6" />,
  package: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
};

export const ToolDock: React.FC<ToolDockProps> = ({
  activeTool,
  onSelectTool,
  rage,
  maxRage,
  onTriggerSpecial,
  isSpecialActive,
}) => {
  const isSpecialReady = rage >= maxRage;

  return (
    <footer className="w-full bg-slate-900/95 border-t border-slate-700/80 px-2 sm:px-4 py-1.5 sm:py-2.5 select-none shrink-0 z-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-1.5 sm:gap-2">
        {/* Special Move Banner: СЕРВИСНЫЙ РЕЖИМ МОРДЫ */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-950/80 rounded-lg p-1 sm:p-1.5 border border-slate-800 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 whitespace-nowrap pl-1 uppercase font-display">
              Ярость ремзоны:
            </span>
            <div className="flex-1 h-3 sm:h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isSpecialReady
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 animate-pulse'
                    : 'bg-gradient-to-r from-sky-500 to-amber-500'
                }`}
                style={{ width: `${Math.min(100, (rage / maxRage) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-300 font-bold pr-1 tabular-nums">
              {Math.round(rage)}%
            </span>
          </div>

          <button
            type="button"
            onClick={onTriggerSpecial}
            disabled={!isSpecialReady}
            data-testid="special-mode-button"
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-display text-[11px] sm:text-sm font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap ${
              isSpecialActive
                ? 'bg-red-600 text-white ring-4 ring-red-500 animate-bounce'
                : isSpecialReady
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-red-500/30 hover:scale-105 cursor-pointer animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
            <span>СЕРВИСНЫЙ РЕЖИМ!</span>
          </button>
        </div>

        {/* Tools row (Android Touch & Desktop keyboard 1-7) */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar touch-pan-x justify-start sm:justify-center">
          {TOOLS.map((tool, index) => {
            const isSelected = activeTool.id === tool.id && !isSpecialActive;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool)}
                data-testid={`tool-button-${tool.id}`}
                className={`shrink-0 min-w-[72px] sm:min-w-[85px] max-w-[120px] flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl border transition-all text-center active:scale-90 ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/60 scale-[1.02]'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <div className="relative mb-0.5">
                  <span className="text-slate-200">
                    {ICONS[tool.iconName] || <Wrench className="w-5 h-5" />}
                  </span>
                  <span className="absolute -top-1 -right-2 text-[9px] font-mono font-bold bg-slate-900 border border-slate-700 rounded px-1 text-slate-400">
                    {index + 1}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold leading-tight truncate w-full font-display">
                  {tool.name}
                </span>
                <span className="text-[9px] text-amber-400 font-mono mt-0.5 font-bold">
                  Урон {tool.damage}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
