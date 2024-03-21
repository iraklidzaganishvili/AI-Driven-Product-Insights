// Import the Showdown converter
const Showdown = require('showdown');
const { JSDOM } = require("jsdom");
const fs = require('fs');
const path = require('node:path');

function articleToHTML(markdownText, product0, product1, product2, index, rand, PupImages) {

    //End the function if any of the products are empty or null         
    if (product0 == null || product1 == null || product2 == null) {
        console.log("Gen failed in converter.js index " + index, rand)
        return
    }

    // Create a new converter instance
    const converter = new Showdown.Converter();

    // Convert markdown to HTML
    const htmlText = converter.makeHtml(markdownText);
    // console.log(htmlText)

    function addListsToHTML(html) {
        const dom = new JSDOM(html);
        const document = dom.window.document;
        let currentUl = null;

        // Function to close current list if it exists
        const closeCurrentList = () => {
            if (currentUl) {
                currentUl = null;
            }
        };

        const elements = Array.from(document.body.children);
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.tagName === 'H1') {
                // Create a new header element and wrap the H1
                const header = document.createElement('header');
                header.className = 'container'; // Set the class for the header

                el.classList.add('text-center', 'mt-5'); // Add classes to the H1 tag

                // Move the H1 into the header and then replace the original H1 with this new header
                el.parentNode.insertBefore(header, el);
                header.appendChild(el);

                //carousel
                const carousel = mainDocument.getElementById('carousel-cont')
                const carouselInner = mainDocument.getElementsByClassName('carousel-inner')[0]

                //inside it
                PupImages.forEach((imageUrl, i) => {
                    const item = document.createElement('div');
                    item.classList.add('carousel-item', 'link2amazon');
                    if (i == 0) {
                        item.classList.add('active');
                    }
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.onerror="this.onerror=null"
                    img.className = 'd-block w-100';
                    img.alt = 'Carousel product image';
                    item.appendChild(img);
                    carouselInner.appendChild(item);
                })
                header.insertAdjacentElement('afterend', carousel)

            } else if (el.tagName === 'H2') {
                closeCurrentList(); // Ensure no open lists are carried over
            } else if (el.tagName === 'H3') {
                // Check if there's a P tag following the H3
                const nextEl = elements[i + 1];
                if (nextEl && nextEl.tagName === 'P') {
                    if (!currentUl) {
                        // If there's no current list, create one and insert it after the last H2 or at the start
                        currentUl = document.createElement('ul');
                        currentUl.className = "list-group";
                        el.parentNode.insertBefore(currentUl, el);
                    }
                    // Create a new list item and move H3 and P into it
                    const li = document.createElement('li');
                    li.className = "list-group-item";
                    li.appendChild(el.cloneNode(true)); // Clone H3
                    li.appendChild(nextEl.cloneNode(true)); // Clone P
                    currentUl.appendChild(li);

                    // Remove original H3 and P to avoid duplication
                    el.parentNode.removeChild(el);
                    nextEl.parentNode.removeChild(nextEl);

                    i++; // Skip the next element since we already processed it
                }
            }
        }

        // ----------

        const h2s = document.querySelectorAll('h2');

        h2s.forEach((h2, index) => {
            const div = document.createElement('div'); // Create a new div
            div.className = "container mt-5 sec"; // Add classes to the div
            h2.parentNode.insertBefore(div, h2); // Insert the div before the h2

            let next = h2.nextElementSibling;
            div.appendChild(h2); // Move the h2 inside the div
            while (next && next.tagName !== 'H2') {
                const toMove = next; // Store reference as next will change
                next = next.nextElementSibling; // Move to the next sibling before moving the current element
                div.appendChild(toMove); // Move the current element inside the div
            }

        });

        // ---------

        const aTags = document.querySelectorAll('a');

        aTags.forEach(a => {
            const parentP = a.parentNode;
            if (parentP.tagName === 'P') {
                a.className = "btn btn-primary link2amazon"
                const div = document.createElement('div'); // Create a new div
                div.innerHTML = parentP.innerHTML; // Copy the innerHTML from the p to the div
                parentP.parentNode.replaceChild(div, parentP); // Replace the p with the div
            }
        });
        let outputHTML = document.body.innerHTML;

        // Regular expression to remove extra line breaks after </ul> tags
        // outputHTML = outputHTML.replace(/<\/ul>\s*\n\s*\n/g, '</ul>\n');
        outputHTML = outputHTML.replace(/<\/div>\s*\n\s*\n/g, '</div>\n');

        return outputHTML;
    }

    // Load main HTML content
    const mainHtmlContent = fs.readFileSync('e/blueprint.html', 'utf8');
    const mainDom = new JSDOM(mainHtmlContent);
    const mainDocument = mainDom.window.document;

    // Transform the HTML
    const modifiedHtml = addListsToHTML(htmlText);
    // console.log(modifiedHtml);

    // ---------- insert in to the actual file ----------

    // Find the section with the ID 'article'
    const articleSection = mainDocument.querySelector('#article');
    articleSection.innerHTML += modifiedHtml;

    // Insert in to cards
    const card1 = mainDocument.querySelector('#card1')
    card1.querySelector('img').src = product1.productImages[0]
    card1.querySelector('.card-title').innerHTML = product1.title
    card1.querySelector('.card-text').innerHTML = product1.fullPrice + "$"
    card1.querySelector('.revCount').innerHTML = product1.reviewRatingAndCount[1].match(/\d+/g).join(",");
    const card2 = mainDocument.querySelector('#card2')
    card2.querySelector('img').src = product2.productImages[0]
    card2.querySelector('.card-title').innerHTML = product2.title
    card2.querySelector('.card-text').innerHTML = product2.fullPrice + "$"
    card2.querySelector('.revCount').innerHTML = product1.reviewRatingAndCount[1].match(/\d+/g).join(",");

    // Insert Links
    const scriptTag = mainDocument.createElement('script');
    scriptTag.innerHTML = `var link0 = "${product0.link}"; var link1 = "${product1.link}"; var link2 = "${product2.link}";`;
    mainDocument.body.insertBefore(scriptTag, mainDocument.body.firstChild);

    // Make schema
    const schemaJSON = mainDocument.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(schemaJSON.innerHTML);
    schema.itemListElement[0].item.offers.price = product0.fullPrice;
    schema.itemListElement[0].item.offers.url = product0.link;
    schema.itemListElement[0].item.image = product0.productImages[0];
    schema.itemListElement[0].item.name = product0.title;
    schema.itemListElement[0].item.description = product0.fromTheManufacturer[0] || "";

    schema.itemListElement[1].item.offers.price = product1.fullPrice;
    schema.itemListElement[1].item.offers.url = product1.link;
    schema.itemListElement[1].item.image = product1.productImages[0];
    schema.itemListElement[1].item.name = product1.title;
    schema.itemListElement[1].item.description = product1.fromTheManufacturer[0] || "";

    schema.itemListElement[2].item.offers.price = product2.fullPrice;
    schema.itemListElement[2].item.offers.url = product2.link;
    schema.itemListElement[2].item.image = product2.productImages[0];
    schema.itemListElement[2].item.name = product2.title;
    schema.itemListElement[2].item.description = product2.fromTheManufacturer[0] || "";
    schemaJSON.innerHTML = JSON.stringify(schema);

    //Other parts of header
    mainDocument.querySelector('meta[name="description"]').setAttribute('content', 'product0.fromTheManufacturer[0]')
    mainDocument.querySelector('meta[name="keywords"]').setAttribute('content', 'hi')
    mainDocument.querySelector('title').innerHTML = product0.title;

    // Save the updated HTML
    const updatedHTML = mainDom.serialize();

    const files = fs.readdirSync('e');
    let maxNum = 0;

    files.forEach(file => {
        const baseName = path.basename(file, '.html');
        const num = parseInt(baseName);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    })
    const pageNum = maxNum + 1;
    const newFileName = `${pageNum}.html`;
    const road = path.join('e', newFileName)
    fs.writeFileSync(road, updatedHTML, 'utf8');
    console.log(`HTML file ${newFileName} saved!`)
}

function mainPage(allProducts) {
    const mainHtmlContent = fs.readFileSync('e/index.html', 'utf8');
    const mainDom = new JSDOM(mainHtmlContent);
    const mainDocument = mainDom.window.document;

    const section = mainDocument.querySelectorAll('section');

    const cards = section[0].querySelectorAll('.card');
    cards.forEach((card, index) => {
        if (allProducts.length > index) {
            card.querySelector('img').src = allProducts[index].productImages[0]
            card.querySelector('.card-title').innerHTML = allProducts[index].title
            card.querySelector('.card-text').innerHTML = allProducts[index].fullPrice + "$"
            card.querySelector('.revCount').innerHTML = allProducts[index].reviewRatingAndCount[1].match(/\d+/g).join(",");
            card.onclick = () => { window.location.href = allProducts[index].link; }
        } else {
            return;
        }
    });
    const updatedHTML = mainDom.serialize();
    const road = path.join('e', 'index-new.html')
    fs.writeFileSync(road, updatedHTML, 'utf8');
    console.log(`HTML file index-new.html saved!`)
}
module.exports = {
    articleToHTML,
    mainPage
};

