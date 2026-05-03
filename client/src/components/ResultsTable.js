import React from 'react';
import './ResultsTable.css';

const ResultsTable = ({ results }) => {
  // Перевірка чи results є масивом
  if (!results || !Array.isArray(results)) {
    console.error('ResultsTable: results is not an array', results);
    return <div className="results-error">Помилка: неправильний формат даних</div>;
  }

  if (results.length === 0) {
    return <div className="results-error">Немає даних для відображення</div>;
  }

  const sortedResults = [...results].sort((a, b) => a.cost - b.cost);
  
  return (
    <div className="results-table-container">
      <h3>Детальна інформація</h3>
      <div className="table-responsive">
        <table className="results-table">
          <thead>
            <tr>
              <th>Провайдер</th>
              <th>Тип VM</th>
              <th>Обчислення</th>
              <th>Сховище</th>
              <th>Всього</th>
              <th>Рейтинг</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => (
              <tr key={result.provider} className={index === 0 ? 'best-option' : ''}>
                <td className="provider-cell">
                  <strong>{result.provider}</strong>
                  {index === 0 && <span className="badge">Найдешевше</span>}
                </td>
                <td className="vm-type">{result.vmType}</td>
                <td>${result.breakdown.compute.toFixed(2)}</td>
                <td>${result.breakdown.storage.toFixed(2)}</td>
                <td className="total-cost">
                  <strong>${result.cost.toFixed(2)}</strong>
                </td>
                <td>
                  <div className="rank-badge rank-{index + 1}">
                    #{index + 1}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="price-breakdown">
        <h4>Погодинні ставки:</h4>
        <div className="breakdown-grid">
          {results.map(result => (
            <div key={result.provider} className="breakdown-card">
              <h5>{result.provider}</h5>
              <p>Обчислення: ${result.breakdown.computeHourly}/год</p>
              <p>Сховище: ${result.breakdown.storageMonthly}/міс</p>
              {result.breakdown.sustainedUseDiscount && (
                <p className="discount">
                  Знижка: {result.breakdown.sustainedUseDiscount}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
