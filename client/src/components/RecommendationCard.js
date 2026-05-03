import React from 'react';
import './RecommendationCard.css';

const RecommendationCard = ({ recommendation }) => {
  // Перевірка наявності даних
  if (!recommendation) {
    return (
      <div className="recommendation-card">
        <p>Рекомендації недоступні</p>
      </div>
    );
  }

  const explanation = recommendation.explanation || 'Пояснення відсутнє';
  const method = recommendation.method || 'Автоматичний';
  const recommended = recommendation.recommended || 'Не вказано';
  const ranking = recommendation.ranking || [];

  return (
    <div className="recommendation-card">
      <div className="recommendation-header">
        <h3>Рекомендація системи</h3>
        <div className="recommended-provider">
          {recommended}
        </div>
      </div>

      <div className="recommendation-body">
        <div className="method-badge">
          {method}
        </div>

        <div className="explanation">
          {explanation.split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>

        <div className="ranking-details">
          <h4>Детальний рейтинг провайдерів:</h4>
          <div className="ranking-list">
            {ranking.length > 0 ? (
              ranking.map(item => (
                <div key={item.provider} className="ranking-item">
                  <div className="ranking-header">
                    <span className="rank-number">#{item.rank}</span>
                    <span className="provider-name">{item.provider}</span>
                    <span className="provider-cost">${item.cost?.toFixed(2) || '0.00'}</span>
                    <span className="provider-score">{item.score || 0}/10</span>
                  </div>
                  {item.details && (
                    <div className="criteria-scores">
                      <div className="score-item">
                        <span className="score-label">Вартість:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${(item.details.costScore || 0) * 10}%` }}
                          ></div>
                        </div>
                        <span className="score-value">{item.details.costScore || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Надійність:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${(item.details.reliability || 0) * 10}%` }}
                          ></div>
                        </div>
                        <span className="score-value">{item.details.reliability || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Продуктивність:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${(item.details.performance || 0) * 10}%` }}
                          ></div>
                        </div>
                        <span className="score-value">{item.details.performance || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Підтримка:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${(item.details.support || 0) * 10}%` }}
                          ></div>
                        </div>
                        <span className="score-value">{item.details.support || 0}/10</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>Рейтинг недоступний</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
