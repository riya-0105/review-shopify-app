import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const generateColor = (index) => {
  const colors = [
    '#F1B9F5', '#8CCF35', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#DFFF00', '#FFBF00', '#FF7F50', '#DE3163', '#9FE2BF', '#40E0D0', '#6495ED', '#CCCCFF'
  ];
  return colors[index % colors.length];
};

// Function to generate a range of years from start to end
const generateYears = (startYear, endYear) => {
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year.toString());
  }
  return years;
};

// Function to generate all months
const generateMonths = () => {
  return [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ];
};

// Function to prepare complete dataset
const prepareCompleteData = (data, labels, startYear, endYear) => {
  const years = generateYears(startYear, endYear);
  const completeData = years.map(year => {
    const yearData = data.find(d => d.label === year);
    const monthData = labels.map(month => {
      const monthIndex = labels.indexOf(month);
      return yearData && yearData.data[monthIndex] !== undefined ? yearData.data[monthIndex] : 0;
    });
    return {
      label: year,
      data: monthData,
      backgroundColor: generateColor(parseInt(year) - startYear),
    };
  });
  return completeData;
};

const DotChart = ({ data, labels }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  
  // Generate labels for all months
  const allMonths = generateMonths();
  const startYear = 1970;
  const endYear = new Date().getFullYear();

  useEffect(() => {
    const ctx = chartRef.current.getContext('2d');

    // Destroy previous chart instance if exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Prepare complete datasets
    const datasets = prepareCompleteData(data, allMonths, startYear, endYear);

    // Create new chart instance
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: allMonths,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month',
            },
            ticks: {
              autoSkip: false, // Disable auto-skip
              maxRotation: 45, // Rotate labels to avoid overlap
              minRotation: 45,
            },
          },
          y: {
            title: {
              display: true,
              text: 'Total Price',
            },
            suggestedMin: 0, // Optional: Adjust as per your data
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'right',
          },
        },
      },
    });

    // Clean up on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data, labels, allMonths]);

  return (
    <div style={{ width: '100%', height: 'auto' }}>
      <canvas ref={chartRef} style={{ width: '100%', maxWidth: '200rem' }}></canvas>
    </div>
  );
};

export default DotChart;
