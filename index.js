const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');
const fs = require('fs');
const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: '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',
});
//google image search
const API_KEY = ' AIzaSyBddp8jmFT7KubMWGlq6LKpoi8TZO52oMA';
const CX = '206e8f6255aad4f6c';
//CHANGE THEESE
let MaxPages = 1;
let maxIndexesPerPage = 3

let allProducts = [];
let allArticles = []
let currNum = 0;

async function fetchAndProcessData() {
    try {
        const url = await new Promise((resolve) => {
            readline.question(`Enter Search `, resolve);
        });

        await getProducts('https://www.amazon.com/s?k=' + url);
        console.log(allProducts.length, "products stolen");

        let dataToSave = JSON.stringify(allProducts, null, 2);
        let AIDataToSave = JSON.stringify(allArticles, null, 2);
        await fs.promises.writeFile('outputs/output.txt', dataToSave);
        await fs.promises.writeFile('outputs/AI-output.txt', AIDataToSave);
        console.log('The files with the goods have been saved!');
    } catch (err) {
        console.error(err);
    } finally {
        readline.close();
    }
}

async function getProducts(url) {
    try {
        const response = await fetch(url);
        console.log("Search page loaded", url)
        const html = await response.text();
        const $ = cheerio.load(html);
        const singlePageResults = [];

        $('.s-result-item[data-component-type="s-search-result"]', html).each(function () {
            let link = 'https://www.amazon.com' + $(this).find('[data-cy="title-recipe"]').children('h2').children('a').attr('href');
            let img = $(this).find("img").attr("src");
            let title = $(this).find(".s-title-instructions-style").text();
            let priceWhole = $(this).find(".a-price-whole").text();
            let priceFraction = $(this).find(".a-price-fraction").text();
            let fullPrice = priceWhole + priceFraction;

            if (link && img && title && priceWhole) singlePageResults.push({
                link,
                title,
                productImages:[img],
                fullPrice
            });
        });

        if (singlePageResults.length == 0) {
            console.log('YOU WERE (probably) BANNED BY AMAZON FOR (hopefully) SEVERAL HOURS');
            console.log($.html())
            process.exit(0);
        }

        const productDetails = singlePageResults.map(async (product, i) => {
            return await fetchProductDetails(product, i);
        });

        const resolvedProductDetails = await Promise.all(productDetails);
        allProducts = allProducts.concat(resolvedProductDetails.filter(detail => detail));

        currNum++;
        let next = $('[aria-label^="Go to next page"]').attr('href')
        if (currNum < MaxPages && next) {
            const nextUrl = "https://www.amazon.com" + next;
            await getProducts(nextUrl);
        } else {
            console.log("Not going to next page")
        }
    } catch (err) {
        console.error(err);
    }
}

async function fetchProductDetails(product, index) {
    try {
        if (maxIndexesPerPage <= index) return
        console.log("Started", index)
        let commentsPage = "http://www.amazon.com/product-reviews" + (product.link.match(/(\/[^\/]*){5}(.{0,10})/) || [, ''])[1];
        const [response1, mainRes] = await Promise.all([
            fetch(commentsPage),
            fetch(product.link)
        ]);
        const html1 = await response1.text();
        const $1 = cheerio.load(html1);
        const ans = [];
        $1('[id^="customer_review"]', html1).each(function () {
            const titleElement = $1(this).find('[data-hook="review-title"]');
            const title = titleElement.children('span').text();
            const rating = titleElement.find('span').first().text();
            const content = $1(this).find('[data-hook="review-body"]').text().trim();
            ans.push({ title, rating, content });
        });

        const mainHtml = await mainRes.text();
        const m$ = cheerio.load(mainHtml);
        const texts = [];
        m$('#aplus_feature_div').find('p, h1, h2, h3, h4, h5, h6').each(function () {
            texts.push($1(this).text().trim());
        });
        product.reviewRatingAndCount = [
            $1('[data-hook="rating-out-of-text"]', html1).text(),
            $1('[data-hook="total-review-count"]', html1).children('span').text()
        ].filter(item => item !== null && item !== "");

        product.fromTheManufacturer = [
            m$('[id="featurebullets_feature_div"]', mainHtml).find('ul').text().trim(),
            ...texts,
            m$('[id="bookDescription_feature_div"]', mainHtml).text().trim()
        ].filter(item => item !== null && item !== "");

        product.bestReviews = ans;
        
        const links = await fetchImages(product.title)
        product.productImages.unshift(...links)

        console.log("Product", index, "done")

        //Call AI
        const { productImages, ...productNoImages } = product;
        const aiAnswer = await DoAIMagic(productNoImages, index)
        allArticles.push(aiAnswer)

        return product;
    } catch (error) {
        console.error(`Error fetching details for product index ${index}:`, error);
        return null;  // Return null for errors to filter out failed requests later
    }
}

