const fs = require('fs');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');


const parameters = {
    url: 'https:\/\/s3.eu-central-1.amazonaws.com\/wavemaker-storage\/generated\/20\/2209020926_23885\/300x250\/index.html',
    json: '', 
    output: 'image.gif',
	duration: 7000,
    width: 300,
    height: 250,
    delay: 0,
    scale: 2,

    fullPage: false,

    // 1 minute to timeout
    timeoutInSeconds: 60
};

const videoParams = {
	followNewTab: true,
	fps: 25,
	videoFrame: {
		width: 300,
		height: 250,
	},
	videoCrf: 18,
	videoCodec: 'libx264',
	videoPreset: 'ultrafast',
	videoBitrate: 1000,
	autopad: {
		color: 'black' | '#35A5FF',
	}
};


// Define sleep function
const sleep = m => new Promise(r => setTimeout(r, m));

// Get parameters
process.argv.forEach(function (val, index) {
    const argument = val.split('=');
    parameters[argument[0]] = argument[1];
	videoParams[argument[0]] = argument[1];
});

// Start process here
(async function() {


    const browser = await launchBrowser();

    if (parameters.json && parameters.json.length > 10) {

        process.stdout.write('Details coming from json');

        // Has JSON, parse it and run capture
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

        // Each in json array (generate multiple videos)
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
        // Set puppeteer dimensions
		params.width = parseInt(params.width);
		params.height = parseInt(params.height);

        // Set video dimensions
        videoParams.videoFrame.width = params.width * params.scale;
        videoParams.videoFrame.height = params.height * params.scale;

        process.stdout.write('Video generating started from: ' + params.url + '\n');

        const page = await browser.newPage();

        // Set screen width and height
        await page.setViewport({ width: params.width, height: params.height });

        // Go to url
        await page.goto(params.url.replace('\\', '/'));

        process.stdout.write('Viewport set to ' + params.width + 'x' + params.height + ' scale ' + params.scale + '\n');

        // Delay before capture the video
        await sleep(parseInt(params.delay));

        // Timeout promise
        const timeoutPromise = new Promise(async (resolve, reject) => {
            setTimeout(async () => {

                // Send reject
                reject('Html to video generating timed out' + '\n');

            }, parseInt(params.timeoutInSeconds) * 1000);
        })

        // Record promise
        const recordPromise = new Promise(async (resolve, reject) => {

            try {

                // Remove videofile if already exists
                if (fs.existsSync(params.output + '.mp4')) {
                    fs.rmSync(params.output + '.mp4');
                }

				const recorder = new PuppeteerScreenRecorder(page, videoParams);

				process.stdout.write('Start capture\n');
				await recorder.start(params.output + '.mp4');
				await sleep(params.duration);
				await recorder.stop();
				process.stdout.write('End capture\n');

                process.stdout.write('Video record created successfully to: ' + params.output + '.mp4\n');

				// Create gif from mp4
				ffmpeg(params.output + '.mp4')
					.output(params.output)
					.outputOption('-vf', 'fps=' + videoParams.fps + ',scale=640:-1:flags=lanczos')
					.outputOption('-pix_fmt', 'rgb24')
					.outputOption('-r', videoParams.fps)
					.outputOption('-f', 'gif')
					.on('end', () => {

						// Remove videofile if already exists
						if (fs.existsSync(params.output + '.mp4')) {
							fs.rmSync(params.output + '.mp4');
						}

						process.stdout.write('Gif created successfully to ' + params.output + '\n');
						resolve(true);
					})
					.on('error', (error) => {

						// Remove videofile if already exists
						if (fs.existsSync(params.output + '.mp4')) {
							fs.rmSync(params.output + '.mp4');
						}

						throw('Failed to create gif from video' + error.message);
					})
					.run();
                
            } catch(error) {
                reject(error);
                throw(error);
            }

        });

        // Race with video vs timeout
       	await Promise.race([recordPromise,  timeoutPromise])
            .then(async () => {
                process.stdout.write('Html to video generated successfully to: ' + params.output + '\n');
            })
            .catch(async (error) => {
                process.stdout.write('Failed to generate video from html: ' + error + '\n');
            });

    } catch (error) {
        process.stdout.write('Html to video generating failed with: ' + error + '\n');
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