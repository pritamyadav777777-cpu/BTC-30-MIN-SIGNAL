"use client";

import { useState } from "react";

export default function Home() {
  const [signal, setSignal] = useState("LONG");

  const changeSignal = () => {
    if (signal === "LONG") setSignal("SHORT");
    else if (signal === "SHORT") setSignal("WAIT");
    else setSignal("LONG");
  };

  const signalColor =
    signal === "LONG"
      ? "#22c55e"
      : signal === "SHORT"
      ? "#ef4444"
      : "#f59e0b";

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div>
            <div style={styles.exchange}>DELTA EXCHANGE</div>
            <h1 style={styles.title}>BTCUSD</h1>
          </div>

          <div style={styles.live}>
            <span style={styles.liveDot}></span>
            LIVE
          </div>
        </header>

        {/* Price */}
        <section style={styles.priceBox}>
          <div>
            <div style={styles.price}>$115,250</div>
            <div style={styles.positive}>+1.24% today</div>
          </div>

          <div style={styles.timeframe}>
            30M
          </div>
        </section>

        {/* Main Signal */}
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
            {signal}
          </div>

          <div style={styles.confidenceText}>
            Signal Confidence
          </div>

          <div style={styles.confidence}>
            78%
          </div>

          <div style={styles.progressBackground}>
            <div
              style={{
                ...styles.progress,
                width: "78%",
                background: signalColor,
              }}
            ></div>
          </div>
        </section>

        {/* Trade Levels */}
        <section style={styles.grid}>
          <div style={styles.box}>
            <div style={styles.label}>ENTRY</div>
            <div style={styles.value}>$115,250</div>
          </div>

          <div style={styles.box}>
            <div style={styles.label}>STOP LOSS</div>
            <div style={{ ...styles.value, color: "#ef4444" }}>
              $114,700
            </div>
          </div>

          <div style={styles.box}>
            <div style={styles.label}>TARGET</div>
            <div style={{ ...styles.value, color: "#22c55e" }}>
              $116,300
            </div>
          </div>
        </section>

        {/* Analysis */}
        <section style={styles.card}>
          <div style={styles.cardTitle}>
            Market Analysis
          </div>

          <AnalysisRow
            name="RSI"
            value="61.2"
            status="Bullish"
            good
          />

          <AnalysisRow
            name="MACD"
            value="Bullish"
            status="BUY"
            good
          />

          <AnalysisRow
            name="EMA 20 / 50"
            value="Bullish"
            status="UP"
            good
          />

          <AnalysisRow
            name="Volume"
            value="Strong"
            status="+32%"
            good
          />

          <AnalysisRow
            name="Market Trend"
            value="Uptrend"
            status="BULL"
            good
          />
        </section>

        {/* Why signal */}
        <section style={styles.card}>
          <div style={styles.cardTitle}>
            Why this signal?
          </div>

          <div style={styles.reason}>
            <span style={styles.check}>✓</span>
            EMA 20 is above EMA 50
          </div>

          <div style={styles.reason}>
            <span style={styles.check}>✓</span>
            RSI is above 50
          </div>

          <div style={styles.reason}>
            <span style={styles.check}>✓</span>
            MACD shows bullish momentum
          </div>

          <div style={styles.reason}>
            <span style={styles.check}>✓</span>
            Trading volume is increasing
          </div>
        </section>

        {/* Refresh */}
        <button
          onClick={changeSignal}
          style={styles.button}
        >
          ↻ Refresh Signal
        </button>

        <div style={styles.disclaimer}>
          Demo signal only. This is not financial advice.
        </div>

      </div>
    </main>
  );
}

function AnalysisRow({ name, value, status, good }) {
  return (
    <div style={styles.analysisRow}>
      <div>
        <div style={styles.analysisName}>{name}</div>
        <div style={styles.analysisValue}>{value}</div>
      </div>

      <div
        style={{
          ...styles.badge,
          color: good ? "#22c55e" : "#f59e0b",
          background: good
            ? "rgba(34,197,94,0.10)"
            : "rgba(245,158,11,0.10)",
        }}
      >
        ● {status}
      </div>
    </div>
  );
}

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
    letterSpacing: "-1px",
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
    display: "inline-block",
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
    letterSpacing: "-1px",
  },

  positive: {
    color: "#22c55e",
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
      "linear-gradient(145deg, #111720, #0c1016)",
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
    letterSpacing: "-2px",
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

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
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
    fontSize: "14px",
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
    borderBottom: "1px solid #1b2029",
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
    color: "#22c55e",
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

  disclaimer: {
    textAlign: "center",
    color: "#555d6b",
    fontSize: "10px",
    marginTop: "16px",
  },
};
