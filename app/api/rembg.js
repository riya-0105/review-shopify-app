import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

async function removeBackground(imageUrl, apiKey, outputFilePath) {
  const formData = new FormData();
  formData.append('size', 'auto');
  formData.append('image_url', imageUrl);

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: formData,
      responseType: 'arraybuffer',
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': apiKey,
      },
      encoding: null
    });

    if(response.status !== 200) {
      console.error('Error:', response.status, response.statusText);
      return;
    }

    fs.writeFileSync(outputFilePath, response.data);
    console.log('Image saved successfully!');
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Usage example
removeBackground('https://www.remove.bg/example.jpg', 'INSERT_YOUR_API_KEY_HERE', 'no-bg.png');
