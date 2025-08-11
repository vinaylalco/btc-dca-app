import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

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
        const historyResponse = await axios.get(
          'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
          {
            params: {
              vs_currency: 'usd',
              days: 200, // Changed from 1400 to 200 days
              interval: 'daily',
            },
          }
        );
        const prices = historyResponse.data.prices.map(([timestamp, price]) => price);

        // Calculate 200-day SMA (average of 200 daily prices)
        const sma = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        setSma200Day(sma);

        // Calculate max deviation from SMA
        const deviations = prices.map(price => Math.abs(price - sma));
        const maxDev = Math.max(...deviations);
        setMaxDeviation(maxDev);

        // Calculate risk score: (current_price - SMA) / max_deviation
        // Normalize to 0–1 using a linear scaling approach
        const rawRisk = (currentPrice - sma) / maxDev;
        // Scale to 0–1: if rawRisk > 1, cap at 1; if < -1, map to 0
        const normalizedRisk = Math.min(1, Math.max(0, (rawRisk + 1) / 2));
        setRiskScore(normalizedRisk);

      } catch (err) {
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
        const usd = Number(value) * (1 - riskScore);
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
                The risk score helps you decide how much Bitcoin to buy based on its current price relative to the 200-day simple moving average (SMA), a medium-term trend indicator.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Calculation</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>We fetch the current Bitcoin price and 200 days of daily prices from CoinGecko.</li>
                    <li>The 200-day SMA is the average price over these 200 days.</li>
                    <li>The maximum deviation is the largest absolute difference between any daily price and the SMA.</li>
                    <li>The risk score is calculated as <code>(current price - 200-day SMA) / max deviation</code>.</li>
                    <li>This is normalized to a 0–1 scale: 0 means the price is far below the SMA (buy more), 1 means far above (buy less).</li>
                    <li>Your DCA amount (USD) is multiplied by <code>(1 - risk score)</code> to get the recommended purchase amount, then converted to BTC.</li>
                  </ul>
                </li>
                <li>
                  <strong>Why This Approach?</strong>: The 200-day SMA is a widely used indicator for medium-term Bitcoin trends. Buying more when the price is below the SMA and less when above aligns with value-based DCA strategies.
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