const UserAgents = require('user-agents');
const fs = require('fs');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

async function getImages(url) {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const firstAgent = new UserAgents(userAgent => userAgent.deviceCategory === 'desktop')
    await page.setUserAgent(firstAgent.toString())

    await page.goto(url);

    try {
        let imageUrls = []
        const totalElements = 5
        for (i = 0; i < totalElements; i++) {
            await page.hover(`#altImages ul li:nth-of-type(${i + 5})`)

            await page.waitForSelector(`.image.item.itemNo${i + 1}.maintain-height.selected .a-dynamic-image`, {
                visible: true,
            });

            const filePath = `screenshot-${i + 1}.png`
            await page.screenshot({ path: filePath });

            const imageUrl = await page.evaluate((index) => {
                const imageInForm = document.querySelector(`.image.item.itemNo${index}.maintain-height.selected .a-dynamic-image`);
                return imageInForm ? imageInForm.src : null;
            }, i + 1)
            imageUrls.push(imageUrl)
        }
        console.log(imageUrls.filter(url => url !== null));
        await browser.close();

    } catch (error) {
        console.log('Hover action failed, grabbing the first image on the page. ' + error);

        // Grab the first image on the page
        const firstImageUrl = await page.evaluate(() => {
            const imageInForm = document.querySelector('form img');
            return imageInForm ? imageInForm.src : null;
        });

        console.log(firstImageUrl)
        await downloadFile(firstImageUrl, 'captcha.png');

        const pythonOutput = execSync('python captcha.py').toString().trim();
        await page.type('#captchacharacters', pythonOutput);
        await page.screenshot({ path: 'page-on-comp.png' });

        Promise.all([
            page.waitForNavigation(), // The promise resolves after navigation has finished
            page.click('button[type="submit"]'), // Clicking the button that leads to navigation
        ]).then(async () => {
            try {

                let imageUrls = []
                const totalElements = 5
                for (i = 0; i < totalElements; i++) {
                    await page.hover(`#altImages ul li:nth-of-type(${i + 5})`)

                    await page.waitForSelector(`.image.item.itemNo${i + 1}.maintain-height.selected .a-dynamic-image`, {
                        visible: true,
                    });

                    const filePath = `screenshot-${i + 1}.png`
                    await page.screenshot({ path: filePath });

                    const imageUrl = await page.evaluate((index) => {
                        const imageInForm = document.querySelector(`.image.item.itemNo${index}.maintain-height.selected .a-dynamic-image`);
                        return imageInForm ? imageInForm.src : null;
                    }, i + 1)
                    imageUrls.push(imageUrl)
                }
                console.log(imageUrls.filter(url => url !== null));
                await browser.close();

            } catch (error) {
                console.log('Action failed' + error);
            }
            await browser.close();
        });
    }
};
getImages('https://www.amazon.com/ASUS-Vivobook-Windows-Transparent-M515DA-WS33/dp/B0CRDCFNHW/?_encoding=UTF8&pd_rd_w=jNgYL&content-id=amzn1.sym.d0ebfbb2-6761-494f-8e2f-95743b37c35c%3Aamzn1.symc.50e00d6c-ec8b-42ef-bb15-298531ab4497&pf_rd_p=d0ebfbb2-6761-494f-8e2f-95743b37c35c&pf_rd_r=D3QP8WRQQ6MFWR2TQVTW&pd_rd_wg=PSJ8S&pd_rd_r=fd01e1ba-d51f-42e6-8fe4-072d319c0897&ref_=pd_gw_ci_mcx_mr_hp_atf_m')


const downloadFile = async (imageUrl, outputPath) => {
    const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const streamPipeline = (source, dest) => new Promise((resolve, reject) => {
            source.pipe(dest);
            dest.on('finish', resolve);
            dest.on('error', reject);
        });

        await streamPipeline(response.body, fs.createWriteStream(outputPath));
        console.log('Download and save successful.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};