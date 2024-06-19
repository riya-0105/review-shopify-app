import {
  Page,
  BlockStack,
  Text,
  Image,
  Button,
  Pagination,
  IndexTable,
  Layout,
  DropZone,
  Card,
  Badge,
  TextField,
  OptionList,
  Form,
  FullscreenBar,
  ButtonGroup,
  Spinner,
  Box,
  Modal,
  CalloutCard,
  Divider,
  Thumbnail,
  Select,
} from "@shopify/polaris";
import "react-image-crop/dist/ReactCrop.css";
import ReactCrop from "react-image-crop";
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
import fetchProductImage from "../api/image"
import { loadAllCSVs, getUniqueProductTypes } from '../api/imageFunction.js';

// import { url } from "inspector";
// import { fetchUrlsData } from '../api/imageFunction.js';
// import { removeBackground } from "@imgly/background-removal-node";

export const loader = async ({ request }) => {
  const { cors, admin } = await authenticate.admin(request);

  const query = `
      query AllProducts($cursor: String) {
        products(first: 10, after: $cursor) {
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

  const variables = { cursor: "" };
  const res = await admin.graphql(query, variables);
  const allProductsData = await res.json();

  // Load products from CSV files and get unique product types
  const productsFromCSV = await loadAllCSVs();
  const uniqueProductTypes = getUniqueProductTypes(productsFromCSV);


  console.log("data is:  ", uniqueProductTypes);

  return cors(json({ allProductsData, uniqueProductTypes }));
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
  } else {
    const imagePrompt = formData.get("imagePrompt");
    console.log("the prompt is: ", imagePrompt);
    const imageBytes = await query({ inputs: imagePrompt });

    if (formData.get("generateProduct")) {
      console.log("formData is: ", formData);
      console.log("the image is: ", formData.get("imageUrl"));
      console.log("request received");
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
      const productId = formData.get("productId");
      console.log("product: ", productId);
      const action = await fetchProductImage(
        productId,
        formData.get("imageUrl"),
      );

      console.log("action: ", action);

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
  const { allProductsData, uniqueProductTypes } = useLoaderData();
  const [productInput, setProductInput] = useState("");
  const [productInputList, setProductInputList] = useState([]);
  const productNextData = useActionData() ?? null;
  const submit = useSubmit();
  const [productList, setProductList] = useState([]);
  const [imageTemp, setImageTemp] = useState('');
  const [base64, setBase64] = useState('');
  const [pageInfo, setPageInfo] = useState({
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [selectedOptionListData, setSelectedOptionListData] = useState('');
  const [loading, setLoading] = useState(false);
  const [optionModal, setOptionModal] = useState(false);
  const [productTypesList, setProductTypesList] = useState([]);
  const [modal, setModal] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const actionData = useActionData() ?? null;
  const [imageUrlList, setImageUrlList] = useState([]);
  const [imageUrl, setImageUrl] = useState(
    "https://st2.depositphotos.com/1561359/12101/v/950/depositphotos_121012076-stock-illustration-blank-photo-icon.jpg",
  );
  const [imageFile, setImageFile] = useState(null);
  const [dataReceived, setDataReceived] = useState(false);
  const [image, setImage] = useState(null);
  const [warning, setWarning] = useState(false);
  const [crop, setCrop] = useState({ aspect: 1 / 1 });
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState([]);
  const [isFullscreen, setFullscreen] = useState(true);
  const [imageOptions, setImageOptions] = useState(false);
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
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const productId = actionData?.product;


  // methods
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
      console.log("image url is: ", url);
      setImageUrl(url);
    }
  }, [actionData]);

  const handleChange = useCallback((newValue) => {setImagePrompt(newValue); setProductTitle(imagePrompt);}, []);

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
    console.log("selected is: ", String(selected[0]));
    optionsList.map((option) => {
      console.log("value is: ", option.label);
    });
    console.log("The list is: ", optionsList);
    const selectedOption = optionsList.find(
      (option) => option.label == selected[0],
    );
    console.log("Selected value is: ", selectedOption);
    if (selectedOption && selectedOption.value) {
      setImageSize(selectedOption.value);
    }
    console.log("image is: ", imageSize);
  }, [selected]);

  const handleActionClick = useCallback(() => {
    setFullscreen(false);
  }, []);

  const handleDownloadImage = async () => {
    const canvas = document.createElement("canvas");
    const image = document.querySelector(".generated_image");
    console.log("image is: ", image);
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
    console.log("blob url is: ", blobUrl);
    // const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = productTitle + ".png";
    //   link.href = canvas.toDataURL();
    link.href = blobUrl;
    link.click();
  };

  const handleGenerateProductSubmit = useCallback(
    async (event) => {
      console.log("data");
      setLoading(true);
      event.preventDefault();
      const formData = new FormData();
      // Convert the base64 image URL to a Blob object
      // const blob = await fetch(imageUrl).then((response) => response.blob());

      // // Create a Blob URL from the Blob object
      // const blobUrl = URL.createObjectURL(blob);
      // console.log("blob data is: ", blob, blobUrl);
      console.log("passed data is: ", imageUrl, productTitle);
      formData.append("imageUrl", imageUrl);
      formData.append("generateProduct", String(true));
      formData.append("productTitle", imagePrompt);
      formData.append("imagePrompt", imagePrompt);
      formData.append("productId", productInput);
      for (const pair of formData.entries()) {
        console.log(pair[0] + ", " + pair[1]);
      }
      submit(formData, { method: "post" });
    },
    [submit, imageUrl, imagePrompt],
  );

//   const useRemoveImageBackground = () => {
//     return useCallback(async () => {
//       const buffer = Buffer.from(imageUrl, "base64");
//       // Create a Blob from the buffer
//       const blob = new Blob([buffer], { type: "image/jpeg" });
//       const outputImage = await removeBackground(blob);
//       const resultBuffer = Buffer.from(await outputImage.arrayBuffer());
//       const dataURL = `data:image/png;base64,${resultBuffer.toString("base64")}`;
//       console.log("data is: ", dataURL);
//       setImageUrl(dataURL);
//     }, [imgSource]);
//   };

  const handleEditImage = () => {
    console.log("redirect");
    console.log("image url is: ", imageUrl);
    // setImageUrl(croppedImageUrl);
    setModal(false);
    setEditModal(true);
    // navigate(`/app/editImage?productId=${productId}&imageUrl=${encodeURIComponent(imageUrl)}`);
  };

  // const handleProductTitle = useCallback(
  //   (newValue) => setProductTitle(newValue),
  //   [productTitle],
  // );

  useEffect(() => {
    console.log("options are: ", uniqueProductTypes);
    if (uniqueProductTypes) {
      const typesList = Object.keys(uniqueProductTypes);
      // const values = uniqueProductTypes['Snowboards'];
      // console.log("values are: ", values);
      setProductTypesList(typesList);
      console.log("product types list is: ", typesList);
    }
  }, [uniqueProductTypes]);

  const optionListForModal = productTypesList.map(type => ({
    value: type, // Pass the image src list as the value
    label: type
  }));


  // function
  useEffect(() => {
    if (productNextData && productNextData.allProductsData) {
      console.log("next data is: ", productNextData);
      setLoading(false);
      setPageInfo(productNextData.allProductsData.data.products.pageInfo);
      setProductList(productNextData.allProductsData.data.products.edges);
    } else if (allProductsData?.data?.products) {
      console.log("page info is: ", allProductsData.data.products.pageInfo);
      setPageInfo(allProductsData.data.products.pageInfo);
      setProductList(allProductsData.data.products.edges);
    }
  }, [allProductsData]);

  useEffect(() => {
    if (productNextData?.allProductsData?.data?.products) {
      setLoading(false);
      setPageInfo(productNextData.allProductsData.data.products.pageInfo);
      setProductList(productNextData.allProductsData.data.products.edges);
    }
  }, [productNextData]);

  const handleGenerateImage = (productID, imageData) => {
    // setModal(true);
    setImageModal(true);
    setImageTemp(imageData);
    setProductInput(productID);
  };

  const handleNextPage = () => {
    console.log("clicked");
    if (pageInfo.hasNextPage) {
      setLoading(true);
      const lastEdge = productList[productList.length - 1];
      const formData = new FormData();
      formData.append("cursor", lastEdge.cursor);
      formData.append("page", "nextPage");
      for (const pair of formData.entries()) {
        console.log(pair[0] + ", " + pair[1]);
      }
      submit(formData, { method: "post" });
    }
  };

  const handleEditModalClose = useCallback(() => {
    setEditModal(false);
  }, [editModal]);

  const handleModalClose = useCallback(() => {
    setModal(false);
  }, [modal]);

  const handlePreviousPage = () => {
    if (pageInfo.hasPreviousPage) {
      setLoading(true);
      const firstEdge = productList[0];
      const formData = new FormData();
      formData.append("cursor", firstEdge.cursor);
      formData.append("page", "prevPage");
      for (const pair of formData.entries()) {
        console.log(pair[0] + ", " + pair[1]);
      }
      submit(formData, { method: "post" });
    }
  };

  const handleCropComplete = (crop) => {
    makeClientCrop(crop);
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
      console.log("cropped image is: ", cropImage);
      setCroppedImageUrl(cropImage);
    }
  };

  const getCroppedImg = (crop) => {
    const canvas = document.createElement("canvas");
    const image = document.querySelector(".image_to_crop");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas toBlob error"));
        }
      }, "image/png");
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
    console.log("image: ", imageUrl);
    setDataReceived(false);
  };

  const handleSave = () => {
    setImageUrl(croppedImageUrl);
    console.log("image crop url: ", croppedImageUrl);
    setEditModal(false);
    console.log("image url is: ", imageUrl);
    if(imageUrl) {
      setModal(true);
    }
  };

  const handleDownload = () => {
    console.log("download");
    console.log("image url is: ", croppedImageUrl);
    if (croppedImageUrl) {
      const link = document.createElement("a");
      link.href = croppedImageUrl;
      console.log("cropped image is: ", croppedImageUrl);
      link.download = "cropped-image.png";
      link.click();
    }
  };

  // ---------------------------------------------------------------------------
  const handleRmSubmit = async (event) => {
    event.preventDefault();

    function base64ToFile(base64String, fileName) {
      // Decode the base64 string to binary data
      const byteString = atob(base64String.split(",")[1]);

      // Extract the MIME type
      const mimeString = base64String.split(",")[0].split(":")[1].split(";")[0];

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
      console.log("Uploading...");
      setLoading(true);

      const formData = new FormData();
      formData.append("image", imageData);

      try {
        // Send a POST request to the Flask server to process the image
        const response = await fetch("http://127.0.0.1:5000/image-bg-remove", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to process image.");
        }

        const blob = await response.blob();

        // Create a new URL for the Blob object and set it as the image source
        setImageUrl(URL.createObjectURL(blob));
        setDataReceived(true);
      } catch (error) {
        console.error("Error processing image:", error);
      } finally {
        setLoading(false);
      }
    } else {
      console.error("No image selected.");
    }
  };

  const handleImageChange = (event) => {
    setImageFile(event.target.files[0]);
  };

  const handleOptionModalList = () => {
    setOptionModal(true);
  }

  const downloadRmImage = () => {
    // handleDownloadImage();
    // const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "generated_image.png";
    // link.href = canvas.toDataURL();
    link.href = imageUrl;
    link.click();
  };

  const handleGenerateImageData = useCallback(() => {
    setModal(true);
  }, [modal]);

  const handleSelectedOptionListData = useCallback((newValue) => {
    setSelectedOptionListData(newValue);
    setProductInputList(uniqueProductTypes[newValue]);
    setImageOptions(true);
    console.log("selected option is: ", productInputList);
  }, []);


  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setBase64(reader.result);
        setImageUrl(reader.result);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };
    }
  }, []);


  const handleImageModalClose = useCallback(() => {
    setImageModal(false);
  }, [imageModal]);

  const handleOptionModalClose = useCallback(() => {
    setOptionModal(false);
  });

  useEffect(() => {
    console.log("product list is: ", productInputList);
  }, [productInputList])

  const handleImageClick = (url) => {
    console.log("url is: ", url);
    setImageUrl(url);
    setEditModal(true);
  }

  // ---------------------------------------------------------------------------


  const productRows = productList.map(({ node }) => {
    const productID = node.id.match(/\d+$/)[0];
    const imageData = node.images.edges[0]?.node.url || "";
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
            onClick={() => handleGenerateImage(productID, imageData)}
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
          />
        )}
        {loading && (
          <div style={{ marginRight: "1rem" }}>
            <Spinner size="small" />
          </div>
        )}
      </div>
      {modal && (
        <Box>
          <Modal
            size="large"
            open={modal}
            style={{ width: "2000px" }}
            onClose={handleModalClose}
            title="Generate Product"
            primaryAction={[
              {
                content: "Close",
                onAction: handleModalClose,
              },
            ]}
          >
            <Modal.Section>
              <Page>
                {/* <FullscreenBar onAction={handleActionClick}>
                  <div
                    style={{
                      display: "flex",
                      flexGrow: 1,
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingLeft: "1rem",
                      paddingRight: "1rem",
                    }}
                  >
                    <Badge tone="info">Draft</Badge>
                    <div style={{ marginLeft: "1rem", flexGrow: 1 }}>
                      <Text variant="headingLg" as="p">
                        Page title
                      </Text>
                    </div>
                    <ButtonGroup>
                      <Button onClick={() => {}}>Secondary Action</Button>
                      <Button variant="primary" onClick={() => {}}>
                        Primary Action
                      </Button>
                    </ButtonGroup>
                  </div>
                </FullscreenBar>
                <Divider></Divider>
                <br></br> */}
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
                                <Button
                                  variant="secondary"
                                  onClick={handleEditImage}
                                >
                                  Edit Image
                                </Button>
                                <Button
                                  variant="primary"
                                  onClick={handleGenerateProductSubmit}
                                >
                                  Add To Product List
                                </Button>
                                {actionData?.product && (
                                  <Button
                                    url={`shopify:admin/products/${productId}`}
                                    target="_blank"
                                    variant="secondary"
                                  >
                                    View product
                                  </Button>
                                )}
                                <Button
                                  variant="primary"
                                  onClick={() => downloadImage()}
                                >
                                  Save Image
                                </Button>
                              </ButtonGroup>
                            </BlockStack>
                          </>
                        )}
                      </BlockStack>
                    </Card>
                  </Layout.Section>
                </Layout>
              </Page>
            </Modal.Section>
          </Modal>
        </Box>
      )}
      {imageModal && (
        <Box shadow="300" borderWidth="025"> 
            <Modal
            size="large"
            open={imageModal}
            onClose={handleImageModalClose}
            title="Generate Product"
            primaryAction={[
              {
                content: "Close",
                onAction: handleImageModalClose,
              },
            ]}
          >
            <Modal.Section>
                <Layout>
                    <Layout.Section variant="oneThird">
                        <Box shadow="300" borderWidth="025">
                        {/* <DropZone onDrop={handleDropZoneDrop}> */}
                            <div style={{ width: "5rem", height: "7rem", display: "flex", alignItems: "center", justifyItems: "center", marginLeft: "auto", marginRight: "auto" }}>
                            <Form onSubmit={handleSubmit}>
                                <input type="file" onChange={handleFileChange} style={{ backgroundColor: "transparent" }} />
                                {base64 && (
                                    <div>
                                    <h2>Base64 String:</h2>
                                    <br></br>
                                    <textarea value={base64} readOnly style={{ width: '100%', height: '200px' }} />
                                    </div>
                                )}
                                {base64 && <button type="submit">Submit</button>}
                            </Form>
                            </div>
                        </Box>
                        <br></br>
                        <div style={{ display: "flex", alignContent: "center", justifyContent: "center" }}>
                        <BlockStack width={20}>----------------------or----------------------</BlockStack>
                        </div>
                        <br></br>
                        <div style={{ width: "29rem", height: "5rem" }}>
                        <Box shadow="300" borderWidth="025" width={200}>
                          <BlockStack>
                            <div style={{ display: "flex", alignItems:"center", justifyContent: "center", width: "10rem", height: "5rem", marginLeft: "auto", marginRight: "auto" }}>
                            <Button
                            variant="secondary"
                            onClick={handleOptionModalList}
                            >
                              Generate New Product
                            </Button>
                            </div>
                          </BlockStack>
                        </Box>
                        </div>
                    </Layout.Section>
                    <Layout.Section variant="oneThird">
                        <div style={{ height: "10rem" }}>
                        <Box shadow="300" borderWidth="025" width={300}>
                        <div style={{  display: "flex", alignItems: "center", justifyContent: "center", height: "10rem" }}>
                            <Thumbnail
                            source={imageTemp}
                            alt="Product Image"
                            size="large"
                            />
                        </div>
                        </Box>
                        </div>
                    </Layout.Section>
                </Layout>
            </Modal.Section>
          </Modal>           
        </Box>
      )}
      {editModal && (
        <Box shadow="300" borderWidth="025">
          <Modal
            size="large"
            open={editModal}
            onClose={handleEditModalClose}
            title="Generate Product"
            primaryAction={[
              {
                content: "Close",
                onAction: handleEditModalClose,
              },
            ]}
          >
            <Modal.Section>
              <Page>
                <Layout>
                  <Layout.Section roundedAbove="sm" padding="600">
                    <Text as="h2" variant="headingSm">
                      Remove Background
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        width="200vh"
                        padding="500"
                        shadow="500"
                        borderColor="border"
                        borderWidth="0.25"
                        gap="200"
                      >
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
                                  className="image_to_crop"
                                  src={imageUrl}
                                  alt="uploaded"
                                  width={500}
                                  height="auto"
                                />
                              </ReactCrop>
                            )}
                            <br></br>
                            <ButtonGroup>
                              <Button
                                submit
                                variant="primary"
                                onClick={handleSave}
                              >
                                Save
                              </Button>
                              <Button
                                submit
                                variant="primary"
                                onClick={handleDownload}
                              >
                                Upload
                              </Button>
                            </ButtonGroup>
                          </>
                        )}
                      </Box>
                    </div>
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
                          Remove Background
                        </Text>
                        {warning && (
                          <BlockStack>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.25rem",
                                color: "red",
                              }}
                            >
                              No Image Selected!!
                            </div>
                          </BlockStack>
                        )}
                        {imageUrl && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt="Processed"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                width: "15rem",
                              }}
                            />
                          </div>
                        )}
                        {!loading && !imageUrl && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src="https://st2.depositphotos.com/1561359/12101/v/950/depositphotos_121012076-stock-illustration-blank-photo-icon.jpg"
                              alt="Processed"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                width: "15rem",
                              }}
                            />
                          </div>
                        )}
                        {loading && (
                          <div
                            style={{
                              display: "flex",
                              alignContent: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Spinner
                              accessibilityLabel="Spinner example"
                              size="large"
                            />
                            <Text variant="headingsm" as="h6">
                              This might take 10 secs
                            </Text>
                          </div>
                        )}
                        <BlockStack
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                          gap="300"
                        >
                          {dataReceived && imageUrl && (
                            <ButtonGroup>
                              <Button onClick={handleDismiss}>Save</Button>
                              <Button
                                variant="primary"
                                // onClick={useRemoveImageBackground}
                              >
                                Save Image
                              </Button>
                            </ButtonGroup>
                          )}
                        </BlockStack>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Box
                            width="200vh"
                            padding="500"
                            shadow="500"
                            borderColor="border"
                            borderWidth="0.25"
                            gap="200"
                          >
                            {!loading && (
                              <Form
                                gap="500"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                onSubmit={handleRmSubmit}
                              >
                                <Button submit variant="primary">
                                  Remove Background
                                </Button>
                              </Form>
                            )}
                          </Box>
                        </div>
                      </BlockStack>
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
              </Page>
            </Modal.Section>
          </Modal>
        </Box>
      )}
      {optionModal && (
         <Box shadow="300" borderWidth="025">
         <Modal
           size="large"
           open={optionModal}
           onClose={handleOptionModalClose}
           title="Select Product Image"
           primaryAction={[
             {
               content: "Close",
               onAction: handleOptionModalClose,
             },
           ]}
         >
           <Modal.Section>
            <Button variant="secondary" onClick={handleGenerateImageData}>Generate Product</Button>

            <BlockStack>------------------------or-------------------------------------</BlockStack>
            <Select
              value={selectedOptionListData}
              label="Select Product to get Images"
              options={optionListForModal}
              onChange={handleSelectedOptionListData}
            />
            {(productInputList.length > 0 && imageOptions) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {productInputList.map((url, index) => (
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
          )}
            {/* <select
              id="productTypeSelect"
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
            >
              <option value="">--Select a Product Type--</option>
              {productTypesList.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
      </select> */}
           </Modal.Section>
          </Modal>
        </Box>
      )}
    </Page>
  );
}
