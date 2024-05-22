document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const searchTerm = document.getElementById('searchInput').value;
    console.log(1);
    fetch(`/search?name=${encodeURIComponent(searchTerm)}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            console.log(data);
            if (data.fileName) {
                window.location.href = data.fileName;
            } else {
                alert('Product not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
});
