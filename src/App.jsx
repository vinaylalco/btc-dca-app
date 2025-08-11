import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [dcaAmount, setDcaAmount] = useState('');
  const [btcPrice, setBtcPrice] = useState(null);
  const [riskScore, setRiskScore] = useState(null);
  const [cycleRisk, setCycleRisk] = useState(null);
  const [liquidityRisk, setLiquidityRisk] = useState(null);
  const [daysSinceHalving, setDaysSinceHalving] = useState(null);
  const [priceChange108d, setPriceChange108d] = useState(null);
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

        // Fetch 108 days of historical prices for liquidity proxy
        const historyResponse = await axios.get(
          'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
          {
            params: {
              vs_currency: 'usd',
              days: 108,
              interval: 'daily',
            },
          }
        );
        const prices = historyResponse.data.prices.map(([timestamp, price]) => price);
        if (prices.length < 2) {
          setError('Insufficient historical data for liquidity calculation.');
          return;
        }

        // Calculate 108-day price change percentage
        const price108dAgo = prices[0];
        const priceChange = ((currentPrice - price108dAgo) / price108dAgo) * 100;
        setPriceChange108d(priceChange);

        // Calculate days since last halving (April 20, 2024)
        const lastHalvingDate = new Date('2024-04-20T00:00:00Z');
        const currentDate = new Date();
        const daysSince = (currentDate - lastHalvingDate) / (1000 * 60 * 60 * 24);
        setDaysSinceHalving(daysSince);

        // Calculate cycle risk (sinusoidal, peaking at ~450–540 days)
        const cycleLength = 1460; // ~4 years
        const phaseShift = 180; // Align trough at ~900–990 days
        const cycleRisk = 0.5 + 0.5 * Math.sin((2 * Math.PI * (daysSince + phaseShift)) / cycleLength);
        setCycleRisk(cycleRisk);

        // Calculate liquidity risk (sigmoid on 108-day price change)
        const liquidityRisk = 1 / (1 + Math.exp(priceChange / 20));
        setLiquidityRisk(liquidityRisk);

        // Combine risks (weighted: 60% cycle, 40% liquidity)
        const riskScore = 0.6 * cycleRisk + 0.4 * liquidityRisk;
        setRiskScore(Math.min(1, Math.max(0, riskScore)));

        // Debug logs
        console.log('Days Since Halving:', daysSince, 'Cycle Risk:', cycleRisk, 'Price Change 108d:', priceChange, 'Liquidity Risk:', liquidityRisk, 'Risk Score:', riskScore);
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
                Days Since Halving:{' '}
                <span className="font-medium">{daysSinceHalving?.toFixed(0)}</span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                108-Day Price Change:{' '}
                <span className={`font-medium ${priceChange108d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChange108d?.toFixed(2)}%
                </span>
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
                The risk score determines how much Bitcoin to buy based on Bitcoin’s halving cycle and global liquidity trends, encouraging more purchases during low-price periods and fewer during highs.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Halving Cycle</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>Bitcoin’s price often peaks 12–18 months after a halving and bottoms 18–24 months before the next.</li>
                    <li>We calculate days since the last halving (April 20, 2024) and use a sinusoidal function to assign higher risk (buy less) near 12–18 months post-halving and lower risk (buy more) ~18–24 months pre-halving.</li>
                  </ul>
                </li>
                <li>
                  <strong>Global Liquidity</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>Global M2 money supply predicts Bitcoin’s price direction with a ~108-day lead.</li>
                    <li>We use the 108-day price change as a proxy, with positive changes indicating bullish conditions (lower risk) and negative changes suggesting bearish conditions (higher risk).</li>
                  </ul>
                </li>
                <li>
                  <strong>Combined Risk</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>The risk score combines cycle risk (60%) and liquidity risk (40%), normalized to 0–1.</li>
                    <li>Your DCA amount (USD) is multiplied by <code>(1 - risk score)</code> to get the recommended purchase amount, then converted to BTC.</li>
                  </ul>
                </li>
                <li>
                  <strong>Why This Approach?</strong>: Halvings drive Bitcoin’s cyclical price patterns, while M2 liquidity signals future price momentum, aligning with strategies from analysts like Lyn Alden.
                </li>
                <li>
                  <strong>Note</strong>: The liquidity proxy uses price changes due to limited real-time M2 data. Extreme market events or halving-related volatility may affect accuracy.
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