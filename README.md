# htmlimage-puppeteer

Call ```node htmlimage.js url=google.com width=300 height=250 output=image.jpg type=jpeg delay=1500 timeoutInSeconds=120 fullPage=false``` in cli and take screenshot with puppeteer.

Or ```node htmlvideo.js url=google.com width=300 height=250 duration=7000 output=video.mp4 delay=0``` and create video.

Or ```node htmlgif.js url=google.com```

# Use json

``` node htmlvideo.js json='{url: "google.com"}'```

# Or generate multiple outputs

``` node htmlgif.js json='[{url: "google.com"}]' ```

# Create gifs from google, facebook and youtube
```node htmlgif.js json='[{"url":"https://google.com","output":"google.gif"},{"url":"https://facebook.com","output":"facebook.gif"},{"url":"https://youtube.com","output":"youtube.gif"}]'```