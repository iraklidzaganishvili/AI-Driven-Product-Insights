const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 50;
const path = require('node:path');
const { spawn } = require('child_process');

//imports
const { articleToHTML, mainPage } = require('./e/converter');
const { getImages, downloadFile } = require('./pup');

//useragent
const UserAgents = require('user-agents');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const firstAgent = new UserAgents(userAgent => userAgent.deviceCategory === 'desktop')
options = {
    method: 'GET',
    headers: {
        'User-Agent': firstAgent.toString()
    }
}
const cheerio = require('cheerio');
const fs = require('fs');
const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});
const OpenAI = require("openai");

//changables ------
let storeID = 'bestmmorpg00'

//openai
const openai = new OpenAI({
    apiKey: '***REMOVED***',
});

let allProducts = []
let allArticles = []
let savedIndexes = []
let currNum = 0;

let MaxPages = 1
let maxIndexesPerPage = 1
let url = "bottle"

agentRotator = 0

isFirstCall = true
let ImgMaxNum = 0;

async function fetchAndProcessData() {
    try {
        const userOutput = await new Promise((resolve) => {
            readline.question(`Enter search, max products per page (1-10), amount of pages: `, (input) => {
                readline.close();
                resolve(input);
            });
        });
        const inputs = userOutput.split(',').map(input => input.trim());
        [url = "bottle", maxIndexesPerPage = 1, MaxPages = 1] = inputs;

        await getProducts('https://www.amazon.com/s?k=' + url);

        for (let i = 0; i < savedIndexes.length; i++) {
            if (savedIndexes[i][1].bestReviews && savedIndexes[i][1].productImages) {
                const rand = twoNumbers();
                articleToHTML(savedIndexes[i][2], savedIndexes[i][1], allProducts[rand[0]], allProducts[rand[1]], 2222222);
            } else {
                console.log("Product " + index + " html generation failed due to lack of info")
            }
        }

        if (allProducts) mainPage(allProducts)

        let dataToSave = JSON.stringify(allProducts, null, 2);
        let AIDataToSave = JSON.stringify(allArticles, null, 2);
        await fs.promises.writeFile('outputs/info-output.txt', dataToSave);
        await fs.promises.writeFile('outputs/text-output.txt', AIDataToSave);
        console.log(allProducts.length, "products gotten");
    } catch (err) {
        console.error(err);
    } finally {
        readline.close();
    }
}

