const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');
const fs = require('fs');
const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

let allProducts = [];
let allArticles = []
let MaxPages = 9;
let maxIndexesPerPage = 1
let currNum = 0;

async function fetchAndProcessData() {
    try {
        const url = await new Promise((resolve) => {
            readline.question(`Enter Search `, resolve);
        });

        await getProducts('https://www.amazon.com/s?k=' + url);
        console.log(allProducts.length, "products stolen");

        let dataToSave = JSON.stringify(allProducts, null, 2);
        await fs.promises.writeFile('outputs/output.txt', dataToSave);
        console.log('The file with the goods has been saved!');
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
                img,
                fullPrice
            });
        });

        if (singlePageResults.length == 0){
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
        }else{
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

        console.log("Product", index, "done")
        return product;
    } catch (error) {
        console.error(`Error fetching details for product index ${index}:`, error);
        return null;  // Return null for errors to filter out failed requests later
    }
}

fetchAndProcessData();