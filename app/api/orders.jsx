import fetch from 'node-fetch';

const fetchOrderList = async () => {
  try {
    const shopAccessToken = "shpua_31b5154e4709a98cb8df34bb39ba1f36";
    const url = `https://ai-image-blog-generation.myshopify.com/admin/api/2024-04/orders.json?status=any`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": shopAccessToken,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    const responseData = await response.json();

    const orders = responseData.orders;

    const formattedOrders = orders.map(order => {
        const orderId = order.id;
        const orderNumber = order.order_number;
        const closedAt = order.created_at;
        console.log("closed at time is: ", order.created_at);
        const dateObject = new Date(closedAt);
        const cancelledDate = order.cancelled_at;
        const dateCancelledObject = new Date(cancelledDate);
        let formattedCancelledDateTime = null;
        let cancelledOrder = false;

        if(cancelledDate !== null) {
          cancelledOrder = true;
          formattedCancelledDateTime = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          }).format(dateCancelledObject);
        }

        console.log("cancelled date: ", formattedCancelledDateTime, cancelledOrder);
  
        // Format the date and time according to your specified format
        const formattedDateTime = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(dateObject);

        console.log("closed at time is: ", formattedDateTime);
  
        let totalPrice = `${order.current_subtotal_price ? order.current_subtotal_price : 0}`;
        console.log("total price of: ",  totalPrice);
        // order.line_items.forEach(item => {
        //   totalPrice += parseFloat(item.price); // Accumulate total price
        // });
  
        // Return an object with required fields
        return {
          orderId,
          orderNumber,
          dateTime: formattedDateTime,
          totalPrice,
          cancelDate: formattedCancelledDateTime,
          cancelOrder: cancelledOrder,
        };
      });
  
      // Log or return the formattedOrders array
      console.log("Formatted Orders:", formattedOrders);
      return formattedOrders;
  } catch (error) {
    console.error("Error fetching:", error);
    throw error; // Propagate the error
  }
};

// (async() => {
//     await fetchOrderList();
// })()

export { fetchOrderList };
