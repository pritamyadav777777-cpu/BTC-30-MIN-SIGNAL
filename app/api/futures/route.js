export async function GET() {
  try {
    const base = "https://api.india.delta.exchange";

    const now = Math.floor(Date.now() / 1000);
    const start = now - 24 * 60 * 60;

    // Live BTCUSD ticker
    const tickerResponse = await fetch(
      `${base}/v2/tickers/BTCUSD`,
      {
        cache: "no-store",
      }
    );

    // Historical Open Interest
    const oiResponse = await fetch(
      `${base}/v2/history/candles?resolution=30m&symbol=OI:BTCUSD&start=${start}&end=${now}`,
      {
        cache: "no-store",
      }
    );

    // Historical Funding
    const fundingResponse = await fetch(
      `${base}/v2/history/candles?resolution=30m&symbol=FUNDING:BTCUSD&start=${start}&end=${now}`,
      {
        cache: "no-store",
      }
    );

    if (
      !tickerResponse.ok ||
      !oiResponse.ok ||
      !fundingResponse.ok
    ) {
      throw new Error("Delta futures API request failed");
    }

    const ticker = await tickerResponse.json();
    const oi = await oiResponse.json();
    const funding = await fundingResponse.json();

    const tickerData = ticker.result || {};
    const oiData = oi.result || [];
    const fundingData = funding.result || [];

    const latestOI =
      oiData.length > 0
        ? oiData[oiData.length - 1]
        : null;

    const previousOI =
      oiData.length > 1
        ? oiData[oiData.length - 2]
        : null;

    const latestFunding =
      fundingData.length > 0
        ? fundingData[fundingData.length - 1]
        : null;

    const currentOI = latestOI
      ? Number(latestOI.close)
      : null;

    const previousOIValue = previousOI
      ? Number(previousOI.close)
      : null;

    let oiChange = null;

    if (
      currentOI !== null &&
      previousOIValue !== null &&
      previousOIValue !== 0
    ) {
      oiChange =
        ((currentOI - previousOIValue) /
          previousOIValue) *
        100;
    }

    return Response.json({
      success: true,

      price: tickerData.close || null,

      openInterest: currentOI,

      oiChange,

      fundingRate: latestFunding
        ? Number(latestFunding.close)
        : null,

      updatedAt: Date.now(),
    });

  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
