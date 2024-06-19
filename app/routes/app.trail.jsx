import { useCallback, useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Image,
  Form,
  TextField
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
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
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
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
  });
};

export default function generateProductsList() {
  
  // variables 

  const nav = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const [imageUrl, setImageUrl] = useState("https://upload.wikimedia.org/wikipedia/en/b/bd/Doraemon_character.png");
  const [imagePrompt, setImagePrompt] = useState("");
  const [pageCount, setPageCount] = useState("");

  // functions

  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const productId = actionData?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => submit({}, { replace: true, method: "POST" });

  const handleChange = useCallback((newValue) => (
    setImagePrompt(newValue)
  ), []);

  return (
    <Page>
      <TitleBar title="Add new Product">
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Form>
                  <BlockStack gap="500">
                    <TextField
                      label="Product Name"
                      value={imagePrompt}
                      onChange={handleChange}
                      autoComplete="off"
                      placeholder="for eg., shoes, t-shirts"
                    />
                    <InlineStack gap="500">
                    <Text>Product Image</Text>
                    <Box shadow="300" borderColor="border" borderWidth="025">
                      <Image
                      src={imageUrl}
                      alt="No image"
                      style={{ width: "4rem" }}
                      />
                    </Box>
                    </InlineStack>
                    <TextField
                      label="Product Description"
                      value={imagePrompt}
                      onChange={handleChange}
                      autoComplete="off"
                      placeholder="Detailed Description of Product"
                    />
                    <TextField
                      label="Product Price"
                      type="number"
                      value={imagePrompt}
                      onChange={handleChange}
                      autoComplete="off"
                      placeholder="Product Price"
                    />
                  </BlockStack>
                </Form>
                <InlineStack gap="300">
                  <Button variant="primary" loading={isLoading} onClick={generateProduct}>
                    Generate a product
                  </Button>
                  {actionData?.product && (
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View product
                    </Button>
                  )}
                </InlineStack>
                {actionData?.product && (
                  <>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productCreate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(actionData.product, null, 2)}
                        </code>
                      </pre>
                    </Box>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productVariantUpdate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(actionData.variant, null, 2)}
                        </code>
                      </pre>
                    </Box>
                  </>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
