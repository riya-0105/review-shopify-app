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
  InlineGrid
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect, useRef } from "react";
// import { authenticate } from "../shopify.server";
import { query } from '../image.generate';
import { useActionData, useSubmit } from "@remix-run/react";
import { useNavigate } from "react-router-dom";

export const action = async ({ request }) => {
  const formData = await request.formData();
  const imagePrompt = formData.get("imagePrompt");
  // console.log("the prompt is: ", imagePrompt);

  const imageBytes = await query({ inputs: imagePrompt });
  return imageBytes;
};

export default function ImagePage() {
  // variables
  const [imagePrompt, setImagePrompt] = useState("");
  const imageUrlAction = useActionData() ?? null;
  const [imageUrl, setImageUrl] = useState('https://st2.depositphotos.com/1561359/12101/v/950/depositphotos_121012076-stock-illustration-blank-photo-icon.jpg');
  const [selected, setSelected] = useState([]);
  const submit = useSubmit();
  const [imageSize, setImageSize] = useState({ width: '15rem', height: '15rem' }); 
  const canvasRef = useRef(null);
  const optionsList = [
    { value: { width: '17rem', height: '14rem' }, label: 'landscape' },
    { value: { width: '14rem', height: '17rem' }, label: 'portrait' },
    { value: { width: '15rem', height: '15rem' }, label: 'square' },
  ];
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // functions

  useEffect(() => {
    if (imageUrlAction) {
      setLoading(false);
      const uint8Array = new Uint8Array(imageUrlAction.data);
      const blob = new Blob([uint8Array], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      // console.log("received data is: ", url);
      setImageUrl(url);
    }
  }, [imageUrlAction]);

  const handleChange = useCallback((newValue) => setImagePrompt(newValue), []);

  const handleSubmit = useCallback(
    (event) => {
      setLoading(true);
      event.preventDefault();
      const formData = new FormData();
      formData.append("imagePrompt", imagePrompt);
      submit(formData, { method: "post" });
    },
    [imagePrompt, submit]
  );

  useEffect(() => {
    // console.log("selected is: ", String(selected[0]));
    // optionsList.map(option => {
    //   console.log("value is: ",option.label);
    // });
    // console.log("The list is: ", optionsList);
    const selectedOption = optionsList.find(option => option.label == selected[0]);
    // console.log("Selected value is: ", selectedOption);
    if(selectedOption && selectedOption.value) {
      setImageSize(selectedOption.value);
    }
    // console.log("image is: ", imageSize)
  }, [selected])

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      // Parse the width and height to remove 'rem' and convert to pixels
      const widthInPixels = parseInt(imageSize.width) * 16; // assuming 1rem = 16px
      const heightInPixels = parseInt(imageSize.height) * 16; // assuming 1rem = 16px
      canvas.width = widthInPixels;
      canvas.height = heightInPixels;
      ctx.drawImage(img, 0, 0, widthInPixels, heightInPixels);
    };
    img.src = imageUrl;
    // console.log("the canvas element is: ", canvas);
  }

  const downloadImage = () => {
    handleDownloadImage();
    // const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "generated_image.png";
    link.href = canvas.toDataURL();
    link.href = imageUrl;
    link.click();
  }

  const handleEditImage = () => {
    // console.log("redirect");
    navigate('/app/removeBg')
  }

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
              {/* <Text variant="headingMd" as="h6">
                Aspect Ratio
              </Text> */}
              <OptionList
                title="Image Size"
                onChange={setSelected}
                options={[
                  { value: 'landscape', label: 'Landscape' },
                  { value: 'portrait', label: 'Portrait' },
                  { value: 'square', label: 'Square' },
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
                <BlockStack style={{ display: "flex", justifyContent: "flex-end" }}>
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
            <BlockStack gap="300" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <Text variant="headingMd" as="h6">
                    Generated Image
                </Text>
                {loading ? (
                  <div style={{ display: "flex", alignContent: "center", justifyContent: "center" }}>
                    <Spinner accessibilityLabel="Spinner example" size="small" />
                    <Text variant="headingsm" as="h6">This might take 10 secs</Text>
                  </div>
                ) : (
                  <>
                  <div style={{ display: "flex", alignContent: "center", justifyContent: "center" }}>
                  <Image
                  src={imageUrl}
                  style={{ width: imageSize.width, height: imageSize.height }}
                  alt="Generated Image"
                  // onLoad={handleDownloadImage}
                  />
                <canvas ref={canvasRef} alt="generated Image" style={{ display: "none" }}></canvas>
                </div>
                <BlockStack style={{ display: "flex", justifyContent: "flex-end" }}>
                  <ButtonGroup>
                    <Button>Add To Product List</Button>
                    <Button variant="primary" onClick={downloadImage}>Save Image</Button>
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
