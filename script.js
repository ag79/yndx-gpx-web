document.getElementById('converterForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const url = document.getElementById('url').value;
    const addElevation = document.getElementById('add_elevation').checked ? 1 : 0;
    const lines = document.querySelector('input[name="lines"]:checked').value;
    const placemarks = document.getElementById('placemarks').checked ? 1 : 0;

    const errorDiv = document.getElementById('error');

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
            let filename = 'track.gpx'; // Default

            if (contentDisposition) {
                // Match filename*=UTF-8''<anything> until end or invalid char
                const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.*)$/);
                if (utf8Match && utf8Match[1]) {
                    try {
                        filename = decodeURIComponent(utf8Match[1]);
                    } catch (e) {
                        console.error('Failed to decode filename:', e);
                    }
                } else {
                    // Fallback to basic filename="..."
                    const basicMatch = contentDisposition.match(/filename="([^"]+)"/);
                    if (basicMatch && basicMatch[1]) {
                        filename = basicMatch[1];
                    }
                }
            }

            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            errorDiv.style.display = 'none';
        } else {
            const errorText = await response.text();
            errorDiv.textContent = `Error ${response.status}: ${errorText}`;
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = `Request failed: ${err.message}`;
        errorDiv.style.display = 'block';
    }
});