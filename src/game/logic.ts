/**
 * Pure game rules, scoring, and dialogue logic for VAG Anti-stress.
 * Decoupled from React and DOM for fast deterministic unit testing.
 */

export interface ToolDef {
  id: string;
  name: string;
  subname: string;
  damage: number;
  rageGain: number;
  sound: 'slap' | 'wrench' | 'sledge' | 'pneumo' | 'cleaner' | 'gas' | 'part' | 'special';
  vibrationMs: number;
  iconName: string;
  description: string;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'slap',
    name: 'Лещ от мастера',
    subname: 'Быстрый шлепок',
    damage: 8,
    rageGain: 5,
    sound: 'slap',
    vibrationMs: 30,
    iconName: 'hand',
    description: 'Бодрящий воспитательный хлопок по самодовольному лицу',
  },
  {
    id: 'wrench',
    name: 'Ключ на 10',
    subname: 'Тот самый, найденный',
    damage: 18,
    rageGain: 12,
    sound: 'wrench',
    vibrationMs: 50,
    iconName: 'wrench',
    description: 'Звонкий удар хромованадиевым рожковым ключом',
  },
  {
    id: 'sledge',
    name: 'Кувалда сервисная',
    subname: 'Для запрессовки',
    damage: 40,
    rageGain: 25,
    sound: 'sledge',
    vibrationMs: 120,
    iconName: 'hammer',
    description: 'Когда специнструмент VAG T10355 не помог!',
  },
  {
    id: 'pneumo',
    name: 'Пневмогайковёрт',
    subname: '1400 Нм трещотка',
    damage: 22,
    rageGain: 15,
    sound: 'pneumo',
    vibrationMs: 70,
    iconName: 'zap',
    description: 'Очередь ударов с фонтаном сорванной резьбы и болтов XZN',
  },
  {
    id: 'cleaner',
    name: 'Очиститель тормозов',
    subname: '«Очистос» 500мл',
    damage: 12,
    rageGain: 10,
    sound: 'cleaner',
    vibrationMs: 35,
    iconName: 'spray',
    description: 'Химическая терапия для глаз и самолюбия инженера',
  },
  {
    id: 'gas',
    name: 'Горелка / Автоген',
    subname: '«Греем закисший»',
    damage: 28,
    rageGain: 18,
    sound: 'gas',
    vibrationMs: 80,
    iconName: 'flame',
    description: 'Если не откручивается — превращаем в жидкость!',
  },
  {
    id: 'part',
    name: 'Пластиковый термостат',
    subname: 'В сборе с помпой',
    damage: 32,
    rageGain: 20,
    sound: 'part',
    vibrationMs: 90,
    iconName: 'package',
    description: 'Треснувший пластиковый корпус за 90 тысяч рублей!',
  },
];

export const SPECIAL_TOOL: ToolDef = {
  id: 'special',
  name: 'СЕРВИСНЫЙ РЕЖИМ МОРДЫ!',
  subname: 'Разборка всей передней части',
  damage: 120,
  rageGain: 0,
  sound: 'special',
  vibrationMs: 250,
  iconName: 'alert-triangle',
  description: 'Снимаем бампер, усилитель, три радиатора и фары ради одного датчика!',
};

export const CORE_QUOTES = [
  'Нам всё равно как вы будете это делать, просто "снимите"!!!',
  'Не важно что она из говна и палок, главное по трассе после 140 держит!!!',
  'Если эта деталь выдержит 5 ампер, делаем её на пять ампер! Сделать крепче не позволяет бюджет! Все деньги ушли на устойчивость после 140км/ч!!!',
] as const;

export const ADDITIONAL_QUOTES = [
  'Расход масла 1 литр на 1000 км — это конструктивная особенность, читайте мануал!',
  'Там всего один скрытый болт XZN M10 за подушкой подрамника... нащупайте!',
  'Пластиковый масляный поддон и пластиковая пробка? Das Auto! Инновации!',
  'Чтобы поменять цепь ГРМ, выньте мотор с коробкой! Это всего 48 нормочасов!',
  'Мехатроник DQ200 не сломался, он просто адаптируется к вашему стилю езды!',
  'Зачем вам доступ к свечам без снятия впускного коллектора?! Зато аэродинамика!',
  'Проводка в гофре двери рассчитана ровно на 5 ампер! Ни миллиампером больше!',
  'Термостат в сборе с помпой и датчиками за 95 000 ₽ — зато немецкое качество!',
  'Это не течь масла, это заводская антикоррозийная обработка днища!',
  'Оригинальный специнструмент VAG стоит 1200 евро, закажите из Вольфсбурга!',
  'После 140 км/ч прижимная сила идеальная! А в ремзоне вы как-нибудь сами!',
  'Переведите морду в сервисное положение, делов на пять минут (на самом деле 6 часов)!',
];

