const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs');

let num = 2
let currNum = 0
let allProducts = []

// const url = "https://www.amazon.com/s?k=bottle&crid=2NRI3MYBVKGHC&sprefix=bottl%2Caps%2C254&ref=nb_sb_noss_2"
const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function fetchAndProcessData() {
    try {
        const url = await new Promise((resolve) => {
            readline.question(`Enter Search `, resolve);
        });

        const products = await getProducts('https://www.amazon.com/s?k=' + url)

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
// app.listen(PORT, () => console.log("i work"))

async function getProducts(url) {
    try {
        const response = await axios(url);
        console.log("Search page loaded", url)
        const html = response.data;
        const $ = cheerio.load(html);
        const singlePageResaults = [];

        $('.s-result-item[data-component-type="s-search-result"]', html).each(function () {
            let link = 'https://www.amazon.com' + $(this).find('[data-cy="title-recipe"]').children('h2').children('a').attr('href');
            let img = $(this).find("img").attr("src");
            let title = $(this).find(".s-title-instructions-style").text();
            let priceWhole = $(this).find(".a-price-whole").text();
            let priceFraction = $(this).find(".a-price-fraction").text();
            let fullPrice = priceWhole + priceFraction;

            if (link && img && title && priceWhole) singlePageResaults.push({
                link,
                title,
                img,
                fullPrice
            });
        })

        // Made by satan. It works (sometimes) so don't touch it. Keep out. <------------->
        for (let i = 0; i < singlePageResaults.length; i++) {
            let commentsPage = "http://www.amazon.com/product-reviews" + (singlePageResaults[i]['link'].match(/(\/[^\/]*){5}(.{0,10})/) || [, ''])[1]
            const response1 = await axios(commentsPage);
            console.log("Comments page", i, "loaded")
            const html1 = response1.data;
            const $1 = cheerio.load(html1);
            const ans = [];
            $1('[id^="customer_review"]', html1).each(function () {
                const titleElement = $1(this).find('[data-hook="review-title"]');
                const title = titleElement.children('span').text();
                const rating = titleElement.find('span').first().text();
                const content = $1(this).find('[data-hook="review-body"]').text().trim();
                ans.push({
                    title,
                    rating,
                    content
                });
            });

            const mainRes = await axios(singlePageResaults[i]['link']);
            console.log("Main page", i, "loaded")
            const mainhtml = mainRes.data;
            const m$ = cheerio.load(mainhtml);
            const texts = [];

            m$('#aplus_feature_div').find('p, h1, h2, h3, h4, h5, h6').each(function () {
                texts.push($1(this).text().trim());
            });
            let ret = [
                ans,
                $1('[data-hook="rating-out-of-text"]', html1).text(),
                $1('[data-hook="total-review-count"]', html1).children('span').text(),
                m$('[id="featurebullets_feature_div"]', mainhtml).find('ul').text().trim(),
                texts
            ];

            ret.push(m$('[id="bookDescription_feature_div"]', mainhtml).text().trim())

            singlePageResaults[i].reviewRatingAndCount = [ret[1] ?? null, ret[2] ?? null]
            singlePageResaults[i].fromTheManufacturer = [ret[3], ret[4], ret[5]].filter(item => item !== null && item !== "")
            singlePageResaults[i].bestReviews = ret[0]
        }
        // KEEP OUT ^^^^^  <-------------------------------------------->

        allProducts = allProducts.concat(singlePageResaults)
        currNum++
        if (currNum < num) {
            const nextUrl = "https://www.amazon.com" + $('[aria-label^="Go to next page"]').attr('href')
            // await new Promise(r => setTimeout(r, 10000));
            const wait = await getProducts(nextUrl)
        }

    } catch (err) {
        console.error(err);
    }
}

fetchAndProcessData();