import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const LineChart = ({ data, labels }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy(); // Destroy the previous chart before creating a new one
    }
    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            borderColor: 'red',
            fill: false,
          },
        ],
      },
      options: {
        legend: { display: false },
      },
    });
  }, [data, labels]);

  // Cleanup when the component is unmounted
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  return <canvas ref={chartRef} style={{ width: '100%', maxWidth: "25rem", maxHeight: "25rem" }}></canvas>;
};

export default LineChart;
