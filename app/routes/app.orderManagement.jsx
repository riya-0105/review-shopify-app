import {
  Page,
  BlockStack,
  Text,
  Image,
  Button,
  Select,
  Pagination,
  IndexTable,
  Layout,
  Card,
  Tabs,
  Tooltip,
  DataTable,
  TextField,
  OptionList,
  Form,
  ButtonGroup,
  Spinner,
  Box,
  Modal,
  InlineStack,
  Divider,
  Banner,
} from "@shopify/polaris";  
import { PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {queryReviewApi} from "../api/review_api";
import {fetchOrderList} from '../api/orders';
import ChartByYear from "./barChart.jsx";
import DotChart from "./dotChart.jsx";
import {
  useActionData,
  useLoaderData,
  useSubmit,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { useState, useCallback, useEffect, useRef, Fragment } from "react";
import { authenticate } from "../shopify.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import LineChart from "./line.jsx";
import ProfitLossChart from "../api/profitloss.jsx"; '../api/profitloss.jsx';
import TrendsChart from "../api/trends.jsx";

export const loader = async ({ request }) => {
  const { cors, admin } = await authenticate.admin(request);

  const productCount = 10;

  const query = `
    query {
      products(first: ${productCount}) {
        edges {
          cursor
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            priceRangeV2 {
              minVariantPrice {
                amount
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;

  const productCountQuery = `query {
    productsCount {
      count
    }
  }`;

  const resProductCount = await admin.graphql(productCountQuery);

  const allProductCountRes = await resProductCount.json();
  const allProductCount = allProductCountRes?.data?.productsCount?.count;

  const res = await admin.graphql(query);
  const allProductsData = await res.json();

  const orderList = await fetchOrderList();

  console.log("order list is: ", orderList);

  return json({ allProductsData, allProductCount, orderList });
};

export const action = async({ request }) => {
  const formData = await request.formData();
  const data = formData.get("data");
  // console.log("data is: ", data);
  const response = await queryReviewApi({ inputs: data });
  return response; 
}

const OrderManagement = () => {
  const [selected, setSelected] = useState(0);
  const [orderLimit, setOrderLimit] = useState(10);
  const [orderCancelLimit, setOrderCancelLimit] = useState(10);
  const [orderCount, setOrderCount] = useState(0);
  const [orderCancelCount, setOrderCancelCount] = useState(0);
  const [limitMonth, setLimitMonth] = useState("Jun");
  const [limitYear, setLimitYear] = useState("2024");
  const [errorLimit, setErrorLimit] = useState(false);
  const [errorCancelLimit, setErrorCancelLimit] = useState(false);
  const [dataByYear, setDataByYear] = useState('');
  const [revenueDataMonthList, setRevenueDataMonthList] = useState({
    Product: [454597, 687802, 469902, 335846, 776667, 806250, 552036, 346734, 787205, 720496, 686963, 835688],
    Services: [821687, 679306, 568503, 715827, 627459, 822625, 271114, 797991, 823966, 304521, 758665, 322694],
    Other: [426510, 767295, 799314, 408533, 353862, 261403, 344075, 277433, 289814, 386539, 625447, 489178],
  });
  const [selectedStartMonth, setSelectedStartMonth] = useState(0);
  const [orderTotal, setOrderTotal] = useState({
    totalPrice: 0,
    totalOrderCount: 0
  });
  const [selectedEndMonth, setSelectedEndMonth] = useState(11);
  const submit = useSubmit();
  const [reviewData, setReviewData] = useState([
    "Mark Howard is one of my fav Cric commentators. Glad that he is a part of the IPL commentary panel.", 
    "Rohit Sharma in IPL as dull as KL Rahul playing for the Indian team, Both have failed miserably as a batsman in the past few years, it is so much irritating as a fan I have almost stopped following MI",
    "Virat Kohli first remove his gloves and then he touched his childhood coach feet - The way Virat gave respect and love for his coach is so beautiful to see",
    "I dedicate this video i made to every other RR fan who was left heartbroken after yesterday's match. This is gonna sting us for a very long time. Credit to K.L. Saigal for giving us a song to relate to as RR fans. (Lyrics translated for English speakers)",
    "supporting RR really gives u heart ache..they find ways to lose the match..been supporting this team from almost 10 years..they come so close and yet they fck it up so itâ€™s basically in 6 matches they just won 1 match..they donâ€™t deserve to qualify for playoffs fck this sht"
  ]);
  const [reportSelected, setReportSelected] = useState(0);
  const { allProductsData, allProductCount, orderList } = useLoaderData();
  const [productsList, setProductsList] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(0); // State variable to hold the selected month index
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const [chartDataList, setChartDataList] = useState([]);
  const [chartLabelsList, setChartLabelsList] = useState([]);
  const [optionYear, setOptionYear] = useState(['2021', '2022', '2023', '2024', '2025'])

  useEffect(() => {
    const totalPrice = orderList.reduce((accumulator, order) => accumulator + parseFloat(order.totalPrice), 0);
    const totalOrderCount = orderList.length;
  
    setOrderTotal({
      totalPrice,
      totalOrderCount,
    });
  
    const getMonthYear = (dateString) => {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return { month: 'Invalid', year: 'Invalid' };
      }
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return { month, year };
    };
  
    const getAllMonthLabels = () => {
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    };
  
    const ordersByMonthAndYear = orderList.reduce((acc, order) => {
      const { month, year } = getMonthYear(order.dateTime);
      if (month === 'Invalid' || year === 'Invalid') {
        return acc; // Skip invalid dates
      }
      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][month]) {
        acc[year][month] = [];
      }
      acc[year][month].push({totalPrice: order.totalPrice, cancelDate: order.cancelDate, cancelOrder: order.cancelOrder});
      console.log("acc is: ", acc, order.cancelDate);
      return acc;
    }, {});

    console.log("data by year is: ", ordersByMonthAndYear);
    console.log("order list : ", orderList);

    setDataByYear(ordersByMonthAndYear);

    const years = Object.keys(ordersByMonthAndYear).map(Number);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // Generate an array of all years from minYear to maxYear
    const allYears = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
    
    console.log("years list is: ", allYears);

    setOptionYear(allYears);

    const averageByMonthAndYear = {};
    for (const [year, months] of Object.entries(ordersByMonthAndYear)) {
      averageByMonthAndYear[year] = Object.entries(months).map(([month, prices]) => {
        const total = prices.reduce((sum, price) => sum + price, 0);
        const average = total / prices.length;
        return { month, average };
      });
    }
  
    const labels = getAllMonthLabels();
    const datasets = Object.entries(averageByMonthAndYear).map(([year, data]) => ({
      label: year,
      data: labels.map(month => {
        const monthData = data.find(item => item.month === month);
        return monthData ? monthData.average : 0; // Set average to 0 if no data for the month
      }),
      backgroundColor: getRandomColor(),
      showLine: false,
    }));

    console.log("order limit is: ", ordersByMonthAndYear['2024'])
    if (ordersByMonthAndYear[limitYear] && ordersByMonthAndYear[limitYear][limitMonth]) {
      // Filter out orders with cancelOrder == false
      const filteredOrders = ordersByMonthAndYear[limitYear][limitMonth].filter(order => !order.cancelOrder);
      const ordersInMonth = filteredOrders.length;
    
      if (ordersInMonth < orderLimit) {
        console.log(`Orders in ${limitMonth} ${limitYear} are below the limit of ${orderLimit}. Order Count is: ${ordersInMonth}.`);
        setErrorLimit(true); 
        setOrderCount(ordersInMonth);
        console.log("order limit is: ", ordersInMonth);
      }
      else {
        console.log("it is running: ", ordersInMonth);
        setErrorLimit(false);
      }
    }
    else {
      console.log("order limit when month and year: ", orderLimit);
      setOrderCount(0);
    }

    if (ordersByMonthAndYear[limitYear] && ordersByMonthAndYear[limitYear][limitMonth]) {
      // Filter out orders with cancelOrder == false
      const filteredOrders = ordersByMonthAndYear[limitYear][limitMonth].filter(order => order.cancelOrder);
      const ordersInMonth = filteredOrders.length;
      console.log("order cancel limit is: ", ordersInMonth, orderCancelLimit);
    
      if (ordersInMonth > orderCancelLimit) {
        console.log(`Orders cancel in ${limitMonth} ${limitYear} are above the limit of ${orderCancelLimit}. Order Count is: ${ordersInMonth}.`);
        setErrorCancelLimit(true); 
        setOrderCancelCount(ordersInMonth);
        console.log("order limit is: ", ordersInMonth);
      }
      else {
        console.log("it is running: ", ordersInMonth);
        setErrorCancelLimit(false);
      }
    }
    else {
      console.log("order limit when month and year: ", orderLimit);
      setOrderCancelCount(0);
    }
  
    setChartDataList(datasets);
    setChartLabelsList(labels);
  
  }, [orderList, limitMonth, limitYear, orderLimit, orderCancelLimit]);
  

  const getMonthOptions = (startMonth) => {
    return [
      ...monthNames.slice(startMonth),
    ].map((month, index) => ({ label: month, value: (startMonth + index) }));
  };

  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex); // Update the selected month index
  };

  const handleOrderLimit = useCallback((value) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      setOrderLimit(parsedValue);
      console.log("order limit changes value is: ", parsedValue);
    }
  }, []);

  const handleOrderCancelLimit = useCallback((value) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      setOrderCancelLimit(parsedValue);
      console.log("order limit changes value is: ", parsedValue);
    }
  }, []);
  

  const handleReviewSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const formData = new FormData();
      formData.append("data", JSON.stringify(reviewData));
      // console.log("data is:", formData);
      submit(formData, { method: "post" });
    },
    [reviewData, submit]
  );

  const monthLabels = monthNames.slice(selectedStartMonth, selectedEndMonth + 1);

  const reportsTab = [
    {
      id: "income_statement",
      content: "Income Statement",
      accessibilityLabel: "All customers",
      panelID: "all-customers-content-1",
    },
    {
      id: "balance_sheet",
      content: "Balance Sheet",
      accessibilityLabel: "All customers",
      panelID: "all-customers-content-1",
    },
    {
      id: "profit_loss_projection",
      content: "Profit Loss Projection",
      accessibilityLabel: "All customers",
      panelID: "all-customers-content-1",
    },
  ];

  const tabs = [
    {
      id: "product",
      content: "Product",
      accessibilityLabel: "All customers",
      panelID: "all-customers-content-1",
    },
    {
      id: "financial",
      content: "Financial Reports",
      panelID: "all-customers-content-1",
    },
    {
      id: "order_ai",
      content: "Analysis Report",
      panelID: "all-customers-content-1",
    },
    {
      id: "help",
      content: "Help",
      panelID: "all-customers-content",
    },
  ];

  useEffect(() => {
    // console.log("order list useeffect is: ", orderList);
    const calculateRevenueData = () => {
      const updatedRevenueData = {
        Product: Array(12).fill(0),
        Services: Array(12).fill(0),
        Other: Array(12).fill(0),
      };

      orderList.forEach(order => {
        const date = new Date(order.dateTime);
        const monthIndex = date.getMonth();
        const totalPrice = order.totalPrice || 0;

        updatedRevenueData.Product[monthIndex] += totalPrice;
        // Adjust this logic if different categories should have different totals
      });
      // console.log("update list is: ", updatedRevenueData);

      setRevenueDataMonthList(updatedRevenueData);
    };

    calculateRevenueData();
  }, [orderList]);


  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelected(selectedTabIndex),
    [],
  );

  const handleReportTabChange = useCallback(
    (value) => {
      setReportSelected(value);
    },
    [reportSelected],
  );

  useEffect(() => {
    // console.log("products are: ", allProductsData);
    setProductsList(allProductsData.data.products);
  }, [allProductsData]);

  const chartData = productsList
    ? productsList.edges.map(
        (edge) => edge.node.priceRangeV2.minVariantPrice.amount,
      )
    : [];
  const chartLabels = productsList
    ? productsList.edges.map((edge) => edge.node.title)
    : [];

    const dataRows = ['Revenue'];

    const revenueData = {
      Product: [454597, 687802, 469902, 335846, 776667, 806250, 552036, 346734, 787205, 720496, 686963, 835688],
      Services: [821687, 679306, 568503, 715827, 627459, 822625, 271114, 797991, 823966, 304521, 758665, 322694],
      Other: [426510, 767295, 799314, 408533, 353862, 261403, 344075, 277433, 289814, 386539, 625447, 489178],
    };

    const revenueDataMonth = {
      Product: [454597, 687802, 469902, 335846, 776667, 806250, 552036, 346734, 787205, 720496, 686963, 835688],
      Services: [821687, 679306, 568503, 715827, 627459, 822625, 271114, 797991, 823966, 304521, 758665, 322694],
      Other: [426510, 767295, 799314, 408533, 353862, 261403, 344075, 277433, 289814, 386539, 625447, 489178],
    };

    const filteredRevenueData = {};
    Object.keys(revenueDataMonthList).forEach(category => {
      filteredRevenueData[category] = revenueDataMonthList[category].slice(selectedStartMonth, selectedEndMonth + 1);
      if (selectedStartMonth > selectedEndMonth) {
        const dataBeforeEnd = revenueDataMonthList[category].slice(0, selectedEndMonth + 1);
        filteredRevenueData[category].push(...dataBeforeEnd);
      }
    });

    // Calculate the sum for each category in the filtered data
    const sumProduct = filteredRevenueData.Product.reduce((acc, value) => acc + value, 0);
    const sumServices = filteredRevenueData.Services.reduce((acc, value) => acc + value, 0);
    const sumOther = filteredRevenueData.Other.reduce((acc, value) => acc + value, 0);

    // Assuming you want to recalculate totalRevenue and totalIncome based on the filtered data
    const totalRevenue = sumProduct + sumServices + sumOther;
    const totalIncome = 0;

    // Calculate GrossSales for each month
    const result = [];
    for (let i = 0; i < filteredRevenueData.Product.length; i++) {
      const productValue = filteredRevenueData.Product[i];
      const servicesValue = filteredRevenueData.Services[i];
      const otherValue = filteredRevenueData.Other[i];
      const resultValue = productValue + servicesValue + otherValue;
      result.push(resultValue);
    }

    // Update the revenueDataMonth object with the filtered and calculated values
    revenueDataMonthList.Product = filteredRevenueData.Product;
    revenueDataMonthList.Services = filteredRevenueData.Services;
    revenueDataMonthList.Other = filteredRevenueData.Other;

    revenueDataMonthList['Total Revenue'] = filteredRevenueData.Product; // Assuming 'Product' category represents Total Revenue
    revenueDataMonthList.GrossSales = result;
    revenueDataMonthList['Total Income'] = filteredRevenueData.Services; // Assuming 'Services' category represents Total Income

    const getRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    const handleMonthChange = (value) => {
      setLimitMonth(value);
    };
  
    // Function to handle changes in limitYear
    const handleYearChange = (value) => {
      setLimitYear(value);
    };
  

    const revenueRows = <Fragment>
      <IndexTable.Row rowType="subheader">
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="semibold" as="span">
              {dataRows}
            </Text>
          </IndexTable.Cell>
        </IndexTable.Row>
        {Object.keys(revenueDataMonthList).map((key, index) => {
    return (
      <IndexTable.Row key={index} id={key} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {key}
          </Text>
        </IndexTable.Cell>
        {revenueDataMonthList[key].map((value, idx) => (
          <IndexTable.Cell key={idx}>
            <Text as="span" alignment="end" numeric>
              ${value.toLocaleString()}
            </Text>
          </IndexTable.Cell>
        ))}
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            ${revenueDataMonthList[key].reduce((a, b) => a + b).toLocaleString()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendsChart revenueData={revenueDataMonthList} data={key}/>
          </div>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  })}
    </Fragment>

  return (
    <>
      <Box borderColor="border" borderWidth="025">
        <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}></Tabs>
      </Box>
      {selected === 0 && (
        // <div style={{ display: "flex", flexDirection: "row", width: "30rem" }}>
          <BlockStack gap={200}>
            {(errorLimit  || errorCancelLimit) && (
              <Box padding={500}>
                <Banner title="Warning" onDismiss={() => {}} tone="warning">
                <Tooltip content={`Order Count is ${orderCount}`}>
                {errorLimit && (
                  <p>Orders in {limitMonth} {limitYear} are below the limit of {orderLimit}</p>
                )}
                {errorCancelLimit && (
                  <p>Cancelled Order in {limitMonth} {limitYear} are above the limit of {orderCancelLimit}</p>
                )}
                </Tooltip>
                </Banner>
              </Box>
            )}
            <Layout>
          <Layout.Section >
            <Box>
            {/* {console.log("chartDataList: ", chartDataList, "chartLabelsList: ", chartLabelsList)} */}
            {/* <DotChart data={chartDataList} labels={chartLabelsList} /> */}
            <div style={{ margin: "0rem" }}>
            <h1>Order Data by Year</h1>
            <div style={{ display: "flex", marginLeft: "0.5rem", width: "57.5rem", backgroundColor: "white", border: "0.05rem solid black" }}>
              {dataByYear !== '' && (
                <ChartByYear dataByYear={dataByYear} />
              )}
            </div>
          </div>
          </Box>
          </Layout.Section>
        </Layout>
          </BlockStack>
        // </div>
      )}
      {selected === 1 && (
        <Box borderColor="border" borderWidth="025">
          <Tabs
            tabs={reportsTab}
            selected={reportSelected}
            onSelect={handleReportTabChange}
          ></Tabs>
          {reportSelected === 0 && (
            <>
            <Box padding="300">
            <InlineStack gap={200}>
            <Select
              label="Start Month"
              // options={monthNames.map((month, index) => ({ label: month, value: index }))}
              options={getMonthOptions(0)}
              onChange={(value) => setSelectedStartMonth(Number(value))}
              value={selectedStartMonth}
            />
            <Select
              label="End Month"
              options={getMonthOptions(selectedStartMonth)}
              onChange={(value) => setSelectedEndMonth(Number(value))}
              value={selectedEndMonth}
            />
            </InlineStack>
            </Box>
            <Box padding="300">
            <div>
            <IndexTable
              itemCount={10}
              headings={[
                { title: <div style={{ marginLeft: "4rem" }}></div> },
                ...monthLabels.map((month, index) => (
                  {
                    title: (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "2rem"
                        }}
                      >
                        {month}
                      </div>
                    )
                  }
                )),
                { title: <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "2rem" }}>2024</div> },
                { title: <div style={{ display: "flex", alignItems: "center", justifyContent: "center", maxWidth: "9rem" }}>Trends</div> }
              ]}
              selectable={false}
            >
              {revenueRows}
          </IndexTable>
            </div>
            </Box>
            </>
          )}
          {reportSelected === 2 && (
              <BlockStack gap={300}>
              <Box padding={300} style={{ display: "flex", marginLeft: "1rem", marginTop: "1rem" }} borderColor="border" borderWidth="025">
                <Box shadow="300" padding={500} style={{ display: "flex", marginLeft: "1rem", marginBottom: "1rem", width: "76rem" }} borderColor="border" borderWidth="025" width={500}>
                <div style={{ display: "flex" }}>
                    <Text variant="headingMd" as="h4">
                      Profit Loss Projection
                    </Text>
                  </div>
                  <div style={{ display: "flex", marginLeft: "auto", marginRight: "5rem" }}>
                    <Text variant="bodyMd" as="p">
                      Date
                    </Text>
                  </div>
                </Box>
            </Box>
            <div>
              <Box padding={300}>
                <Layout>
                  <Layout.Section style={{ marginLeft: "3rem", width: "5rem" }} variant="oneThird">
                    <div style={{ width: "28rem" }}>
                    <Tooltip content="Summarizes the revenues, costs, expenses, and profits/losses of a company during a specified period" width="wide">
                    <Text variant="bodyLg" as="p" style={{ marginBottom: "1rem" }}>
                      Profit & Loss Statement (YEARLY)		
                    </Text>
                    </Tooltip>
                    <Box padding={600} shadow="500" borderColor="border" borderWidth="025">
                      <div style={{ display: "flex" }}>
                      <Tooltip content="Total income that business made from all sales before subtracting expenses" width="wide">
                        <Text variant="bodyLg" as="p">
                        Total Revenue
                        </Text>
                      </Tooltip>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <div style={{ display: "flex" }}>
                        <Text variant="bodyLg" as="p">
                        Total Cost of Sales
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <Divider borderColor="border-inverse"></Divider>
                      <div style={{ display: "flex" }}>
                        <Text variant="bodyLg" as="p">
                        Gross Profit
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <div style={{ display: "flex" }}>
                        <Text variant="bodyLg" as="p">
                        Total Non-Operational Income
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <Divider borderColor="border-inverse"></Divider>
                      <div style={{ display: "flex" }}>
                      <Tooltip content="Total income is your gross income from all sources less certain deductions such as expenses, allowances and reliefs" width="wide">
                        <Text variant="headingMd" as="h6">
                        TOTAL INCOME
                        </Text>
                      </Tooltip>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <div style={{ display: "flex" }}>
                        <Text variant="bodyLg" as="p">
                        Total Operating Expenses
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <div style={{ display: "flex" }}>
                        <Text variant="bodyLg" as="p">
                        Total Non-Recurring Expenses
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <Divider borderColor="border-inverse"></Divider>
                      <div style={{ display: "flex" }}>
                      <Tooltip content="The Total Expenses metric represents the sum of all costs incurred by a business within a specific time period. It includes expenses such as wages, rent, utilities, and supplies. This metric is essential for tracking and analyzing the financial health of a company, as it provides insights into the overall spending and profitability." width="wide">
                        <Text variant="headingMd" as="h6">
                        TOTAL EXPENSES
                        </Text>
                        </Tooltip>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <div style={{ display: "flex" }}>
                        <Text variant="headingMd" as="h6">
                        TOTAL TAXES
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <Divider borderColor="border-inverse"></Divider>
                      <div style={{ display: "flex" }}>
                        <Text variant="headingMd" as="h6">
                        NET INCOME
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <div style={{ display: "flex" }}>
                        <Text variant="headingMd" as="h6">
                        DIVIDENDS
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                      <Divider borderColor="border-inverse"></Divider>
                      <div style={{ display: "flex" }}>
                        <Text variant="headingMd" as="h6">
                        NET PROFIT
                        </Text>
                        <div style={{ marginLeft: "auto", marginRight: "1rem" }}>
                        <Text variant="bodyLg" as="p">
                        ${totalRevenue}
                        </Text>
                        </div>
                      </div>
                    </Box>
                    </div>
                  </Layout.Section>
                  <Layout.Section variant="oneThird" padding="300">
                  <div style={{ marginRight: "5rem" }}>
                  <ProfitLossChart revenueData={revenueData} />
                  </div>
                  </Layout.Section>
                </Layout>
              </Box>
            </div>
            </BlockStack>
          )}
        </Box>
      )}
      {selected === 2 && (
        <BlockStack gap={300}>
          <div style={{ marginTop: "1rem", marginLeft: "1rem" }}>
          <Text variant="headingMd" as="h6">
            Analysis Report
          </Text>
          </div>
          <div style={{ marginTop: "1rem", marginLeft: "1rem" }}>
          <Text variant="bodyMd" as="p">
            Order Analysis Limit
          </Text>
          </div>
          <Box padding={10} style={{ display: "flex", marginLeft: "2rem", marginTop: "0.05rem" }} borderColor="border" borderWidth="025">
                <BlockStack gap={200}>
                  <TextField
                  type="number"
                  value={orderLimit}
                  onChange={handleOrderLimit}
                  />
                {errorLimit && (
                  <Tooltip content={`Order Count is ${orderCount}`}>
                  <Text as="p" tone="critical">
                  Orders in {limitMonth} {limitYear} are below the limit of {orderLimit}
                  </Text>
                  </Tooltip>
                )}
                <Select
              label="Select Month"
              options={[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ]}
              value={limitMonth}
              onChange={handleMonthChange}
            />
            <Select
              label="Select Year"
              options={optionYear.map(year => ({ label: year.toString(), value: year.toString() }))}
              value={limitYear}
              onChange={handleYearChange}
            />
                </BlockStack>
          </Box>
          {/* error for return  */}

          <div style={{ marginTop: "1rem", marginLeft: "1rem" }}>
          <Text variant="bodyMd" as="p">
            Order Cancel Analysis Limit
          </Text>
          </div>

          <Box padding={10} style={{ display: "flex", marginLeft: "2rem", marginTop: "0.05rem" }} borderColor="border" borderWidth="025">
                <BlockStack gap={200}>
                  <TextField
                  type="number"
                  value={orderCancelLimit}
                  onChange={handleOrderCancelLimit}
                  />
                {errorCancelLimit && (
                  <Tooltip content={`Order Count is ${orderCancelCount}`}>
                  <Text as="p" tone="critical">
                  Orders in {limitMonth} {limitYear} are below the limit of {orderCancelLimit}
                  </Text>
                  </Tooltip>
                )}
                </BlockStack>
          </Box>
          <Box>
          <div>
            <h1>Order Data by Year</h1>
            <div style={{ display: "flex", marginLeft: "0.5rem", width: "57.5rem", backgroundColor: "white", border: "0.05rem solid black" }}>
              <ChartByYear dataByYear={dataByYear} />
            </div>
          </div>
          </Box>
        </BlockStack>
      )}
    </>
  );
};

export default OrderManagement;
