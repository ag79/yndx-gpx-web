document.getElementById('converterForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Collect form values
    const url = document.getElementById('url').value;
    const addElevation = document.getElementById('add_elevation').checked ? 1 : 0;
    const lines = document.querySelector('input[name="lines"]:checked').value;
    const placemarks = document.getElementById('placemarks').checked ? 1 : 0;

    const errorDiv = document.getElementById('error');

    // Validate URL
    if (!url.startsWith('https://yandex.ru/maps/')) {
        errorDiv.textContent = 'URL должен начинаться с https://yandex.ru/maps/';
        errorDiv.style.display = 'block';
        return; // Stop execution if validation fails
    }

    // Construct the query string
    const queryParams = new URLSearchParams({
        url: url,
        add_elevation: addElevation,
        lines: lines,
        placemarks: placemarks
    }).toString();

    // Replace with your Yandex Cloud Function URL
    const functionUrl = `https://functions.yandexcloud.net/d4ea9k4gss3q5ge37s23?${queryParams}`;

    try {
        const response = await fetch(functionUrl);

        if (response.ok) {
            // Handle file download
            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition
                ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                : 'track.gpx';

            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            errorDiv.style.display = 'none'; // Hide error if successful
        } else {
            // Display error
            const errorText = await response.text();
            errorDiv.textContent = `Error ${response.status}: ${errorText}`;
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = `Request failed: ${err.message}`;
        errorDiv.style.display = 'block';
    }
});