import { TitleBar } from "@shopify/app-bridge-react";
import { Box, BlockStack, Text, IndexTable, TextField, Button } from "@shopify/polaris";
import { useLoaderData, useSubmit, useActionData } from "@remix-run/react";
import { PieChart, Pie, Tooltip, Cell, Legend } from "recharts";
import { useCallback, useEffect, useState } from "react";
import {scrapeAmazonReviews} from '../api/webScappingReviews.jsx';

export async function loader({ request }) {
  // const url = "https://www.amazon.in/Prolicious-Khakra-Garlic-Chorafali-Evening/product-reviews/B0B31RTFRB/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews";
  // const reviews = await scrapeAmazonReviews(url);
  // console.log("reviews data is ", data, reviews);
  return data;
}

export async function action({ request }) {
  const formData = await request.formData();
  console.log("formData of url is: ", formData.get('url'), formData.get('count'))
  const reviewList = await scrapeAmazonReviews(formData.get('url'), formData.get("count"));
  console.log("reviews list is ", reviewList);
  return reviewList;
}

function ReviewPage() {
  const data = useLoaderData();
  const reviewList = useActionData();
  const [count, setCount] = useState(20);
  const [baseUrl, setBaseUrl] = useState('');
  const [row, setRow] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const COLORS = ['#7B241C', '#F1C40F', '#2980B9'];
  const [productReviewList, setProductReviewList] = useState([]);
  const [show, setShow] = useState(false);
  const submit = useSubmit();

  useEffect(() => {
    setShow(true);
    console.log("review list in action is: ", reviewList);
    setProductReviewList(reviewList || []);
  }, [reviewList])

  useEffect(() => {
    if (data && data.length > 0) {
      const newRows = data.flatMap(product => {
        if (product.metafields && product.metafields.length > 0 && product.metafields[0].negativeReview) {
          return product.metafields[0].negativeReview.map((label, idx) => ({
            productName: idx === 0 ? product.title : '', // Show product name only for the first row
            review: idx === 0 ? product.metafields[0].value : '', // Show review only for the first row
            label: label.label,
            score: label.score,
            dataItem: label.dataItem
          }));
        }
        return [];
      });

      setRow(newRows);

      // Calculate sentiment counts
      const sentimentCounts = {
        Positive: 0,
        Neutral: 0,
        Negative: 0
      };

      newRows.forEach(row => {
        if (row.label === 'Positive') {
          sentimentCounts.Positive++;
        } else if (row.label === 'Neutral') {
          sentimentCounts.Neutral++;
        } else if (row.label === 'Negative') {
          sentimentCounts.Negative++;
        }
      });

      // Calculate percentages
      const totalCount = newRows.length;
      const percentageData = {
        Positive: (sentimentCounts.Positive / totalCount) * 100,
        Neutral: (sentimentCounts.Neutral / totalCount) * 100,
        Negative: (sentimentCounts.Negative / totalCount) * 100
      };

      setSentimentData([
        { name: 'Positive', value: percentageData.Positive },
        { name: 'Neutral', value: percentageData.Neutral },
        { name: 'Negative', value: percentageData.Negative }
      ]);
    }
  }, [data]);  

  const handleBaseUrl = useCallback((value) => {
    console.log("base url is: ", value);
    setBaseUrl(value);
  }, []);

  const handleCount = useCallback((value) => {
    console.log("base url is: ", value);
    setCount(parseInt(value));
  }, []);


  const handleBaseURLSubmit = () => {
    console.log("clicked");
    // const reviews = await scrapeAmazonReviews(baseUrl);
    const formData = new FormData();
    formData.append("url", baseUrl);
    formData.append("count", count);
    console.log("data url is: ", baseUrl, count);
    submit(formData, { method: 'post' });
  }

  // Function to calculate total negative reviews for a product
//   const getTotalNegativeReviews = (metafields) => {
//     return metafields.reduce((total, edge) => {
//       const metafield = edge.node;
//       if (metafield.negativeReview && metafield.negativeReview.length > 0) {
//         return total + 1;
//       }
//       return total;
//     }, 0);
//   };
  const rowMarkup = row.map(
    (
      {productName, review, label, score, dataItem},
      index,
    ) => (
      <IndexTable.Row
        id={productName}
        key={productName}
      >
        <IndexTable.Cell>{productName}</IndexTable.Cell>
        <IndexTable.Cell>{label}</IndexTable.Cell>
        <IndexTable.Cell>{score}</IndexTable.Cell>
        <IndexTable.Cell>{dataItem}</IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  function getStars(ratingString) {
    const rating = parseFloat(ratingString.split(' ')[0]); // Extract the numerical value from the string
    const fullStars = Math.floor(rating);
    const halfStars = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStars;

    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  return (
    <>
      <TitleBar title="Review" />
      <Box padding="300">
        <BlockStack>
          <IndexTable
                // itemCount={data.metafields.length}
                itemCount={10}
                headings={[
                  {title: 'Product Name'},
                  {title: 'Label'},
                  {title: 'Score'},
                  {title: 'Review'},
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
          </BlockStack>
          {sentimentData.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "0.25rem solid purple", width: "30rem", marginLeft: "auto", marginRight: "auto", marginTop: "5rem", backgroundColor:"#FDFEFE"}}>
              <Box padding={200}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}><Text variant="headingLg" as="h5">
                Analysis Report of Reviews
              </Text></div>
              <PieChart width={400} height={300} border={200}>
                <Pie
                  data={sentimentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                  strokeWidth={2}
                  stroke="#2C3E50" 
                >
                  {
                    sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </Box>
            </div>
          )}
      </Box>
      <Box padding={400}>
              <TextField
              label="Enter Amazon Product review Url page like https://www.amazon.in/Amazon-Brand-12-inch-Roulette-Movement/product-reviews/B076VF43GG/ref=cm_cr_getr_d_paging_btm_next_4?ie=UTF8&reviewerType=all_reviews&pageNumber=1 {No other urls are accepted}"
              value={baseUrl}
              onChange={(newValue) => handleBaseUrl(newValue)}
              autoComplete="off"
              />
              <TextField
              label="Enter Amazon Product review Url page like https://www.amazon.in/Amazon-Brand-12-inch-Roulette-Movement/product-reviews/B076VF43GG/ref=cm_cr_getr_d_paging_btm_next_4?ie=UTF8&reviewerType=all_reviews&pageNumber=1 {No other urls are accepted}"
              value={count}
              type="number"
              onChange={(newValue) => handleCount(newValue)}
              autoComplete="off"
              />
              <Button variant="secondary" onClick={handleBaseURLSubmit}>Submit</Button>
            </Box>

            {productReviewList.length > 0 && (
            <Box>
              <Text>List in action is:</Text>
              <ul>
                {productReviewList.map((review, index) => (
                  <li key={index}>
                    <div>Profile: {review.profile}</div>
                    <div>Rating: {review.rating}  <span className="stars" style={{ color: "gold", width: "2rem" }}>{getStars(review.rating)}</span></div>
                    <div>Body: {review.body}</div>
                    <div>Date: {review.date}</div>
                    <div>Helpful Votes: {review.helpfulVotes}</div>
                  </li>
                ))}
              </ul>
            </Box>
          )}
    </>
  );
}

export default ReviewPage;
