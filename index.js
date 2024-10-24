#!/usr/bin / env node
const express = require('express');
const app = express();
const port = 3000;
const puppeteer = require('puppeteer');
let postDescription = '';

app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Open http://localhost:${port} in your web browser to get started.`);
    console.log('Please press Ctrl + C in this terminal when finished, then press Y.');
});

async function getThredup(description){
    //open up Thredup page
    const search = description.replaceAll(" ", "%20");
    const url = "https://www.thredup.com/women?text="+search+"&sort=price_high_low"
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(url);

    //get number of entries
    let totalResults = await page.evaluate(() => {
        for (const div of document.querySelectorAll("div.u-font-bold")){
            if(div.textContent.includes("items")){
                return div.textContent;
            }
        }
    })
    totalResults = totalResults.replace(" items", "");
    totalResults = totalResults.replace(",", "");
    //120 per page
    if(totalResults == 0){
        browser.close();
        return{price: 0.00, results: 0};
    }
    //find middle page
    // if(totalResults > 200)
    // {
    //     let halfResults = Math.ceil(Number(totalResults)/120)
    //     let middlePage = Math.ceil(halfResults / 2)
    //     page.goto(url+"&page="+middlePage);
    //     await page.waitForNavigation();
    //     await page.waitForNavigation();
    // }
    
    //find middle item
    const totalPrice = await page.evaluate(() => {
        const itemList = document.getElementsByClassName('grid-item');
        const middleItem =  itemList[Math.round(itemList.length / 2)];
        const soldPriceHTML = middleItem.querySelector("span.u-inline-block");
        let finalPrice = soldPriceHTML.innerHTML;
        finalPrice = finalPrice.replace("$", "");
        return finalPrice;
    });
    browser.close();
    return {price: totalPrice, results: totalResults}

}

async function getEbay(text){
    // Open up Ebay page

    const search = text.replaceAll(" ", "+");
    const url = "https://www.ebay.com/sch/i.html?_nkw="+search+"&_sacat=0&LH_Sold=1&LH_Complete=1&LH_BIN=1&_sop=15&_ipg=240"
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(url);

    // find the middle result
    // select the middle page
    let totalResults = await page.evaluate(() => {
        return document.querySelector(".srp-controls__count-heading").querySelector("span").innerText;
    });
    totalResults = totalResults.replace(",", "");
    if(totalResults == 0){
        browser.close();
        return{price: 0.00, results: 0};
    }
    if(totalResults > 360);
    {
        let halfResults = Math.ceil(Number(totalResults)/240)
        let middlePage = Math.ceil(halfResults / 2)
        page.goto(url+"&_pgn="+middlePage);
        await page.waitForNavigation();
    }

    // select the middle item and get the sold price
    let price = await page.evaluate(() => {
        const itemList = document.getElementsByClassName('s-item');
        const middleItem =  itemList[Math.round(itemList.length / 2)];
        const soldPriceHTML = middleItem.querySelector(".s-item__price");
        let soldPrice = soldPriceHTML.querySelector("span").innerText;
        soldPrice = soldPrice.replace("$", "");

        //Get shipping price and add to total
        let shippingPrice = middleItem.querySelector(".s-item__shipping").innerText;
        shippingPrice = shippingPrice.replace("+$", "");
        shippingPrice = shippingPrice.replace(" shipping", "");
        shippingPrice = shippingPrice.replace("Free", "0.00");
        return (Number(soldPrice) + Number(shippingPrice)).toFixed(2);
    })
    browser.close();
    return {price: price, results: totalResults};
}



app.use(express.static('public'));
app.use(express.json());

app.get('/pricing', async (request, response) => {
    const ebayResults = await getEbay(postDescription);
    const thredupResults = await getThredup(postDescription);
    let results = [];
    results.push({site: 'Ebay', price: ebayResults.price, results: ebayResults.results});
    results.push({site: 'Thredup', price: thredupResults.price, results: thredupResults.results});
    response.json(results);
});

app.post('/desc', (req, res) => {
    const {parcel} = req.body;
    if(!parcel){
        return res.status(400).send({status: 'failed'});
    }
    res.status(200).send({status: 'recieved'});
    postDescription = parcel;
})