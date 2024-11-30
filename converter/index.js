const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 50;
const path = require('node:path');
const axios = require('axios');
require('dotenv').config();

//imports
const { articleToHTML } = require('./converter');
const { mainArticleAI, commentAI } = require('./ai');
const { getImages, downloadFile, resizeFile } = require('./pup');
const { sendToServer } = require('./server_controller');

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
const { stringify } = require('querystring');
const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

//changables ------
let storeID = 'bestmmorpg00'

let allProducts = []
let allArticles = []
let savedIndexes = []
let currNum = 0;

let MaxPages = 1
let maxIndexesPerPage = 1
let url = "bottle"
let category = "All"
let RelatedProductAmount = 8

agentRotator = 0

// isFirstCall = true
let ImgMaxNum = 0;

async function fetchAndProcessData() {
    try {
        const userOutput = await new Promise((resolve) => {
            readline.question(`Enter search, max products per page (1-10), amount of pages, category: `, (input) => {
                readline.close();
                resolve(input);
            });
        });
        const inputs = userOutput.split(',').map(input => input.trim());
        [url = "bottle", maxIndexesPerPage = 1, MaxPages = 1, category = "All"] = inputs;

        await getProducts('https://www.amazon.com/s?k=' + url);

        for (let i = 0; i < savedIndexes.length; i++) {
            if (savedIndexes[i].product.bestReviews && savedIndexes[i].product.productImages) {
                const rand = randomNumbers(RelatedProductAmount, savedIndexes.index);
                const relatedProducts = rand.map(index => allProducts[index]);
                articleToHTML(savedIndexes[i].aiAnswer, savedIndexes[i].product, relatedProducts, 2222222, rand);
            } else {
                console.log("Product " + index + " html generation failed due to lack of info")
            }
        }

        // if (allProducts) mainPage(allProducts)

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
                let prefix1 = "Featured from Amazon brandsFeatured from Amazon brands"
                title = title.startsWith(prefix) ? title.slice(prefix.length).trim() : title
                title = title.startsWith(prefix1) ? title.slice(prefix1.length).trim() : title

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
                    productSmallImages: [],
                    fullPrice,
                    category: category,
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

        reviewRating = Math.round(
            $1('[data-hook="rating-out-of-text"]', html1).text().match(/^(\d(\.\d)?)/)[0] * 2) / 2;
        let reviewCount = $1('[data-hook="total-review-count"]', html1).children('span').text().match(/\d+/g).join(",");
        product.reviewRating = reviewRating.toString();
        product.reviewCount = reviewCount;

        product.fromTheManufacturer = [
            m$('[id="featurebullets_feature_div"]', mainHtml).find('ul').text().trim(),
            ...texts,
            m$('[id="bookDescription_feature_div"]', mainHtml).text().trim()
        ].filter(item => item !== null && item !== "");

        product.bestReviews = ans;

        // if (isFirstCall == true) {
        //     const imgFiles = fs.readdirSync('./gen-img');

        //     imgFiles.forEach(file => {
        //         const baseName = path.basename(file, '.html');
        //         const num = parseInt(baseName);
        //         if (!isNaN(num) && num > ImgMaxNum) {
        //             ImgMaxNum = num;
        //         }
        //     })
        //     isFirstCall == false
        // }

        product.table = []
        m$('table[class="a-keyvalue prodDetTable"] > tbody > tr').each(function () {

            const key = $1('[class="a-color-secondary a-size-base prodDetSectionEntry"]', this).text().trim()
            const value = $1('[class="a-size-base prodDetAttrValue"]', this).text().trim()
            product.table.push([key, value])
        })

        // console.log(product.link, 'prlink')
        const ImgPromise = runConcurrentlyControlledImageProcessing(product, index)


        //Call AI
        if (product.bestReviews) {
            const { productImages, ...productNoImages } = product;
            const aiAnswerPromise = mainArticleAI(productNoImages)

            const rephraseComments = (async () => {
                const aiPromises = product.bestReviews.slice(0, 3).map(async (review) => {
                    return commentAI(review);
                });
                return Promise.all(aiPromises);
            })();

            const [result1, uncutAiAnswer, rephraseCommentsAns] = await Promise.all([ImgPromise, aiAnswerPromise, rephraseComments]);

            if (rephraseCommentsAns[0] && rephraseCommentsAns[0].title) product.rephraseComments = rephraseCommentsAns;

            allProducts.push(product)

            //SAVER <----

            sendToServer(product)
                .then(result => {
                    console.log("Product sent successfully:", result);
                })
                .catch(error => {
                    console.error("Failed to send product:", error);
                });

            const cutIndex = uncutAiAnswer.indexOf('<article>');
            if (cutIndex !== -1) {
                var aiAnswer = uncutAiAnswer.slice(cutIndex + 9);
            } else {
                var aiAnswer = uncutAiAnswer;
            }

            allArticles.push(aiAnswer)

            if (aiAnswer && product) {
                if (index > RelatedProductAmount) {
                    const rand = randomNumbers(RelatedProductAmount, index);
                    const relatedProducts = rand.map(index => allProducts[index]);
                    articleToHTML(cutIndex, product, relatedProducts, index, rand);
                } else {
                    savedIndexes.push({ index, product, aiAnswer })
                }
            } else {
                console.log("Product " + index + " generation failed due to lack of info, ye")
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

function randomNumbers(count, index) {
    if (count >= allProducts.length) {
        return Array(count).fill(0);
    }
    const uniqueIndices = new Set();
    while (uniqueIndices.size < count) {
        const randomIndex = Math.floor(Math.random() * allProducts.length);
        if (randomIndex != index) uniqueIndices.add(randomIndex);
    }
    console.log(uniqueIndices)
    return Array.from(uniqueIndices);
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
            // console.log(prLinks, 'link');
            let operations = prLinks.map(async (link, i) => {
                try {
                    await downloadFile(link, `./gen-og/${product.asin}-${i}.webp`, index);

                    const resizePromises = [
                        resizeFile(
                            `./gen-og/${product.asin}-${i}.webp`,
                            `../public/gen-img/${product.asin}-${i}-big.webp`,
                            index,
                            524,
                            550,
                            { r: 255, g: 255, b: 255, alpha: 1 }
                        ),
                    ];

                    resizePromises.push(
                        resizeFile(
                            `./gen-og/${product.asin}-${i}.webp`,
                            `../public/gen-img/${product.asin}-${i}-small.webp`,
                            index,
                            89,
                            89,
                            { r: 255, g: 255, b: 255, alpha: 1 }
                        )
                    );


                    if (i === 0) {
                        resizePromises.push(
                            resizeFile(
                                `./gen-og/${product.asin}-${i}.webp`,
                                `../public/gen-img/${product.asin}-${i}-mid.webp`,
                                index,
                                204,
                                200,
                                { r: 255, g: 255, b: 255, alpha: 1 }
                            )
                        );
                    }

                    await Promise.all(resizePromises);

                    product.productImages.push(`${product.asin}-${i}-big.webp`);
                    product.productSmallImages.push(`${product.asin}-${i}-small.webp`)
                    if (i === 0) product.productMidImage = (`${product.asin}-${i}-mid.webp`)
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