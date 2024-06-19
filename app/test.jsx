// // import { authenticate } from "./shopify.server.js";
// // import he from "he";
// // import { queryReviewApi } from "./api/reviewNlp.jsx";

// // export async function metaFunction(request) {
// //   const { admin } = await authenticate.admin(request);
// //   const formData = await request.formData();


// //   // // Extract text
// //   // let text = "";
// //   // jsonData.reviews.recent.forEach((review) => {
// //   //   const decodedReviewBody = he.decode(review.body); // Decode HTML entities in review body
// //   //   text += decodedReviewBody + ". ";
// //   // });

// //   // console.log("decoded data is: ", text, typeof text);

// //   // const reviewList = text.split(". ");
// //   // console.log("decoded data is: ", reviewList, typeof reviewList);

// //   // const negativeSentiments = await queryReviewApi(reviewList);
// //   // console.log("negative reviews", negativeSentiments);

// //   const currentMetaResponse = await admin.graphql(`
// //     query {
// //       products(first: 100) {
// //         nodes {
// //           id
// //           title
// //           category {
// //             id
// //             name
// //           }
// //           featuredImage {
// //             url
// //           }
// //           availablePublicationsCount {
// //             count
// //           }
// //           priceRangeV2 {
// //             maxVariantPrice {
// //               amount
// //               currencyCode
// //             }
// //           }
// //           variants(first: 100) {
// //             nodes {
// //               id
// //               title
// //               price
// //             }
// //           }
// //           priceRange {
// //             minVariantPrice {
// //               amount
// //               currencyCode
// //             }
// //             maxVariantPrice {
// //               amount
// //               currencyCode
// //             }
// //           }
// //           metafields(first: 100) {
// //             edges {
// //               node {
// //                 id
// //                 key
// //                 value
// //               }
// //             }
// //           }
// //           totalInventory
// //         }
// //       }
// //     }
// //   `);

// //   const jsonResponse = await currentMetaResponse.json();
// //   const products = jsonResponse.data.products.nodes;

// //   const calculateReviewsCount = (value) => {
// //     return parseInt(value, 10);
// //   };
  
// //   // Log reviews count for each product
// //   products.forEach(product => {
// //     console.log("review count is: ", product.metafields);
// //     if(product.metafields.edges.length > 0) {
// //       console.log("review is: ", product.metafields.edges);
// //       const reviewsCount = calculateReviewsCount(product.metafields.edges.find(meta => meta.key === 'reviews_count'));
// //       const reviewsAverage = calculateReviewsCount(product.metafields.edges.find(meta => meta.key === 'reviews_average'));
// //       console.log(`Product: ${product.title}, Reviews Count: ${reviewsCount}, Reviews Average: ${reviewsAverage}`);
// //     }
// //   });

// //   // Create an array to store product titles and metafields
// //   const productList = [];

// //   const metaResponseJson = await metaResponse.json();
// //   console.log("data is: ", metaResponseJson.data.productUpdate.product);

// //   // Iterate over each product to extract title and metafields
// //   await Promise.all(products.map(async (product) => {
// //     let metafields = [];
// //     const productID = product.id;
// //     const title = product.title;
// //     console.log("length is: ", product.metafields.edges.length);
// //     if (product.metafields && product.metafields.edges && product.metafields.edges.length > 0) {
// //       metafields = await Promise.all(
// //         product.metafields.edges.map(async (edge) => {
// //           console.log("edge is: ", edge.node.key);
// //           if (edge.node.key === "product_plugin") {
// //             console.log("key is: ", edge.node.key);
// //             const decodedData = he.decode(edge.node.value);
// //             // Parse JSON
// //             const jsonData = JSON.parse(decodedData);

// //             // Extract text
// //             let text = "";
// //             jsonData.reviews.recent.forEach((review) => {
// //               const decodedReviewBody = he.decode(review.body); // Decode HTML entities in review body
// //               text += decodedReviewBody + ". ";
// //             });

// //             console.log("decoded data is: ", text, typeof text);

// //             const reviewList = text.split(". ");
// //             console.log("decoded data is: ", reviewList, typeof reviewList);

// //             const negativeSentiments = await queryReviewApi(reviewList);

// //             console.log("negative reviews", negativeSentiments);
// //             return {
// //               id: edge.node.id,
// //               key: edge.node.key,
// //               value: reviewList,
// //               negativeReview: negativeSentiments,
// //             };
// //           } else {
// //             return null;
// //           }
// //         }),
// //       );
// //       metafields = metafields.filter(metafield => metafield !== null);
// //     }
// //     console.log("metafields lists are: ", metafields)
// //     productList.push({ productID, title, metafields: metafields });
// //   }));

// //   console.log("Product List: ", productList);
// //   return productList;
// // }


// import { authenticate } from "./shopify.server.js";
// import db from './db.server.js';
// import he from "he";
// // import { queryReviewApi } from "./api/reviewNlp.jsx";

// export async function metaFunction(request) {
//   const { admin } = await authenticate.admin(request);
//   const formData = await request.formData();
//   console.log("formdata id: ", formData.get("Id"));
//   const productId = formData.get("Id");

//   const currentMetaResponse = await admin.graphql(`
//     query {
//       product(id: ${productId}) {
//         id
//         title
//         metafields(first: 100) {
//           edges {
//             node {
//               id
//               key
//               value
//             }
//           }
//         }
//       }
//     }
//   `,);

//   const jsonResponse = await currentMetaResponse.json();
//   const product = jsonResponse.data.product;

//   let metafields = [];
//   const title = product.title;

//   if (product.metafields && product.metafields.edges && product.metafields.edges.length > 0) {
//     metafields = await Promise.all(
//       product.metafields.edges.map(async (edge) => {
//         if (edge.node.key === "review_list") {

//           const newReview = formData.get("reviewList");

//           const combinedReviews = [...existingReviews, newReview];

//           await admin.graphql(
//             `mutation productUpdate($input: ProductInput!) {
//               productUpdate(input: $input) {
//                 product {
//                   id
//                   metafields(first: 250) {
//                     edges {
//                       node {
//                         id
//                         key
//                         value
//                       }
//                     }
//                   }
//                 }
//                 userErrors {
//                   field
//                   message
//                 }
//               }
//             }`,
//             {
//               variables: {
//                 input: {
//                   id: product.id,
//                   metafields: [
//                     {
//                       key: "review_list",
//                       value: JSON.stringify(combinedReviews),
//                       type: "string",
//                     },
//                   ],
//                 },
//               },
//             }
//           );

//           return {
//             id: edge.node.id,
//             key: edge.node.key,
//             value: combinedReviews,
//           };
//         } else {
//           return null;
//         }
//       }),
//     );
//     metafields = metafields.filter(metafield => metafield !== null);
//   }
//   const productList = [{ productID: product.id, title, metafields }];
//   console.log("product list: ", productList);

//   return productList;
// }
