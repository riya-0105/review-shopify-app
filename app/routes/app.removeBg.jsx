import React, { useState } from 'react';
import { BlockStack, Box, Button, ButtonGroup, Divider, Layout, Spinner } from '@shopify/polaris';
import 
{ 
    Card, 
    Form,
    Text
 } 
from '@shopify/polaris';

function ImageUploader() {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [dataReceived, setDataReceived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState(false);

  const handleSubmit = async (event) => {
    if(imageFile !== null) {
        console.log("upload");
        setLoading(true);
    event.preventDefault();
    if (!imageFile) {
      console.error('No image selected.');
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      // Send a POST request to the Flask server to process the image
      const response = await fetch('http://127.0.0.1:5000/image-bg-remove', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to process image.');
      }

      const blob = await response.blob();

      // Create a new URL for the Blob object and set it as the image source
      setImageUrl(URL.createObjectURL(blob));
      setDataReceived(true);
      setLoading(false);
    } catch (error) {
      console.error('Error processing image:', error);
      setLoading(false);
    }
    }
    else {
        setWarning(true);
        setTimeout(() => {
            setWarning(false);
        }, 2000);
    }
  };

  const handleImageChange = (event) => {
    setImageFile(event.target.files[0]);
  };

  const handleDismiss = () => {
    setImageUrl(null);
    setDataReceived(false);
  };

  const downloadImage = () => {
    // handleDownloadImage();
    // const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "generated_image.png";
    // link.href = canvas.toDataURL();
    link.href = imageUrl;
    link.click();
  }

  return (
        <Box display='flex' padding="600" minHeight='200vh' justifyContent="center" alignItems='center'>
            <Layout>
            <Layout.Section roundedAbove="sm" padding="600">
                <Text as="h2" variant="headingSm">
                    Remove Background
                </Text>
                <div style={{ display: "flex", alignItems: 'center', justifyContent: 'center' }}>
                <Box width="200vh" padding="500" shadow="500" borderColor="border" borderWidth="0.25" gap="200">
                    {!loading && (<Form gap="500" style={{ display: "flex", alignItems: "center" }} onSubmit={handleSubmit}>
                        <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "flex", flexDirection: "columns", marginBottom: "2rem" }}/>
                        <Button submit variant="primary">Upload</Button>
                    </Form>)}
                </Box>
                </div>
            </Layout.Section>
            <Layout.Section variant="oneThird">
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
            </Layout.Section>
            </Layout>
        </Box>
  );
}

export default ImageUploader;
