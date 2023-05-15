const fs = require('fs');
const puppeteer = require('puppeteer');

const parameters = {
    url: 'https:\/\/s3.eu-central-1.amazonaws.com\/wavemaker-storage\/generated\/20\/2209020926_23885\/300x250\/index.html',
    json: '', 
    output: 'output.png',
    width: 300,
    height: 250,
    delay: 1500,
    scale: 1,

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

        process.stdout.write('Details coming from json\n');

        // Has JSON, parse it and run screenshots
        await parseJSON(browser, parameters);

    } else {

        // Has one url, no json detected
        await generate(browser, parameters);
    }

    process.stdout.write('Generating finished' + '\n');

    await killProcess(browser);

})();



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









// Generate function
async function generate(browser, params) {

    try {
		params.width = parseInt(params.width);
		params.height = parseInt(params.height);

        process.stdout.write('Screenshot generating started from: ' + params.url + '\n');

        const page = await browser.newPage();

        // Go to url
        await page.goto(params.url.replace('\\', '/'));

        // Set screen width and height
        await page.setViewport({
            width: params.width,
            height: params.height,   
            deviceScaleFactor: params.scale
        });

        process.stdout.write('Viewport set to ' + params.width + 'x' + params.height + ' scale ' + params.scale + '\n');

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
                if (fs.existsSync(params.output)) {
                    fs.rmSync(params.output);
                }

                const screenshotAttributes = {
                    path: params.output,
                    type: 'png',
                    fullPage: false
                };

                process.stdout.write('Starting make the screenshot' + '\n'); 
                const screenshot = await page.screenshot(screenshotAttributes);
                process.stdout.write('Screenshot created successfully to: ' + screenshotAttributes.path + '\n');

                // Send resolve
                resolve(screenshot);
            } catch(error) {
                reject(error);
                throw error;
            }

        });

        // Race with screenshot vs timeout
        await Promise.race([screenshotPromise, timeoutPromise])
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