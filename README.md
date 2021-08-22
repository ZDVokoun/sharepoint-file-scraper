# Sharepoint File Scraper
A script for scraping file links from Sharepoint 2013 site. After running the script, you will get list of links to all files on Sharepoint which you can download using e. g. `wget`.
Before using the script, run `npm install` to download dependencies.


```
Usage: node index.js [-- <args>]
Options:
    --help      Prints this help
    --url       Sets URL to start with, required
    --user      Sets username, required
    --password  Sets password, required
    --output    Writes result to file
```
