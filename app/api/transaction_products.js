import fetch from 'node-fetch';

const fetchOrderList = async () => {
  try {
    const shopAccessToken = "shpua_31b5154e4709a98cb8df34bb39ba1f36";
    const url = `https://ai-image-blog-generation.myshopify.com/admin/api/2024-04/shopify_payments/balance/transactions.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": shopAccessToken,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order list: ${response.status}`);
    }

    // const data = await response.json();
    console.log("Order list fetched successfully:", response);
    return [];
  } catch (error) {
    console.error("Error fetching order list:", error);
    throw error; // Propagate the error
  }
};

(async () => {
  try {
    await fetchOrderList();
  } catch (error) {
    // Handle error here
    console.error("Error in fetching orders:", error);
  }
})();

export { fetchOrderList };
