// import axios from "axios";
// import prisma from "../db.server.js";

// const shop = "orderlimitstore.myshopify.com";

// const getSessionTokenForShop = async (shop) => {
//   const session = await prisma.session.findFirst({
//     where: {
//       shop: shop,
//     },
//   });
//   return session ? session : null;
// };

// export const fetchProducts = async (cursor=null) => {
//   try {
//     const session = await getSessionTokenForShop();

//     const shopName = session ? session.shop : null;
//     const accessToken = session ? session.accessToken : null;

//     if(!accessToken) {
//       return [];
//     }

//     const query = `
//       query AllProducts($cursor: String) {
//         products(first: 10, after: $cursor) {
//           edges {
//             cursor
//             node {
//               id
//               title
//               variants(first: 250) {
//                 edges {
//                   node {
//                     id
//                     image {
//                       url
//                     }
//                     price
//                     inventoryQuantity
//                     title
//                   }
//                 }
//               }
//               category {
//                 name
//                 id
//               }
//               totalInventory
//               priceRangeV2 {
//                 maxVariantPrice {
//                     amount
//                 }
//                 minVariantPrice {
//                     amount
//                 }
//               }
//               images(first: 1) {
//                 edges {
//                   node {
//                     url
//                   }
//                 }
//               }
//             }
//           }
//           pageInfo {
//             hasNextPage
//             hasPreviousPage
//             startCursor
//             endCursor
//           }
//         }
//       }
//     `;

//     const url = `https://${shopName}/admin/api/2024-04/graphql.json`;

//     const response = await axios.post(
//       url,
//       { query: query },
//       {
//         headers: {
//           "X-Shopify-Access-Token": accessToken,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.data || !response.data.data) {
//       console.error("Invalid response data:", response.data);
//       return [];
//     }

//     const productsData = [];
//     const shopMetafields = response.data.data.shop?.metafields?.edges || [];

//     response.data.data.products.edges.forEach((edge) => {
//       const product = edge.node;

//       const productData = {
//         id: product.id,
//         title: product.title,
//         image: product.images.edges.length > 0 ? product.images.edges[0].node.url : null,
//         price: {
//           amount: product.priceRangeV2.maxVariantPrice.amount,
//           currencyCode: product.priceRangeV2.maxVariantPrice.currencyCode,
//         },
//         totalInventory: product.totalInventory,
//         categoryName: product.category ? product.category.name : null,
//         categoryId: product.category ? product.category.id : null,
//         startCursor: response.data.data.products.pageInfo.startCursor,
//         endCursor:  response.data.data.products.pageInfo.startCursor,
//         hasPrevPage:  response.data.data.products.pageInfo.hasPreviousPage,
//         hasNextPage:  response.data.data.products.pageInfo.hasNextPage,
//         variants: product.variants.edges.map(variantEdge => {
//           const variant = variantEdge.node;
//           let totalAvailable = 0; // Default value

//           // Find the productVariantInfo metafield
//           const productVariantInfoMetafield = shopMetafields.find(metafield =>
//             metafield.node.namespace === "productVariantInfo" &&
//             metafield.node.key === "productVariantInfo"
//           );

//           // If productVariantInfo metafield is found, parse its value
//           if (productVariantInfoMetafield) {
//             const productVariantInfo = JSON.parse(productVariantInfoMetafield.node.value);

//             // Find the variant's productCount from productVariantInfo
//             const productCount = productVariantInfo.find(info => info.productId === variant.id)?.productCount;
//             if (productCount !== undefined) {
//               totalAvailable = parseInt(productCount);
//             }
//           }

//           return {
//             id: variant.id,
//             title: variant.title,
//             price: variant.price,
//             image: variant.image ? variant.image.url : null,
//             inventoryQuantity: variant.inventoryQuantity,
//             totalAvailable: totalAvailable,
//           };
//         }),
//       };

//       productsData.push(productData);
//     });

//     console.log("products are: ", productsData);
//     return productsData; // Return the productsData
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     throw error; // Propagate the error
//   }
// };

// // (async () => {
// //   const productData = await fetchProducts(); 
// //   console.log(productData);
// // })();

// // export default fetchProducts;
