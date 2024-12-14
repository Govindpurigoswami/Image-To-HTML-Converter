const imageUpload = document.getElementById('image-upload');
const convertBtn = document.getElementById('convert-btn');
const htmlOutput = document.getElementById('html-output');
const copyBtn = document.getElementById('copy-btn');
const progressElement = document.getElementById('progress');  // Progress element
const uploadStatus = document.getElementById('upload-status'); // Upload status element
const languageSelect = document.getElementById('language-select'); // Language selection element
const loadingSpinner = document.getElementById('loading-spinner'); // Loading spinner element

// Handle image upload
imageUpload.addEventListener('change', () => {
    if (imageUpload.files.length > 0) {
        uploadStatus.textContent = 'Image uploaded successfully!';
        uploadStatus.style.color = '#28a745'; // Green text for success
    } else {
        uploadStatus.textContent = '';
    }
});

// Handle the convert button click
convertBtn.addEventListener('click', () => {
    const file = imageUpload.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageSrc = e.target.result;

            // Create a canvas to preprocess the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                // Convert to grayscale
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = data[i + 1] = data[i + 2] = avg;  // Set R, G, B to avg
                }
                ctx.putImageData(imageData, 0, 0);
                const preprocessedSrc = canvas.toDataURL(); // Get the preprocessed image as Data URL

                // Get the selected language from the dropdown
                const selectedLanguage = languageSelect.value;

                // Show loading spinner
                loadingSpinner.style.display = 'block';

                // Recognize text using Tesseract with progress display
                Tesseract.recognize(
                    preprocessedSrc, // Use preprocessed image
                    selectedLanguage,  // Use the selected language
                    {
                        logger: (info) => {
                            console.log(info);
                            // Show progress in the UI
                            if (info.status === 'recognizing text') {
                                progressElement.textContent = `Progress: ${Math.round(info.progress * 100)}%`;
                            }
                        }
                    }
                )
                .then(({ data: { text } }) => {
                    const generatedHTML = convertImageToHTML(text);
                    htmlOutput.value = generatedHTML;
                    progressElement.textContent = 'Completed!';  // Show completion message
                })
                .catch(err => {
                    console.error(err);
                    alert('An error occurred while recognizing text. Please try another image.');
                    progressElement.textContent = 'Error occurred.';
                })
                .finally(() => {
                    // Hide loading spinner
                    loadingSpinner.style.display = 'none';
                });
            };
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please upload an image file.');
    }
});

function convertImageToHTML(recognizedText) {
    return `
    <div class="text-container">
        <p>${recognizedText}</p> <!-- Display recognized text -->
    </div>
    `;
}

// Handle copy button click
copyBtn.addEventListener('click', () => {
    htmlOutput.select();
    document.execCommand('copy'); // Copy the content of the textarea
    alert('HTML code copied to clipboard!');
});

// Download in HTML file format
function downloadHTML() {
    const blob = new Blob([htmlOutput.value], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'generated.html';
    link.click();
}

const downloadBtn = document.getElementById('download-btn');
downloadBtn.addEventListener('click', downloadHTML);
