/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameState,
  ToolDef,
  TOOLS,
  SPECIAL_TOOL,
  createInitialState,
  processHit,
} from './game/logic';
import { sound } from './game/audio';
import { CanvasEngineer } from './game/CanvasEngineer';
import { ToolDock } from './components/ToolDock';
import { GameHUD } from './components/GameHUD';
import {
  TitleScreen,
  PauseModal,
  VictoryModal,
  QuotesModal,
} from './components/Modals';

type AppState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const [appState, setAppState] = useState<AppState>('title');
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(1000));
  const [activeTool, setActiveTool] = useState<ToolDef>(TOOLS[0]);
  const [isSpecialActive, setIsSpecialActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [isQuotesOpen, setIsQuotesOpen] = useState<boolean>(false);

  // Keep state ref for key listeners
  const stateRef = useRef({ appState, activeTool, gameState, isSpecialActive });
  stateRef.current = { appState, activeTool, gameState, isSpecialActive };

  // Sync document.body.dataset.state for Ultra Mode / Playwright automation
  useEffect(() => {
    document.body.dataset.state = appState;
  }, [appState]);

  // Support ?autostart=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setAppState('playing');
    }
  }, []);

  const handleStartGame = useCallback(() => {
    setAppState('playing');
    document.body.dataset.state = 'playing';
  }, []);

  const handlePause = useCallback(() => {
    if (appState === 'playing') {
      setAppState('paused');
    } else if (appState === 'paused') {
      setAppState('playing');
    }
  }, [appState]);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState(1000));
    setIsSpecialActive(false);
    setAppState('playing');
  }, []);

  const handleToggleMute = useCallback(() => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
  }, []);

  // Special Service Mode "СЕРВИСНЫЙ РЕЖИМ МОРДЫ"
  const handleTriggerSpecial = useCallback(() => {
    if (gameState.rage < gameState.maxRage) return;
    setIsSpecialActive(true);
    sound.playSpecial();
    sound.vibrate(200);

    // Apply immediate special hit
    const hitResult = processHit(gameState, SPECIAL_TOOL, performance.now(), true);
    setGameState(hitResult.nextState);

    // End special mode after dramatic burst
    setTimeout(() => {
      setIsSpecialActive(false);
    }, 2500);
  }, [gameState]);

  // Handle hit on engineer
  const handleHit = useCallback(
    (x: number, y: number, isSpecial = false) => {
      if (appState !== 'playing') return;

      const toolToUse = isSpecial ? SPECIAL_TOOL : activeTool;
      const hitResult = processHit(gameState, toolToUse, performance.now());

      // Trigger Web Audio sound
      switch (toolToUse.sound) {
        case 'slap':
          sound.playSlap();
          break;
        case 'wrench':
          sound.playWrench();
          break;
        case 'sledge':
          sound.playSledge();
          break;
        case 'pneumo':
          sound.playPneumo();
          break;
        case 'cleaner':
          sound.playCleaner();
          break;
        case 'gas':
          sound.playGas();
          break;
        case 'part':
          sound.playPart();
          break;
        case 'special':
          sound.playSpecial();
          break;
      }

      // Android haptic vibration
      sound.vibrate(hitResult.vibrationMs);

      // Comic scream / squeak
      if (hitResult.screaming || Math.random() < 0.35) {
        sound.playEngineerYelp(hitResult.isCritical ? 1.3 : 1.0);
      }

      // Check victory / zen
      if (hitResult.nextState.zenAchieved) {
        sound.playVictory();
        setTimeout(() => {
          setAppState('gameover');
        }, 700);
      }

      setGameState(hitResult.nextState);
    },
    [appState, activeTool, gameState]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs if any
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const { appState } = stateRef.current;

      // Start Game
      if ((e.code === 'Space' || e.code === 'Enter') && appState === 'title') {
        e.preventDefault();
        handleStartGame();
        return;
      }

      // Restart on gameover
      if ((e.code === 'Space' || e.code === 'Enter') && appState === 'gameover') {
        e.preventDefault();
        handleRestart();
        return;
      }

      // Pause toggle
      if (e.code === 'Escape' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePause();
        return;
      }

      // Mute toggle
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      // Restart
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRestart();
        return;
      }

      // Tools 1-7
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= TOOLS.length) {
        e.preventDefault();
        setActiveTool(TOOLS[num - 1]);
        setIsSpecialActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartGame, handleRestart, handlePause, handleToggleMute]);

  return (
    <main className="fixed inset-0 w-full h-full flex flex-col bg-slate-950 select-none overflow-hidden touch-none font-sans">
      {/* Top HUD */}
      <GameHUD
        gameState={gameState}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onPause={handlePause}
        onOpenQuotes={() => setIsQuotesOpen(true)}
        onReset={handleRestart}
      />

      {/* Center Interactive Canvas Viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <CanvasEngineer
          gameState={gameState}
          activeTool={activeTool}
          onHit={handleHit}
          isSpecialActive={isSpecialActive}
        />
      </div>

      {/* Bottom Tool Dock */}
      <ToolDock
        activeTool={activeTool}
        onSelectTool={tool => {
          setActiveTool(tool);
          setIsSpecialActive(false);
        }}
        rage={gameState.rage}
        maxRage={gameState.maxRage}
        onTriggerSpecial={handleTriggerSpecial}
        isSpecialActive={isSpecialActive}
      />

      {/* Game Shell Modals */}
      {appState === 'title' && <TitleScreen onStart={handleStartGame} />}

      {appState === 'paused' && (
        <PauseModal
          onResume={() => setAppState('playing')}
          onRestart={handleRestart}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          gameState={gameState}
        />
      )}

      {appState === 'gameover' && (
        <VictoryModal gameState={gameState} onRestart={handleRestart} />
      )}

      {isQuotesOpen && (
        <QuotesModal
          onClose={() => setIsQuotesOpen(false)}
          onPlayQuoteSound={() => sound.playEngineerYelp(1.2)}
        />
      )}
    </main>
  );
}
