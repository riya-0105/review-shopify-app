import { useCallback, useEffect, useState, useRef } from "react";
import { json } from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  ButtonGroup,
  Box,
  List,
  Link,
  LegacyCard,
  Tabs,
  Image,
  InlineStack,
  Thumbnail,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  blob1,
  blob2,
  blob3,
  blob4,
  blob5,
  instruction_blob1,
  videoBlobUrl1,
} from "../api/front_image";
import "../css/index.css";


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
            # featuredImage {
            #   url
            # }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
          // featuredImage: {
          //   url: "https://upload.wikimedia.org/wikipedia/en/b/bd/Doraemon_character.png"
          // }
        },
      },
    },
  );
  const responseJson = await response.json();
  const productId = responseJson.data?.productCreate?.product?.id;

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
          originalSource:
            "https://upload.wikimedia.org/wikipedia/en/b/bd/Doraemon_character.png",
        },
        productId: productId,
      },
    },
  );
  const imageResponseJson = await imageResponse.json();

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

export default function Index() {
  const [selected, setSelected] = useState(0);

  const [blobUrl1, setBlobUrl1] = useState(null);
  const [blobUrl2, setBlobUrl2] = useState(null);
  const [blobUrl3, setBlobUrl3] = useState(null);
  const [blobUrl4, setBlobUrl4] = useState(null);
  const [blobUrl5, setBlobUrl5] = useState(null);
  const [blobVideoUrl, setBlobVideoUrl] = useState(null);

  const ImageWithFallback = ({ defaultSource, dynamicSource, alt, width, style }) => {
    const [source, setSource] = useState(defaultSource);

    useEffect(() => {
      if (dynamicSource) {
        setSource(dynamicSource);
      }
    }, [dynamicSource]);

    return (
      <img
        src={source}
        alt={alt}
        width={width}
        style={style}
      />
    );
  };

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelected(selectedTabIndex),
    [],
  );

  const VideoWithFallback = ({ dynamicSource, width, style }) => {
    const videoRef = useRef(null);

    const handleMouseEnter = () => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    };

    const handleMouseLeave = () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };

    const handleButtonClick = () => {
        // Open the specified URL in the same tab/window when the button is clicked
        window.location.href = 'shopify:admin/apps/ai-blog-and-image-generator/app/productList';
      };

    return (
      <>
        {dynamicSource && (
          <video
            ref={videoRef}
            controls
            width={width}
            style={style}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <source src={dynamicSource} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </>
    );
  };

  const tabs = [
    {
      id: "image_ai",
      content: "Generate Image",
      accessibilityLabel: "All customers",
      panelID: "all-customers-content-1",
    },
    {
      id: "blog_ai",
      content: "Generate Blog",
      panelID: "all-customers-content-1",
    },
    {
      id: "order_ai",
      content: "Order Management",
      panelID: "all-customers-content-1",
    },
    {
      id: "help",
      content: "Help",
      panelID: "all-customers-content",
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setBlobUrl1(blob1);
      setBlobUrl2(blob2);
      setBlobUrl3(blob3);
      setBlobUrl4(blob4);
      setBlobUrl5(blob5);
      setBlobVideoUrl(videoBlobUrl1);
    }, 5000); // Simulating delay
  }, []);


  return (
    <>
      <Box borderColor="border" borderWidth="025">
        <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}></Tabs>
      </Box>
      {selected === 0 && (
        <BlockStack gap="200">
          <Box padding="600">
            <BlockStack gap={200} style={{ padding: "3rem" }}>
              <Layout>
                <Layout.Section>
                  <Text variant="heading2xl" as="h3">
                    Generate new Products: AI Product Image Generation
                  </Text>
                  <Text
                    variant="headingXl"
                    as="h4"
                    fontWeight="regular"
                    tone="subdued"
                  >
                    Edit your existing Product Images or generate new image
                  </Text>
                </Layout.Section>
                <Layout.Section variant="oneThird">
                  <ImageWithFallback
                    defaultSource="https://cdn.shopify.com/s/files/1/0803/6591/products/hudderton-backpack_dc8afb13-448b-49d9-a042-5a163a97de8f.jpg?v=1426709346
                    "
                    dynamicSource={blobUrl1}
                    alt="Blob1"
                    width={150}
                    style={{
                      position: "absolute",
                      top: 1,
                      marginLeft: "7rem",
                      marginTop: "7rem",
                      zIndex: 4,
                    }}
                  />
                  <ImageWithFallback
                    defaultSource="https://cdn.shopify.com/s/files/1/0597/2185/products/18k-rose-diamond-earrings_5e7739a0-261d-4788-96c9-ef77214aa70e.jpg?v=1406749573
                    "
                    dynamicSource={blobUrl2}
                    alt="Blob2"
                    width={150}
                    style={{
                      position: "absolute",
                      top: 2,
                      marginTop: "12rem",
                      marginLeft: "15rem",
                      zIndex: 3,
                    }}
                  />
                  <ImageWithFallback
                    defaultSource="https://cdn.shopify.com/s/files/1/0923/8036/products/2015-04-30_Reshoot_03_13988_21427.jpeg?v=1437080830"
                    dynamicSource={blobUrl3}
                    alt="Blob3"
                    width={150}
                    style={{
                      position: "absolute",
                      zIndex: 2,
                      marginTop: "1rem",
                      marginLeft: "23rem",
                    }}
                  />
                  <ImageWithFallback
                    defaultSource="https://cdn.shopify.com/s/files/1/0923/8036/products/2014_10_25_Lana_Look42_05.jpeg?v=1437081073"
                    dynamicSource={blobUrl4}
                    alt="Blob4"
                    width={150}
                    style={{
                      position: "absolute",
                      zIndex: 1,
                      marginTop: "10rem",
                      marginLeft: "7rem",
                    }}
                  />
                  <ImageWithFallback
                    defaultSource="https://cdn.shopify.com/s/files/1/0923/8036/products/1-26-15_Addis_Look_27_12858_1293.jpeg?v=1437081024"
                    dynamicSource={blobUrl5}
                    alt="Blob5"
                    width={150}
                    style={{
                      position: "absolute",
                      zIndex: 1,
                      marginTop: "12rem",
                      marginLeft: "22rem",
                    }}
                  />
                </Layout.Section>
              </Layout>
            </BlockStack>
          </Box>
          <Box padding={200} shadow="200" style={{ marginTop: "10rem" }}>
            <Layout padding={200} shadow="200" >
              <Layout.Section>

              <div className='carousel_container_width'>
                <section className="carousel" aria-label="Gallery">
            <ol className="carousel__viewport">
                <li id="carousel__slide1" tabIndex="0" className="carousel__slide">
                    <div className="carousel__snapper">
                        <a href="#carousel__slide4" className="carousel__prev">Go to last slide</a>
                        <a href="#carousel__slide2" className="carousel__next">Go to next slide</a>
                    </div>
                </li>
                <li id="carousel__slide2" tabIndex="0" className="carousel__slide">
                    <div className="carousel__snapper">
                        <a href="#carousel__slide1" className="carousel__prev">Go to last slide</a>
                        <a href="#carousel__slide3" className="carousel__next">Go to next slide</a>
                    </div>
                </li>
                <li id="carousel__slide3" tapIndex="0" className="carousel__slide">
                    <div className="carousel__snapper">
                    <a href="#carousel__slide2" className="carousel__prev">Go to last slide</a>
                    <a href="#carousel__slide4" className="carousel__next">Go to next slide</a>
                    </div>
                </li>
                <li id="carousel__slide4" tabIndex="0" className="carousel__slide">
                    <div className="carousel__snapper">
                    <a href="#carousel__slide3" className="carousel__prev">Go to last slide</a>
                    <a href="#carousel__slide1" className="carousel__next">Go to next slide</a>
                    </div>
                </li>
            </ol>
            <aside className="carousel__navigation">
                <ol className="carousel__navigation-list">
                    <li className="carousel__navigation-item">
                        <a href="#carousel__slide1" className="carousel__navigation-button">Go to slide 1</a>
                    </li>
                    <li className="carousel__navigation-item">
                        <a href="#carousel__slide2" className="carousel__navigation-button">Go to slide 2</a>
                    </li>
                    <li className="carousel__navigation-item">
                        <a href="#carousel__slide3" className="carousel__navigation-button">Go to slide 3</a>
                    </li>
                    <li className="carousel__navigation-item">
                        <a href="#carousel__slide4" className="carousel__navigation-button">Go to slide 4</a>
                    </li>
                </ol>
            </aside>
        </section>
            </div>
              </Layout.Section>
            </Layout>
            <Box padding={200} width={200} shadow="200" style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4rem", marginTop: "3rem" }}>
              {/* <Button size="large" className="generate_image_btn" url={`shopify:admin/apps/ai-blog-and-image-generator/app/productList`} target="_self">Start Generating</Button> */}
              <button className="generate_image_btn"><a className="generate_href" href="shopify:admin/apps/ai-blog-and-image-generator/app/productList" target="_selfl">Start Generating</a></button>
            </Box>
            <Layout>
              <Layout.Section variant="oneThird">
                <Card width={500}>
                  <Text as="p" fontWeight="semibold">
                    Generate Images from Text Prompt
                  </Text>
                  <br />
                  <div
                    style={{
                      position: "relative",
                      width: 150,
                      height: 150,
                    }}
                    onMouseEnter={(e) => {
                      const video = e.currentTarget.querySelector('video');
                      video.style.display = 'block';
                      video.play();
                    }}
                    onMouseLeave={(e) => {
                      const video = e.currentTarget.querySelector('video');
                      video.style.display = 'none';
                      video.pause();
                    }}
                  >
                    <ImageWithFallback
                      defaultSource="https://cdn.shopify.com/s/files/1/0803/6591/products/hudderton-backpack_dc8afb13-448b-49d9-a042-5a163a97de8f.jpg?v=1426709346"
                      dynamicSource={instruction_blob1}
                      alt="Blob1"
                      width={350}
                      style={{
                        position: "absolute",
                        top: 1,
                        marginLeft: "1rem",
                        marginTop: "1rem",
                        zIndex: 4,
                      }}
                    />
                    <VideoWithFallback
                      dynamicSource={blobVideoUrl}
                      width={350}
                      style={{
                        position: "absolute",
                        top: 1,
                        marginLeft: "1rem",
                        marginTop: "1rem",
                        zIndex: 5,
                        display: 'none', // Initially hidden
                      }}
                    />
                  </div>
                </Card>
              </Layout.Section>
              <Layout.Section variant="oneThird">
                <Card>
                  <Text>Step 1</Text>
                  <Image source={instruction_blob1} width={400} alt="" />
                </Card>
              </Layout.Section>
              <Layout.Section variant="oneThird">
                <Card></Card>
              </Layout.Section>
            </Layout>
          </Box>
        </BlockStack>
      )}
      {selected === 2 && (
        <BlockStack>
          <Box gap={200} style={{ padding: "3rem" }}>
            <Layout>
              <Layout.Section>
                  <Text variant="heading2xl" as="h3">
                    Manage Your Orders: Providing better User Experience
                  </Text>
                  <Text
                    variant="headingXl"
                    as="h4"
                    fontWeight="regular"
                    tone="subdued"
                  >
                    Making Managing Store easier and efficient
                  </Text>
              </Layout.Section>
              <Layout.Section>
              <Box padding={200} width={200} shadow="200" style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4rem", marginTop: "3rem" }}>
              {/* <Button size="large" className="generate_image_btn" url={`shopify:admin/apps/ai-blog-and-image-generator/app/productList`} target="_self">Start Generating</Button> */}
              <button className="generate_image_btn"><a className="generate_href" href="shopify:admin/apps/ai-blog-and-image-generator/app/orderManagement" target="_selfl">Start Generating</a></button>
            </Box>
              </Layout.Section>
            </Layout>
          </Box>
        </BlockStack>
      )}
    </>
  );
}
