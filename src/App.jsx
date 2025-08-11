import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Signup from './Signup';
import Admin from './Admin';
import './App.css';

function Calculator() {
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
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBtcData = async () => {
      try {
        const priceResponse = await axios.get(
          'https://api.coingecko.com/api/v3/coins/bitcoin?sparkline=false'
        );
        const currentPrice = priceResponse.data.market_data.current_price.usd;
        setBtcPrice(currentPrice);

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
          setError(t('calculator.error'));
          return;
        }

        const price108dAgo = prices[0];
        const priceChange = ((currentPrice - price108dAgo) / price108dAgo) * 100;
        setPriceChange108d(priceChange);

        const lastHalvingDate = new Date('2024-04-20T00:00:00Z');
        const currentDate = new Date();
        const daysSince = (currentDate - lastHalvingDate) / (1000 * 60 * 60 * 24);
        setDaysSinceHalving(daysSince);

        const cycleLength = 1460;
        const phaseShift = 180;
        const cycleRisk = 0.5 + 0.5 * Math.sin((2 * Math.PI * (daysSince + phaseShift)) / cycleLength);
        setCycleRisk(cycleRisk);

        const liquidityRisk = 1 / (1 + Math.exp(priceChange / 20));
        setLiquidityRisk(liquidityRisk);

        const riskScore = 0.6 * cycleRisk + 0.4 * liquidityRisk;
        setRiskScore(Math.min(1, Math.max(0, riskScore)));

        console.log('Days Since Halving:', daysSince, 'Cycle Risk:', cycleRisk, 'Price Change 108d:', priceChange, 'Liquidity Risk:', liquidityRisk, 'Risk Score:', riskScore);
      } catch (err) {
        setError(t('calculator.error'));
      }
    };
    fetchBtcData();
  }, [t]);

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
          {t('title')}
        </h1>
        {error && (
          <p className="text-red-500 text-center mb-6 font-medium">{error}</p>
        )}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            {t('calculator.dcaLabel')}
          </label>
          <input
            type="number"
            value={dcaAmount}
            onChange={handleDcaChange}
            placeholder={t('calculator.placeholder')}
            min="0"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>
        {btcPrice && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                {t('calculator.price')}{' '}
                <span className="font-medium">${btcPrice.toLocaleString()}</span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                {t('calculator.daysSinceHalving')}{' '}
                <span className="font-medium">{daysSinceHalving?.toFixed(0)}</span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                {t('calculator.priceChange108d')}{' '}
                <span className={`font-medium ${priceChange108d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChange108d?.toFixed(2)}%
                </span>
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm sm:text-base">
                {t('calculator.riskScore')}{' '}
                <span className="font-medium">{riskScore?.toFixed(2)}</span>{' '}
                <span className="text-gray-500">
                  ({riskScore > 0.7 ? t('calculator.riskBuyLess') : riskScore < 0.3 ? t('calculator.riskBuyMore') : t('calculator.riskNeutral')})
                </span>
              </p>
            </div>
            {recommendedUsd && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm sm:text-base">
                    {t('calculator.recommendedPurchase')}{' '}
                    <span className="font-medium">${recommendedUsd.toFixed(2)}</span>
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 text-sm sm:text-base">
                    {t('calculator.btcAmount')}{' '}
                    <span className="font-medium">{recommendedBtc.toFixed(8)} BTC</span>
                  </p>
                </div>
              </>
            )}
          </div>
        )}
        {!btcPrice && !error && (
          <p className="text-gray-500 text-center text-sm sm:text-base">
            {t('calculator.loading')}
          </p>
        )}
        <div className="mt-6">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            {showExplanation ? t('calculator.hideExplanation') : t('calculator.explanationButton')}
          </button>
          {showExplanation && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-gray-700 text-sm sm:text-base">
              <h2 className="text-lg font-semibold mb-2">{t('calculator.explanationTitle')}</h2>
              <p className="mb-2">{t('calculator.explanationText')}</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>{t('calculator.explanationCycle')}</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>{t('calculator.explanationCycleText')}</li>
                  </ul>
                </li>
                <li>
                  <strong>{t('calculator.explanationLiquidity')}</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>{t('calculator.explanationLiquidityText')}</li>
                  </ul>
                </li>
                <li>
                  <strong>{t('calculator.explanationCombined')}</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>{t('calculator.explanationCombinedText')}</li>
                  </ul>
                </li>
                <li>
                  <strong>{t('calculator.explanationWhy')}</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>{t('calculator.explanationWhyText')}</li>
                  </ul>
                </li>
                <li>
                  <strong>{t('calculator.explanationNote')}</strong>:
                  <ul className="list-circle pl-5 mt-1">
                    <li>{t('calculator.explanationNoteText')}</li>
                  </ul>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { t } = useTranslation();

  return (
    <div>
      <nav className="nav-container">
        <Link to="/" className="nav-link">{t('title')}</Link>
        <Link to="/signup" className="nav-link">{t('signup.title')}</Link>
        <Link to="/admin" className="nav-link">{t('admin.title')}</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Calculator />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

export default App;