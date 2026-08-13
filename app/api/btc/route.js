export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);

    // Last 2 days of 30-minute candles
    const start = now - 2 * 24 * 60 * 60;

    const url =
      `https://api.india.delta.exchange/v2/history/candles` +
      `?resolution=30m` +
      `&symbol=BTCUSD` +
      `&start=${start}` +
      `&end=${now}`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Delta API request failed");
    }

    const data = await response.json();

    return Response.json({
      success: true,
      candles: data.result || [],
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
