import { Question } from './types';

// Simple mulberry32 PRNG to create a deterministic random sequence based on a seed
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

/**
 * Generates a consistent list of questions for the daily challenge.
 * Uses the current date as a seed for a PRNG to ensure every user
 * gets the same set of questions on any given day.
 * @param allQuestions The complete array of questions.
 * @param count The number of questions to include in the challenge.
 * @returns An array of questions for the daily challenge.
 */
export const getDailyChallengeQuestions = (allQuestions: Question[], count: number): Question[] => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // Create a simple numeric seed from the date string
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
        seed = (seed << 5) - seed + dateStr.charCodeAt(i);
        seed |= 0; // Convert to a 32bit integer
    }

    const random = mulberry32(seed);
    
    // Shuffle the array deterministically using the seeded PRNG
    const shuffled = [...allQuestions].sort(() => 0.5 - random());
    
    return shuffled.slice(0, count);
};

/**
 * Checks if a file is a raster image (PNG or JPG).
 * @param file The file to check.
 * @returns True if the file is a PNG or JPG, false otherwise.
 */
export const isRasterImage = (file: File): boolean => {
    return file.type === 'image/png' || file.type === 'image/jpeg';
};

/**
 * Removes the background from a raster image by making the color of the top-left pixel transparent.
 * @param file The image file (PNG or JPG).
 * @returns A promise that resolves with the Base64-encoded transparent PNG and its dimensions.
 */
export const removeImageBackground = (file: File): Promise<{ base64: string; width: number; height: number; }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context'));

                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Get the color of the top-left pixel as the background color
                const bgR = data[0];
                const bgG = data[1];
                const bgB = data[2];

                // Iterate through all pixels
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // If the pixel color matches the background color, make it transparent
                    if (r === bgR && g === bgG && b === bgB) {
                        data[i + 3] = 0; // Set alpha to 0
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                const base64 = canvas.toDataURL('image/png').split(',')[1];
                resolve({ base64, width: img.width, height: img.height });
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Wraps a Base64-encoded raster image in an SVG element.
 * @param base64 The Base64-encoded image data.
 * @param width The width of the image.
 * @param height The height of the image.
 * @returns A string containing the SVG code.
 */
export const convertRasterToSvg = (base64: string, width: number, height: number): string => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
              <image href="data:image/png;base64,${base64}" width="${width}" height="${height}" />
            </svg>`;
};