import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter, ScatterChart } from 'recharts';
import { Select } from '@shopify/polaris';

const ChartByYearCombined = ({ dataByYear }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (selectedYear && dataByYear[selectedYear]) {
      const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Calculate average orders per month
      const barChartData = allMonths.map(month => ({
        month,
        averageOrders: calculateAverageOrders(dataByYear[selectedYear][month]),
      }));

      // Calculate total sales per month for scatter plot
      const scatterPlotData = allMonths.map(month => ({
        month,
        totalSales: calculateTotalSales(dataByYear[selectedYear][month]),
      }));

      setChartData({
        barChartData,
        scatterPlotData,
      });
    }
  }, [selectedYear, dataByYear]);

  // Function to calculate average orders
  const calculateAverageOrders = (data) => {
    if (!data || data.length === 0) return 0;

    const totalOrders = data.reduce((acc, curr) => acc + parseFloat(curr.totalOrders), 0);
    return totalOrders / data.length;
  };

  // Function to calculate total sales
  const calculateTotalSales = (data) => {
    if (!data || data.length === 0) return 0;

    return data.reduce((acc, curr) => acc + parseFloat(curr.totalSales), 0);
  };

  // Handler for year selection
  const handleYearChange = (value) => {
    setSelectedYear(value);
  };

  return (
    <div>
      <Select
        label="Select Year"
        options={Object.keys(dataByYear).map(year => ({ label: year, value: year }))}
        onChange={handleYearChange}
        value={selectedYear}
      />
      {selectedYear && chartData.barChartData && chartData.barChartData.length > 0 && (
        <div>
          <h2>Comparison of Average Orders and Total Sales in {selectedYear}</h2>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <BarChart width={800} height={400} data={chartData.barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageOrders" fill="#8884d8" />
            </BarChart>
            <ScatterChart width={800} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Total Sales" data={chartData.scatterPlotData} fill="#82ca9d" />
            </ScatterChart>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartByYearCombined;
