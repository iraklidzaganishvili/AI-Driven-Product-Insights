async function sendToServer(product) {
    const url = 'http://localhost:3000/add-product'; // Adjust this if your server is on a different domain

    const validFields = [
        'title',
        'asin',
        'link',
        'fullPrice',
        'category',
        'brand',
        'reviewRating',
        'reviewCount',
        'productMidImage',
        'productImages',
        'productSmallImages',
    ];

    // Filter out undefined or null values
    const filteredProduct = Object.fromEntries(
        Object.entries(product)
            .filter(([key, value]) => validFields.includes(key) && value != null)
    );

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(filteredProduct),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    sendToServer
};
