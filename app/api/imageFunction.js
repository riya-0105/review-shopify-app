import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, "../../shopify-product-csvs-and-images-master/shopify-product-csvs-and-images-master/csv-files"); // Directory containing CSV files

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
    const files = await fs.promises.readdir(directoryPath);
    const csvFiles = files.filter(file => file.endsWith('.csv'));

    const allProducts = [];

    for (const file of csvFiles) {
      const filePath = path.join(directoryPath, file);
      const products = await loadCSV(filePath);
      allProducts.push(...products);
    }

    // console.log(`Loaded ${allProducts.length} products from ${csvFiles.length} CSV files`);
    return allProducts;
  } catch (error) {
    console.error('Error reading directory or loading CSV files:', error);
    return '';
  }
};

// Function to get unique product types and their image sources
export const getUniqueProductTypes = (products) => {
  const productTypeDetails = {};

  products.forEach(product => {
    if (product.Type) {
      if (productTypeDetails[product.Type]) {
        productTypeDetails[product.Type].push(product["Image Src"]);
      } else {
        productTypeDetails[product.Type] = [product["Image Src"]];
      }
    }
  });

  return productTypeDetails;
};

// Example usage
// loadAllCSVs().then((products) => {
//   if (products) {
//     const productTypeDetails = getUniqueProductTypes(products);
//     console.log('Product Types and their Image Sources:', productTypeDetails);
//   }
// });
