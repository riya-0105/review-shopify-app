import axios from "axios";
import prisma from "../db.server.js";

const shop = "orderlimitstore.myshopify.com";

const getSessionTokenForShop = async (shop) => {
  const session = await prisma.session.findFirst({
    where: {
      shop: shop,
    },
  });
  return session ? session : null;
};

const fetchProductImage = async (productId, dataUrl) => {
  try {
    const session = await getSessionTokenForShop();

    const shopName = session ? session.shop : null;
    const accessToken = session ? session.accessToken : null;

    if(!accessToken) {
      return [];
    }

    const imageUrl = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
    // console.log("data is: ", imageUrl, productId);

    const productID = productId.match(/\d+$/)[0];

    // console.log("data is: ", imageUrl, productId);


    const image = {
            "product_id": productID,
            "position": 1,
            "filename":"image.jpeg",
            "attachment": imageUrl
        }

    // console.log("image is: ", image);
    
    const url = `https://ai-image-blog-generation.myshopify.com/admin/api/2024-04/products/${productID}/images.json`;

    const response = await axios.post(
        url,
        { image },
        {
            headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-Type": "application/json",
            },
        }
    );

    // console.log("response: ", response.data);
    return "";
  } catch (error) {
    // console.error("Error fetching:", error);
    throw error; // Propagate the error
  }
};

// (async () => {
//   const productId = "7252390314070";
//   const productData = await fetchProductImage(productId, dataUrl); 
// //   console.log(productData);
// })();

export default fetchProductImage;
