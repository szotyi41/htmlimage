const puppeteer = require('puppeteer');

const parameters = {
    url: 'https://google.com',
    output: 'screenshot.png',
    width: 300,
    height: 250,
    type: 'png',
    quality: 50,
    delay: 1500,
    fullPage: false,

    // 1 minute to timeout
    timeoutInSeconds: 60
};



// Define sleep function
const sleep = m => new Promise(r => setTimeout(r, m));

// Get parameters
process.argv.forEach(function (val, index) {
    const argument = val.split('=');
    parameters[argument[0]] = argument[1];
});

(async () => {
    try {
        process.stdout.write('Screenshot generating started from: ' + parameters.url + '\n');

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Go to url
        await page.goto(parameters.url.replace('\\', '/'));

        // Set screen width and height
        await page.setViewport({
            width: parseInt(parameters.width),
            height: parseInt(parameters.height),
        });

        // Take screenshot after delay
        await sleep(parseInt(parameters.delay));

        // Promise for timeout
        const timeoutPromise = new Promise(async (resolve, reject) => {
            setTimeout(async () => {

                // Send reject
                reject('Html to image generating timed out' + '\n');

            }, parseInt(parameters.timeoutInSeconds) * 1000);
        });

        // Promise for screenshot
        const screenshotPromise = new Promise(async (resolve, reject) => {

            let screenshotAttributes = {
                path: parameters.output,
                type: parameters.type === 'jpg' ? 'jpeg' : parameters.type,
                fullPage: parameters.fullPage.toString() === 'true' ? true : false 
            };

            // Only jpeg has quality parameter
            if (screenshotAttributes.type === 'jpeg') {
                screenshotAttributes.quality = parseInt(parameters.quality);
            }

            const screenshot = await page.screenshot(screenshotAttributes);

            // Send resolve
            resolve(screenshot);

        });

        // Race with screenshot vs timeout
        const promises = Promise.race([screenshotPromise, timeoutPromise]);

        // Successfully finished
        promises.then(async () => {

            process.stdout.write('Html to image generated successfully to: ' + parameters.output + '\n');

            // Close the browser and kill process
            if (typeof browser !== 'undefined') {
                await browser.close();
            }

            await process.kill(process.pid);

        })

        // Catch errors
        promises.catch(async (error) => {

            process.stdout.write('Failed to generate image from html: ' + error + '\n');

            // Close the browser and kill process
            if (typeof browser !== 'undefined') {
                await browser.close();
            }

            await process.kill(process.pid);

        });
    } catch (error) {

        process.stdout.write('Html to image generating failed with: ' + error + '\n');

        // Close the browser and kill process
        if (typeof browser !== 'undefined') {
            await browser.close();
        }

        await process.kill(process.pid);

    }
})();
