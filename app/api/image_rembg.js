import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, "../../images_bg");

// Function to get JPEG files and convert them to base64 strings grouped by folder name
export const getGroupedBase64Images = () => {
    let groupedBase64Images = {};

    const walkSync = (currentDirPath) => {
        const files = fs.readdirSync(currentDirPath, { withFileTypes: true });

        for (const file of files) {
            const filePath = path.join(currentDirPath, file.name);

            if (file.isDirectory()) {
                walkSync(filePath); // Recurse into subdirectories
            } else if (file.isFile() && /\.(jpg|jpeg)$/i.test(file.name)) {
                const folder = path.basename(currentDirPath);
                const fileData = fs.readFileSync(filePath, { encoding: 'base64' }); // Read file as base64 string
                const base64Image = `data:image/jpeg;base64,${fileData}`;

                if (!groupedBase64Images[folder]) {
                    groupedBase64Images[folder] = [];
                }

                groupedBase64Images[folder].push(base64Image);
            }
        }
    };

    walkSync(directoryPath); // Accessing directoryPath from here
    return groupedBase64Images;
};

// Example usage
const groupedBase64Images = getGroupedBase64Images();
// console.log("Grouped Base64 Images:", groupedBase64Images);
