// import db from '../db.server.js';
import { authenticate } from '../shopify.server.js';

export async function metaFunction(request, formData) {
  const { admin } = await authenticate.admin(request);
  const products = JSON.parse(formData.get('products'));

  for (const product of products) {
    // Step 1: Fetch the current `reviewList` metafield
    const currentMetaResponse = await admin.graphql(`
      query {
        product(id: "gid://shopify/Product/${product.id}") {
          metafields(first: 100) {
            edges {
              node {
                id
                namespace
                key
                value
              }
            }
          }
        }
      }
    `);

    const currentMetaFields = currentMetaResponse.data.product.metafields.edges;
    const reviewListMeta = currentMetaFields.find(mf => mf.node.namespace === "reviewList" && mf.node.key === "reviewlist");
    
    let currentReviewList = [];
    if (reviewListMeta) {
      currentReviewList = JSON.parse(reviewListMeta.node.value);
    }

    // Step 2: Append the new review to the current list
    const newReviews = product.reviews;  // Assuming `product.reviews` contains the new reviews to be added
    const updatedReviewList = [...currentReviewList, ...newReviews];

    // Step 3: Update the `reviewList` metafield with the new combined list
    const metaResponse = await admin.graphql(`
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            metafields(first: 100) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: {
        input: {
          id: product.id,
          metafields: [
            {
              namespace: "reviewList",
              key: "reviewlist",
              value: JSON.stringify(updatedReviewList),
              type: "json_string",
            },
          ],
        },
      },
    });

    const metaData = await metaResponse.json();
    console.log(
      "Updated metafield data: ",
      metaData.data.productUpdate.product.metafields.edges,
      metaData.data.productUpdate.userErrors,
    );
  }
}
