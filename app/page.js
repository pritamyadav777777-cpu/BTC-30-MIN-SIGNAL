"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const response = await fetch("/api/btc", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!result.success || !result.candles?.length) {
        throw new Error("No BTC market data received");
      }

      // Delta can return newest first.
      // Sort oldest -> newest for correct indicator calculations.
      const candles = [...result.candles].sort(
        (a, b) => Number(a.time) - Number(b.time)
      );

      const latest = candles[candles.length - 1];
      const previous = candles[candles.length - 2];

      const closes = candles.map((c) => Number(c.close));
      const highs = candles.map((c) => Number(c.high));
      const lows = candles.map((c) => Number(c.low));
      const volumes = candles.map((c) => Number(c.volume));

      const price = Number(latest.close);
      const previousPrice = Number(previous.close);

      const ema20 = calculateEMA(closes, 20);
      const ema50 = calculateEMA(closes, 50);

      const rsi = calculateRSI(closes, 14);

      const macdData = calculateMACD(closes);

      const atr = calculateATR(
        highs,
        lows,
        closes,
        14
      );

      const priceChange =
        ((price - previousPrice) / previousPrice) * 100;

      const currentVolume = Number(latest.volume);

      const recentVolumes = volumes.slice(
        Math.max(0, volumes.length - 21),
        volumes.length - 1
      );

      const averageVolume =
        recentVolumes.length > 0
          ? recentVolumes.reduce(
              (sum, value) => sum + value,
              0
            ) / recentVolumes.length
          : currentVolume;

      const volumeRatio =
        averageVolume > 0
          ? currentVolume / averageVolume
          : 1;

      const volumeStrong = volumeRatio >= 1.2;

      /*
        ============================
        SIGNAL SCORING
        ============================

        Starting score = 50

        EMA       +/- 25
        RSI       +/- 20
        MACD      +/- 20
        Candle    +/- 15
        Volume    +/- 10
        Momentum  +/- 10

        Final = 0 - 100
      */

      let score = 50;

      // EMA trend
      if (ema20 > ema50) {
        score += 25;
      } else {
        score -= 25;
      }

      // RSI
      if (rsi >= 55 && rsi < 68) {
        score += 20;
      } else if (rsi >= 50 && rsi < 55) {
        score += 10;
      } else if (rsi >= 68 && rsi < 75) {
        score += 5;
      } else if (rsi >= 75) {
        score -= 10;
      } else if (rsi <= 45 && rsi > 30) {
        score -= 15;
      } else if (rsi <= 30) {
        score += 5;
      }

      // MACD
      if (macdData.histogram > 0) {
        score += 20;
      } else {
        score -= 20;
      }

      // Current candle direction
      if (price > Number(latest.open)) {
        score += 15;
      } else if (price < Number(latest.open)) {
        score -= 15;
      }

      // Volume confirmation
      if (volumeStrong) {
        if (price > Number(latest.open)) {
          score += 10;
        } else {
          score -= 10;
        }
      }

      // Short-term momentum
      if (priceChange > 0) {
        score += 10;
      } else if (priceChange < 0) {
        score -= 10;
      }

      score = Math.max(
        0,
        Math.min(100, Math.round(score))
      );

      // Signal
      let signal = "WAIT";

      if (score >= 65) {
        signal = "LONG";
      } else if (score <= 35) {
        signal = "SHORT";
      }

      /*
        Confidence here means
        "signal strength", NOT probability
        of winning a trade.
      */

      let confidence;

      if (signal === "WAIT") {
        confidence = Math.round(
          55 + Math.abs(score - 50) * 0.5
        );
      } else {
        confidence = score;
      }

      confidence = Math.max(
        50,
        Math.min(95, confidence)
      );

      /*
        ============================
        ATR TRADE LEVELS
        ============================
      */

      let entry = price;
      let stopLoss = null;
      let target1 = null;
      let target2 = null;

      if (signal === "LONG") {
        stopLoss = price - atr * 1.0;
        target1 = price + atr * 1.5;
        target2 = price + atr * 2.2;
      }

      if (signal === "SHORT") {
        stopLoss = price + atr * 1.0;
        target1 = price - atr * 1.5;
        target2 = price - atr * 2.2;
      }

      const risk =
        stopLoss !== null
          ? Math.abs(entry - stopLoss)
          : 0;

      const reward =
        target1 !== null
          ? Math.abs(target1 - entry)
          : 0;

      const riskReward =
        risk > 0
          ? reward / risk
          : 0;

      setData({
        price,
        priceChange,

        candle: latest,

        ema20,
        ema50,

        rsi,

        macd: macdData.macd,
        macdSignal: macdData.signal,
        macdHistogram: macdData.histogram,

        atr,

        volume: currentVolume,
        averageVolume,
        volumeRatio,
        volumeStrong,

        signal,
        score,
        confidence,

        entry,
        stopLoss,
        target1,
        target2,
        riskReward,

        updated: new Date(),
      });

      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(
      loadData,
      60000
    );

    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          Loading BTC market data...
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          <h2>Unable to load BTC data</h2>

          <p>{error}</p>

          <button
            onClick={loadData}
            style={styles.button}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const signalColor =
    data.signal === "LONG"
      ? "#22c55e"
      : data.signal === "SHORT"
      ? "#ef4444"
      : "#f59e0b";

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <header style={styles.header}>
          <div>
            <div style={styles.exchange}>
              DELTA EXCHANGE
            </div>

            <h1 style={styles.title}>
              BTCUSD
            </h1>
          </div>

          <div style={styles.live}>
            <span style={styles.liveDot}></span>
            LIVE
          </div>
        </header>

        {/* PRICE */}

        <section style={styles.priceBox}>
          <div>
            <div style={styles.price}>
              ${formatPrice(data.price)}
            </div>

            <div
              style={{
                ...styles.positive,
                color:
                  data.priceChange >= 0
                    ? "#22c55e"
                    : "#ef4444",
              }}
            >
              {data.priceChange >= 0
                ? "+"
                : ""}
              {data.priceChange.toFixed(3)}%
              {" "}from previous 30M
            </div>
          </div>

          <div style={styles.timeframe}>
            30M
          </div>
        </section>

        {/* SIGNAL */}

        <section style={styles.signalCard}>
          <div style={styles.smallTitle}>
            BTC 30 MIN SIGNAL
          </div>

          <div
            style={{
              ...styles.signal,
              color: signalColor,
            }}
          >
            {data.signal}
          </div>

          <div style={styles.confidenceText}>
            Signal Strength
          </div>

          <div style={styles.confidence}>
            {data.confidence}%
          </div>

          <div style={styles.progressBackground}>
            <div
              style={{
                ...styles.progress,
                width: `${data.confidence}%`,
                background: signalColor,
              }}
            />
          </div>

          <div style={styles.score}>
            Score: {data.score}/100
          </div>
        </section>

        {/* TRADE LEVELS */}

        <section style={styles.grid}>

          <div style={styles.box}>
            <div style={styles.label}>
              ENTRY
            </div>

            <div style={styles.value}>
              ${formatPrice(data.entry)}
            </div>
          </div>

          <div style={styles.box}>
            <div style={styles.label}>
              STOP LOSS
            </div>

            <div
              style={{
                ...styles.value,
                color: "#ef4444",
              }}
            >
              {data.stopLoss
                ? `$${formatPrice(data.stopLoss)}`
                : "--"}
            </div>
          </div>

          <div style={styles.box}>
            <div style={styles.label}>
              TARGET 1
            </div>

            <div
              style={{
                ...styles.value,
                color: "#22c55e",
              }}
            >
              {data.target1
                ? `$${formatPrice(data.target1)}`
                : "--"}
            </div>
          </div>

        </section>

        {/* TARGET 2 / RR */}

        <section style={styles.card}>
          <div style={styles.extraGrid}>

            <div>
              <div style={styles.label}>
                TARGET 2
              </div>

              <div
                style={{
                  ...styles.bigValue,
                  color: "#22c55e",
                }}
              >
                {data.target2
                  ? `$${formatPrice(data.target2)}`
                  : "--"}
              </div>
            </div>

            <div>
              <div style={styles.label}>
                RISK / REWARD
              </div>

              <div style={styles.bigValue}>
                {data.riskReward
                  ? `1 : ${data.riskReward.toFixed(2)}`
                  : "--"}
              </div>
            </div>

            <div>
              <div style={styles.label}>
                ATR
              </div>

              <div style={styles.bigValue}>
                ${formatPrice(data.atr)}
              </div>
            </div>

          </div>
        </section>

        {/* MARKET ANALYSIS */}

        <section style={styles.card}>

          <div style={styles.cardTitle}>
            Market Analysis
          </div>

          <AnalysisRow
            name="RSI"
            value={data.rsi.toFixed(2)}
            status={getRSIStatus(data.rsi)}
            good={data.rsi >= 50 && data.rsi < 70}
          />

          <AnalysisRow
            name="EMA 20 / 50"
            value={
              data.ema20 > data.ema50
                ? "EMA20 > EMA50"
                : "EMA20 < EMA50"
            }
            status={
              data.ema20 > data.ema50
                ? "BULL"
                : "BEAR"
            }
            good={data.ema20 > data.ema50}
          />

          <AnalysisRow
            name="MACD"
            value={data.macd.toFixed(2)}
            status={
              data.macdHistogram > 0
                ? "Bullish"
                : "Bearish"
            }
            good={data.macdHistogram > 0}
          />

          <AnalysisRow
            name="Volume"
            value={`${data.volumeRatio.toFixed(2)}x average`}
            status={
              data.volumeStrong
                ? "STRONG"
                : "NORMAL"
            }
            good={data.volumeStrong}
          />

          <AnalysisRow
            name="30M Candle"
            value={
              data.price >
              Number(data.candle.open)
                ? "Bullish"
                : "Bearish"
            }
            status={
              data.price >
              Number(data.candle.open)
                ? "UP"
                : "DOWN"
            }
            good={
              data.price >
              Number(data.candle.open)
            }
          />

        </section>

        {/* SIGNAL EXPLANATION */}

        <section style={styles.card}>

          <div style={styles.cardTitle}>
            Signal Explanation
          </div>

          <Reason
            good={data.ema20 > data.ema50}
            text="EMA 20 / 50 trend"
          />

          <Reason
            good={
              data.rsi >= 50 &&
              data.rsi < 70
            }
            text="RSI momentum"
          />

          <Reason
            good={
              data.macdHistogram > 0
            }
            text="MACD momentum"
          />

          <Reason
            good={
              data.price >
              Number(data.candle.open)
            }
            text="Current 30M candle direction"
          />

          <Reason
            good={data.volumeStrong}
            text="Volume confirmation"
          />

        </section>

        {/* REFRESH */}

        <button
          onClick={loadData}
          style={styles.button}
          disabled={loading}
        >
          {loading
            ? "Updating..."
            : "↻ Refresh Market Data"}
        </button>

        <div style={styles.updated}>
          Last updated:{" "}
          {data.updated.toLocaleTimeString()}
        </div>

        <div style={styles.disclaimer}>
          Signal strength is an algorithmic
          estimate, not a guaranteed probability.
          Not financial advice.
        </div>

      </div>
    </main>
  );
}


