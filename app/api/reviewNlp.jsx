import natural from 'natural';

const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

function interpretSentiment(score) {
    if (score > 0) return "Positive";
    if (score === 0) return "Neutral";
    if (score < 0) return "Negative";
}

export async function queryReviewApi(reviews) {
    const results = await Promise.all(reviews.map(async (review) => {
        const stringDataItem = review.body.toString();
        const words = stringDataItem.split(" ");
        const resultData = analyzer.getSentiment(words); // Pass the array of words
        const label = interpretSentiment(resultData);
        return { profile: review.profile, label, score: resultData, body: review.body };
    }));

    console.log("results:", results);
    return results;
}

// Define the reviews array
// const reviews = [
//     { profile: "Gaurav kumar", rating: 5.0, body: "Love the quality, Size can be worked on. But definitely Good product, must buy", date: "Reviewed in India on 11 April 2021", helpfulVotes: 2 },
//     { profile: "Himansu", rating: 4.0, body: "It’s a good Product.. very nice .. price is little high but it’s ok .. size is perfect.", date: "Reviewed in India on 28 January 2022", helpfulVotes: 2 },
//     // Add more reviews as needed
// ];

// Call the queryReviewApi function with the reviews array
// (async () => {
//     const sentimentResults = await queryReviewApi(reviews);
//     console.log("Sentiment Analysis Results:", sentimentResults);
// })();
