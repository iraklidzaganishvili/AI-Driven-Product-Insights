// Import the Showdown converter
const Showdown = require('showdown');
const { JSDOM } = require("jsdom");
const fs = require('fs');
const path = require('node:path');
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: '***REMOVED***',
});

async function articleToHTML(markdownText, product0, relatedProducts, index, rand) {
    const relatedProductsTitles = relatedProducts.map(product => product.title)
    // if (product1.reviewRatingAndCount == "") {
    //     console.log(product1)
    // }

    //End the function if any of the products are empty or null         
    // if (product0 == null || product1 == null || product2 == null) {
    //     console.log("Gen failed in converter.js index " + index, rand)
    //     return
    // }

    const keywords = getKewords(product0.title)

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

                // //carousel
                // const carousel = mainDocument.getElementById('carousel-cont')
                // const carouselInner = mainDocument.getElementsByClassName('carousel-inner')[0]

                // //inside it
                // product0.productImages.forEach((imageUrl, i) => {
                //     const item = document.createElement('div');
                //     item.classList.add('carousel-item', 'link2amazon');
                //     if (i == 0) {
                //         item.classList.add('active');
                //     }
                //     const img = document.createElement('img');
                //     img.src = imageUrl;
                //     img.onerror = "this.onerror=null"
                //     img.className = 'd-block w-100';
                //     img.alt = 'Carousel product image';
                //     item.appendChild(img);
                //     carouselInner.appendChild(item);
                // })
                // header.insertAdjacentElement('afterend', carousel)

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

        const linkEl = document.createElement('a');
        linkEl.href = product0.link;
        linkEl.className = "btn btn-primary link2amazon";
        linkEl.textContent = "Buy on Amazon";
        document.body.appendChild(linkEl);

        let outputHTML = document.body.innerHTML;
        // Regular expression to remove extra line breaks after </ul> tags
        // outputHTML = outputHTML.replace(/<\/ul>\s*\n\s*\n/g, '</ul>\n');
        outputHTML = outputHTML.replace(/<\/div>\s*\n\s*\n/g, '</div>\n');

        return outputHTML;
    }

    // Load main HTML content
    const mainHtmlContent = fs.readFileSync('template/swoo_html/inner_pages/template.html', 'utf8');
    const mainDom = new JSDOM(mainHtmlContent);
    const mainDocument = mainDom.window.document;

    // Transform the HTML
    const modifiedHtml = addListsToHTML(htmlText);
    // console.log(modifiedHtml);


    // ---------- insert in to the actual file ----------

    // // Find the section with the ID 'article'
    // const articleSection = mainDocument.querySelector('#article');
    // articleSection.innerHTML += modifiedHtml;

    // // Insert in to cards
    // let c1Score = product1.reviewRatingAndCount[0].match(/^(\d(\.\d)?)/)[0]
    // c1Score = Math.round(c1Score * 2) / 2;
    // const card1 = mainDocument.querySelector('#card1')
    // card1.querySelector('img').src = product1.productSmallImage
    // card1.querySelector('.card-title').innerHTML = product1.title
    // card1.querySelector('.card-text').innerHTML = product1.fullPrice + "$"
    // card1.querySelector('.revCount').innerHTML = product1.reviewRatingAndCount[1].match(/\d+/g).join(",");
    // card1.querySelector('.revImg').src = `./images/${c1Score}.png`

    // let c2Score = product2.reviewRatingAndCount[0].match(/^(\d(\.\d)?)/)[0]
    // c2Score = Math.round(c2Score * 2) / 2;
    // const card2 = mainDocument.querySelector('#card2')
    // card2.querySelector('img').src = product2.productSmallImage
    // card2.querySelector('.card-title').innerHTML = product2.title
    // card2.querySelector('.card-text').innerHTML = product2.fullPrice + "$"
    // card2.querySelector('.revCount').innerHTML = product1.reviewRatingAndCount[1].match(/\d+/g).join(",");
    // card2.querySelector('.revImg').src = `./images/${c2Score}.png`

    // // Insert Links
    // const scriptTag = mainDocument.createElement('script');
    // scriptTag.innerHTML = `var link0 = "${product0.link}"; var link1 = "${product1.link}"; var link2 = "${product2.link}";`;
    // mainDocument.body.insertBefore(scriptTag, mainDocument.body.firstChild);

    // Make schema
    const schemaJSON = mainDocument.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(schemaJSON.innerHTML);
    schema.itemListElement[0].item.offers.price = product0.fullPrice;
    schema.itemListElement[0].item.offers.url = product0.link;
    schema.itemListElement[0].item.image = product0.productImages[0];
    schema.itemListElement[0].item.name = product0.title;
    schema.itemListElement[0].item.description = product0.fromTheManufacturer[0] || "";

    const listItemSchema = {
        "@type": "ListItem",
        "position": 1,
        "item": {
            "@type": "Product",
            "name": "",
            "image": "",
            "description": "",
            "offers": {
                "@type": "Offer",
                "url": "",
                "priceCurrency": "USD",
                "price": "",
                "availability": "https://schema.org/InStock",
                "itemCondition": "https://schema.org/NewCondition"
            }
        }
    }
    let position = 2;
    relatedProducts.forEach(rp => {
        const copy = JSON.parse(JSON.stringify(listItemSchema));
        copy.position = position;
        copy.item.name = rp.title;
        copy.item.image = rp.productImages[0];
        copy.item.description = rp.fromTheManufacturer[0] || "";
        copy.item.offers.price = rp.fullPrice;
        copy.item.offers.url = rp.link;
        schema.itemListElement.push(copy);
        position += 1;
    });

    schemaJSON.innerHTML = JSON.stringify(schema);

    //Other parts of header
    mainDocument.querySelector('meta[name="description"]').setAttribute('content', product0.fromTheManufacturer[0]);
    mainDocument.querySelector('meta[name="keywords"]').setAttribute('content', await keywords)
    mainDocument.querySelector('title').innerHTML = product0.title;

    // Save the updated HTML

    // mainDocument.getElementById('1-title').innerHTML=product0.title
    // mainDocument.getElementById('2-price').innerHTML=product0.price
    const ids = Array.from(mainDocument.querySelectorAll('[id]'))
        .filter(el => /^\d+-\w/.test(el.id));
    ids.sort((a, b) => parseInt(a.id.split('-')[0]) - parseInt(b.id.split('-')[0]));
    ids.forEach(el => {
        console.log(el.id)

    })
    ids[0].innerHTML = product0.title
    let c1Score = product0.reviewRatingAndCount[0].match(/^(\d(\.\d)?)/)[0]
    c1Score = Math.round(c1Score * 2) / 2;
    ids[1].src = `../../../e/images/${c1Score}.png`
    ids[2].innerHTML = product0.reviewRatingAndCount[1].match(/\d+/g).join(",");
    ids[3].innerHTML = product0.fullPrice + '$'
    ids[4].innerHTML = '.-sdasdsad'
    ids[5].innerHTML = product0.fullPrice + '$'
    ids[6].innerHTML = 'grab-this'
    ids[7].innerHTML = product0.brand

    const swiperWrapper = mainDocument.getElementById('9-imgs-big').querySelector('.swiper-wrapper');
    product0.productImages.forEach((imgSrc, i) => {
        const newSlide = mainDocument.createElement('div');
        newSlide.className = "swiper-slide";
        const imgContainer = mainDocument.createElement('div');
        imgContainer.className = "img";
        const img = mainDocument.createElement('img');
        img.src = "../../../e/" + imgSrc;
        imgContainer.appendChild(img);
        newSlide.appendChild(imgContainer);
        swiperWrapper.appendChild(newSlide);
    });

    const swiperWrapper1 = mainDocument.querySelector('.gallery-thumbs').querySelector('.swiper-wrapper');
    product0.productImages.forEach((imgSrc, i) => {
        const newSlide = mainDocument.createElement('div');
        newSlide.className = "swiper-slide";
        const imgContainer = mainDocument.createElement('div');
        imgContainer.className = "img";
        const img = mainDocument.createElement('img');
        img.src = "../../../e/" + imgSrc;
        imgContainer.appendChild(img);
        newSlide.appendChild(imgContainer);
        swiperWrapper1.appendChild(newSlide);
    });

    ids[10].innerHTML = modifiedHtml

    const table = product0.table
    if (table) {
        const ul = mainDocument.createElement('ul');
        const addInfo = mainDocument.querySelector('.additional-info')
        table.forEach(([key, value]) => {
            const li = mainDocument.createElement('li');
            const strong = mainDocument.createElement('strong');
            strong.textContent = key;
            const span = mainDocument.createElement('span');
            span.textContent = ` ${value}`;
            li.appendChild(strong);
            li.appendChild(span);
            ul.appendChild(li);
        });
        addInfo.appendChild(ul)
    } else {
        console.log('no table found')
    }

    const relatedProductsElement = mainDocument.getElementById('13-related-prdcts');

    // Create 8 slides with product information
    for (let i = 0; i < relatedProducts.length; i++) {
        const product = relatedProducts[i];

        // Create the slide element
        const slide = mainDocument.createElement('div');
        slide.className = 'swiper-slide';
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-label', `${i + 1} / 8`);
        slide.style.width = '236px';

        // Create the product card element
        const productCard = mainDocument.createElement('div');
        productCard.className = 'product-card';

        // Create the top info section
        const topInfo = mainDocument.createElement('div');
        topInfo.className = 'top-inf';

        // Create the image section
        const imageLink = mainDocument.createElement('a');
        imageLink.href = '#0';
        imageLink.className = 'img';
        const image = mainDocument.createElement('img');
        const imgLink = '../../../e/' + product.productSmallImage
        image.src = imgLink;
        image.alt = '';
        image.className = 'img-contain main-image';
        imageLink.appendChild(image);

        // Create the info section
        const info = mainDocument.createElement('div');
        info.className = 'info';

        const rating = mainDocument.createElement('div');
        rating.className = 'rating';
        const stars = mainDocument.createElement('div');
        stars.className = 'stars';
        const star = mainDocument.createElement('img');
        let cScore = product.reviewRatingAndCount[0].match(/^(\d(\.\d)?)/)[0]
        cScore = Math.round(cScore * 2) / 2;
        star.src = `../../../e/images/${cScore}.png`
        stars.appendChild(star);
        const numReviews = mainDocument.createElement('span');
        numReviews.className = 'num';
        numReviews.textContent = `(${product.reviewRatingAndCount[1].match(/\d+/g).join(",")})`;
        rating.appendChild(stars);
        rating.appendChild(numReviews);

        const title = mainDocument.createElement('h6');
        const titleLink = mainDocument.createElement('a');
        titleLink.href = '#';
        titleLink.className = 'prod-title fsz-14 fw-bold mt-2 hover-green2';
        titleLink.textContent = product.title;
        title.appendChild(titleLink);

        const price = mainDocument.createElement('div');
        price.className = 'price mt-15';
        const priceText = mainDocument.createElement('h5');
        priceText.className = 'fsz-18 fw-600';
        const fPrice = product.fullPrice + '$'
        priceText.textContent = fPrice;
        price.appendChild(priceText);

        const inStockText = mainDocument.createElement('p');
        inStockText.className = 'fsz-12 mt-2';
        const inStockIcon = mainDocument.createElement('i');
        inStockIcon.className = 'fas fa-check-circle color-green2 me-1';
        inStockText.appendChild(inStockIcon);
        inStockText.appendChild(mainDocument.createTextNode(' In stock'));

        info.appendChild(rating);
        info.appendChild(title);
        info.appendChild(price);
        info.appendChild(inStockText);

        // Append all elements to the product card
        productCard.appendChild(topInfo);
        productCard.appendChild(imageLink);
        productCard.appendChild(info);

        // Append the product card to the slide
        slide.appendChild(productCard);

        // Append the slide to the related products element
        relatedProductsElement.appendChild(slide);
    }

    if (product0.rephraseComments) {
        product0.rephraseComments.forEach(comment => {
            const commentReplayCont = mainDocument.createElement('div');
            commentReplayCont.className = 'comment-replay-cont py-5 px-4 mb-20 bg-white radius-5';

            const commentCont = mainDocument.createElement('div');
            commentCont.className = 'd-flex comment-cont';

            const inf = mainDocument.createElement('div');
            inf.className = 'inf';

            const title = mainDocument.createElement('div');
            title.className = 'title d-flex justify-content-between';

            const name = mainDocument.createElement('h6');
            name.className = 'fw-bold';
            name.textContent = comment.title;

            const timeAndRate = mainDocument.createElement('div');
            timeAndRate.className = 'time  text-uppercase d-inline-block';

            const rate = mainDocument.createElement('div');
            rate.className = 'rate';

            const stars = mainDocument.createElement('div');
            stars.className = 'stars';

            const star = mainDocument.createElement('img');
            let c2Score = comment.rating.match(/^(\d(\.\d)?)/)[0]
            c2Score = Math.round(c2Score * 2) / 2;
            star.src = `../../../e/images/${c2Score}.png`
            stars.appendChild(star);

            timeAndRate.appendChild(rate);
            title.appendChild(name);
            title.appendChild(timeAndRate);
            inf.appendChild(title);

            const text = mainDocument.createElement('div');
            text.className = 'text color-000  mt-10';
            text.textContent = comment.content;

            inf.appendChild(text);
            commentCont.appendChild(inf);
            commentReplayCont.appendChild(commentCont);

            mainDocument.getElementById('14-reviews-cont').appendChild(commentReplayCont);
        });
        mainDocument.getElementById('15-reviews-num').innerHTML = `(${product0.rephraseComments.length}) Comments`
        mainDocument.getElementById('pills-tab3-tab').innerHTML = `(${product0.rephraseComments.length}) Comments`
    }else{
        mainDocument.getElementById('15-reviews-num').innerHTML = `(0) Comments`
        mainDocument.getElementById('pills-tab3-tab').innerHTML = `(0) Comments`
    }


    const updatedHTML = mainDom.serialize();

    const files = fs.readdirSync('template/swoo_html/inner_pages/');
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
    const road = path.join('', newFileName)
    fs.writeFileSync(`template/swoo_html/inner_pages/${newFileName}`, updatedHTML, 'utf8');
    console.log(`HTML file ${newFileName} saved!`)
}