/* =========================
   EMA
========================= */

function calculateEMA(values, period) {
  if (values.length < period) {
    return values[values.length - 1];
  }

  const multiplier =
    2 / (period + 1);

  let ema =
    values
      .slice(0, period)
      .reduce(
        (sum, value) => sum + value,
        0
      ) / period;

  for (
    let i = period;
    i < values.length;
    i++
  ) {
    ema =
      (values[i] - ema) *
        multiplier +
      ema;
  }

  return ema;
}


/* =========================
   RSI
========================= */

function calculateRSI(values, period) {
  if (values.length <= period) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change =
      values[i] - values[i - 1];

    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let averageGain =
    gains / period;

  let averageLoss =
    losses / period;

  for (
    let i = period + 1;
    i < values.length;
    i++
  ) {
    const change =
      values[i] - values[i - 1];

    const gain =
      change > 0 ? change : 0;

    const loss =
      change < 0
        ? Math.abs(change)
        : 0;

    averageGain =
      (averageGain *
        (period - 1) +
        gain) /
      period;

    averageLoss =
      (averageLoss *
        (period - 1) +
        loss) /
      period;
  }

  if (averageLoss === 0) {
    return 100;
  }

  const rs =
    averageGain / averageLoss;

  return 100 - 100 / (1 + rs);
}