async function DoAIMagic(prompt, index) {
    console.log("Started AI")
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        messages: [
            {
                "role": "system",
                "content": "Generate a 2000-word article that is SEO-optimized and based on the following inputs: 1. Product Name: [Insert Product Name Here] 2. Product Brand: [Insert Brand Name Here] 3. Amazon Product Reviews: [Insert Key Insights from Amazon Reviews] 4. Any other information. The article should be engaging and informative, tailored to potential customers. Ensure the content is unique and structured with SEO best practices in mind, including keyword optimization related to the product and its features. Incorporate the following elements: - Robert Cialdini's Principles of Persuasion: Apply these principles (Reciprocity, Scarcity, Authority, Consistency, Liking, and Consensus) strategically throughout the content to enhance its persuasive impact. - Readability and Structure: The article should be easy to read, with a clear introduction, body, and conclusion.Use H1 for the main title, H2 for major headings, and H3 for subheadings. - Formatting: Employ bullet points for lists, and ensure paragraphs are concise. - Useful Information for the Reader: Highlight the benefits, features, and practical applications of the product. Address common questions or concerns raised in the Amazon product reviews. - Call to Action: Conclude with a compelling call to action that encourages the reader to consider purchasing or learning more about the product. The objective is to create content that not only ranks well on search engines but also provides real value to readers, encouraging engagement and potential conversion. Use several of the images provided in the article"
            },
            {
                "role": "user",
                "content": JSON.stringify(prompt, null, 2)
            }
        ],
        temperature: 0,
        max_tokens: 4000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    });
    // let RawAiResault = response.choices[0].message.content
    // await fs.promises.writeFile('outputs/AI-output-raw.txt', JSON.stringify(RawAiResault, null, 2));
    // const secondResponse = await openai.chat.completions.create({
    //     model: "gpt-3.5-turbo-16k",
    //     messages: [
    //         {
    //             "role": "system",
    //             "content": "Convert the following article into a fully structured, SEO-optimized HTML webpage. Retain the original words and meaning of the article without any alterations. Structure the HTML with appropriate tags, such as <h1> for the main title, <h2> for subheadings, <p> for paragraphs, <ul>/<ol> for any lists, and <a> for hyperlinks, if applicable. Include meta tags for SEO, such as <title>, <meta name='description'> with a brief summary of the article, and <meta name='keywords'> with relevant keywords extracted from the article. Ensure that the HTML is clean, readable, and compliant with web standards. The final output should be ready to be directly used on a web page."
    //         },
    //         {
    //             "role": "user",
    //             "content": RawAiResault
    //         }
    //     ],
    //     temperature: 0,
    //     max_tokens: 12000,
    //     top_p: 1,
    //     frequency_penalty: 0,
    //     presence_penalty: 0,
    // });

    // saveAsHtml(secondResponse.choices[0].message.content.replace(/\\|\\n/g, ""), index)
    saveAsHtml(RawAiResault, index)
    return RawAiResault
}
async function saveAsHtml(item, index) {
    await fs.promises.writeFile(`outputs/txt/txt-${index}.txt`, item);
    console.log(`File ${index} saved`)
}
fetchAndProcessData()

async function fetchImages(SEARCH_QUERY) {
    try {
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(SEARCH_QUERY)}&cx=${CX}&searchType=image&key=${API_KEY}`
        const response = await fetch(url);
        const data = await response.json();

        let links = []
        if (data.items) {
            data.items.forEach(item => {
                links.push(item.link)
            });
        } else {
            console.log('No results found');
        }
        return links
    } catch (error) {
        console.error('Error:', error);
    }
}
