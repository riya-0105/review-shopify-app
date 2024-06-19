import {
  Page,
  BlockStack,
  Text,
  Image,
  Button,
  Pagination,
  IndexTable,
  Layout,
  Card,
  TextField,
  OptionList,
  Form,
  ButtonGroup,
  Spinner,
  Box,
  Modal,
  InlineStack,
} from "@shopify/polaris";
import 'react-image-crop/dist/ReactCrop.css';
import '../css/app.css';
import ReactCrop from 'react-image-crop';
import {
  useActionData,
  useLoaderData,
  useSubmit,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { useState, useCallback, useEffect, useRef } from "react";
import { authenticate } from "../shopify.server";
import { query } from "../image.generate";
import { useAppBridge } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import fetchProductImage from '../api/image';
import { getGroupedBase64Images } from '../api/image_rembg.js';
import { loadAllCSVs, getUniqueProductTypes } from '../api/imageFunction.js';

export const loader = async ({ request }) => {
  const { cors, admin } = await authenticate.admin(request);

  const productCount = 10;

  const query = `
    query {
      products(first: ${productCount}) {
        edges {
          cursor
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            priceRangeV2 {
              minVariantPrice {
                amount
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;

  const productCountQuery = `query {
    productsCount {
      count
    }
  }`;

  const resProductCount = await admin.graphql(productCountQuery);


  const allProductCountRes = await resProductCount.json();
  const allProductCount = allProductCountRes?.data?.productsCount?.count;

  // const variables = { cursor: "" };
  const res = await admin.graphql(query);
  const allProductsData = await res.json();
  // console.log("data is: ", allProductsData);
  const groupedBase64 = getGroupedBase64Images();
  const productsFromCSV = await loadAllCSVs();
  const uniqueProductTypes = getUniqueProductTypes(productsFromCSV);
  const blobUrlsList = {...groupedBase64, ...uniqueProductTypes};
  // console.log("product count is: ", allProductCount);
  return cors(json({ allProductsData, blobUrlsList, allProductCount, productCount, uniqueProductTypes }));
};

export const action = async ({ request }) => {
  const { cors, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  if (formData.get("cursor")) {
    const cursor = formData.get("cursor");
    const page = formData.get("page");

    const query = `
    query {
      products(${page === `nextPage` ? `first: 10, after: "${cursor}"` : `last: 10, before: "${cursor}"`}) {
        edges {
          cursor
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            priceRangeV2 {
              minVariantPrice {
                amount
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;

    // const variables = { cursor };
    const res = await admin.graphql(query);
    const allProductsData = await res.json();

    return cors(json({ allProductsData }));
  } 
  else if(formData.get('productCount')) {
    const query = `
    query {
      products(first: ${formData.get('productCount')}) {
        edges {
          cursor
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            priceRangeV2 {
              minVariantPrice {
                amount
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;
    const res = await admin.graphql(query);
    const allProductsData = await res.json();
    const productCount =  formData.get('productCount');

    return cors(json({ allProductsData, productCount }));
  }
  else {
    const imagePrompt = formData.get("imagePrompt");
    // console.log("the prompt is: ", imagePrompt);
    const imageBytes = await query({ inputs: imagePrompt });
    // console.log("image Bytes are: ", imageBytes);

    if (formData.get("generateProduct")) {
      // console.log("formData is: ", formData);
      // console.log("the image is: ", formData.get("imageUrl"));
      // console.log("request received");
      // const { admin } = await authenticate.admin(request);
      // const response = await admin.graphql(
      //   `#graphql
      //   mutation populateProduct($input: ProductInput!) {
      //       productCreate(input: $input) {
      //           product {
      //               id
      //               title
      //               handle
      //               status
      //               variants(first: 10) {
      //                   edges {
      //                       node {
      //                       id
      //                       price
      //                       barcode
      //                       createdAt
      //                       }
      //                   }
      //               }
      //           }
      //       }
      //   }`,
      //   {
      //     variables: {
      //       input: {
      //         title: formData.get("productTitle"),
      //       },
      //     },
      //   },
      // );
      // const responseJson = await response.json();

      // console.log("response json is: ", responseJson);

      // const productId = responseJson.data?.productCreate?.product?.id;
      const productId = formData.get('productId');
      // console.log("product: ", productId);
      const action = await fetchProductImage(
        productId,
        formData.get("imageUrl"),
      );

      // console.log("action: ", action);

      // const variantId =
      //   responseJson.data.productCreate.product.variants.edges[0].node.id;
      // const variantResponse = await admin.graphql(
      //   `#graphql
      //       mutation shopifyRemixTemplateUpdateVariant($input: ProductVariantInput!) {
      //           productVariantUpdate(input: $input) {
      //           productVariant {
      //               id
      //               price
      //               barcode
      //               createdAt
      //           }
      //           }
      //       }`,
      //   {
      //     variables: {
      //       input: {
      //         id: variantId,
      //         price: Math.random() * 100,
      //       },
      //     },
      //   },
      // );
      // const variantResponseJson = await variantResponse.json();

      return json({
        product: formData.get("productId"),
        variant: null,
        imageBytes,
      });
    } else {
      return json({
        product: null,
        variant: null,
        imageBytes,
      });
    }
  }
};


export default function ProductList() {
  // variable
  const [searchQuery, setSearchQuery] = useState("");
  const [searchValue, setSearchValue] = useState('');
  const [overlayBackgroundImage, setOverlayBackgroundImage] = useState(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const { allProductsData, blobUrlsList, allProductCount, productCount, uniqueProductTypes } = useLoaderData();
  const [blobUrlList, setBlobUrlList] = useState([]);
  const [productInput, setProductInput] = useState('');
  const productNextData = useActionData();
  const submit = useSubmit();
  const [productList, setProductList] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const actionData = useActionData() ?? null;
  const [imageUrl, setImageUrl] = useState(
    "https://st2.depositphotos.com/1561359/12101/v/950/depositphotos_121012076-stock-illustration-blank-photo-icon.jpg",
  );
  const [rotationValue, setRotationValue] = useState(0);
  const [imageEditorUrl, setImageEditorUrl] = useState(
    "https://st2.depositphotos.com/1561359/12101/v/950/depositphotos_121012076-stock-illustration-blank-photo-icon.jpg",
  );
  const [editOptionSelected, setEditOptionSelected] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [editImageTemp, setEditImageTemp] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [dataReceived, setDataReceived] = useState(false);
  const [image, setImage] = useState(null);
  const [warning, setWarning] = useState(false);
  const [crop, setCrop] = useState({ aspect: 1 / 1 });
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState([]);
  const [productCountButton, setProductCountButton] = useState(false);
  const [brightnessValue, setBrightnessValue] = useState(100);
  const [blurValue, setBlurValue] = useState(10);
  const [greyScaleValue, setGreyScaleValue] = useState(100);
  const [saturationValue, setSaturationValue] = useState(100);
  const [editImage,  setEditImage] = useState('');
  const [filterProductRows, setFilterProductRows] = useState(productList);
  const [imageSize, setImageSize] = useState({
    width: "15rem",
    height: "15rem",
  });
  const canvasRef = useRef(null);
  const optionsList = [
    { value: { width: "17rem", height: "14rem" }, label: "landscape" },
    { value: { width: "14rem", height: "17rem" }, label: "portrait" },
    { value: { width: "15rem", height: "15rem" }, label: "square" },
  ];
  const [productTitle, setProductTitle] = useState("");
  const navigate = useNavigate();
  const nav = useNavigation();
  const [productCountQuery, setProductCountQuery] = useState("10");
  const shopify = useAppBridge();
  const [uniqueProductList, setUniqueProductList] = useState(null);
  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const productId = actionData?.product;
  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  useEffect(() => {
    if (actionData && actionData.imageBytes) {
      setLoading(false);
      const base64Image = btoa(
        String.fromCharCode.apply(
          null,
          new Uint8Array(actionData.imageBytes.data),
        ),
      );
      const url = `data:image/jpeg;base64,${base64Image}`;
      setImageUrl(url);
      // setEditImageTemp(url);
    }
  }, [actionData]);

  useEffect(() => {
    if(blobUrlsList) {
      // console.log("blob urls are: ", blobUrlsList);
      setBlobUrlList(blobUrlsList);
    }
  }, [blobUrlsList]);

  useEffect(() => {
    if(uniqueProductTypes) {
      setUniqueProductList(uniqueProductTypes);
    }
  }, [uniqueProductTypes])

  const handleChange = useCallback((newValue) => {setImagePrompt(newValue); setProductTitle(imagePrompt)}, []);

  const handleSubmit = useCallback(
    (event) => {
      setLoading(true);
      event.preventDefault();
      const formData = new FormData();
      formData.append("imagePrompt", imagePrompt);
      submit(formData, { method: "post" });
    },
    [imagePrompt, submit],
  );

  useEffect(() => {
    // console.log("selected is: ", String(selected[0]));
    // optionsList.map((option) => {
    //   console.log("value is: ", option.label);
    // });
    // console.log("The list is: ", optionsList);
    const selectedOption = optionsList.find(
      (option) => option.label == selected[0],
    );
    // console.log("Selected value is: ", selectedOption);
    if (selectedOption && selectedOption.value) {
      setImageSize(selectedOption.value);
    }
    // console.log("image is: ", imageSize);
  }, [selected]);

  const handleDownloadImage = async () => {
    const canvas = document.createElement("canvas");
    const image = document.querySelector(".generated_image");
    // console.log("image is: ", image);
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = 220 * scaleY;
    canvas.height = 220 * scaleX;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(URL.createObjectURL(blob));
      }, "image/png");
    });
  };

  const downloadImage = async () => {
    const blobUrl = await handleDownloadImage();
    // console.log("blob url is: ", blobUrl);
    // const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = productTitle + ".png";
    //   link.href = canvas.toDataURL();
    link.href = blobUrl;
    link.click();
  };

  const handleGenerateProductSubmit = useCallback(
    async (event) => {
      // console.log("data");
      setLoading(true);
      event.preventDefault();
      const formData = new FormData();
      // Convert the base64 image URL to a Blob object
      const blob = await fetch(imageUrl).then((response) => response.blob());

      // Create a Blob URL from the Blob object
      const blobUrl = URL.createObjectURL(blob);
      // console.log("blob data is: ", blob, blobUrl);
      // console.log("passed data is: ", imageUrl);
      formData.append("imageUrl", imageUrl);
      formData.append("generateProduct", String(true));
      formData.append("productTitle", productTitle);
      formData.append("imagePrompt", imagePrompt);
      formData.append("productId", productInput);
      // for (const pair of formData.entries()) {
      //   console.log(pair[0] + ", " + pair[1]);
      // }
      submit(formData, { method: "post" });
    },
    [submit, imageUrl, imagePrompt],
  );

  const handleEditImage = () => {
    // console.log("redirect");
    // console.log("image url is: ", imageUrl);
    // setImageUrl(croppedImageUrl);
    setImageEditorUrl(imageUrl);
    setEditImage(imageEditorUrl);
    setEditModal(true);
    // navigate(`/app/editImage?productId=${productId}&imageUrl=${encodeURIComponent(imageUrl)}`);
  };

  // const handleProductTitle = useCallback(
  //   (newValue) => setProductTitle(newValue),
  //   [productTitle],
  // );

  // function

  const handleSearchChange = useCallback(
    (newValue) => {
      setSearchQuery(newValue);
      setSearchValue(newValue);
      filteredProductRows(newValue);
    },
    [filterProductRows] // Include filterRows as a dependency
  );

  useEffect(() => {
    // console.log("error here!!");
    if (productNextData && productNextData.allProductsData) {
      // console.log("next data is: ", productNextData);
      setLoading(false);
      setPageInfo(productNextData.allProductsData.data.products.pageInfo);
      setProductList(productNextData.allProductsData.data.products.edges);
      setProductCountQuery(productCount);
    } else if (allProductsData && allProductsData?.data?.products) {
      // console.log("page info is: ", allProductsData.data.products.pageInfo);
      setPageInfo(allProductsData.data.products.pageInfo);
      setProductList(allProductsData.data.products.edges);
    }

    if(productNextData && productNextData.productCount) {
      setProductCountQuery(productNextData.productCount);
    }
  }, [allProductsData]);

  useEffect(() => {
    if (productNextData && productNextData?.allProductsData) {
      setLoading(false);
      setPageInfo(productNextData.allProductsData.data.products.pageInfo);
      setProductList(productNextData.allProductsData.data.products.edges);
    }
    if(productNextData && productNextData.productCount) {
      setProductCountQuery(productNextData.productCount);
    }
  }, [productNextData]);

  const handleGenerateImage = (productID) => {
    setModal(true);
    setProductInput(productID);
  };

  const handleNextPage = () => {
    // console.log("clicked");
    if (pageInfo.hasNextPage) {
      setLoading(true);
      const lastEdge = productList[productList.length - 1];
      const formData = new FormData();
      formData.append("cursor", lastEdge.cursor);
      formData.append("page", "nextPage");
      // formData.append("productCount", productCountQuery);
      // for (const pair of formData.entries()) {
      //   console.log(pair[0] + ", " + pair[1]);
      // }
      submit(formData, { method: "post" });
    }
  };

  const handleEditModalClose = useCallback(() => {
    setEditModal(false);
  }, [editModal]);

  const handleModalChangesSubmit = () => {
    setImageUrl(editImageTemp);
    setEditModal(false);
  }

  const handleModalClose = useCallback(() => {
    setModal(false);
  }, [modal]);

  const handlePageCountSubmit = () => {
    const formData = new FormData();
    formData.append('productCount', productCountQuery);
    submit(formData, { method: "post" });
  }

  const handlePreviousPage = () => {
    if (pageInfo.hasPreviousPage) {
      setLoading(true);
      const firstEdge = productList[0];
      const formData = new FormData();
      formData.append("cursor", firstEdge.cursor);
      formData.append("page", "prevPage");
      // for (const pair of formData.entries()) {
      //   console.log(pair[0] + ", " + pair[1]);
      // }
      submit(formData, { method: "post" });
    }
  };

  const handleProductQueryCount = useCallback((value) => {setProductCountQuery(String(value))}, [productCountQuery]);


  const handleCropComplete = (crop) => {
    makeClientCrop(crop);
  };

  const handleBrightness = (event) => {
    const value = event.target.value;
    // console.log("brightness value: ", value);
    setBrightnessValue(value);
  };

  const handleSaturation = (event) => {
    const value = event.target.value;
    // console.log("brightness value: ", value);
    setSaturationValue(value);
  };

  const handleBlur = (event) => {
    const value = event.target.value;
    // console.log("brightness value: ", value);
    setBlurValue(value);
  };

  const handleGreyScale = (event) => {
    const value = event.target.value;
    // console.log("brightness value: ", value);
    setGreyScaleValue(value);
  };


  const makeClientCrop = async (crop) => {
    if (imageUrl && crop.width && crop.height) {
      const croppedImage = await getCroppedImg(crop);
      const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };
      const cropImage = await blobToBase64(croppedImage);
      // console.log("cropped image is: ", cropImage);
      setCroppedImageUrl(cropImage);
    }
  };


  const getCroppedImg = (crop) => {
    const canvas = document.createElement('canvas');
    const image = document.querySelector('.image_to_crop');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob error'));
        }
      }, 'image/png');
    });
  };

  // const handleImageChange = (event) => {
  //   let file = event.target.files[0];
  //   if(!file) return;
  //   const reader = new FileReader();
  //   reader.addEventListener("load", () => {
  //     setImageUrl(reader.result?.toString() || "");
  //     console.log(reader.result?.toString() || "");
  //   });
  //   // console.log(event.target.files);
  //   reader.readAsDataURL(file);
  //   // setImageUrl(URL.createObjectURL(event.target.files[0]));
  // };

  const handleDismiss = () => {
    // console.log("image: ", editImage);
    // setImageUrl(editImage);
    setEditImageTemp(editImage);
    setDataReceived(false);
  };

  const handleSave = () => {
    setImageUrl(croppedImageUrl);
    setEditModal(false);
  }


  const handleDownload = () => {
    // console.log("download");
    // console.log("image url is: ", croppedImageUrl);
    if (croppedImageUrl) {
      const link = document.createElement('a');
      link.href = croppedImageUrl;
      // console.log("cropped image is: ", croppedImageUrl);
      link.download = 'cropped-image.png';
      link.click();
    }
  };

  // ---------------------------------------------------------------------------


  const handleRmSubmit = async (event) => {
    event.preventDefault();
  
    function base64ToFile(base64String, fileName) {
      // Decode the base64 string to binary data
      const byteString = atob(base64String.split(',')[1]);
  
      // Extract the MIME type
      const mimeString = base64String.split(',')[0].split(':')[1].split(';')[0];
  
      // Create an ArrayBuffer and a Uint8Array
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
  
      // Write the bytes to the Uint8Array
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
  
      // Create a Blob from the Uint8Array
      const blob = new Blob([arrayBuffer], { type: mimeString });
  
      // Create a File from the Blob
      return new File([blob], fileName, { type: mimeString });
    }
  
    // Convert the base64 image URL to a File object
    const imageData = base64ToFile(imageUrl, "temp.jpeg");
    
    // Set the file in state (if you need to use it elsewhere)
    setImageFile(imageData);
  
    if (imageData) {
      // console.log("Uploading...");
      setLoading(true);
  
      const formData = new FormData();
      formData.append('foreground_image', imageEditorUrl);
      formData.append('background_url', backgroundUrl);

      // console.log("formData submitted is: ", imageUrl, backgroundUrl);
  
      try {
        // Send a POST request to the Flask server to process the image
        const response = await fetch('http://127.0.0.1:5000/image-bg-remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "foreground_image": imageUrl,
            'background_url': backgroundUrl
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to process image.');
        }

        // const responseText = await response.json();
        const responseData = await response.json();
        // console.log("response is: ", responseData.image);

        const blob_image = "data:image/png;base64," + responseData.image;

        // console.log(blob_image);
  
        // const blob = blob_image.blob();
  
        // Create a new URL for the Blob object and set it as the image source
        setEditImage(blob_image);
        setDataReceived(true);
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setLoading(false);
      }
    } else {
      console.error('No image selected.');
    }
  };
  
  const handleBase64Urls = (url) => {
    // console.log("url clicked is: ", url);
    setBackgroundUrl(url);
  };

  const handleImageChange = (event) => {
    setImageFile(event.target.files[0]);
  };

  const handleLeftRotate = () => {
    setRotationValue((parseInt(rotationValue) + 90));
  }

  const handleRightRotate = () => {
    setRotationValue((parseInt(rotationValue) - 90));
  }

  const handleSearchBarInput = () => {
    setShowSearchBar(!showSearchBar);
    // console.log("Show search is: ", showSearchBar);
  };

  const downloadRmImage = () => {
    // handleDownloadImage();
    // const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "generated_image.png";
    // link.href = canvas.toDataURL();
    link.href = imageUrl;
    link.click();
  }
  // ---------------------------------------------------------------------------

  const handleSubmitRemove = () => {
    setEditImageTemp(editImage);
  }

  const handleImageEditorSubmit = () => {
    setEditImageTemp(imageEditorUrl);
  }

  useEffect(() => {
    const filterImage = document.getElementById("filter_image");

    if (!filterImage) {
        console.error("filter_image element not found");
        return;
    }

    const canvasID = document.createElement('canvas');
    const context = canvasID.getContext('2d');

    const applyFiltersAndCreateURL = () => {
        // Set the canvas dimensions to match the image
        canvasID.width = filterImage.naturalWidth;
        canvasID.height = filterImage.naturalHeight;

        // Set the filter string
        const filterString =
          "brightness(" + brightnessValue + "%" +
          ") grayscale(" + greyScaleValue + "%" +
          ") blur(" + blurValue*0.1 + "px" +
          ") saturate(" + saturationValue + "%" + ")";

        // Convert degrees to radians for rotation
        const rotationInRadians = rotationValue * Math.PI / 180;

        // Calculate the dimensions of the rotated image
        // const rotatedWidth = Math.abs(filterImage.width * Math.cos(rotationInRadians)) + Math.abs(filterImage.height * Math.sin(rotationInRadians));
        // const rotatedHeight = Math.abs(filterImage.width * Math.sin(rotationInRadians)) + Math.abs(filterImage.height * Math.cos(rotationInRadians));

        // Set the canvas dimensions to accommodate the rotated image
        canvasID.width = filterImage.naturalWidth;
        canvasID.height = filterImage.naturalHeight;

        // Clear the canvas
        context.clearRect(0, 0, canvasID.width/2, canvasID.height/2);

        // Save the current context state
        context.save();

        // Translate the canvas to the center point
        context.translate(canvasID.width / 2, canvasID.height / 2);

        // Rotate the canvas
        context.rotate(rotationInRadians);

        context.filter = filterString;

        // Draw the image onto the canvas
        context.drawImage(filterImage, -filterImage.naturalWidth/2, -filterImage.naturalHeight/2);

        // Restore the context to its original state
        // context.restore();
        

        // Create and return a promise that resolves with the URL of the blob
        return new Promise((resolve) => {
            canvasID.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                // console.log(url); // Print the generated URL
                resolve(url);
                setImageEditorUrl(url);
            }, "image/png");
        });
    };

    // Check if the image is already loaded
    if (filterImage.complete) {
        applyFiltersAndCreateURL();
    } else {
        filterImage.onload = applyFiltersAndCreateURL;
        filterImage.onerror = (err) => console.error('Failed to load image:', err);
    }

    // Cleanup function
    return () => {
        if (filterImage) {
            filterImage.onload = null;
            filterImage.onerror = null;
        }
    };
}, [brightnessValue, blurValue, saturationValue, greyScaleValue, rotationValue]);