export interface GameState {
  mechanicStress: number; // 100 to 0 (Starts at 100 max stress, drops down to 0 zen)
  maxStress: number;
  rage: number; // 0 to 100 (Unlocks ultimate "Сервисный режим")
  maxRage: number;
  totalHits: number;
  combo: number;
  maxCombo: number;
  lastHitTime: number;
  currentQuote: string | null;
  quoteTimer: number; // Duration quote remains visible in seconds
  quotePriority: boolean; // whether current quote is a core quote
  stage: 1 | 2 | 3 | 4; // Damage stage of engineer
  zenAchieved: boolean;
}

export function createInitialState(maxStress = 1000): GameState {
  return {
    mechanicStress: maxStress,
    maxStress,
    rage: 0,
    maxRage: 100,
    totalHits: 0,
    combo: 0,
    maxCombo: 0,
    lastHitTime: 0,
    currentQuote: null,
    quoteTimer: 0,
    quotePriority: false,
    stage: 1,
    zenAchieved: false,
  };
}

export function calculateStage(currentStress: number, maxStress: number): 1 | 2 | 3 | 4 {
  const ratio = currentStress / maxStress;
  if (ratio > 0.75) return 1;
  if (ratio > 0.45) return 2;
  if (ratio > 0.15) return 3;
  return 4;
}

export function pickQuote(hitCount: number, forceCoreQuote = false): { text: string; isCore: boolean } {
  // Guarantee frequent appearance of the 3 user requested quotes!
  // Every 3-5 hits or when forced, pick from core quotes
  if (forceCoreQuote || hitCount % 3 === 0) {
    const idx = Math.floor(Math.random() * CORE_QUOTES.length);
    return { text: CORE_QUOTES[idx], isCore: true };
  }
  const idx = Math.floor(Math.random() * ADDITIONAL_QUOTES.length);
  return { text: ADDITIONAL_QUOTES[idx], isCore: false };
}

export interface HitResult {
  nextState: GameState;
  damageDealt: number;
  isCritical: boolean;
  quoteTriggered: string | null;
  sound: ToolDef['sound'];
  vibrationMs: number;
  screaming: boolean;
}

export function processHit(
  state: GameState,
  tool: ToolDef,
  nowMs: number,
  forceCrit = false
): HitResult {
  const timeSinceLastHit = (nowMs - state.lastHitTime) / 1000;
  const isComboActive = timeSinceLastHit < 2.2;
  const newCombo = isComboActive ? state.combo + 1 : 1;
  const maxCombo = Math.max(state.maxCombo, newCombo);

  // Combo multiplier (from 1.0x up to 2.5x)
  const comboMultiplier = Math.min(2.5, 1.0 + (newCombo - 1) * 0.05);
  const isCritical = forceCrit || Math.random() < 0.18;
  const critMultiplier = isCritical ? 1.6 : 1.0;

  const rawDamage = Math.round(tool.damage * comboMultiplier * critMultiplier);
  const nextStress = Math.max(0, state.mechanicStress - rawDamage);
  const nextStage = calculateStage(nextStress, state.maxStress);

  const nextRage = tool.id === 'special'
    ? 0
    : Math.min(state.maxRage, state.rage + tool.rageGain);

  const newHits = state.totalHits + 1;

  // Decide if engineer shouts a quote (every 4-6 hits or on crits, or when current quote expired)
  let quoteTriggered = state.currentQuote;
  let quoteTimer = Math.max(0, state.quoteTimer - timeSinceLastHit);
  let isCore = state.quotePriority;

  const shouldShout = quoteTimer <= 0 || isCritical || (newHits % 5 === 0) || tool.id === 'special';
  if (shouldShout) {
    const pick = pickQuote(newHits, isCritical || tool.id === 'special');
    quoteTriggered = pick.text;
    quoteTimer = 4.0; // 4 seconds
    isCore = pick.isCore;
  }

  const zenAchieved = nextStress === 0;

  const nextState: GameState = {
    ...state,
    mechanicStress: nextStress,
    rage: nextRage,
    totalHits: newHits,
    combo: newCombo,
    maxCombo,
    lastHitTime: nowMs,
    currentQuote: quoteTriggered,
    quoteTimer,
    quotePriority: isCore,
    stage: nextStage,
    zenAchieved,
  };

  return {
    nextState,
    damageDealt: rawDamage,
    isCritical,
    quoteTriggered: shouldShout ? quoteTriggered : null,
    sound: tool.sound,
    vibrationMs: tool.vibrationMs,
    screaming: shouldShout,
  };
}

export function resetGame(maxStress = 1000): GameState {
  return createInitialState(maxStress);
}
