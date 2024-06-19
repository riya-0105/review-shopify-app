import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const RevenueChart = ({ revenueData }) => {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [
          {
            label: 'Total Revenue',
            data: revenueData['Total Revenue'],
            borderColor: 'red',
            fill: false,
          },
          {
            label: 'Total Income',
            data: revenueData['Total Income'],
            borderColor: 'blue',
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }, [revenueData]);

  return <canvas ref={canvasRef} id="revenueChart" />;
};

export default RevenueChart;
