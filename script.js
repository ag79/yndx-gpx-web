document.getElementById('converterForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const urlInput = document.getElementById('url');
    let url = urlInput.value;
    const addElevation = document.getElementById('add_elevation').checked ? 1 : 0;
    const lines = document.querySelector('input[name="lines"]:checked').value;
    const placemarks = document.getElementById('placemarks').checked ? 1 : 0;

    const errorDiv = document.getElementById('output');

    function displayMessage(message, isError = true) {
        errorDiv.className = isError ? 'error' : 'result';
        errorDiv.innerHTML = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Validate URL format
    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            throw new Error('Invalid protocol');
        }
    } catch (e) {
        displayMessage('Проверьте, что введен корректный адрес карты, \
        начинающийся с http:// или https://. Копируйте его из адресной строки браузера \
        или пользуйтесь функцией "Поделиться".');
        return;
    }

    if (!/yandex\.[a-z]{2,}\/maps/i.test(url)) {
        displayMessage('Нужна ссылка на Яндекс Карты: https://yandex.ru/maps...');
        return;
    }

    // Fix user double paste
    url = url.replace(/(https:\/\/.*?)(https:\/\/.*)/, '$1');

    // Fix common user input error (where does this come from?)
    url = url.replace("maps/rtext", "maps?rtext");

    // Update url in input field
    urlInput.value = url;

    const queryParams = new URLSearchParams({
        url: url,
        add_elevation: addElevation,
        lines: lines,
        placemarks: placemarks
    }).toString();

    const functionUrl = `https://functions.yandexcloud.net/d4ea9k4gss3q5ge37s23?${queryParams}`;

    try {
        const response = await fetch(functionUrl);

        if (response.ok) {
            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'track.gpx';

            if (contentDisposition) {
                const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.*)$/);
                if (utf8Match && utf8Match[1]) {
                    try {
                        filename = decodeURIComponent(utf8Match[1]);
                    } catch (e) {
                        console.error('Failed to decode filename:', e);
                    }
                } else {
                    const basicMatch = contentDisposition.match(/filename="([^"]+)"/);
                    if (basicMatch && basicMatch[1]) {
                        filename = basicMatch[1];
                    }
                }
            }

            // Handle X-GPX-Info header with proper UTF-8 decoding
            const gpxInfoHeader = response.headers.get('X-GPX-Info');
            if (gpxInfoHeader) {
                try {
                    const decodedString = decodeBase64UTF8(gpxInfoHeader);
                    displayMessage(decodedString, false);
                } catch (e) {
                    console.error('Failed to decode X-GPX-Info:', e);
                }
            }

            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } else {
            const errorText = await response.text();
            displayMessage(`Ошибка ${response.status}: ${errorText}`);
        }
    } catch (err) {
        displayMessage(`Request failed: ${err.message}`);
    }
});

// Helper function for proper UTF-8 base64 decoding
function decodeBase64UTF8(str) {
    const byteArray = Uint8Array.from(atob(str), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(byteArray);
}

// Paste handling
document.getElementById('pasteButton').addEventListener('click', async function() {
    const urlInput = document.getElementById('url');
    
    try {
        // Check if Clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            throw new Error('Clipboard API not available');
        }
        
        // Read clipboard text
        const clipboardText = await navigator.clipboard.readText();
        
        // Validate and insert the text
        if (clipboardText.trim()) {
            urlInput.value = clipboardText;
            
            // Trigger input event for any validation listeners
            const event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            urlInput.dispatchEvent(event);
            
            // Focus the input for immediate editing if needed
            urlInput.focus();
        }
    } catch (err) {
        console.error('Paste failed:', err);
        
        // Fallback: Focus the input and show instructions
        urlInput.focus();
    }
});