const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 50;
const path = require('node:path');
const axios = require('axios');
require('dotenv').config();

//imports
const { articleToHTML } = require('./converter');
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
let category = "All"
let RelatedProductAmount = 8

agentRotator = 0

isFirstCall = true
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

async function commentAI(prompt) {
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k-0613",
        messages: [
            {
                "role": "system",
                "content": "Given comment rephrase the comment. The answer needs to only have the name of the rephrased comment and your rephrased comment in that order in the same format that it was provided. I has to be in the same format as it was provided so {\"title\": \"your output\", \"content\": \"your output\"}"
            },
            {
                "role": "user",
                "content": JSON.stringify(prompt, null, 4).replace(/[\n\r]/g, '').replace(/"([^"]+)":/g, '$1:')
            }
        ],
        temperature: 1,
        max_tokens: 6000,
        top_p: 0.4,
        frequency_penalty: 1,
        presence_penalty: 1,
    });
    let newComment = JSON.parse(response.choices[0].message.content)
    if (newComment.title) {
        newComment.rating = prompt.rating
        return newComment
    }
}

async function fakeAI(prompt) {
    RawAiResault = `Here's the comprehensive product review article as requested:

<article>

# STANLEY IceFlow Tumbler: Your Ultimate Hydration Companion

The STANLEY IceFlow Stainless Steel Tumbler is revolutionizing the way we stay hydrated on the go. With its innovative design, superior insulation, and versatile features, this tumbler is quickly becoming a must-have for anyone who values both style and functionality in their daily hydration routine.

## Product Overview

The STANLEY IceFlow Tumbler is a 30 oz vacuum-insulated stainless steel container designed to keep your beverages at the perfect temperature for hours. Whether you're sipping on ice-cold water during a scorching summer day or enjoying a hot coffee on your morning commute, this tumbler has got you covered. Its leak-resistant flip straw and ergonomic handle make it ideal for use at home, in the office, or while traveling.

## Key Features

### Impressive Temperature Retention

- Double-wall vacuum insulation keeps drinks cold for up to 12 hours
- Maintains ice for an impressive 2 days
- Suitable for both hot and cold beverages

### Innovative Straw Design

- Exclusive IceFlow flip straw for effortless sipping
- Leak-resistant when closed
- Eliminates the need for disposable straws

### Durable Construction

- Made from 18/8 stainless steel
- BPA-free materials
- Built to withstand daily use and accidental drops

### Convenient Design

- Ergonomic, rotating handle for easy carrying
- Fits in most car cup holders and exercise machine holders
- Dishwasher safe for easy cleaning

### Eco-Friendly

- Made from recycled fishing nets, contributing to ocean conservation
- Reusable design reduces reliance on single-use plastics

## Design and Build Quality

The STANLEY IceFlow Tumbler boasts a sleek and modern design that appeals to a wide range of users. Its stainless steel body not only adds a touch of sophistication but also ensures durability for long-term use. The tumbler comes in various colors, including retro-inspired options and a stylish rose gold finish, allowing users to express their personal style.

### Handle and Lid

The ergonomic top handle is a standout feature, offering superior portability compared to traditional side-handled tumblers. The lid is well-constructed and includes the innovative flip straw mechanism, which can be easily closed when not in use.

### Size and Portability

At 30 oz, this tumbler strikes a perfect balance between capacity and portability. It's large enough to keep you hydrated throughout the day but still compact enough to fit comfortably in most cup holders and bags.

## Performance

The STANLEY IceFlow Tumbler lives up to its promises when it comes to temperature retention. Users consistently report that their beverages stay cold for extended periods, with ice remaining intact for up to two days. This impressive insulation performance makes it ideal for long workdays, outdoor activities, or extended travel.

### Leak Resistance

While the majority of users praise the tumbler's leak-resistant design, some have reported minor leakage issues. However, when the flip straw is properly closed, the tumbler generally performs well in preventing spills and leaks.

## User Experience

The STANLEY IceFlow Tumbler has garnered overwhelmingly positive feedback from users across various lifestyles and needs.

### Ease of Use

- The flip straw allows for convenient, one-handed operation
- The collapsible straw design is praised for its sanitary benefits
- Easy to clean, with most parts being dishwasher safe

### Versatility

Users appreciate the tumbler's versatility, using it for everything from water and smoothies to coffee and tea. Its ability to maintain temperature makes it suitable for both hot summer days and chilly winter mornings.

### Durability

Many users report that the tumbler holds up well to daily use and occasional drops, living up to STANLEY's reputation for durability.

## Pros and Cons

### Pros:

- Excellent temperature retention for both hot and cold beverages
- Durable stainless steel construction
- Convenient flip straw design
- Eco-friendly materials and reusable concept
- Stylish appearance with various color options
- Fits most cup holders
- Dishwasher safe

### Cons:

- Some users report minor leakage issues
- Relatively heavy when full due to its size and construction
- Premium price point compared to basic tumblers

## Customer Reviews

The STANLEY IceFlow Tumbler has received overwhelmingly positive reviews, with an average rating of 4.6 out of 5 stars based on over 29,000 global ratings.

### Positive Feedback:

- Many users praise the tumbler's ability to keep drinks cold for extended periods
- The flip straw design is frequently mentioned as a favorite feature
- Customers appreciate the stylish appearance and color options
- The durability and build quality receive consistent praise

### Critical Feedback:

- Some users have experienced leakage issues, particularly when the tumbler is not upright
- A few customers noted that the tumbler arrived with minor scratches or imperfections

## Comparison with Similar Products

When compared to other insulated tumblers on the market, the STANLEY IceFlow stands out in several ways:

- Superior insulation performance, particularly for maintaining ice
- Innovative flip straw design not commonly found in competitors
- Eco-friendly materials and construction
- STANLEY's reputation for durability and lifetime warranty

While there are cheaper alternatives available, the STANLEY IceFlow justifies its premium price through its combination of performance, design, and brand reliability.

## Value for Money

At $35.00, the STANLEY IceFlow Tumbler is positioned in the premium range of insulated tumblers. However, considering its features, performance, and durability, many users find it to be a worthwhile investment. The lifetime warranty provided by STANLEY adds significant value, ensuring that this tumbler can truly be a long-term hydration solution.

### Long-term Benefits:

- Reduced need for single-use plastics
- Potential savings on bottled beverages
- Durability that outlasts cheaper alternatives

## Conclusion

The STANLEY IceFlow Stainless Steel Tumbler emerges as a top-tier choice for those seeking a reliable, stylish, and eco-friendly hydration solution. Its impressive insulation capabilities, innovative design features, and robust construction make it stand out in a crowded market of insulated tumblers.

While it comes with a premium price tag, the combination of performance, durability, and STANLEY's lifetime warranty justifies the investment for many users. The minor issues reported by some customers, such as occasional leakage, are outweighed by the overwhelmingly positive experiences of most users.

Whether you're a busy professional, an outdoor enthusiast, or simply someone who values keeping their beverages at the perfect temperature, the STANLEY IceFlow Tumbler is likely to exceed your expectations. Its versatility makes it suitable for a wide range of beverages and situations, from office use to outdoor adventures.

In conclusion, if you're in the market for a high-quality insulated tumbler that combines style, functionality, and eco-consciousness, the STANLEY IceFlow Stainless Steel Tumbler is definitely worth considering. It's not just a tumbler; it's a long-term companion for your hydration needs.

</article>`
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
            const aiAnswerPromise = fakeAI(productNoImages)

            const rephraseComments = (async () => {
                const aiPromises = product.bestReviews.slice(0, 3).map(async (review) => {
                    return commentAI(review);
                });
                return Promise.all(aiPromises);
            })();

            const [result1, uncutAiAnswer, rephraseCommentsAns] = await Promise.all([ImgPromise, aiAnswerPromise, rephraseComments]);

            if (rephraseCommentsAns[0] && rephraseCommentsAns[0].title) product.rephraseComments = rephraseCommentsAns;

            allProducts.push(product)
            axios.post(`http://localhost:3000/add-product`, product)
                .then(response => {
                    console.log('Product added successfully:', response.data);
                })
                .catch(error => {
                    console.error('Error adding product:', error.response ? error.response.data : error.message);
                });

            //SAVER <----
            const cutIndex = uncutAiAnswer.indexOf('<article>');
            if (cutIndex !== -1) {
                var aiAnswer = uncutAiAnswer.slice(cutIndex + 9);
            } else {
                var aiAnswer = uncutAiAnswer;
            }
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
                    await downloadFile(link, `./e/gen-og/${product.asin}-${i}.webp`, index);

                    const resizePromises = [
                        resizeFile(
                            `./e/gen-og/${product.asin}-${i}.webp`,
                            `./public/gen-img/${product.asin}-${i}-big.webp`,
                            index,
                            524,
                            550,
                            { r: 255, g: 255, b: 255, alpha: 1 }
                        ),
                    ];

                    resizePromises.push(
                        resizeFile(
                            `./e/gen-og/${product.asin}-${i}.webp`,
                            `./public/gen-img/${product.asin}-${i}-small.webp`,
                            index,
                            89,
                            89,
                            { r: 255, g: 255, b: 255, alpha: 1 }
                        )
                    );


                    if (i === 0) {
                        resizePromises.push(
                            resizeFile(
                                `./e/gen-og/${product.asin}-${i}.webp`,
                                `./public/gen-img/${product.asin}-${i}-mid.webp`,
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