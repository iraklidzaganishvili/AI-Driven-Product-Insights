const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 50;
const path = require('node:path');
const { spawn } = require('child_process');
const sharp = require('sharp');

//imports
const { articleToHTML, mainPage } = require('./e/converter');
const { getImages, downloadFile, resizeFile } = require('./pup');

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
            if (savedIndexes[i].product.bestReviews && savedIndexes[i].product.productImages) {
                const rand = twoNumbers();
                articleToHTML(savedIndexes[i].aiAnswer, savedIndexes[i].product, allProducts[rand[0]], allProducts[rand[1]], 2222222, rand);
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

let allprom = [];

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
        [singlePageResults, $] = await grabFirst(url)
        async function grabFirst(url) {
            const response = await fetch(url, options);
            agentRotator++
            console.log("Search page loaded", url)
            const html = await response.text();
            const $ = cheerio.load(html);
            const singlePageResults = [];

            $('.s-result-item[data-component-type="s-search-result"]', html).each(function () {
                let link = 'https://www.amazon.com' + $(this).find('[data-cy="title-recipe"]').children('h2').children('a').attr('href');
                link = decodeURIComponent(link);

                // let img = $(this).find("img").attr("src");

                let title = $(this).find(".s-title-instructions-style").text();
                let prefix = "SponsoredSponsored You’re seeing this ad based on the product’s relevance to your search query.Leave ad feedback"
                title = title.startsWith(prefix) ? title.slice(prefix.length).trim() : title

                let priceWhole = $(this).find(".a-price-whole").text();
                let priceFraction = $(this).find(".a-price-fraction").text();
                let fullPrice = priceWhole + priceFraction;
                let asin = (link.match(/\/([A-Z0-9]{10})\//i))[1];
                link = `https://www.amazon.com/dp/${asin}/ref=nosim?tag=${storeID}`;

                if (link && title && priceWhole) singlePageResults.push({
                    link,
                    asin,
                    title,
                    productImages: [],
                    fullPrice
                });
            });
            return [singlePageResults, $]
        }

        async function handleError(url) {
            const userAgent = new UserAgents(userAgent => userAgent.deviceCategory === 'desktop')
            console.log(userAgent.toString())
            options = {
                method: 'GET',
                headers: {
                    'User-Agent': userAgent.toString()
                }
            }
            await new Promise(resolve => setTimeout(resolve, 20 * 1000));
            [singlePageResults, $] = await grabFirst(url);
            if (singlePageResults == 0) {
                console.log('YOU WERE BANNED BY AMAZON... AGAIN');
                await handleError(url)
            } else {
                return [singlePageResults, $]
            }
        }

        if (singlePageResults.length == 0) {
            console.log('YOU WERE BANNED BY AMAZON');
            await handleError(url)
            // console.log($.html())
        }

        const productDetails = singlePageResults.map(async (product, i) => {
            return conContPages.run(async () => {
                await fetchProductDetails(product, i);
            });
        });

        allprom.push(...productDetails)

        currNum++;
        let next = $('[aria-label^="Go to next page"]').attr('href')
        if (currNum < MaxPages && next) {
            const nextUrl = "https://www.amazon.com" + next;
            await getProducts(nextUrl);
        } else {
            console.log("Not going to next page")
            await Promise.all(allprom)
        }
    } catch (err) {
        console.error(err);
    }
}

async function DoAIMagic(prompt) {
    try {
        const promptString = `Product information:
Product Name: ${cleanText(prompt.title)}
${prompt.brand ? `Product Brand: ${cleanText(prompt.brand)}` : ''}
Product Price: ${cleanText(prompt.fullPrice)}
Product Description: ${cleanText(prompt.fromTheManufacturer.join(' '))}
Review Rating And Count: ${cleanText(prompt.reviewRatingAndCount.join(' '))}
Amazon Product Reviews:
${prompt.bestReviews.map((review, index) => `Review ${index + 1}: ${cleanText(review.title)}
    Rating: ${cleanText(review.rating)}
    Content: "${cleanText(review.content)}"`).join('\n')}

Article word count should be at least 1500 words but we need to try to output 2000 words. `;

        function cleanText(text) {
            return text.replace(/\s+/g, ' ') // Replace multiple spaces with a single space
                .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with a single newline
                .trim(); // Remove leading and trailing whitespace
        }

        // console.log(promptString)


        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k-0613",
            messages: [
                {
                    "role": "system",
                    "content": `
                        Act as a world-class copywriter, generate a 2000 word article in proper US English without any grammatical or punctuation mistakes that is SEO-optimized and based on the following prompt and product information: Remember 2000 word count is important.

                        The article should be engaging and informative, tailored to potential customers. Ensure the content is unique and structured with SEO best practices in mind, including keyword optimization related to the product and its features. Incorporate the following elements: - Robert Cialdini's Principles of Persuasion: Apply these principles (Reciprocity, Scarcity, Authority, Consistency, Liking, and Consensus) strategically throughout the content to enhance its persuasive impact, but do not mention Robert Cialdini. 
                        
                        Readability and Structure: The article should be easy to read, with a clear introduction, body, and conclusion. Use H1 for the main title, H2 for major headings, and H3 for list headings. Implement all elements with markdown. Making everything markdown is very important and should not be missed. NEVER write anything but markdown. Ensure paragraphs are concise. Provide useful Information for the Reader: Highlight the benefits, features, and practical applications of the product. Address common questions or concerns raised in the Amazon product reviews. - Call to Action: Conclude with a compelling call to action that encourages the reader to consider purchasing or learning more about the product. The objective is to create content that not only ranks well on search engines but also provides real value to readers, encouraging engagement and potential conversion. 
                        
                        Do not forget, You are writing a ready to ship article. Do not include keynotes or anything for the writer. No matter what, do not copy paste reviews, use them as information to enhance the article. Do not title the last paragraph "call to action", it should have a proper name fit for a conclusion. Remember to write the paragraph in markdown. NEVER try to include any images. Do NOT use any links in the article. The article word count should be at least 1500 words but we need to try to output 2000 words. DO NOT OUTPUT LESS THAN 1500 WORDS. DO NOT DIRELY USE REVIEWS, USE THE INFORMATION IN THEM TO MAKE YOUR OWN PARAGRAPHS. Try your best to match the maximum token length. A small article is not needed. You need to generate the biggest article you can without directly using comments. Do not write anything but the article itself. DO NOT INCLUDE ANY AI WARNINGS OR A WORD COUNT.
                        `
                },
                {
                    "role": "user",
                    "content": promptString
                }
            ],
            temperature: 1,
            max_tokens: 12000,
            top_p: 0.4,
            frequency_penalty: 1,
            presence_penalty: 1,
        });
        function removeLinks(markdownString) {
            const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
            return markdownString.replace(linkRegex, '$1').replace(/H\d+:(\s*)/g, '$1');
        }
        let RawAiResault = removeLinks(response.choices[0].message.content)
        allArticles.push(RawAiResault)
        console.log('doneai')
        return RawAiResault
    } catch (err) {
        console.error(err);
    }

}

