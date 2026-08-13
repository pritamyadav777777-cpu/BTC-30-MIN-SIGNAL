"use client";

import { useState } from "react";

export default function Home() {
  const [signal, setSignal] = useState("LONG");

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <div className="max-w-2xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-gray-400 text-sm">DELTA EXCHANGE</p>
            <h1 className="text-3xl font-bold">BTCUSD</h1>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold">$115,250</p>
            <p className="text-green-400">+1.24%</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center mb-5">
          <p className="text-gray-400 text-sm mb-2">
            30 MIN SIGNAL
          </p>

          <h2
            className={`text-5xl font-bold mb-3 ${
              signal === "LONG"
                ? "text-green-400"
                : signal === "SHORT"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {signal}
          </h2>

          <p className="text-gray-400">
            Confidence
          </p>

          <p className="text-3xl font-bold">
            78%
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-500 text-sm">Entry</p>
            <p className="font-bold">$115,250</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-500 text-sm">Stop Loss</p>
            <p className="font-bold text-red-400">$114,700</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-500 text-sm">Target</p>
            <p className="font-bold text-green-400">$116,300</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5">
          <h3 className="text-xl font-bold mb-4">
            Market Analysis
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span>RSI</span>
              <span className="text-green-400">61 🟢</span>
            </div>

            <div className="flex justify-between">
              <span>MACD</span>
              <span className="text-green-400">Bullish 🟢</span>
            </div>

            <div className="flex justify-between">
              <span>EMA 20/50</span>
              <span className="text-green-400">Bullish 🟢</span>
            </div>

            <div className="flex justify-between">
              <span>Volume</span>
              <span className="text-green-400">Strong 🟢</span>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            setSignal(
              signal === "LONG"
                ? "SHORT"
                : signal === "SHORT"
                ? "WAIT"
                : "LONG"
            )
          }
          className="w-full mt-5 bg-white text-black font-bold py-4 rounded-xl"
        >
          Refresh Signal
        </button>

      </div>
    </main>
  );
}
