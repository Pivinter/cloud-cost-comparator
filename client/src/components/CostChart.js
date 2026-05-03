import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './CostChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CostChart = ({ results }) => {
  // Перевірка чи results є масивом
  if (!results || !Array.isArray(results)) {
    console.error('CostChart: results is not an array', results);
    return <div className="chart-error">Помилка: неправильний формат даних</div>;
  }

  if (results.length === 0) {
    return <div className="chart-error">Немає даних для відображення</div>;
  }

  const data = {
    labels: results.map(r => r.provider),
    datasets: [
      {
        label: 'Вартість обчислень (USD)',
        data: results.map(r => r.breakdown.compute),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
      },
      {
        label: 'Вартість сховища (USD)',
        data: results.map(r => r.breakdown.storage),
        backgroundColor: 'rgba(118, 75, 162, 0.8)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Порівняння вартості провайдерів',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          footer: (tooltipItems) => {
            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
            return `Всього: $${total.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <Bar data={data} options={options} />
    </div>
  );
};

export default CostChart;
