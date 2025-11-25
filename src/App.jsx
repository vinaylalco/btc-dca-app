import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const MIN_MULTIPLIER = 0.5;
const MAX_MULTIPLIER = 1.5;

function App() {
  const [dcaAmount, setDcaAmount] = useState('');
  const [btcPrice, setBtcPrice] = useState(null);
  const [riskScore, setRiskScore] = useState(null);
  const [maxDeviation, setMaxDeviation] = useState(null);
  const [sma200Day, setSma200Day] = useState(null);
  const [recommendedUsd, setRecommendedUsd] = useState(null);
  const [recommendedBtc, setRecommendedBtc] = useState(null);
  const [error, setError] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchBtcData = async () => {
      try {
        // Fetch current price
        const priceResponse = await axios.get(
          'https://api.coingecko.com/api/v3/coins/bitcoin?sparkline=false'
        );
        const currentPrice = priceResponse.data.market_data.current_price.usd;
        setBtcPrice(currentPrice);

        // Fetch 200 days of historical prices for 200-day SMA
        const apiKey = import.meta.env.VITE_CG_DEMO_API_KEY;
        const historyResponse = await axios.get(
          'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
          {
            params: {
              vs_currency: 'usd',
              days: 200, // request the latest 200 daily data points
              interval: 'daily',
              precision: 'full',
              ...(apiKey ? { x_cg_demo_api_key: apiKey } : {}),
            },
          }
        );
        const pricePoints = historyResponse.data?.prices || [];
        if (!Array.isArray(pricePoints) || pricePoints.length === 0) {
          setError('Failed to load historical price data for SMA.');
          return;
        }

        if (pricePoints.length < 30) {
          setError('Not enough data to compute SMA.');
          return;
        }

        const prices = pricePoints.map(([, price]) => price);
        const recentPrices = prices.slice(-200);

        // Calculate 200-day SMA (average of the latest daily prices)
        const sma =
          recentPrices.reduce((sum, price) => sum + price, 0) /
          (recentPrices.length || 1);
        console.debug('BTC SMA calculation', {
          pointsUsed: recentPrices.length,
          firstDate: new Date(pricePoints[0][0]).toISOString(),
          lastDate: new Date(pricePoints[pricePoints.length - 1][0]).toISOString(),
          sma,
        });
        setSma200Day(sma);

        // Calculate max deviation from SMA across the SMA window
        const deviations = recentPrices.map(price => Math.abs(price - sma));
        const maxDev = deviations.length ? Math.max(...deviations) : 0;
        setMaxDeviation(maxDev);

        // Calculate risk score using normalized deviation from SMA
        if (!maxDev || maxDev < Number.EPSILON) {
          setRiskScore(0.5);
          return;
        }

        const rawDeviation = (currentPrice - sma) / maxDev;
        const clampedDeviation = Math.max(-1, Math.min(1, rawDeviation));
        const computedRiskScore = 0.5 + 0.5 * clampedDeviation;
        setRiskScore(computedRiskScore);

      } catch (err) {
        console.error('Failed to fetch Bitcoin data', err);
        setError('Failed to fetch Bitcoin data. Please try again.');
      }
    };
    fetchBtcData();
  }, []);

  const handleDcaChange = (e) => {
    const value = e.target.value;
    if (value >= 0 || value === '') {
      setDcaAmount(value);
      if (value && btcPrice && riskScore !== null) {
        const baseDcaUsd = Number(value);
        const multiplier =
          MIN_MULTIPLIER + (1 - riskScore) * (MAX_MULTIPLIER - MIN_MULTIPLIER);
        const usd = baseDcaUsd * multiplier;
        setRecommendedUsd(usd);
        setRecommendedBtc(usd / btcPrice);
      } else {
        setRecommendedUsd(null);
        setRecommendedBtc(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-800">
          Bitcoin DCA Calculator
        </h1>
        {error && (
          <p className="text-red-500 text-center mb-6 font-medium">{error}</p>
        )}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Enter DCA Amount (USD):
          </label>
          <input
            type="number"
            value={dcaAmount}
            onChange={handleDcaChange}
            placeholder="e.g., 100"
            min="0"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>
        {btcPrice && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                Current BTC Price:{' '}
                <span className="font-medium">${btcPrice.toLocaleString()}</span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                200-Day SMA:{' '}
                <span className="font-medium">${sma200Day?.toLocaleString()}</span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                Risk Score:{' '}
                <span className="font-medium">{riskScore?.toFixed(2)}</span>{' '}
                <span className="text-gray-500">
                  ({riskScore > 0.7 ? 'Buy less' : riskScore < 0.3 ? 'Buy more' : 'Neutral'})
                </span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                Max Deviation from SMA:{' '}
                <span className="font-medium">${maxDeviation?.toLocaleString()}</span>
              </p>
            </div>
            {recommendedUsd && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm sm:text-base">
                    Recommended Purchase:{' '}
                    <span className="font-medium">${recommendedUsd.toFixed(2)}</span>
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm sm:text-base">
                    BTC Amount:{' '}
                    <span className="font-medium">{recommendedBtc.toFixed(8)} BTC</span>
                  </p>
                </div>
              </>
            )}
          </div>
        )}
        {!btcPrice && !error && (
          <p className="text-gray-500 text-center text-sm sm:text-base">
            Loading Bitcoin data...
          </p>
        )}
        <div className="mt-6">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            {showExplanation ? 'Hide Explanation' : 'How Does This Work?'}
          </button>
          {showExplanation && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-gray-700 text-sm sm:text-base">
              <h2 className="text-lg font-semibold mb-2">How the Risk Score Works</h2>
              <p className="mb-2">
                The risk score helps you decide how much Bitcoin to buy based on the current price versus Bitcoin’s 200-day simple moving average (SMA) calculated from CoinGecko’s daily prices.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Calculation</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>We fetch the current Bitcoin price and 200 days of daily BTC prices from CoinGecko to compute the 200-day SMA.</li>
                    <li>The maximum deviation is the largest absolute difference between any daily price in that window and the SMA.</li>
                    <li>
                      The risk score compares today’s price to the SMA relative to that maximum deviation:
                      <code>0.5 + 0.5 * clamp((current price - 200-day SMA) / max deviation, -1, 1)</code>.
                    </li>
                    <li>
                      Scale: <strong>0</strong> = far below the SMA (cheap, leans toward buying more),
                      <strong>0.5</strong> = near the SMA (neutral), <strong>1</strong> = far above the SMA (expensive, leans toward
                      buying less).
                    </li>
                    <li>Your DCA amount is adjusted with a multiplier between 0.5× and 1.5× before converting to BTC.</li>
                  </ul>
                </li>
                <li>
                  <strong>Why This Approach?</strong>: The 200-day SMA is a widely used indicator for medium-term Bitcoin trends. When BTC is cheap relative to its 200-day trend, the multiplier can suggest buying more than your normal DCA; when it’s expensive, it can suggest buying less.
                </li>
                <li>
                  <strong>Note</strong>: The risk score assumes the max deviation reflects the market’s historical range. Extreme market events may affect accuracy, and future enhancements could include volatility-based confidence metrics.
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;