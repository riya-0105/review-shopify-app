import axios from 'axios';


const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
const headers = { "Authorization": "" };

export async function query(payload) {
    try {
        const response = await axios.post(API_URL, payload, { headers, responseType: 'arraybuffer' });
        console.log("data is: ", response.data)
        return response.data;
    } catch (error) {
        console.error('Error fetching image:', error);

        try {
            const response = await fetch(
                "https://api-inference.huggingface.co/models/Corcelio/mobius",
                {
                    headers: headers,
                    method: "POST",
                    body: JSON.stringify(payload),
                }
            );
            const result = await response.blob();
            return result;
        }
        catch(error) {
            console.error('Error fetching image:', error);
        }
        return error;
    }
}


