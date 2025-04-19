// const puppeteer = require("puppeteer-extra");
// const StealthPlugin = require("puppeteer-extra-plugin-stealth");
// const path = require("path");
// puppeteer.use(StealthPlugin());

// const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// const applyToJob = async ({
//   url,
//   name,
//   email,
//   resumePath,
//   coverLetterPath,
// }) => {
//   const browser = await puppeteer.launch({
//     headless: false,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--single-process",
//       "--no-zygote",
//     ],
//     // userDataDir: "C:/Users/Remi/AppData/Local/Google/Chrome/User Data",
//     // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
//   });
//   const page = await browser.newPage();

//   // Mimic browser
//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.90 Safari/537.36"
//   );
//   await page.setViewport({
//     width: 1366 + Math.floor(Math.random() * 100),
//     height: 768 + Math.floor(Math.random() * 100),
//   });
//   await page.setExtraHTTPHeaders({
//     "accept-language": "en-US,en;q=0.9",
//   });

//   try {
//     await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

//     await sleep(2000);
//     await humanLikeMouse(page);

//     // Fill name, email
//     await typeLikeHuman(page, 'input[name="name"], input#name', name);
//     await typeLikeHuman(page, 'input[name="email"], input#email', email);

//     // Upload files
//     const resumeInput = await page.waitForSelector(
//       'input[type="file"][name*="resume"], input[type="file"]'
//     );
//     await resumeInput.uploadFile(path.resolve(resumePath));

//     const coverInput = await page.$('input[type="file"][name*="cover"]');
//     if (coverInput) {
//       await coverInput.uploadFile(path.resolve(coverLetterPath));
//     }

//     await sleep(1000);
//     await clickLikeHuman(page, 'button[type="submit"], button.apply');

//     await sleep(5000);
//     console.log("✅ Application submitted!");
//   } catch (error) {
//     console.error("❌ Application failed:", error.message);
//   } finally {
//     await browser.close();
//   }
// };

// // Example usage
// applyToJob({
//   url: "https://jobs.smartrecruiters.com/oneclick-ui/company/Talan/publication/44d25765-663f-4262-b301-6b2b1ad7379c?dcr_ci=Talan",
//   name: "John Doe",
//   email: "john.doe@example.com",
//   resumePath: "./resume.pdf",
//   coverLetterPath: "./coverLetter.pdf",
// });

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
const fs = require("fs");

puppeteer.use(StealthPlugin());

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Simulate human typing
const typeLikeHuman = async (page, selector, text) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 8000 });
    const input = await page.$(selector);
    for (const char of text) {
      await input.type(char);
      await sleep(50 + Math.random() * 100);
    }
  } catch (err) {
    console.warn(`⚠️ Could not type into ${selector}:`, err.message);
  }
};

// Simulate human clicking
const clickLikeHuman = async (page, selector) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 8000 });
    const button = await page.$(selector);
    const box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await sleep(50 + Math.random() * 100);
    await page.mouse.up();
  } catch (err) {
    console.warn(`⚠️ Could not click ${selector}:`, err.message);
  }
};

// Simulate human-like mouse movement
const humanLikeMouse = async (page) => {
  const { width, height } = await page.evaluate(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  for (let i = 0; i < 5; i++) {
    await page.mouse.move(
      Math.floor(Math.random() * width),
      Math.floor(Math.random() * height),
      { steps: 5 }
    );
    await sleep(100 + Math.random() * 200);
  }
};

// Main apply logic
const applyToJob = async ({
  url,
  name,
  email,
  resumePath,
  coverLetterPath,
}) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await sleep(3000);
    await humanLikeMouse(page);

    // Handle potential iframes (SmartRecruiters uses them)
    const frames = page.frames();
    const appFrame = frames.find(
      (f) =>
        f.url().includes("smartrecruiters") || f.name().includes("application")
    );

    const framePage = appFrame || page;

    // Fill name and email
    await typeLikeHuman(framePage, 'input[name="name"], input#name', name);
    await typeLikeHuman(framePage, 'input[name="email"], input#email', email);

    // Upload resume
    const resumeInput = await framePage.waitForSelector(
      'input[type="file"][name*="resume"], input[type="file"]',
      { visible: true, timeout: 10000 }
    );
    await resumeInput.uploadFile(path.resolve(resumePath));

    // Upload cover letter (optional)
    const coverInput = await framePage.$('input[type="file"][name*="cover"]');
    if (coverInput) {
      await coverInput.uploadFile(path.resolve(coverLetterPath));
    }

    await sleep(1500);

    // Submit the application
    await clickLikeHuman(framePage, 'button[type="submit"], button.apply');

    await sleep(5000);
    console.log("✅ Application submitted!");
  } catch (error) {
    console.error("❌ Application failed:", error.message);
  } finally {
    await browser.close();
  }
};

// ✅ Example usage
applyToJob({
  url: "https://jobs.smartrecruiters.com/oneclick-ui/company/Talan/publication/44d25765-663f-4262-b301-6b2b1ad7379c?dcr_ci=Talan",
  name: "John Doe",
  email: "john.doe@example.com",
  resumePath: "./resume.pdf",
  coverLetterPath: "./coverLetter.pdf",
});
