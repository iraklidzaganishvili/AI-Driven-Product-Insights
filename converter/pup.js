const UserAgents = require('user-agents');
const fs = require('fs');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const sharp = require('sharp');

async function getImages(url) {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const firstAgent = new UserAgents(userAgent => userAgent.deviceCategory === 'desktop')
    await page.setUserAgent(firstAgent.toString())

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    try {
        let imageUrls = []

        selector = '#altImages ul .imageThumbnail';
        const htmlContent = await page.evaluate((sel) => {
            const elements = document.querySelectorAll(sel);
            let srcs = [];
            elements.forEach(element => {
                const img = element.querySelector('img');
                if (img && img.src) srcs.push(img.src);
            });
            return srcs;
        }, selector);
        if (htmlContent.length === 0) {
            // const filePath = `screenshot-${1}.png`
            // await page.screenshot({ path: filePath });
            throw new Error("The variable is empty");
        }

        for (let i = 0; i < htmlContent.length; i++) {
            await page.hover(`#altImages ul .imageThumbnail img[src*='${htmlContent[i]}']`)

            await page.waitForSelector(`.image.item.itemNo${i}.maintain-height.selected .a-dynamic-image`, {
                visible: true,
            });

            // const filePath = `screenshot-${i}.png`
            // await page.screenshot({ path: filePath });

            const imageUrl = await page.evaluate((index) => {
                const imageInForm = document.querySelector(`.image.item.itemNo${index}.maintain-height.selected .a-dynamic-image`);
                return imageInForm ? imageInForm.src : null;
            }, i)
            imageUrls.push(imageUrl)
        }
        // console.log(imageUrls.filter(url => url !== null));
        await browser.close();
        return imageUrls

    } catch (error) {
        // console.log('Hover action failed, grabbing the first image on the page. ' + error);

        // Grab the first image on the page
        const firstImageUrl = await page.evaluate(() => {
            const imageInForm = document.querySelector('form img');
            return imageInForm ? imageInForm.src : null;
        });

        // console.log(firstImageUrl)
        await downloadFile(firstImageUrl, 'captcha.png');

        const pythonOutput = execSync('python captcha.py').toString().trim();
        await page.type('#captchacharacters', pythonOutput);
        // await page.screenshot({ path: 'page-on-comp.png' });

        await Promise.all([
            page.waitForNavigation(), // Waits for the navigation to happen
            page.click('button[type="submit"]'), // Clicks the button that leads to the navigation
        ]);
        
        let imageUrls = []
        selector = '#altImages ul .imageThumbnail';
        const htmlContent = await page.evaluate((sel) => {
            const elements = document.querySelectorAll(sel);
            let srcs = [];
            elements.forEach(element => {
                const img = element.querySelector('img');
                if (img && img.src) srcs.push(img.src);
            });
            return srcs;
        }, selector);

        for (let i = 0; i < htmlContent.length; i++) {
            await page.hover(`#altImages ul .imageThumbnail img[src*='${htmlContent[i]}']`)

            await page.waitForSelector(`.image.item.itemNo${i}.maintain-height.selected .a-dynamic-image`, {
                visible: true,
            });

            // const filePath = `screenshot-${i}.png`
            // await page.screenshot({ path: filePath });

            const imageUrl = await page.evaluate((index) => {
                const imageInForm = document.querySelector(`.image.item.itemNo${index}.maintain-height.selected .a-dynamic-image`);
                return imageInForm ? imageInForm.src : null;
            }, i)
            imageUrls.push(imageUrl)
        }
        // console.log(imageUrls.filter(url => url !== null));
        await browser.close();
        return imageUrls
    }
};
// getImages('https://www.amazon.com/dp/B0001AVSJG/ref=nosim?tag=bestmmorpg00')


const downloadFile = async (imageUrl, outputPath, id = '') => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image, id ${id}: ${response.statusText}`);
        const streamPipeline = (source, dest) => new Promise((resolve, reject) => {
            source.pipe(dest);
            dest.on('finish', resolve);
            dest.on('error', reject);
        });
        await streamPipeline(response.body, fs.createWriteStream(outputPath));
    } catch (error) {
        // console.error(`Error in id ${id}: ${error.message}`);
    }
};
async function resizeFile(inputPath, outputPath, id = '', width, height, background = { r: 255, g: 255, b: 255, alpha: 1 }) {
    try {
        let image = sharp(inputPath);
        if (width && height) {
            image = image.resize({
                width: width,
                height: height,
                fit: 'contain',
                background: background
              });
        }

        const buffer = await image.toBuffer(); // Convert to buffer whether resized or not
        fs.writeFile(outputPath, buffer, (err) => {
            if (err) {
                console.error('Error processing the image in ID:', id, err);
                return;
            }
        })
    } catch (error) {
        console.error('Error processing the image in ID:', id, error);
    }
}


module.exports = {
    getImages,
    downloadFile,
    resizeFile
};
