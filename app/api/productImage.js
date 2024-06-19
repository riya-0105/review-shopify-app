import fetch from 'node-fetch';

const fetchProductImage = async (productId, dataUrl) => {
  try {
    const shopAccessToken = "shpua_31b5154e4709a98cb8df34bb39ba1f36";

    const imageUrl = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
    const productID = productId.match(/\d+$/)[0];
    const url = `https://ai-image-blog-generation.myshopify.com/admin/api/2024-04/products/${productID}/images.json`;

    const image = {
      product_id: productID,
      position: 1,
      filename: "image.jpeg",
      attachment: imageUrl
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": shopAccessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image })
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    console.log("Image uploaded successfully");
    return "";
  } catch (error) {
    console.error("Error fetching:", error);
    throw error; // Propagate the error
  }
};

export { fetchProductImage };
