const UserAgents = require('user-agents');
const fs = require('fs');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const sharp = require('sharp');
const { spawn } = require('child_process');
const { Cluster } = require('puppeteer-cluster');

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
        puppeteer,
        puppeteerOptions: { headless: true },
    });
    cluster.task(async ({ page, data }) => {
        const { url, index } = data;
        await getImages(page, url, index);
    });
    cluster.queue({ url: 'https://www.amazon.com/dp/B0001AVSJG/ref=nosim?tag=bestmmorpg00', index: 1 })
    cluster.queue({ url: 'https://www.amazon.com/dp/B0964CHD65/ref=nosim?tag=bestmmorpg00', index: 2 })
    await cluster.idle();
    await cluster.close();
})()

async function getImages(page, url, index = 0) {
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
            throw new Error(`The variable is empty in ${index}`);
        }

        for (let i = 0; i < htmlContent.length; i++) {
            console.log(index, i)
            const filePath1 = `screenshot-${index}-${i}.png`
            await page.screenshot({ path: filePath1 });
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
        return imageUrls

    } catch (error) {
        console.log(`Hover action failed, grabbing the first image on page ${index}. ${error}`);

        // Grab the first image on the page
        const firstImageUrl = await page.evaluate(() => {
            const imageInForm = document.querySelector('form img');
            return imageInForm ? imageInForm.src : null;
        });

        // console.log(firstImageUrl)
        await downloadFile(firstImageUrl, `${index}.png`);
        // console.log('a')

        const result = await runPythonScript(index)

        await page.type('#captchacharacters', result.toString().trim())

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

        for (i = 0; i < htmlContent.length; i++) {
            const filePath1 = `screenshot-${index}-${i}.png`
            await page.screenshot({ path: filePath1 });
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
        return imageUrls
    }
};

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
        console.error(`Error in id ${id}: ${error.message}`);
    }
};
async function resizeFile(inputPath, outputPath, id = '', width, height) {
    try {
        let image = sharp(inputPath);
        if (width && height) {
            image = image.resize(width, height); // Apply resize only if width and height are provided
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

function runPythonScript(directoryPath) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['captcha.py', directoryPath]);

        let outputData = ''; // Variable to accumulate data from stdout

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Data from the Python script: ${data}`);
            outputData += data.toString();
        });

        // Capture any errors
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error from the Python script: ${data}`);
            reject(new Error(data.toString())); // Reject the promise on error
        });

        // Handle subprocess exit
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                //   console.log(`Python script exited with code ${code}`);
                resolve(outputData); // Resolve the promise with the accumulated data
            } else {
                reject(new Error(`Python script exited with code ${code}`));
            }
        });
    });
}


module.exports = {
    getImages,
    downloadFile,
    resizeFile
};
