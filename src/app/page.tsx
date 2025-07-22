'use client';

import { useState } from 'react';
import Link from 'next/link';

type CoinSide = 'heads' | 'tails';


export default function QuantumCoinFlip() {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<CoinSide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flipHistory, setFlipHistory] = useState<CoinSide[]>([]);
  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);
  const [lastUsedApi, setLastUsedApi] = useState<string>('');

  const flipCoin = async () => {
    if (isFlipping) return;

    setIsFlipping(true);
    setError(null);
    setResult(null);

    try {
      let randomNum: number;
      let apiUsed = '';
      
      // Try quantum APIs in order of preference
      try {
        // Primary: ANU Binary Stream (no rate limits!)
        const binaryResponse = await fetch('https://qrng.anu.edu.au/wp-content/plugins/colours-plugin/get_one_binary.php', {
          signal: AbortSignal.timeout(8000)
        });
        
        if (binaryResponse.ok) {
          const binaryData = await binaryResponse.text();
          if (binaryData && binaryData.length === 8 && /^[01]+$/.test(binaryData)) {
            // Convert binary string to decimal (0-255)
            randomNum = parseInt(binaryData, 2);
            apiUsed = 'ANU Binary Stream';
            setLastUsedApi('ANU_BINARY');
          } else {
            throw new Error('Invalid binary response');
          }
        } else {
          throw new Error('ANU Binary API failed');
        }
      } catch {
        // Fallback 1: ANU JSON API (with rate limits)
        try {
          const anuResponse = await fetch('https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint8', {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000)
          });
          
          if (anuResponse.ok) {
            const anuData = await anuResponse.json();
            if (anuData.success && anuData.data && anuData.data.length > 0) {
              randomNum = anuData.data[0];
              apiUsed = 'ANU QRNG (fallback)';
              setLastUsedApi('ANU');
            } else {
              throw new Error('Invalid ANU response');
            }
          } else {
            // Check for rate limit error
            if (anuResponse.status === 500) {
              const errorText = await anuResponse.text();
              if (errorText.includes('1 requests per minute')) {
                throw new Error('RATE_LIMIT');
              }
            }
            throw new Error('ANU API failed');
          }
        } catch (anuError) {
          // If it's a rate limit error, throw it immediately
          if (anuError instanceof Error && anuError.message === 'RATE_LIMIT') {
            throw anuError;
          }
        
          // Fallback 2: LfD QRNG (via server-side API to avoid CORS)
          try {
            const lfdResponse = await fetch('/api/quantum-random?source=lfd', {
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(8000)
            });
            
            if (lfdResponse.ok) {
              const lfdData = await lfdResponse.json();
              if (lfdData.success && lfdData.data && lfdData.data.length > 0) {
                randomNum = lfdData.data[0];
                apiUsed = 'LfD QRNG (fallback)';
                setLastUsedApi('LfD');
              } else {
                throw new Error('Invalid LfD response');
              }
            } else {
              throw new Error('LfD API failed');
            }
          } catch {
            throw new Error('Все квантовые API недоступны');
          }
        }
      }

      // Use the quantum random number to determine heads or tails
      const coinResult: CoinSide = randomNum % 2 === 0 ? 'heads' : 'tails';
      
      // Store which API was used for display
      console.log(`Quantum number generated using: ${apiUsed}`);
      
      // Simulate coin flip animation delay
      setTimeout(() => {
        setResult(coinResult);
        setFlipHistory(prev => [coinResult, ...prev.slice(0, 9)]); // Keep last 10 flips
        setIsFlipping(false);
      }, 2000);
      
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMIT') {
        setError('Превышен лимит запросов (1 в минуту). Повторите попытку через:');
        setRateLimitTimer(60);
        
        // Start countdown timer
        const timer = setInterval(() => {
          setRateLimitTimer(prev => {
            if (prev && prev > 1) {
              return prev - 1;
            } else {
              setError(null);
              clearInterval(timer);
              return null;
            }
          });
        }, 1000);
      } else {
        setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
      }
      setIsFlipping(false);
    }
  };

  const getStats = () => {
    const recent = flipHistory.slice(0, 10); // Only use last 10 flips for stats
    const heads = recent.filter(flip => flip === 'heads').length;
    const tails = recent.filter(flip => flip === 'tails').length;
    return { heads, tails, total: recent.length };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col">
      {/* Navigation */}
      <nav className="p-4">
        <div className="flex gap-4">
          <Link 
            href="/magic-ball" 
            className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            🎱 Магический Шар (Three.js)
          </Link>
          <Link 
            href="/babylon-ball" 
            className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            🎱 Babylon.js версия
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Квантовое Подбрасывание Монеты
        </h1>
        <p className="text-white/80 text-sm mb-8">
          Основано на настоящей квантовой случайности от АНУ
        </p>

        {/* Coin Display */}
        <div className="mb-8 flex justify-center">
          <div 
            className={`w-32 h-32 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-lg flex items-center justify-center text-2xl font-bold transition-all duration-500 ${
              isFlipping 
                ? 'animate-spin' 
                : result 
                  ? 'scale-110 shadow-yellow-400/50 shadow-2xl' 
                  : 'hover:scale-105'
            }`}
          >
            {isFlipping ? (
              <div className="text-yellow-800">?</div>
            ) : result ? (
              <div className="text-yellow-800">
                {result === 'heads' ? '👑' : '🏛️'}
              </div>
            ) : (
              <div className="text-yellow-800">₿</div>
            )}
          </div>
        </div>

        {/* Result Display */}
        {result && !isFlipping && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {result === 'heads' ? 'Орёл!' : 'Решка!'}
            </h2>
            <p className="text-white/70 text-sm">
              Результат квантового измерения: {result === 'heads' ? 'орёл' : 'решка'}
            </p>
            <p className="text-white/50 text-xs mt-1">
              Источник энтропии: Квантовый генератор случайных чисел
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">
              {error}
              {rateLimitTimer && (
                <span className="block mt-1 font-mono text-lg text-red-200">
                  {rateLimitTimer} сек
                </span>
              )}
            </p>
          </div>
        )}

        {/* Flip Button */}
        <button
          onClick={flipCoin}
          disabled={isFlipping || rateLimitTimer !== null}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
            isFlipping || rateLimitTimer !== null
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isFlipping ? 'Подбрасываю...' : rateLimitTimer ? `Ожидание ${rateLimitTimer}с` : 'Подбросить Квантовую Монету'}
        </button>

        {/* Statistics */}
        {flipHistory.length > 0 && (
          <div className="mt-8 bg-white/5 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Статистика (Последние {stats.total} подбрасываний)</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl">👑</div>
                <div className="text-white">{stats.heads}</div>
                <div className="text-white/60">Орёл</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">🏛️</div>
                <div className="text-white">{stats.tails}</div>
                <div className="text-white/60">Решка</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">📊</div>
                <div className="text-white">
                  {stats.total > 0 ? Math.round((stats.heads / stats.total) * 100) : 0}%
                </div>
                <div className="text-white/60">Орёл</div>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {flipHistory.length > 0 && (
          <div className="mt-4">
            <h4 className="text-white/80 text-sm mb-2">Последние подбрасывания:</h4>
            <div className="flex justify-center space-x-1 flex-wrap">
              {flipHistory.slice(0, 10).map((flip, index) => (
                <span 
                  key={index} 
                  className="text-lg"
                  title={flip}
                >
                  {flip === 'heads' ? '👑' : '🏛️'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10">
          {lastUsedApi && (
            <p className="text-white/60 text-xs">
              {lastUsedApi === 'ANU_BINARY' 
                ? 'Использован квантовый поток АНУ (бинарные данные)'
                : lastUsedApi === 'ANU' 
                ? 'Использован квантовый генератор АНУ (JSON API)'
                : lastUsedApi === 'LfD'
                ? 'Использован квантовый генератор LfD Quantum Lab (ID Quantique QRNG)'
                : 'Использован внешний квантовый генератор случайных чисел'
              }
            </p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
