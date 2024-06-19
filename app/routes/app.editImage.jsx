import React, { useState } from 'react';
import { BlockStack, Box, Button, ButtonGroup, Divider, Layout, Spinner } from '@shopify/polaris';
import 
{ 
    Card, 
    Form,
    Image,
    Text
 } 
from '@shopify/polaris';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function EditImage() {
    // variables
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [dataReceived, setDataReceived] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState(false);
  const [crop, setCrop] = useState({ aspect: 1 / 1 });
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);


  // methods

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
      setCroppedImageUrl(croppedImage);
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
      // setImageUrl(URL.createObjectURL(blob));
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
    let file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageUrl(reader.result?.toString() || "");
      console.log(reader.result?.toString() || "");
    });
    // console.log(event.target.files);
    reader.readAsDataURL(file);
    // setImageUrl(URL.createObjectURL(event.target.files[0]));
  };

  const handleDismiss = () => {
    setImageUrl(null);
    setDataReceived(false);
  };


  const handleDownload = () => {
    console.log("download");
    console.log("image url is: ", croppedImageUrl);
    if (croppedImageUrl) {
      const link = document.createElement('a');
      link.href = croppedImageUrl;
      console.log("cropped image is: ", croppedImageUrl);
      link.download = 'cropped-image.png';
      link.click();
    }
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
                    {!loading && (
                        <>
                            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "flex", flexDirection: "columns", marginBottom: "2rem" }}/>
                            {imageUrl && (
                              <ReactCrop

                              crop={crop}
                              onImageLoaded={setImage}
                              onComplete={handleCropComplete}
                              onChange={(newCrop) => setCrop(newCrop)}
                          >
                            <img
                                className='image_to_crop'
                                src={imageUrl}
                                alt="uploaded"
                                width={500}
                                height='auto'
                                  />
                          </ReactCrop>
                            )}
                            <br></br>
                        <Button submit variant="primary" onClick={handleDownload}>Upload</Button>
                        </>
                        )}
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

export default EditImage;