const filteredProductRows = useCallback((query) => {
  // console.log("products are: ", productList[0]);


  const filtered = productList.filter(({ node }) =>
    node.title.toLowerCase().includes(query.toLowerCase())
);
  // const filtered = productList.filter(row =>
  //     row.title.toLowerCase().includes(query.toLowerCase())
  // );
  setFilterProductRows(filtered);
}, [productList]);

const handleOverlayUrls = (url) => {
  setOverlayBackgroundImage(url);
}

  useEffect(() => {
    const dragElement = (container) => {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      const element = document.getElementById(container.id);

      const dragMouseDown = (e) => {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = (e) => elementDrag(e);
      };

      const elementDrag = (e) => {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        container.style.top = (container.offsetTop - pos2) + "px";
        container.style.left = (container.offsetLeft - pos1) + "px";
      };

      const closeDragElement = () => {
        document.onmouseup = null;
        document.onmousemove = null;
      };

      element.onmousedown = dragMouseDown;
    };

    const container = document.getElementById("foreground");
    if (container) {
      dragElement(container);
    }
  }, [backgroundUrl, imageEditorUrl]);

const productDataListSearch = (searchQuery) ? filterProductRows : productList; 

  const productRows = productDataListSearch.map(({ node }) => {
    const productID = node.id.match(/\d+$/)[0];
    return (
      <IndexTable.Row key={node.id} id={node.id}>
        <IndexTable.Cell key="image">
          <Image
            source={node.images.edges[0]?.node.url || ""}
            alt={node.title}
            width={50}
            height={50}
          />
        </IndexTable.Cell>
        <IndexTable.Cell key="title">
          <Text>{node.title}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell key="price">
          <Text>{node.priceRangeV2.minVariantPrice.amount}</Text>
        </IndexTable.Cell>
        <IndexTable.Cell key="action">
          <Button
            variant="secondary"
            // url={`shopify:admin/products/${productID}`}
            onClick={() => handleGenerateImage(productID)}
            target="_blank"
          >
            Edit Media
          </Button>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page>   
      <InlineStack gap="200">
      {!showSearchBar && (
            <div style={{ width: "4rem", marginTop: "1.5rem" }}>
              <Button onClick={handleSearchBarInput}>Search</Button>
              </div>
              
            )}
            {showSearchBar && (
              <>
                <InlineStack gap="100">
                <div style={{ width: "15rem", marginTop: "1.5rem" }}>
                  <TextField
                    placeholder="Search here.."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoComplete="off"
                    fullWidth
                  />
                  </div>
                  <div style={{ width: "4rem", marginLeft: "1rem", marginTop: "1.5rem" }}>
                  <Button onClick={handleSearchBarInput}>Cancel</Button>
                  </div>
                </InlineStack>
              </>
            )}
      {productCountButton && (
          <div style={{ width: "20rem", display: "flex", flexDirection: "row" }}>
          <TextField
          type="number"
          label="No. products per page"
          value={productCountQuery}
          onChange={handleProductQueryCount}
          />
          <div style={{ width: "4rem", marginLeft: "1rem", marginTop: "1.5rem" }}>
          <Button variant="secondary" onClick={handlePageCountSubmit}>Submit</Button>
          </div>
          </div>
        )}
        <div style={{ marginTop: "1.5rem" }}>
        <ButtonGroup>
          <Button
          variant="secondary"
          onClick={() => setProductCountButton(!productCountButton)}
          >
            Product Count Per Page
          </Button>
        </ButtonGroup>
        </div>
      </InlineStack>
      <br></br>
        <BlockStack>
        <IndexTable
          itemCount={productList.length}
          headings={[
            { title: "Image" },
            { title: "Title" },
            { title: "Price" },
            { title: "Action" },
          ]}
          selectable={false}
        >
          {productRows}
        </IndexTable>
        </BlockStack>
      <div
        style={{
          display: "flex",
          justifyContent: "right",
          backgroundColor: "white",
        }}
      >
        {!loading && (
          <Pagination
            hasPrevious={pageInfo.hasPreviousPage}
            onPrevious={handlePreviousPage}
            hasNext={pageInfo.hasNextPage}
            onNext={handleNextPage}
            label={`${productCountQuery} of ${allProductCount}`}
          />
        )}
        {loading && (
          <div style={{ marginRight: "1rem" }}>
            <Spinner size="small" />
          </div>
        )}
      </div>
      {modal && (
        <Modal
          open={modal}
          onClose={handleModalClose}
          title="Generate Product"
          primaryAction={[
            {
              content: "Close",
              onAction: handleModalClose,
            },
          ]}
          size="large"
        >
          <Modal.Section>
            <Layout>
              <Layout.Section>
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h6">
                      Image Generation
                    </Text>
                    {/* <TextField
                      label="Product Title"
                      value={productTitle}
                      onChange={handleProductTitle}
                    /> */}
                    {/* <Text variant="headingMd" as="h6">
                  Aspect Ratio
                </Text> */}
                    <OptionList
                      title="Image Size"
                      onChange={setSelected}
                      options={[
                        { value: "landscape", label: "Landscape" },
                        { value: "portrait", label: "Portrait" },
                        { value: "square", label: "Square" },
                      ]}
                      selected={selected}
                    />
                    <Form method="post" onSubmit={handleSubmit} gap="300">
                      <BlockStack gap="300">
                        <BlockStack gap="300">
                          <TextField
                            label="Image Prompt (Product Name, Requirements, Disallowed Content)"
                            value={imagePrompt}
                            onChange={handleChange}
                            autoComplete="off"
                            placeholder="e.g., Red shoes on white background, No humans"
                          />
                        </BlockStack>
                        <BlockStack
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <ButtonGroup gap="300">
                            <Button submit variant="primary">
                              Generate Image
                            </Button>
                          </ButtonGroup>
                        </BlockStack>
                      </BlockStack>
                    </Form>
                  </BlockStack>
                </Card>
              </Layout.Section>
              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack
                    gap="300"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2rem",
                    }}
                  >
                    <Text variant="headingMd" as="h6">
                      Generated Image
                    </Text>
                    {loading ? (
                      <div
                        style={{
                          display: "flex",
                          alignContent: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Spinner
                          accessibilityLabel="Spinner example"
                          size="small"
                        />
                        <Text variant="headingsm" as="h6">
                          This might take 10 secs
                        </Text>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            display: "flex",
                            alignContent: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src={imageUrl}
                            style={{
                              width: imageSize.width,
                              height: imageSize.height,
                            }}
                            alt="Generated Image"
                            // onLoad={async() => await handleDownloadImage()}
                            className="generated_image"
                          />
                          <canvas
                            ref={canvasRef}
                            alt="generated Image"
                            style={{ display: "none" }}
                          ></canvas>
                        </div>
                        <BlockStack
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <ButtonGroup>
                          <BlockStack>
                            <InlineStack gap={200}>
                            <Button variant="secondary" onClick={handleEditImage}>
                              Edit Image
                            </Button>
                            <Button
                              variant="primary"
                              onClick={handleGenerateProductSubmit}
                            >
                              Add To Product List
                            </Button>
                            </InlineStack>
                            <br></br>
                            <InlineStack gap={200}>
                            {actionData?.product && (
                              <Button
                                url={`shopify:admin/products/${productId}`}
                                target="_blank"
                                variant="secondary"
                              >
                                View Product
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              onClick={() => downloadImage()}
                            >
                              Save Image
                            </Button>
                            </InlineStack>
                            </BlockStack>
                          </ButtonGroup>
                        </BlockStack>
                      </>
                    )}
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
          </Modal.Section>
        </Modal>
      )}
      {editModal && (
        <Modal
        open={editModal}
        onClose={handleEditModalClose}
        title="Generate Product"
        primaryAction={[
          {
            content: "Save",
            onAction: handleModalChangesSubmit,
          },
        ]}
        secondaryActions={[
          {
            content: "Close",
            onAction: handleEditModalClose,
          },
        ]}
        size="large"
      >
        <Modal.Section>
          <Layout>
            <Layout.Section>
              <div id="background" style={{ width: "15rem", height: "20rem" }}>
                <img
                  src={overlayBackgroundImage}
                  alt="no Image"
                  width={300}
                />
                <div id="foreground" style={{ position: 'absolute', top: '0', left: '0', resize: "both" }}>
                {/* <ReactCrop
                  crop={crop}
                  onImageLoaded={setImage}
                  onComplete={handleCropComplete}
                  onChange={(newCrop) => setCrop(newCrop)}
                  > */}
                  <img
                    src={imageEditorUrl}
                    alt="no Image"
                    width={120}
                    style={{ resize: "both" }}
                  />
                {/* </ReactCrop> */}
                </div>
              </div>
            </Layout.Section>
            <Layout.Section>
            {(Object.keys(uniqueProductList).length > 0) && (
                  <div>
                      {Object.entries(uniqueProductList).map(([folder, urls]) => (
                          <div key={folder}>
                              <h3>{folder}</h3>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                  {urls.map((url, index) => (
                                      <div key={index} style={{ cursor: "pointer" }} onClick={() => handleOverlayUrls(url)}>
                                          <img
                                              src={url}
                                              alt={`Image ${index + 1}`}
                                              style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                                          />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </Layout.Section>
          </Layout>
        <Layout>

        <Layout.Section roundedAbove="sm" padding="600">
            <Text as="h2" variant="headingSm">
                Crop Image
            </Text>
            <div style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
            <Box width="200vh" padding="500" shadow="500" borderColor="border" borderWidth="0.25" gap="200">
                {!loading && (
                    <>
                        {/* <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "flex", flexDirection: "columns", marginBottom: "2rem" }}/> */}
                        {imageUrl && (
                          <ReactCrop

                          crop={crop}
                          onImageLoaded={setImage}
                          onComplete={handleCropComplete}
                          onChange={(newCrop) => setCrop(newCrop)}
                      >
                        <Image
                            className='image_to_crop'
                            src={imageEditorUrl}
                            alt="uploaded"
                            width={500}
                            height='auto'
                              />
                      </ReactCrop>
                        )}
                        <br></br>
                    <ButtonGroup>
                      <Button submit variant="primary" onClick={handleSave}>Save</Button>
                      <Button submit variant="primary" onClick={handleDownload}>Upload</Button>
                    </ButtonGroup>
                    </>
                    )}
            </Box>
            </div>
            </Layout.Section>
            <Layout.Section roundedAbove="sm" padding="600">
              <Card>
              <Layout>
                <Layout.Section>
                  <Box borderColor="border" borderWidth="025" padding="400">
                  <BlockStack gap={300}>
             <Text variant="headingMd" as="h6">
                        Image Editor
                    </Text>
                    <BlockStack gap={500}>
                      <ButtonGroup>
                        <Button onClick={() => setEditOptionSelected('brightness')}>Brightness</Button>
                        <Button onClick={() => setEditOptionSelected('saturation')}>Saturation</Button>
                        <Button onClick={() => setEditOptionSelected('blur')}>Blur</Button>
                        <Button onClick={() => setEditOptionSelected('grey scale')}>Grey Scale</Button>
                      </ButtonGroup>
                    </BlockStack>
                    { editOptionSelected === 'brightness' && (
                      <>
                      <label>Brightness {brightnessValue}%</label>
                      <input type="range" value={brightnessValue} min="0" max="200" className="brightness_editor" onChange={handleBrightness}/>
                      </>
                    )}

                    { editOptionSelected === 'saturation' && (
                      <>
                      <label>Saturation {saturationValue}%</label>
                      <input type="range" value={saturationValue} min="0" max="200" onChange={handleSaturation}/>
                      </>
                    )}

                    { editOptionSelected === 'blur' && (
                      <>
                      <label>Blur {blurValue}%</label>
                      <input type="range" value={blurValue} min="0" max="200" onChange={handleBlur}/>
                      </>
                    )}

                    { editOptionSelected === 'grey scale' && (
                      <>
                      <label>Gray Scale {greyScaleValue}%</label>
                      <input type="range" value={greyScaleValue} min="0" max="200" onChange={handleGreyScale}/>
                      </>
                    )}
             </BlockStack>
             <br></br>
             <BlockStack gap={300}>
             <Text variant="headingMd" as="h6">Rotate</Text>
             <BlockStack gap={300}>
              <ButtonGroup>
              <Button onClick={handleLeftRotate}>
                <Image width={20} src="https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/256x256/plain/rotate_left.png"/>
                </Button>
                <Button onClick={handleRightRotate}>
                <Image width={20} src="https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/256x256/plain/rotate_right.png"/>
                </Button>
                {/* <Button>
                <Image width={20} src="https://cdn-icons-png.flaticon.com/512/73/73795.png"/>
                </Button>
                <Button>
                <Image width={20} src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr801_7JFC_-Oe4GoYuiQL5Y5DrgJI2WUTTg&s"/>
                </Button> */}
              </ButtonGroup>
             </BlockStack>
             </BlockStack>
             <br></br>
             <ButtonGroup>
              <Button>Reset Filters</Button>
              <Button onClick={handleImageEditorSubmit}>Save Image</Button>
             </ButtonGroup>
                  </Box>
                </Layout.Section>
                <Layout.Section variant="oneThird">
                <img
                id="filter_image"
                src={imageEditorUrl}
                width={250}
                style={{
                  filter: `brightness(${brightnessValue}%) grayscale(${greyScaleValue}%) saturate(${saturationValue}%) blur(${blurValue*0.1}px)`, rotate: `${rotationValue}deg`
              }}
                />
                <canvas id="canvas" alt="generated Image" style={{ display: "none" }}></canvas>
                </Layout.Section>
              </Layout>
              </Card>
            </Layout.Section>
        
            <Layout.Section roundedAbove="sm" padding="600">
            <Card>
            <BlockStack gap="300" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <Text variant="headingMd" as="h6">
                    Remove Background
                </Text>
                {warning && (
                    <BlockStack>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", color: "red" }}>
                        No Image Selected!!
                        </div>
                    </BlockStack>
                )}
                {(imageEditorUrl) && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img 
                        src={imageEditorUrl} 
                        alt="Processed" 
                        style={{ display: "flex", alignItems: "center", width: '15rem' }} 
                        />
                    </div>
                )}
                {(editImage) && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img 
                        src={editImage} 
                        alt="Processed" 
                        style={{ display: "flex", alignItems: "center", width: '15rem' }} 
                        />
                    </div>
                )}
                {!loading && (!(imageUrl)) && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img 
                    src="https://st2.depositphotos.com/1561359/12101/v/950/depositphotos_121012076-stock-illustration-blank-photo-icon.jpg"
                    alt="Processed" 
                    style={{ display: "flex", alignItems: "center", width: '15rem' }} 
                    />
                </div>
                )}
                {loading && (
                  <div style={{ display: "flex", alignContent: "center", justifyContent: "center" }}>
                    <Spinner accessibilityLabel="Spinner example" size="large" />
                    <Text variant="headingsm" as="h6">This might take 10 secs</Text>
                  </div> 
                )}
                {/* {(blobUrlList.length > 0 && imageOptions) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {blobUrlList.map((url, index) => (
                      <div key={index} onClick={() => handleImageClick(url)} style={{ cursor: "pointer" }}>
                        <Thumbnail
                          size="large"
                          source={url}
                          alt={`Product Image ${index + 1}`}
                          style={{ cursor: 'pointer' }} // Make it clear that the image is clickable
                        />
                      </div>
                    ))}
                </div>
                )} */}
                <BlockStack style={{ display: "flex", justifyContent: "flex-end" }} gap="300">
                    {(dataReceived && editImage) && (
                        <ButtonGroup>
                            <Button onClick={handleDismiss}>Save Changes</Button>
                            <Button variant="primary" onClick={downloadRmImage}>Download Image</Button>
                        </ButtonGroup>
                    )}
                </BlockStack>
                <div style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
                <Box width="200vh" padding="500" shadow="500" borderColor="border" borderWidth="0.25" gap="200">
                    <InlineStack gap="300">
                    {!loading && (<Form gap="500" style={{ display: "flex", alignItems: "center" }} onSubmit={handleRmSubmit}>
                        <Button submit variant="primary">Remove Background</Button>
                    </Form>)}
                    {/* <Button onClick={handleSubmitRemove}>Save Image</Button> */}
                    </InlineStack>
                </Box>
                </div>
            </BlockStack>
                {(Object.keys(blobUrlList).length > 0) && (
                  <div>
                      {Object.entries(blobUrlList).map(([folder, urls]) => (
                          <div key={folder}>
                              <h3>{folder}</h3>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                  {urls.map((url, index) => (
                                      <div key={index} style={{ cursor: "pointer" }} onClick={() => handleBase64Urls(url)}>
                                          <img
                                              src={url}
                                              alt={`Image ${index + 1}`}
                                              style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                                          />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </Card>
            </Layout.Section>
        {/* <Layout.Section variant="oneThird">
        <Card>
        <BlockStack gap="300" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <Text variant="headingMd" as="h6">
                Generated Image
            </Text>
            {warning && (
                <BlockStack>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", color: "red" }}>
                    No Image Selected!!
                    </div>
                </BlockStack>
            )}
            {(dataReceived && imageUrl) && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img 
                    src={imageUrl} 
                    alt="Processed" 
                    style={{ display: "flex", alignItems: "center", width: '15rem' }} 
                    />
                </div>
            )}
            {!loading && (!(dataReceived && imageUrl)) && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img 
                src="https://st2.depositphotos.com/1561359/12101/v/950/depositphotos_121012076-stock-illustration-blank-photo-icon.jpg"
                alt="Processed" 
                style={{ display: "flex", alignItems: "center", width: '15rem' }} 
                />
            </div>
            )}
            {loading && (
              <div style={{ display: "flex", alignContent: "center", justifyContent: "center" }}>
                <Spinner accessibilityLabel="Spinner example" size="large" />
                <Text variant="headingsm" as="h6">This might take 10 secs</Text>
              </div> 
            )}
            <BlockStack style={{ display: "flex", justifyContent: "flex-end" }} gap="300">
                {(dataReceived && imageUrl) && (
                    <ButtonGroup>
                        <Button onClick={handleDismiss}>Dismiss</Button>
                        <Button variant="primary" onClick={downloadImage}>Save Image</Button>
                    </ButtonGroup>
                )}
            </BlockStack>
        </BlockStack>
        </Card>
        </Layout.Section> */}
        </Layout>
        </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}
