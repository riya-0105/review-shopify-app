import puppeteer from "puppeteer";

export async function scrapeAmazonReviews(baseUrl, count=20) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let pageNumber = 1;
  let reviews = [];

  try {
    // Check if baseUrl already contains &pageNumber and remove it if present
    // const parsedUrl = new URL(baseUrl);
    // if (parsedUrl.searchParams.has("pageNumber")) {
    //   parsedUrl.searchParams.delete("pageNumber");
    // }

    while (true) {
      // Construct the URL for the current page
      const url = `${baseUrl}&pageNumber=${pageNumber}`;
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      // Wait for the review list to be rendered
      await page.waitForSelector('.a-section');

      // Extract reviews
      const pageReviews = await page.evaluate(() => {
        const reviews = [];
        const reviewElements = document.querySelectorAll('.a-section');

        reviewElements.forEach(element => {
          try {
            const profile = element.querySelector('.a-profile-name').innerText.trim();
            const rating = element.querySelector('.review-rating').innerText.trim();
            const body = element.querySelector('.review-text').innerText.trim();
            const date = element.querySelector('.review-date').innerText.trim();
            const helpfulVotes = element.querySelector('.cr-vote-text').innerText.trim();

            reviews.push({ profile, rating, body, date, helpfulVotes });
          } catch (error) {
            console.error('Error extracting review:', error.message);
          }
        });

        return reviews;
      });

      // Append reviews from current page to main reviews array
      reviews = reviews.concat(pageReviews);

      // Check if we have fetched the desired count of reviews
      if (reviews.length >= count) {
        reviews = reviews.slice(0, count); // Trim reviews array to the desired count
        break; // Exit the loop
      }

      // Check if there is a next page
      const nextButtonDisabled = await page.evaluate(() => {
        const nextButton = document.querySelector('.a-last > li.a-disabled');
        return !!nextButton; // Return true if next button is disabled
      });

      if (nextButtonDisabled) {
        break; // Exit the loop if next page button is disabled
      }

      // Move to the next page
      pageNumber++;
    }

    console.log(`Total reviews scraped: ${reviews.length}`);
    return reviews;
  } catch (error) {
    console.error('Error scraping Amazon reviews:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

// // Example usage:
// const baseUrl = 'https://www.amazon.in/Amazon-Brand-12-inch-Roulette-Movement/product-reviews/B076VF43GG/ref=cm_cr_getr_d_paging_btm_prev_1?ie=UTF8&reviewerType=all_reviews&pageNumber=1';
// const reviewsCount = 20; // Change this to the number of reviews you want to fetch
// scrapeAmazonReviews(baseUrl, reviewsCount)
//   .then(reviews => {
//     console.log(reviews); // Process or display the reviews as needed
//   })
//   .catch(error => {
//     console.error('Error:', error);
//   });
