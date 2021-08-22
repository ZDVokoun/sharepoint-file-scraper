import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { argv, exit } from "process";

// Checking arguments
let saveTo, username, password, firstURL;
if (argv.indexOf("--output") != -1) saveTo = argv[argv.indexOf("--output") + 1];
if (argv.indexOf("--user") != -1) username = argv[argv.indexOf("--user") + 1];
if (argv.indexOf("--password") != -1) password = argv[argv.indexOf("--password") + 1];
if (argv.indexOf("--url") != -1) firstURL = argv[argv.indexOf("--url") + 1];
if (argv.indexOf("--help") != -1) {
  console.log(
    `Usage: node index.js [-- <args>]
Options:
    --help      Prints this help
    --url       Sets URL to start with, required
    --user      Sets username, required
    --password  Sets password, required
    --output    Writes result to file`
    );
  exit();
}
if (!username || !password || !firstURL) throw Error("Missing arguments. Use --help for more info");

async function run() {
  let pages = new Set([firstURL]);
  let files = new Set([]);
  const browser = await puppeteer.launch({args: ['--ignore-certificate-errors']});
  let page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
  await page.authenticate({'username':username, 'password': password});
  // Scraping every found page
  for (let i = 0; i < pages.size; i++) {
    // Get site to scrap 
    let path = Array.from(pages)[i];
    await page.goto(path);
    await page.waitForSelector("body");

    let urls = await page.$$eval("a, img", (elements, firstURL) => {
      // regex to check the domain of URL
      let hostRegex = new RegExp(firstURL.match(/^https?:\/\/[^\/]+/)[0], "");
      let links = {pages: [], files: []};

      for (let element of elements) {
        // it's a link
        if (element.nodeName == "A") {
          const link = element.href;
          let itsPage = /\/\w*\.aspx|\/[^\.]*\/?$/u.test(link);
          // Checking if href is valid and if is on current domain
          if (!/javascript|#$/i.test(link) && hostRegex.test(link) && link) {
            // href refers to Shared Documents?
            if (itsPage && /Shared%20[dD]ocuments|default.aspx/i.test(link)) {
              links.pages.push(link);
            } 
            // href refers to Gallery?
            else if (itsPage && /Gallery/i.test(link)) {
              // use "All Items" mode instead of "Thumbnails" and "Slides" mode
              links.pages.push(link.replace(/(Thumbnails|Slides).aspx/i, "AllItems.aspx"));
            } 
            // href refers to file?
            else if (!itsPage) links.files.push(link);
          } 
        } 
        // it's an image
        else {
          links.files.push(element.src);
        }
      }
      return links;
    }, firstURL);

    // Update lists
    pages = new Set([...pages,...urls.pages]);
    files = new Set([...files,...urls.files]);
    
    console.log(path + " scraped");
  }

  // Write result to file, if specified
  let output = "Pages:\n" + Array.from(pages).join("\n") + "\n\nFiles:\n" + Array.from(files).join("\n");

  if (saveTo)
    await writeFile(saveTo, output, "utf-8")
      .catch(err => console.error(err)).then(() => console.log("Saved file successfully"));
  else console.log(output);
  browser.close();
}

run();