async function getKewords(input) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [
                {
                    "role": "system",
                    "content": `
                    Objective: Your task is to analyze the input, which will be a product name including the brand and the item type, and generate a list of SEO-optimized meta keywords. These keywords should be carefully selected to improve the product's search engine visibility, considering relevance, search volume, and specificity.

Input Description: The input is a string containing the brand name and the product type, formatted as "Brand Name - Product Type" (e.g., "AcmeCorp - Wireless Headphones").

Output Requirements:
Format: Output a comma-separated list of keywords. There should be no leading or trailing spaces, and no additional text or punctuation beyond the commas.

Content:
Start with the brand name and product type as primary keywords.
Include long-tail keywords, which are more specific phrases that potential customers might use when searching for this type of product. These often have lower search volume but can be less competitive and more targeted.
Add keywords that reflect product features, benefits, and applications, focusing on terms with a good balance between search volume and relevance to the product.
Consider related search terms that potential customers might use, which are indirectly related to the product but could lead to its discovery.
SEO Optimization Techniques:

Ensure the keywords are relevant to the product’s features and potential uses.
Incorporate a mix of broad and specific keywords to balance visibility and targeting.
Utilize semantic variations of the main keywords to cover possible search intents and synonyms.
Avoid keyword stuffing; ensure the keywords are natural and directly related to the product.
Examples:

Input: "AcmeCorp - Wireless Headphones"

Output: "AcmeCorp, wireless headphones, Bluetooth headphones, noise-cancelling audio, high fidelity sound, portable audio devices, best wireless headphones for travel"

Input: "GigaTech - Smartwatch"

Output: "GigaTech, smartwatch, fitness tracking watch, waterproof smart devices, heart rate monitor wearable, smart notifications wristwatch, best smartwatch for athletes"

Constraints:
Limit the output to a maximum of 50 keywords to maintain focus and relevance.
Ensure the keywords are realistic and reflect actual search behaviors and patterns.
Special Considerations:

Research commonly searched terms related to the product type to inform your keyword selection.
For niche products, prioritize keywords that accurately describe the product’s unique features or target market to attract more qualified traffic.
                    `
                },
                {
                    "role": "user",
                    "content": input
                }
            ],
            temperature: 1,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        let RawAiResault = response.choices[0].message.content
        RawAiResault = RawAiResault.replace(/\.$/, '')
        return RawAiResault
    } catch (err) {
        console.error(err);
    }

}

module.exports = {
    articleToHTML
};