async function getProducts(url) {
    try {
        //roator
        if (agentRotator >= 100) {
            agentRotator = 0
            const userAgent = new UserAgents(userAgent => userAgent.deviceCategory === 'desktop')
            options = {
                method: 'GET',
                headers: {
                    'User-Agent': userAgent.toString()
                }
            }
        }

        const response = await fetch(url, options);
        agentRotator++
        console.log("Search page loaded", url)
        const html = await response.text();
        const $ = cheerio.load(html);
        const singlePageResults = [];

        $('.s-result-item[data-component-type="s-search-result"]', html).each(function () {
            let link = 'https://www.amazon.com' + $(this).find('[data-cy="title-recipe"]').children('h2').children('a').attr('href');
            link = decodeURIComponent(link);

            let img = $(this).find("img").attr("src");

            let title = $(this).find(".s-title-instructions-style").text();
            let prefix = "SponsoredSponsored You’re seeing this ad based on the product’s relevance to your search query.Leave ad feedback"
            title = title.startsWith(prefix) ? title.slice(prefix.length).trim() : title

            let priceWhole = $(this).find(".a-price-whole").text();
            let priceFraction = $(this).find(".a-price-fraction").text();
            let fullPrice = priceWhole + priceFraction;
            let asin = (link.match(/\/([A-Z0-9]{10})\//i))[1];
            link = `https://www.amazon.com/dp/${asin}/ref=nosim?tag=${storeID}`;

            if (link && img && title && priceWhole) singlePageResults.push({
                link,
                asin,
                title,
                productImages: [img],
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

        currNum++;
        let next = $('[aria-label^="Go to next page"]').attr('href')
        if (currNum < MaxPages && next) {
            const nextUrl = "https://www.amazon.com" + next;
            await getProducts(nextUrl);
        } else {
            console.log("Not going to next page")
            const resolvedProductDetails = await Promise.all(productDetails);
        }
    } catch (err) {
        console.error(err);
    }
}

async function DoAIMagic(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k",
            messages: [
                {
                    "role": "system",
                    "content": "Generate a 2000-word article that is SEO-optimized and based on the following inputs: 1. Product Name: [Insert Product Name Here] 2. Product Brand: [Insert Brand Name Here] 3. Amazon Product Reviews: [Insert Key Insights from Amazon Reviews] 4. Any other information. The article should be engaging and informative, tailored to potential customers. Ensure the content is unique and structured with SEO best practices in mind, including keyword optimization related to the product and its features. Incorporate the following elements: - Robert Cialdini's Principles of Persuasion: Apply these principles (Reciprocity, Scarcity, Authority, Consistency, Liking, and Consensus) strategically throughout the content to enhance its persuasive impact. - Readability and Structure: The article should be easy to read, with a clear introduction, body, and conclusion.Use H1 for the main title, H2 for major headings, and H3 for subheadings. - Formatting: Employ bullet points for lists, and ensure paragraphs are concise. - Useful Information for the Reader: Highlight the benefits, features, and practical applications of the product. Address common questions or concerns raised in the Amazon product reviews. - Call to Action: Conclude with a compelling call to action that encourages the reader to consider purchasing or learning more about the product. The objective is to create content that not only ranks well on search engines but also provides real value to readers, encouraging engagement and potential conversion. Do not use any images provided in the article"
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
        let RawAiResault = response.choices[0].message.content
        allArticles.push(RawAiResault)
        return RawAiResault
    } catch (err) {
        console.error(err);
    }

}

async function fetchProductDetails(product, index) {
    try {
        if (maxIndexesPerPage <= index) return
        let commentsPage = "http://www.amazon.com/product-reviews/" + product.asin;
        const [response1, mainRes] = await Promise.all([
            fetch(commentsPage, options),
            fetch(product.link, options)
        ]);
        agentRotator += 2
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


        //mainPage
        const mainHtml = await mainRes.text();
        const m$ = cheerio.load(mainHtml);

        let prBrand = m$(`.po-brand`, mainHtml).find('.po-break-word').text().trim()
        if (prBrand) product.brand = prBrand;

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

        if (isFirstCall == true) {
            const imgFiles = fs.readdirSync('e/gen-img');

            imgFiles.forEach(file => {
                const baseName = path.basename(file, '.html');
                const num = parseInt(baseName);
                if (!isNaN(num) && num > ImgMaxNum) {
                    ImgMaxNum = num;
                }
            })
            isFirstCall == false
        }

        getImages(product.link).then((prLinks) => {
            product.productImages.push(...prLinks);
            product.productImages.forEach((link, i) => {
                downloadFile(product.productImages[i], `./e/gen-img/${ImgMaxNum}.webp`, index);
                ImgMaxNum++
            });
            console.log('done ' + index)
        });
        //Call AI
        const rand = twoNumbers();
        // if (product.bestReviews && product.productImages) {
        //     const { productImages, ...productNoImages } = product;
        //     // const aiAnswer = await DoAIMagic(productNoImages)

        //     //SAVER <----
        //     console.log (rand)
        //     if (aiAnswer, product && allProducts[rand[0]] && allProducts[rand[1]]) {
        //         if (index > 2) {
        //             articleToHTML(aiAnswer, product, allProducts[rand[0]], allProducts[rand[1]]);
        //         } else {
        //             savedIndexes.push([index, product, aiAnswer])
        //         }
        //     } else {
        //         console.log("Product " + index + " generation failed due to lack of info")
        //     }
        // } else {
        //     console.log("Product " + index + " AI failed due to lack of info")
        // }

        if (index > 2) {
            articleToHTML(aiAnswer = `<h1>aa</h1>`, product, allProducts[rand[0]], allProducts[rand[1]], index, rand);
        } else {
            savedIndexes.push([index, product, '<h1>aa</h1>'])
        }

        allProducts.push(product)

        return product;
    } catch (error) {
        console.error(`Error fetching details for product index ${index}:`, error);
        return null;  // Return null for errors to filter out failed requests later
    }
}

function twoNumbers() {
    if (allProducts.length < 2) {
        return [0, 0]
    }
    let randomIndex1 = Math.floor(Math.random() * allProducts.length)
    let randomIndex2
    do {
        randomIndex2 = Math.floor(Math.random() * allProducts.length)
    } while (randomIndex1 === randomIndex2)
    return [randomIndex1, randomIndex2]
}

fetchAndProcessData()