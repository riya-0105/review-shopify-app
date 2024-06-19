import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TrendsChart = ({ revenueData, data }) => {
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
        // labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        labels: ['', '', '', '', '', '', '', '', '', '', '', ''],
        datasets: [
          {
            // label: data,
            label: '',
            data: revenueData[data],
            // borderColor: 'red' ,
            borderColor: null,
            fill: false,
          },
        ],
      },
      options: {
        // scales: {
        //   y: {
        //     beginAtZero: true,
        //   },
        // },
        scales: {
          x: { // Remove x-axis scale
            display: false,
          },
          y: { // Remove y-axis scale
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false, 
          },
        },
      },
    });
  }, [revenueData]);

  return <canvas ref={canvasRef} id="revenueChart" style={{ maxWidth: "8rem", maxHeight: "3rem" }} />;
};

export default TrendsChart;
