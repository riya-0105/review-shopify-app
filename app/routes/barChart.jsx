import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Select } from '@shopify/polaris';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const ChartByYear = ({ dataByYear }) => {
  const years = Object.keys(dataByYear).map(Number);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const allYears = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
  
  const [selectedYear, setSelectedYear] = useState(minYear.toString());
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    if (selectedYear && dataByYear[selectedYear]) {
      const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const data = allMonths.map(month => {
        if (dataByYear[selectedYear][month]) {
          const filteredData = dataByYear[selectedYear][month].filter(item => !item.cancelOrder);
          const total = filteredData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
          return filteredData.length > 0 ? total / filteredData.length : 0;
        } else {
          return 0;
        }
      });

      const dataCancel = allMonths.map(month => {
        if (dataByYear[selectedYear][month]) {
          const filteredData = dataByYear[selectedYear][month].filter(item => item.cancelOrder);
          const total = filteredData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
          return filteredData.length > 0 ? total / filteredData.length : 0;
        } else {
          return 0;
        }
      });

      const totalOrders = allMonths.reduce((total, month) => {
        if (dataByYear[selectedYear][month]) {
          const filteredData = dataByYear[selectedYear][month].filter(item => !item.cancelOrder);
          const total = filteredData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
          return filteredData.length > 0 ? total / filteredData.length : 0;
        } else {
          return total;
        }
      }, 0);

      const totalCancelOrders = allMonths.reduce((total, month) => {
        if (dataByYear[selectedYear][month]) {
          const filteredData = dataByYear[selectedYear][month].filter(item => item.cancelOrder);
          const total = filteredData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
          return filteredData.length > 0 ? total / filteredData.length : 0;
        } else {
          return total;
        }
      }, 0);

      const totalOrderCount = allMonths.reduce((total, month) => {
        if (dataByYear[selectedYear][month]) {
          const filteredData = dataByYear[selectedYear][month].filter(item => !item.cancelOrder);
          return filteredData.length > 0 ? filteredData.length : 0;
        } else {
          return total;
        }
      }, 0);

      const totalCancelOrderCount = allMonths.reduce((total, month) => {
        if (dataByYear[selectedYear][month]) {
          const filteredData = dataByYear[selectedYear][month].filter(item => item.cancelOrder);
          return filteredData.length > 0 ? filteredData.length : 0;
        } else {
          return total;
        }
      }, 0);

      setChartData({
        labels: allMonths,
        datasets: [
          {
            type: 'bar',
            label: 'Average Orders',
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            order: 1
          },
          {
            type: 'line',
            label: 'Average Cancel Order',
            data: dataCancel,
            backgroundColor: '#663399',
            borderColor: '#663399',
            borderWidth: 2,
            fill: false,
            order: 0
          }
        ],
        totalOrders,
        totalOrderCount,
        totalCancelOrders,
        totalCancelOrderCount
      });
    } else {
      const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = allMonths.map(month => 0);

      setChartData({
        labels: allMonths,
        datasets: [
          {
            type: 'bar',
            label: 'Average Orders',
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }
        ],
        totalOrders: 0,
        totalOrderCount: 0
      });
    }
  }, [selectedYear, dataByYear]);

  const yearOptions = allYears.map((year) => ({
    label: year.toString(),
    value: year.toString(),
  }));

  const chartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            if (tooltipItem.datasetIndex === 0) {
              return `Average Orders: ${tooltipItem.raw.toFixed(2)} | Total Orders: ${chartData.totalOrders}`;
            }
            return `Average Cancel Orders: ${tooltipItem.raw.toFixed(2)}`;
          },
        },
      },
      legend: {
        display: true,
        position: 'right',
        labels: {
          generateLabels: (chart) => {
            const labels = chart.data.datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              hidden: dataset.hidden,
              index: i,
            }));

            labels.push({
              text: `Total Sale: INR ${chartData.totalOrders}`,
              fillStyle: '#6495ED',
              hidden: false,
              index: labels.length,
            });

            labels.push({
              text: `Total Orders: ${chartData.totalOrderCount}`,
              fillStyle: '#CCCCFF',
              hidden: false,
              index: labels.length,
            });

            labels.push({
              text: `Cancel Order Total: INR ${chartData.totalCancelOrders}`,
              fillStyle: '#6495ED',
              hidden: false,
              index: labels.length,
            });

            labels.push({
              text: `Total CancelOrders: ${chartData.totalCancelOrderCount}`,
              fillStyle: '#CCCCFF',
              hidden: false,
              index: labels.length,
            });

            return labels;
          },
        },
      },
    },
  };

  return (
    <div>
      <div style={{ margin: "1.5rem", width: "15rem" }}>
        <Select
          label="Select Year"
          options={yearOptions}
          onChange={(value) => setSelectedYear(value)}
          value={selectedYear}
        />
      </div>
      {chartData.labels && chartData.labels.length > 0 ? (
        <div style={{ display: "block", alignItems: "center", width: "54rem", justifyContent: "center", marginLeft: "2rem" }}>
          <h2 style={{ margin: "1rem" }}>Average Orders in {selectedYear}</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      ) : (
        <p>No data available for the selected year.</p>
      )}
    </div>
  );
};

export default ChartByYear;