/* =========================
   MACD
========================= */

function calculateMACD(values) {
  const ema12 = calculateEMA(
    values,
    12
  );

  const ema26 = calculateEMA(
    values,
    26
  );

  const macd =
    ema12 - ema26;

  // Approximation of MACD signal
  const macdValues = [];

  for (
    let i = 26;
    i < values.length;
    i++
  ) {
    const slice =
      values.slice(0, i + 1);

    const fast =
      calculateEMA(slice, 12);

    const slow =
      calculateEMA(slice, 26);

    macdValues.push(
      fast - slow
    );
  }

  const signal =
    macdValues.length >= 9
      ? calculateEMA(
          macdValues,
          9
        )
      : macd;

  return {
    macd,
    signal,
    histogram:
      macd - signal,
  };
}


/* =========================
   ATR
========================= */

function calculateATR(
  highs,
  lows,
  closes,
  period
) {
  if (closes.length <= period) {
    return 0;
  }

  const trueRanges = [];

  for (let i = 1; i < closes.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const previousClose =
      closes[i - 1];

    const tr = Math.max(
      high - low,
      Math.abs(
        high - previousClose
      ),
      Math.abs(
        low - previousClose
      )
    );

    trueRanges.push(tr);
  }

  const recent =
    trueRanges.slice(-period);

  return (
    recent.reduce(
      (sum, value) => sum + value,
      0
    ) / recent.length
  );
}


/* =========================
   HELPERS
========================= */

function getRSIStatus(rsi) {
  if (rsi >= 70) {
    return "HIGH";
  }

  if (rsi >= 50) {
    return "Bullish";
  }

  if (rsi <= 30) {
    return "LOW";
  }

  return "Bearish";
}


