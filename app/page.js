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
        throw new Error("No BTC data received");
      }

      const candles = result.candles;

      // Delta returns newest candle first
      const latest = candles[0];
      const previous = candles[1];

      const closes = candles.map((c) => Number(c.close));
      const volumes = candles.map((c) => Number(c.volume));

      const ema20 = calculateEMA(closes, 20);
      const ema50 = calculateEMA(closes, 50);
      const rsi = calculateRSI(closes, 14);

      const macd = calculateMACD(closes);

      const price = Number(latest.close);
      const previousPrice = Number(previous.close);

      const priceChange =
        ((price - previousPrice) / previousPrice) * 100;

      const currentVolume = Number(latest.volume);
      const averageVolume =
        volumes.slice(1, 21).reduce((a, b) => a + b, 0) /
        Math.min(20, volumes.length - 1);

      const volumeStrong = currentVolume > averageVolume;

      let score = 50;

      // EMA
      if (ema20 > ema50) {
        score += 15;
      } else {
        score -= 15;
      }

      // RSI
      if (rsi > 50 && rsi < 70) {
        score += 10;
      } else if (rsi < 50 && rsi > 30) {
        score -= 10;
      }

      // MACD
      if (macd.macd > macd.signal) {
        score += 10;
      } else {
        score -= 10;
      }

      // Price direction
      if (price > previousPrice) {
        score += 5;
      } else {
        score -= 5;
      }

      // Volume
      if (volumeStrong) {
        score += price > previousPrice ? 5 : -5;
      }

      score = Math.max(0, Math.min(100, Math.round(score)));

      let signal = "WAIT";

      if (score >= 65) {
        signal = "LONG";
      } else if (score <= 35) {
        signal = "SHORT";
      }

      const confidence = Math.max(
        50,
        Math.abs(score - 50) * 2 + 50
      );

      setData({
        price,
        priceChange,
        rsi,
        ema20,
        ema50,
        macd,
        volume: currentVolume,
        averageVolume,
        volumeStrong,
        signal,
        score,
        confidence: Math.min(99, Math.round(confidence)),
        candle: latest,
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

    const interval = setInterval(loadData, 60000);

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
              {data.priceChange >= 0 ? "+" : ""}
              {data.priceChange.toFixed(3)}% from previous 30M
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
            Signal Confidence
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
              CURRENT
            </div>

            <div style={styles.value}>
              ${formatPrice(data.price)}
            </div>
          </div>

          <div style={styles.box}>
            <div style={styles.label}>
              30M HIGH
            </div>

            <div
              style={{
                ...styles.value,
                color: "#22c55e",
              }}
            >
              ${formatPrice(data.candle.high)}
            </div>
          </div>

          <div style={styles.box}>
            <div style={styles.label}>
              30M LOW
            </div>

            <div
              style={{
                ...styles.value,
                color: "#ef4444",
              }}
            >
              ${formatPrice(data.candle.low)}
            </div>
          </div>

        </section>

        {/* ANALYSIS */}
        <section style={styles.card}>

          <div style={styles.cardTitle}>
            Market Analysis
          </div>

          <AnalysisRow
            name="RSI"
            value={data.rsi.toFixed(2)}
            status={
              data.rsi >= 50
                ? "Bullish"
                : "Bearish"
            }
            good={data.rsi >= 50}
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
            value={data.macd.macd.toFixed(2)}
            status={
              data.macd.macd > data.macd.signal
                ? "Bullish"
                : "Bearish"
            }
            good={
              data.macd.macd >
              data.macd.signal
            }
          />

          <AnalysisRow
            name="Volume"
            value={
              data.volumeStrong
                ? "Above Average"
                : "Normal"
            }
            status={
              data.volumeStrong
                ? "STRONG"
                : "NORMAL"
            }
            good={data.volumeStrong}
          />

        </section>

        {/* WHY */}
        <section style={styles.card}>

          <div style={styles.cardTitle}>
            Signal Explanation
          </div>

          <Reason
            good={data.ema20 > data.ema50}
            text="EMA 20 / 50 trend"
          />

          <Reason
            good={data.rsi >= 50}
            text="RSI momentum"
          />

          <Reason
            good={
              data.macd.macd >
              data.macd.signal
            }
            text="MACD momentum"
          />

          <Reason
            good={data.price > data.candle.open}
            text="Current 30M candle direction"
          />

          <Reason
            good={data.volumeStrong}
            text="Trading volume"
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
          Signals are algorithmic estimates only.
          Not financial advice.
        </div>

      </div>
    </main>
  );
}


/* =========================
   INDICATORS
========================= */

function calculateEMA(values, period) {
  if (values.length < period) {
    return values[0];
  }

  const multiplier =
    2 / (period + 1);

  let ema =
    values
      .slice(0, period)
      .reduce((a, b) => a + b, 0) /
    period;

  for (let i = period; i < values.length; i++) {
    ema =
      (values[i] - ema) *
        multiplier +
      ema;
  }

  return ema;
}


function calculateRSI(values, period) {
  if (values.length <= period) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const difference =
      values[i] - values[i - 1];

    if (difference >= 0) {
      gains += difference;
    } else {
      losses += Math.abs(difference);
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
    const difference =
      values[i] - values[i - 1];

    const gain =
      difference > 0
        ? difference
        : 0;

    const loss =
      difference < 0
        ? Math.abs(difference)
        : 0;

    averageGain =
      (averageGain * (period - 1) +
        gain) /
      period;

    averageLoss =
      (averageLoss * (period - 1) +
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

  // Simple signal approximation
  const signal =
    calculateEMA(
      values.map(
        (_, index) =>
          calculateEMA(
            values.slice(
              0,
              index + 1
            ),
            12
          ) -
          calculateEMA(
            values.slice(
              0,
              index + 1
            ),
            26
          )
      ),
      9
    );

  return {
    macd,
    signal,
  };
}


/* =========================
   COMPONENTS
========================= */

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
    background: "rgba(34,197,94,0.10)",
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
  },
};
