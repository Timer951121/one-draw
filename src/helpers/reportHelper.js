export async function getOptimalDimensions(imageUrl, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        let img = new Image();

        img.onload = () => {
            let originalWidth = img.width;
            let originalHeight = img.height;
            let aspectRatio = originalWidth / originalHeight;

            let optimalWidth, optimalHeight;

            if (originalWidth > originalHeight) {
                optimalWidth = Math.min(maxWidth, originalWidth);
                optimalHeight = optimalWidth / aspectRatio;
            } else {
                optimalHeight = Math.min(maxHeight, originalHeight);
                optimalWidth = optimalHeight * aspectRatio;
            }

            optimalWidth = Math.min(optimalWidth, maxWidth);
            optimalHeight = Math.min(optimalHeight, maxHeight);

            resolve({ optimalWidth, optimalHeight });
        };

        img.onerror = () => {
            reject(new Error("Error loading image."));
        };

        img.src = imageUrl;
    });
}