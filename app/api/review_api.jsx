// export async function queryReviewApi(decodedData) {
//     // Map each item in the decodedData array to a separate API call
//     console.log("decoded data is: ", decodedData);

//     const results = await Promise.all(decodedData.map(async (dataItem) => {
//         console.log("data is: ", dataItem);
//         const stringDataItem = dataItem.toString();
//         const response = await fetch(
//             "https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english",
//             {
//                 headers: { Authorization: "Bearer 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" },
//                 method: "POST",
//                 body: JSON.stringify({ inputs: stringDataItem }),
//             }
//         );
//         const result = await response.json();
//         result.dataItem = dataItem;
//         return result;
//     }));

//     const negativeReviews = results.filter(result => {
//         console.log("result is: ", result);
//         if (result[0]) {
//             const sentiment = result[0][0];
//             return sentiment.label === 'NEGATIVE' && sentiment.score > 0.5;
//         }
//     });

//     const negativeReviewsText = negativeReviews.map(review => review.dataItem);
//     console.log("Negative Reviews:", negativeReviews);

//     return negativeReviews;

//     // console.log(results);
//     // return results;
// }

// // (async() => {
// //     queryReviewApi(['Adhesion color', 'There is no battery for this hence you need to keep  with usb connection on for power', 'That is a drawback.', 'Dont but worst product its stopped wrking after few days', ''] )
// // })()