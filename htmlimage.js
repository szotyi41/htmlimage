const puppeteer = require('puppeteer');

/* [{"url":"https:\/\/s3.eu-central-1.amazonaws.com\/develop-storage\/generated\/3\/2203310424_48568\/300x250\/index.html","output":"storage\/temp\/generated\/2203310424_48568_300x250_index.png","width":"300","height":"250","delay":2000,"type":"png","tempPath":"generated\/2203310424_48568_300x250_index.png","filePath":"3\/2203310424_48568\/300x250\/index.png","fileFormat":"png","size":"300x250","tempStoragePath":"storage\/temp\/generated\/2203310424_48568_300x250_index.png"},{"url":"https:\/\/s3.eu-central-1.amazonaws.com\/develop-storage\/generated\/3\/2203310424_48568\/300x600\/index.html","output":"storage\/temp\/generated\/2203310424_48568_300x600_index.png","width":"300","height":"600","delay":2000,"type":"png","tempPath":"generated\/2203310424_48568_300x600_index.png","filePath":"3\/2203310424_48568\/300x600\/index.png","fileFormat":"png","size":"300x600","tempStoragePath":"storage\/temp\/generated\/2203310424_48568_300x600_index.png"},{"url":"https:\/\/s3.eu-central-1.amazonaws.com\/develop-storage\/generated\/3\/2203310424_48568\/640x360\/index.html","output":"storage\/temp\/generated\/2203310424_48568_640x360_index.png","width":"640","height":"360","delay":2000,"type":"png","tempPath":"generated\/2203310424_48568_640x360_index.png","filePath":"3\/2203310424_48568\/640x360\/index.png","fileFormat":"png","size":"640x360","tempStoragePath":"storage\/temp\/generated\/2203310424_48568_640x360_index.png"},{"url":"https:\/\/s3.eu-central-1.amazonaws.com\/develop-storage\/generated\/3\/2203310424_48568\/728x90\/index.html","output":"storage\/temp\/generated\/2203310424_48568_728x90_index.png","width":"728","height":"90","delay":2000,"type":"png","tempPath":"generated\/2203310424_48568_728x90_index.png","filePath":"3\/2203310424_48568\/728x90\/index.png","fileFormat":"png","size":"728x90","tempStoragePath":"storage\/temp\/generated\/2203310424_48568_728x90_index.png"},{"url":"https:\/\/s3.eu-central-1.amazonaws.com\/develop-storage\/generated\/3\/2203310424_48568\/970x250\/index.html","output":"storage\/temp\/generated\/2203310424_48568_970x250_index.png","width":"970","height":"250","delay":2000,"type":"png","tempPath":"generated\/2203310424_48568_970x250_index.png","filePath":"3\/2203310424_48568\/970x250\/index.png","fileFormat":"png","size":"970x250","tempStoragePath":"storage\/temp\/generated\/2203310424_48568_970x250_index.png"}] */

const parameters = {
    url: 'https:\/\/s3.eu-central-1.amazonaws.com\/wavemaker-storage\/generated\/20\/2209020926_23885\/300x250\/index.html',
    json: '', 
    output: 'screenshot.png',
    width: 300,
    height: 250,
    delay: 1500,
    scaleFactor: 1,

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

// Start process here
(async function() {


    const browser = await launchBrowser();

    if (parameters.json && parameters.json.length > 10) {

        process.stdout.write('Details coming from json');

        // Has JSON, parse it and run screenshots
        await parseJSON(browser, parameters);

    } else {

        // Has one url, no json detected
        await generate(browser, parameters);
    }

    process.stdout.write('------------------------------------' + '\n');
    process.stdout.write('Generating finished' + '\n');

    await killProcess(browser);

})();


// Parse json
async function parseJSON(browser, parameters) {

    const parsedObject = JSON.parse(parameters.json);

    // Generate from array
    if (Array.isArray(parsedObject)) {

        // Each in json
        for (var i = 0, paramsFromObject; i < parsedObject.length; i++) {
            paramsFromObject = parsedObject[i];
            await generate(browser, { ...parameters, ...paramsFromObject});
        }

    } else {

        // Generate from json object
        await generate(browser, { ...parameters, ...parsedObject});
    }

    return true;
}




async function launchBrowser() {
    process.stdout.write('Start browser launch' + '\n');
    try {
        const browser = await puppeteer.launch(
        /* {
            //executablePath: 'chromium',
            headless: false,
            ignoreHTTPSErrors: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
        } */);

        return browser;

    } catch(error) {
        process.stdout.write('Failed to launch browser: ' + error.message + '\n');
    }

    process.stdout.write('Browser launched' + '\n');
}




async function closeBrowser(browser) {
    if (typeof browser !== 'undefined') {
        await browser.close();
        process.stdout.write('Browser closed' + '\n');
    }
}




async function killProcess(browser) {
    await closeBrowser(browser);
    process.stdout.write('Kill process: ' + process.pid + '\n');
    await process.exit(1);
}




// Generate function
async function generate(browser, params) {

    try {
        process.stdout.write('------------------------------------' + '\n');
        process.stdout.write('Screenshot generating started from: ' + params.url + '\n');

        const page = await browser.newPage();

        // Go to url
        await page.goto(params.url.replace('\\', '/'));

        // Set screen width and height
        await page.setViewport({
            width: parseInt(params.width),
            height: parseInt(params.height),   
            deviceScaleFactor: 1//params.scaleFactor
        });

        process.stdout.write('Viewport set to ' + params.width + 'x' + params.height + '. Delay started.' + '\n');

        // Take screenshot after delay
        // -------------------
        // Delay before take the screenshot
        await sleep(parseInt(params.delay));

        process.stdout.write('Delay ended. Now can make screenshot.' + '\n');

        // When its timeout to loading
        // -------------------
        // Promise for timeout
        const timeoutPromise = new Promise(async (resolve, reject) => {
            setTimeout(async () => {

                // Send reject
                reject('Html to image generating timed out' + '\n');

            }, parseInt(params.timeoutInSeconds) * 1000);
        })

        // When its create screenshot
        // ---------------------
        // Promise for screenshot
        const screenshotPromise = new Promise(async (resolve, reject) => {

            try {
                const screenshotAttributes = {
                    path: params.output,
                    type: 'png',
                    fullPage: false
                };

                process.stdout.write('Starting make the screenshot' + '\n'); 
                const screenshot = await page.screenshot(screenshotAttributes);
                page.close();
                process.stdout.write('Screenshot created successfully to: ' + screenshotAttributes.path + '\n');

                // Send resolve
                resolve(screenshot);
            } catch(error) {
                reject(error);
                throw error;
            }

        });

        // Race with screenshot vs timeout
        const promises = await Promise.race([ screenshotPromise,  timeoutPromise])
            .then(async () => {
                process.stdout.write('Html to image generated successfully to: ' + params.output + '\n');
            })
            .catch(async (error) => {
                process.stdout.write('Failed to generate image from html: ' + error + '\n');
            });

    } catch (error) {
        process.stdout.write('Html to image generating failed with: ' + error + '\n');
        if (typeof page.close === 'function') page.close();
    }
}
