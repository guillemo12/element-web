const { chromium } = require('playwright-core');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(`
        <html>
            <head><style>body { height: 5000px; } img { display: block; margin-top: 2000px; width: 100px; height: 100px; }</style></head>
            <body>
                <img id="eager-img" src="https://via.placeholder.com/150" />
                <img id="lazy-img" src="https://via.placeholder.com/150" loading="lazy" />
            </body>
        </html>
    `);

    // Verify eager image loading
    const eagerImg = await page.$('#eager-img');
    const isEagerImgLoaded = await eagerImg.evaluate((img) => img.complete && img.naturalHeight !== 0);
    console.log('Is eager image loaded initially?', isEagerImgLoaded);

    // Verify lazy image loading
    const lazyImg = await page.$('#lazy-img');
    const isLazyImgLoaded = await lazyImg.evaluate((img) => img.complete && img.naturalHeight !== 0);
    console.log('Is lazy image loaded initially?', isLazyImgLoaded);

    // Scroll down to the images
    await page.evaluate(() => window.scrollBy(0, 3000));
    await page.waitForTimeout(500); // Wait for the image to load

    const isLazyImgLoadedAfterScroll = await lazyImg.evaluate((img) => img.complete && img.naturalHeight !== 0);
    console.log('Is lazy image loaded after scroll?', isLazyImgLoadedAfterScroll);

    await browser.close();
})();
