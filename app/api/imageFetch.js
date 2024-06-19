import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct the directory path to match the real address
const parentDirectoryPath = path.join(__dirname, '../../shopify-product-csvs-and-images-master/shopify-product-csvs-and-images-master');
const targetDirectoryName = 'csv-files'; // The target directory name

// Function to load and parse a CSV file
export const loadCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Function to load and parse all CSV files in the directory
export const loadAllCSVs = async () => {
  try {
    const targetDirectoryPath = path.join(parentDirectoryPath, targetDirectoryName);
    const files = await fs.promises.readdir(targetDirectoryPath);
    const csvFiles = files.filter(file => file.endsWith('.csv'));

    const allProducts = [];

    for (const file of csvFiles) {
      const filePath = path.join(targetDirectoryPath, file);
      const products = await loadCSV(filePath);
      allProducts.push(...products);
    }

    // console.log(`Loaded ${allProducts.length} products from ${csvFiles.length} CSV files`);
    return allProducts;
  } catch (error) {
    console.error('Error reading directory or loading CSV files:', error);
  }
};

// Function to get image URLs for products of a specific type
export const getImageUrlsForType = async (type) => {
  try {
    const products = await loadAllCSVs();
    return products
      .filter(product => product.Type === type)
      .map(product => product['Image Src'])
      .filter(imageUrl => imageUrl); // Ensure the image URL is not null or undefined
  } catch (error) {
    console.error('Error getting image URLs for type:', error);
    return [];
  }
};
