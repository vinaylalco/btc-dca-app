import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [dcaAmount, setDcaAmount] = useState('');
  const [btcPrice, setBtcPrice] = useState(null);
  const [priceChange30d, setPriceChange30d] = useState(null);
  const [riskMetric, setRiskMetric] = useState(null);
  const [recommendedUsd, setRecommendedUsd] = useState(null);
  const [recommendedBtc, setRecommendedBtc] = useState(null);
  const [error, setError] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchBtcData = async () => {
      try {
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/coins/bitcoin?sparkline=false'
        );
        const { market_data } = response.data;
        setBtcPrice(market_data.current_price.usd);
        setPriceChange30d(market_data.price_change_percentage_30d);
        const risk = Math.tanh(market_data.price_change_percentage_30d / 20);
        setRiskMetric(risk);
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
      if (value && btcPrice && riskMetric !== null) {
        const usd = Number(value) * (1 + riskMetric);
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
                30-Day Price Change:{' '}
                <span
                  className={`font-medium ${
                    priceChange30d >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {priceChange30d?.toFixed(2)}%
                </span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                Risk Metric:{' '}
                <span className="font-medium">{riskMetric?.toFixed(2)}</span>{' '}
                <span className="text-gray-500">
                  ({riskMetric > 0 ? 'Buy more' : riskMetric < 0 ? 'Buy less' : 'Neutral'})
                </span>
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
              <h2 className="text-lg font-semibold mb-2">How the Risk Metric Works</h2>
              <p className="mb-2">
                The risk metric helps you decide how much Bitcoin to buy based on market conditions over the past 30 days. It’s calculated using Bitcoin’s 30-day price change percentage, which shows how much the price has gone up or down.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Calculation</strong>: We take the 30-day price change (e.g., -20% if the price dropped, +20% if it rose) and apply a mathematical formula (<code>tanh(price change / 20)</code>) to get a risk metric between -1 and 1.
                  <ul className="list-circle pl-5 mt-1">
                    <li>If the price dropped significantly (e.g., -20%), the metric is positive (e.g., ~0.8), suggesting it’s a good time to buy more.</li>
                    <li>If the price rose significantly (e.g., +20%), the metric is negative (e.g., ~-0.8), suggesting you buy less to avoid overpaying.</li>
                    <li>If the price is stable (near 0%), the metric is close to 0, meaning you should buy your usual DCA amount.</li>
                  </ul>
                </li>
                <li>
                  <strong>Formula</strong>: Your input DCA amount (in USD) is multiplied by <code>(1 + risk metric)</code> to get the recommended purchase amount. For example, if you enter $100 and the risk metric is 0.8, you’re recommended to buy $180 worth of Bitcoin. This is then converted to BTC using the current price.
                </li>
                <li>
                  <strong>Why 30 Days?</strong>: The 30-day timeframe captures medium-term market trends, helping you buy more when prices are lower and less when prices are higher, aligning with Bitcoin’s market cycles.
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