const inputArea = document.getElementById('input-area');
const resultText = document.getElementById('result-text');
const copyButton = document.getElementById('copy-button');

// Prevent default behaviors for drag-and-drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    inputArea.addEventListener(eventName, e => e.preventDefault());
});

// Handle drag-and-drop image
inputArea.addEventListener('drop', async (e) => {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        await processImage(file);
    } else {
        alert('Please drop a valid image file.');
    }
});

// Handle paste image
inputArea.addEventListener('paste', async (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            await processImage(file);
        }
    }
});

// Copy text to clipboard
copyButton.addEventListener('click', () => {
    const text = resultText.textContent;
    if (text.trim() === '' || text === 'Your text will appear here...') {
        alert('There is no text to copy!');
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => showNotification('Text copied to clipboard!'))
        .catch(err => console.error('Failed to copy text: ', err));
});

// Show temporary notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px 20px';
    notification.style.backgroundColor = '#007BFF';
    notification.style.color = '#fff';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    document.body.appendChild(notification);

    setTimeout(() => {
        document.body.removeChild(notification);
    }, 2000); // Remove after 2 seconds
}

// Process image file
async function processImage(file) {
    const reader = new FileReader();
    reader.onload = async (event) => {
        const imgSrc = event.target.result;

        // Preprocess image
        const preprocessedImg = await preprocessImage(imgSrc);

        // Perform OCR
        resultText.textContent = 'Processing...';
        try {
            const { data: { text } } = await Tesseract.recognize(
                preprocessedImg,
                'vie', // Use Vietnamese language
                {
                    logger: (info) => console.log(info), // Log progress
                    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựíìỉĩịýỳỷỹỵđ',
                }
            );

            // Concatenate all lines into a single line
            const concatenatedText = text.replace(/\n+/g, ' ').trim();
            resultText.textContent = concatenatedText || 'No text found in the image.';
        } catch (error) {
            resultText.textContent = 'Error extracting text. Please try again.';
            console.error(error);
        }
    };
    reader.readAsDataURL(file);
}

// Preprocess image (convert to grayscale using canvas)
async function preprocessImage(imgSrc) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imgSrc;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size to match the image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image on canvas and apply grayscale filter
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg; // Red
                data[i + 1] = avg; // Green
                data[i + 2] = avg; // Blue
            }

            ctx.putImageData(imageData, 0, 0);

            // Return the preprocessed image as a data URL
            resolve(canvas.toDataURL());
        };
    });
}