function AnalysisRow({
  name,
  value,
  status,
  good,
}) {
  return (
    <div style={styles.analysisRow}>

      <div>
        <div style={styles.analysisName}>
          {name}
        </div>

        <div style={styles.analysisValue}>
          {value}
        </div>
      </div>

      <div
        style={{
          ...styles.badge,
          color: good
            ? "#22c55e"
            : "#ef4444",
          background: good
            ? "rgba(34,197,94,0.10)"
            : "rgba(239,68,68,0.10)",
        }}
      >
        ● {status}
      </div>

    </div>
  );
}


function Reason({ good, text }) {
  return (
    <div style={styles.reason}>

      <span
        style={{
          ...styles.check,
          color: good
            ? "#22c55e"
            : "#ef4444",
        }}
      >
        {good ? "✓" : "×"}
      </span>

      {text}

    </div>
  );
}


function formatPrice(value) {
  return Number(value).toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  );
}


/* =========================
   STYLES
========================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#07090d",
    color: "#ffffff",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
    padding: "20px 14px 40px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "720px",
    margin: "0 auto",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#ffffff",
    textAlign: "center",
    padding: "20px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  exchange: {
    fontSize: "11px",
    letterSpacing: "2px",
    color: "#737b8c",
    marginBottom: "5px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
  },

  live: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 11px",
    borderRadius: "20px",
    background:
      "rgba(34,197,94,0.10)",
    color: "#22c55e",
    fontSize: "11px",
    fontWeight: "700",
  },

  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#22c55e",
  },

  priceBox: {
    background: "#10131a",
    border: "1px solid #1d222d",
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },

  price: {
    fontSize: "32px",
    fontWeight: "800",
  },

  positive: {
    fontSize: "13px",
    marginTop: "5px",
  },

  timeframe: {
    background: "#1b202a",
    padding: "9px 13px",
    borderRadius: "10px",
    color: "#aab2c0",
    fontWeight: "700",
    fontSize: "12px",
  },

  signalCard: {
    background:
      "linear-gradient(145deg,#111720,#0c1016)",
    border: "1px solid #202734",
    borderRadius: "22px",
    padding: "28px 20px",
    textAlign: "center",
    marginBottom: "14px",
  },

  smallTitle: {
    color: "#7e8797",
    fontSize: "12px",
    letterSpacing: "1.5px",
    fontWeight: "700",
  },

  signal: {
    fontSize: "52px",
    fontWeight: "900",
    margin: "8px 0",
  },

  confidenceText: {
    color: "#737b8c",
    fontSize: "12px",
  },

  confidence: {
    fontSize: "26px",
    fontWeight: "800",
    marginTop: "4px",
  },

  progressBackground: {
    height: "6px",
    background: "#202631",
    borderRadius: "20px",
    marginTop: "14px",
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    borderRadius: "20px",
  },

  score: {
    marginTop: "12px",
    color: "#737b8c",
    fontSize: "11px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: "10px",
    marginBottom: "14px",
  },

  box: {
    background: "#10131a",
    border: "1px solid #1d222d",
    borderRadius: "14px",
    padding: "15px 10px",
  },

  label: {
    color: "#687180",
    fontSize: "9px",
    letterSpacing: "1px",
    fontWeight: "700",
    marginBottom: "7px",
  },

  value: {
    fontSize: "13px",
    fontWeight: "800",
  },

  card: {
    background: "#10131a",
    border: "1px solid #1d222d",
    borderRadius: "18px",
    padding: "19px",
    marginBottom: "14px",
  },

  cardTitle: {
    fontSize: "17px",
    fontWeight: "800",
    marginBottom: "15px",
  },

  extraGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",
    gap: "12px",
  },

  bigValue: {
    fontSize: "14px",
    fontWeight: "800",
  },

  analysisRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "13px 0",
    borderBottom:
      "1px solid #1b2029",
  },

  analysisName: {
    color: "#c3c9d3",
    fontSize: "13px",
  },

  analysisValue: {
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    marginTop: "3px",
  },

  badge: {
    padding: "6px 9px",
    borderRadius: "8px",
    fontSize: "10px",
    fontWeight: "800",
  },

  reason: {
    color: "#c4cad4",
    fontSize: "13px",
    padding: "8px 0",
  },

  check: {
    fontWeight: "900",
    marginRight: "9px",
  },

  button: {
    width: "100%",
    border: "0",
    borderRadius: "14px",
    padding: "16px",
    background: "#ffffff",
    color: "#050608",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  updated: {
    textAlign: "center",
    color: "#687180",
    fontSize: "10px",
    marginTop: "14px",
  },

  disclaimer: {
    textAlign: "center",
    color: "#555d6b",
    fontSize: "10px",
    marginTop: "8px",
    lineHeight: "1.5",
  },
};