async function fakeAI(prompt) {
    RawAiResault = 'asdasdas <h1>aa</h1>'
    await new Promise(resolve => setTimeout(resolve, 20 * 1000));
    return RawAiResault
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

        console.log(product.link, 'prlink')
        const ImgPromise = runConcurrentlyControlledImageProcessing(product, index)


        //Call AI
        const rand = twoNumbers();
        if (product.bestReviews) {
            const { productImages, ...productNoImages } = product;
            const aiAnswerPromise = fakeAI(productNoImages)

            const [result1, aiAnswer] = await Promise.all([ImgPromise, aiAnswerPromise]);


            allProducts.push(product)

            //SAVER <----
            if (aiAnswer && product && allProducts[rand[0]] && allProducts[rand[1]]) {
                if (index > 2) {
                    articleToHTML(aiAnswer, product, allProducts[rand[0]], allProducts[rand[1]], index, rand);
                } else {
                    savedIndexes.push({ index, product, aiAnswer })
                }
            } else {
                console.log("Product " + index + " generation failed due to lack of info, ye", aiAnswer, product.link, allProducts[rand[0]].link, allProducts[rand[1]].link)
            }
        } else {
            console.log("Product " + index + " AI failed due to lack of info")
        }

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


class ConcurrencyControl {
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.currentRunning = 0;
        this.queue = [];
    }

    async run(task) {
        // Wait until there's a slot available
        if (this.currentRunning >= this.maxConcurrency) {
            await new Promise((resolve) => this.queue.push(resolve));
        }

        try {
            this.currentRunning++;
            // Execute the task
            return await task();
        } finally {
            this.currentRunning--;
            // Release the slot, start the next task in the queue
            if (this.queue.length > 0) {
                this.queue.shift()();
            }
        }
    }
}
const concpup = new ConcurrencyControl(3);
const conContPages = new ConcurrencyControl(3)

function processProductImages(product, index) {
    console.log('------------------------------------started------------------------------------', index)
    // Return a new promise that encapsulates the entire operation
    return new Promise((resolve, reject) => {
        getImages(product.link).then((prLinks) => {
            console.log(prLinks, 'link');
            let operations = prLinks.map(async (link, i) => {
                const currentImgMaxNum = ImgMaxNum++;
            
                try {
                    await downloadFile(link, `./e/gen-og/${currentImgMaxNum}.webp`, index);
            
                    const resizePromises = [
                        resizeFile(
                            `./e/gen-og/${currentImgMaxNum}.webp`,
                            `./e/gen-img/${currentImgMaxNum}-big.webp`,
                            index,
                            460,
                            460,
                            { r: 255, g: 255, b: 255, alpha: 1 }
                        ),
                    ];
            
                    if (i === 0) {
                        resizePromises.push(
                            resizeFile(
                                `./e/gen-og/${currentImgMaxNum}.webp`,
                                `./e/gen-img/${currentImgMaxNum}-small.webp`,
                                index,
                                320,
                                320,
                                { r: 255, g: 255, b: 255, alpha: 1 }
                            )
                        );
                    }
            
                    await Promise.all(resizePromises);
            
                    product.productImages.push(`./gen-img/${currentImgMaxNum}-big.webp`);
            
                    if (i === 0) {
                        product.productSmallImage = `./gen-img/${currentImgMaxNum}-small.webp`;
                    }
                } catch (err) {
                    console.error(`Error processing link: ${err}`);
                }
            });

            // Wait for all image processing operations to complete
            Promise.all(operations).then(() => {
                console.log('------------------------------------done------------------------------------', index)
                resolve(); // Resolve the outer promise once all operations are complete
            }).catch(reject);
        }).catch(reject);
    });
}
function runConcurrentlyControlledImageProcessing(product, index) {
    return concpup.run(() => processProductImages(product, index));
}

fetchAndProcessData()