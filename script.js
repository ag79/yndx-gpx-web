document.getElementById('converterForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const url = document.getElementById('url').value;
    const addElevation = document.getElementById('add_elevation').checked ? 1 : 0;
    const lines = document.querySelector('input[name="lines"]:checked').value;
    const placemarks = document.getElementById('placemarks').checked ? 1 : 0;

    const errorDiv = document.getElementById('output');

    // Validate URL format
    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            throw new Error('Invalid protocol');
        }
    } catch (e) {
        errorDiv.textContent = 'Проверьте, что введен корректный адрес карты, \
        начинающийся с http:// или https://. Копируйте его из адресной строки браузера \
        или пользуйтесь функцией "Поделиться".';
        errorDiv.style.display = 'block';
        return;
    }

    if (!url.includes('yandex.ru/maps/')) {
        errorDiv.textContent = 'Нужна ссылка на Яндекс Карты: https://yandex.ru/maps/...';
        errorDiv.style.display = 'block';
        return;
    }

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
                    // Proper UTF-8 decoding from base64
                    const decodedString = decodeBase64UTF8(gpxInfoHeader);
                    errorDiv.className = 'result';
                    errorDiv.textContent = decodedString;
                    errorDiv.style.display = 'block';
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
            errorDiv.className = 'error';
            errorDiv.textContent = `Error ${response.status}: ${errorText}`;
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.className = 'error';
        errorDiv.textContent = `Request failed: ${err.message}`;
        errorDiv.style.display = 'block';
    }
});

// Helper function for proper UTF-8 base64 decoding
function decodeBase64UTF8(str) {
    // Convert base64 to binary string
    const binaryString = atob(str);
    // Convert binary string to byte array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    // Decode UTF-8
    return new TextDecoder('utf-8').decode(bytes);
}