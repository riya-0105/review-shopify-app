import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  TextField,
  Image,
  Spinner,
  Form,
  Button,
  OptionList,
  ButtonGroup,
  InlineStack,
  InlineGrid,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { query } from "../image.generate";
import { useActionData, useSubmit } from "@remix-run/react";
import { useNavigate, useNavigation } from "react-router-dom";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Blob } from 'buffer';
import { promises as fs } from 'fs';

// Define a File-like class for Node.js
class File {
  constructor(parts, filename, properties) {
    this.blob = new Blob(parts, properties);
    this.name = filename;
    this.lastModified = properties.lastModified;
    this.size = this.blob.size;
    this.type = this.blob.type;
  }

  async arrayBuffer() {
    return this.blob.arrayBuffer();
  }

  stream() {
    return this.blob.stream();
  }

  async text() {
    return this.blob.text();
  }

  slice(start, end, contentType) {
    return this.blob.slice(start, end, contentType);
  }
}

async function getFileFromBase64(base64String, fileName) {
  try {
    if (!base64String.includes("base64,")) {
      throw new Error("Invalid base64 string");
    }

    const [prefix, imageBase64] = base64String.split(",");
    const mime = prefix.match(/:(.*?);/)[1];
    const byteCharacters = atob(imageBase64);
    const buffer = new ArrayBuffer(byteCharacters.length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < byteCharacters.length; i++) {
      view[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([buffer], { type: mime });

    return new File([blob], fileName, {
      lastModified: new Date().getTime(),
      type: mime,
    });
  } catch (error) {
    console.error("Error converting base64 string to file:", error);
    throw error;
  }
}


export const action = async ({ request }) => {
  const formData = await request.formData();
  const imagePrompt = formData.get("imagePrompt");
  console.log("the prompt is: ", imagePrompt);

  const imageBytes = await query({ inputs: imagePrompt });
  console.log("formData is: ", formData);

  if (formData.get("generateProduct")) {
    // console.log("the image is: ", formData.get("imageUrl"));
    console.log("request received");
    console.log("formData is: ", formData);
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
      `#graphql
        mutation populateProduct($input: ProductInput!) {
            productCreate(input: $input) {
                product {
                    id
                    title
                    handle
                    status
                    variants(first: 10) {
                        edges {
                            node {
                            id
                            price
                            barcode
                            createdAt
                            }
                        }
                    }
                }
            }
        }`,
      {
        variables: {
          input: {
            title: formData.get("productTitle"),
          },
        },
      },
    );
    const responseJson = await response.json();

    console.log("response json is: ", responseJson);

    const productId = responseJson.data?.productCreate?.product?.id;
    const fileName = `temp.jpeg`;

    console.log("file is: ", formData.get("imageUrl"));

    const file = await getFileFromBase64(formData.get('imageUrl'), fileName);

    await fs.writeFile(file.name, Buffer.from(await file.arrayBuffer()));

    console.log("file is: ", file);

    const imageStagedUploads = await admin.graphql(
        `#graphql
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters {
                name
                value
              }
            }
          }
        }`,
        {
          variables: {
            "input": [
              {
                "filename": "temp.jpeg", // Pass the filename as a string
                "mimeType": "image/jpeg",
                "httpMethod": "POST",
                "resource": "IMAGE",
                // "file": `${file.blob}`, // Pass the blob as a separate property,
                // "fileSize": `${file.size.toString()}`,
              },
            ]
          },
        },
      );

      const imageStagedUploadsResponse = await imageStagedUploads.json();

      const imageUrl = imageStagedUploadsResponse.data.stagedUploadsCreate?.stagedTargets[0]?.resourceUrl;

      console.log("image url: ", imageStagedUploadsResponse.data.stagedUploadsCreate?.stagedTargets[0]);

    // Add image to the product
    const imageResponse = await admin.graphql(
        `mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
        productCreateMedia(media: $media, productId: $productId) {
            media {
            alt
            mediaContentType
            status
            }
            mediaUserErrors {
            field
            message
            }
            product {
            id
            title
            }
        }
        }`,
        {
        variables: {
            media: {
                alt: "Image",
                mediaContentType: "IMAGE",
                originalSource: formData.get('imageUrl'),
            },
            productId,
        },
        },
    );
    const imageResponseJson = await imageResponse.json();

    console.log("image is: ", imageResponseJson);

    const variantId =
      responseJson.data.productCreate.product.variants.edges[0].node.id;
    const variantResponse = await admin.graphql(
      `#graphql
            mutation shopifyRemixTemplateUpdateVariant($input: ProductVariantInput!) {
                productVariantUpdate(input: $input) {
                productVariant {
                    id
                    price
                    barcode
                    createdAt
                }
                }
            }`,
      {
        variables: {
          input: {
            id: variantId,
            price: Math.random() * 100,
          },
        },
      },
    );
    const variantResponseJson = await variantResponse.json();

    return json({
      product: responseJson.data.productCreate.product,
      variant: variantResponseJson.data.productVariantUpdate.productVariant,
      imageBytes,
    });
    // return json({
    //     product: null,
    //     variant: null,
    //     imageBytes,
    //   });
  } else {
    return json({
      product: null,
      variant: null,
      imageBytes,
    });
  }
};

export default function ImagePage() {
  // variables
  const [imagePrompt, setImagePrompt] = useState("");
  const actionData = useActionData() ?? null;
  const [imageUrl, setImageUrl] = useState(
    "https://st2.depositphotos.com/1561359/12101/v/950/depositphotos_121012076-stock-illustration-blank-photo-icon.jpg",
  );
  const [selected, setSelected] = useState([]);
  const submit = useSubmit();
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
  const [loading, setLoading] = useState(false);
  const [productTitle, setProductTitle] = useState("");
  const navigate = useNavigate();
  const nav = useNavigation();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const productId = actionData?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  // functions

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  useEffect(() => {
    if (actionData) {
      setLoading(false);
      const base64Image = btoa(
        String.fromCharCode.apply(
          null,
          new Uint8Array(actionData.imageBytes.data),
        ),
      );
      const url = `data:image/jpeg;base64,${base64Image}`;
      setImageUrl(url);
    }
  }, [actionData]);

  const handleChange = useCallback((newValue) => setImagePrompt(newValue), []);

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
      setLoading(true);
      event.preventDefault();
      const formData = new FormData();
      console.log("passed data is: ", imageUrl, productTitle);
      formData.append("imageUrl", imageUrl);
      formData.append("generateProduct", String(true));
      formData.append("productTitle", productTitle);
      formData.append("imagePrompt", imagePrompt);
      for (const pair of formData.entries()) {
        console.log(pair[0] + ", " + pair[1]);
      }
      submit(formData, { method: "post" });
    },
    [productTitle, submit, imageUrl, imagePrompt],
  );

  const handleEditImage = () => {
    console.log("redirect");
    navigate("/app/removeBg");
  };

  const handleProductTitle = useCallback(
    (newValue) => setProductTitle(newValue),
    [productTitle],
  );

  return (
    <Page>
      <TitleBar title="Images" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h6">
                Image Generation
              </Text>
              <TextField
                label="Product Title"
                value={productTitle}
                onChange={handleProductTitle}
              />
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
                    style={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <ButtonGroup gap="300">
                      <Button onClick={handleEditImage}>Edit Image</Button>
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
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
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
                  <Spinner accessibilityLabel="Spinner example" size="small" />
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
                    style={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <ButtonGroup>
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
                      <Button variant="primary" onClick={() => downloadImage()}>
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
  );
}
