// Import the Showdown converter
const Showdown = require('showdown');
const { JSDOM } = require("jsdom");
const fs = require('fs');
const path = require('node:path');
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: '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',
});

async function articleToHTML(markdownText, product0, product1, product2, index, rand) {

    // if (product1.reviewRatingAndCount == "") {
    //     console.log(product1)
    // }

    //End the function if any of the products are empty or null         
    // if (product0 == null || product1 == null || product2 == null) {
    //     console.log("Gen failed in converter.js index " + index, rand)
    //     return
    // }

    // const keywords = getKewords(product0.title)

    // Create a new converter instance
    const converter = new Showdown.Converter();

    // Convert markdown to HTML
    const htmlText = converter.makeHtml(markdownText);
    // console.log(htmlText)

    function addListsToHTML(html) {
        const dom = new JSDOM(html);
        const document = dom.window.document;
        let currentUl = null;

        // Function to close current list if it exists
        const closeCurrentList = () => {
            if (currentUl) {
                currentUl = null;
            }
        };

        const elements = Array.from(document.body.children);
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.tagName === 'H1') {
                // Create a new header element and wrap the H1
                const header = document.createElement('header');
                header.className = 'container'; // Set the class for the header

                el.classList.add('text-center', 'mt-5'); // Add classes to the H1 tag

                // Move the H1 into the header and then replace the original H1 with this new header
                el.parentNode.insertBefore(header, el);
                header.appendChild(el);

                // //carousel
                // const carousel = mainDocument.getElementById('carousel-cont')
                // const carouselInner = mainDocument.getElementsByClassName('carousel-inner')[0]

                // //inside it
                // product0.productImages.forEach((imageUrl, i) => {
                //     const item = document.createElement('div');
                //     item.classList.add('carousel-item', 'link2amazon');
                //     if (i == 0) {
                //         item.classList.add('active');
                //     }
                //     const img = document.createElement('img');
                //     img.src = imageUrl;
                //     img.onerror = "this.onerror=null"
                //     img.className = 'd-block w-100';
                //     img.alt = 'Carousel product image';
                //     item.appendChild(img);
                //     carouselInner.appendChild(item);
                // })
                // header.insertAdjacentElement('afterend', carousel)

            } else if (el.tagName === 'H2') {
                closeCurrentList(); // Ensure no open lists are carried over
            } else if (el.tagName === 'H3') {
                // Check if there's a P tag following the H3
                const nextEl = elements[i + 1];
                if (nextEl && nextEl.tagName === 'P') {
                    if (!currentUl) {
                        // If there's no current list, create one and insert it after the last H2 or at the start
                        currentUl = document.createElement('ul');
                        currentUl.className = "list-group";
                        el.parentNode.insertBefore(currentUl, el);
                    }
                    // Create a new list item and move H3 and P into it
                    const li = document.createElement('li');
                    li.className = "list-group-item";
                    li.appendChild(el.cloneNode(true)); // Clone H3
                    li.appendChild(nextEl.cloneNode(true)); // Clone P
                    currentUl.appendChild(li);

                    // Remove original H3 and P to avoid duplication
                    el.parentNode.removeChild(el);
                    nextEl.parentNode.removeChild(nextEl);

                    i++; // Skip the next element since we already processed it
                }
            }
        }

        // ----------

        const h2s = document.querySelectorAll('h2');

        h2s.forEach((h2, index) => {
            const div = document.createElement('div'); // Create a new div
            div.className = "container mt-5 sec"; // Add classes to the div
            h2.parentNode.insertBefore(div, h2); // Insert the div before the h2

            let next = h2.nextElementSibling;
            div.appendChild(h2); // Move the h2 inside the div
            while (next && next.tagName !== 'H2') {
                const toMove = next; // Store reference as next will change
                next = next.nextElementSibling; // Move to the next sibling before moving the current element
                div.appendChild(toMove); // Move the current element inside the div
            }

        });

        // ---------

        const linkEl = document.createElement('a');
        linkEl.href = product0.link;
        linkEl.className = "btn btn-primary link2amazon";
        linkEl.textContent = "Buy on Amazon";
        document.body.appendChild(linkEl);

        let outputHTML = document.body.innerHTML;
        // Regular expression to remove extra line breaks after </ul> tags
        // outputHTML = outputHTML.replace(/<\/ul>\s*\n\s*\n/g, '</ul>\n');
        outputHTML = outputHTML.replace(/<\/div>\s*\n\s*\n/g, '</div>\n');

        return outputHTML;
    }

    // Load main HTML content
    const mainHtmlContent = fs.readFileSync('template/swoo_html/inner_pages/template.html', 'utf8');
    const mainDom = new JSDOM(mainHtmlContent);
    const mainDocument = mainDom.window.document;

    // Transform the HTML
    const modifiedHtml = addListsToHTML(htmlText);
    // console.log(modifiedHtml);




    // ---------- insert in to the actual file ----------

    // // Find the section with the ID 'article'
    // const articleSection = mainDocument.querySelector('#article');
    // articleSection.innerHTML += modifiedHtml;

    // // Insert in to cards
    // let c1Score = product1.reviewRatingAndCount[0].match(/^(\d(\.\d)?)/)[0]
    // c1Score = Math.round(c1Score * 2) / 2;
    // const card1 = mainDocument.querySelector('#card1')
    // card1.querySelector('img').src = product1.productSmallImage
    // card1.querySelector('.card-title').innerHTML = product1.title
    // card1.querySelector('.card-text').innerHTML = product1.fullPrice + "$"
    // card1.querySelector('.revCount').innerHTML = product1.reviewRatingAndCount[1].match(/\d+/g).join(",");
    // card1.querySelector('.revImg').src = `./images/${c1Score}.png`

    // let c2Score = product2.reviewRatingAndCount[0].match(/^(\d(\.\d)?)/)[0]
    // c2Score = Math.round(c2Score * 2) / 2;
    // const card2 = mainDocument.querySelector('#card2')
    // card2.querySelector('img').src = product2.productSmallImage
    // card2.querySelector('.card-title').innerHTML = product2.title
    // card2.querySelector('.card-text').innerHTML = product2.fullPrice + "$"
    // card2.querySelector('.revCount').innerHTML = product1.reviewRatingAndCount[1].match(/\d+/g).join(",");
    // card2.querySelector('.revImg').src = `./images/${c2Score}.png`

    // // Insert Links
    // const scriptTag = mainDocument.createElement('script');
    // scriptTag.innerHTML = `var link0 = "${product0.link}"; var link1 = "${product1.link}"; var link2 = "${product2.link}";`;
    // mainDocument.body.insertBefore(scriptTag, mainDocument.body.firstChild);

    // // Make schema
    // const schemaJSON = mainDocument.querySelector('script[type="application/ld+json"]');
    // const schema = JSON.parse(schemaJSON.innerHTML);
    // schema.itemListElement[0].item.offers.price = product0.fullPrice;
    // schema.itemListElement[0].item.offers.url = product0.link;
    // schema.itemListElement[0].item.image = product0.productImages[0];
    // schema.itemListElement[0].item.name = product0.title;
    // schema.itemListElement[0].item.description = product0.fromTheManufacturer[0] || "";

    // schema.itemListElement[1].item.offers.price = product1.fullPrice;
    // schema.itemListElement[1].item.offers.url = product1.link;
    // schema.itemListElement[1].item.image = product1.productImages[0];
    // schema.itemListElement[1].item.name = product1.title;
    // schema.itemListElement[1].item.description = product1.fromTheManufacturer[0] || "";

    // schema.itemListElement[2].item.offers.price = product2.fullPrice;
    // schema.itemListElement[2].item.offers.url = product2.link;
    // schema.itemListElement[2].item.image = product2.productImages[0];
    // schema.itemListElement[2].item.name = product2.title;
    // schema.itemListElement[2].item.description = product2.fromTheManufacturer[0] || "";
    // schemaJSON.innerHTML = JSON.stringify(schema);

    // //Other parts of header
    // mainDocument.querySelector('meta[name="description"]').setAttribute('content', 'product0.fromTheManufacturer[0]')
    // await keywords
    // mainDocument.querySelector('meta[name="keywords"]').setAttribute('content', keywords)
    // mainDocument.querySelector('title').innerHTML = product0.title;

    // Save the updated HTML

    // mainDocument.getElementById('1-title').innerHTML=product0.title
    // mainDocument.getElementById('2-price').innerHTML=product0.price
    const ids = Array.from(mainDocument.querySelectorAll('[id]'))
        .filter(el => /^\d+-\w/.test(el.id));
    ids.sort((a, b) => parseInt(a.id.split('-')[0]) - parseInt(b.id.split('-')[0]));
    ids.forEach(el => {
        console.log(el.id)

    })
    ids[0].innerHTML = product0.title
    let c1Score = product0.reviewRatingAndCount[0].match(/^(\d(\.\d)?)/)[0]
    c1Score = Math.round(c1Score * 2) / 2;
    ids[1].src = `../../../e/images/${c1Score}.png`
    ids[2].innerHTML = product0.reviewRatingAndCount[1].match(/\d+/g).join(",");
    ids[3].innerHTML = product0.fullPrice + '$'
    ids[4].innerHTML = '.-sdasdsad'
    ids[5].innerHTML = product0.fullPrice + '$'
    ids[6].innerHTML = 'grab-this'
    ids[7].innerHTML = product0.brand

    const swiperWrapper = mainDocument.getElementById('9-imgs-big').querySelector('.swiper-wrapper');
    product0.productImages.forEach((imgSrc, i) => {
        const newSlide = mainDocument.createElement('div');
        newSlide.className = "swiper-slide";
        const imgContainer = mainDocument.createElement('div');
        imgContainer.className = "img";
        const img = mainDocument.createElement('img');
        img.src = "../../../e/" + imgSrc;
        imgContainer.appendChild(img);
        newSlide.appendChild(imgContainer);
        swiperWrapper.appendChild(newSlide);
    });

    const swiperWrapper1 = mainDocument.querySelector('.gallery-thumbs').querySelector('.swiper-wrapper');
    product0.productImages.forEach((imgSrc, i) => {
        const newSlide = mainDocument.createElement('div');
        newSlide.className = "swiper-slide";
        const imgContainer = mainDocument.createElement('div');
        imgContainer.className = "img";
        const img = mainDocument.createElement('img');
        img.src = "../../../e/" + imgSrc;
        imgContainer.appendChild(img);
        newSlide.appendChild(imgContainer);
        swiperWrapper1.appendChild(newSlide);
    });

    ids[10].innerHTML = modifiedHtml

    const table = product0.table
    if (table) {
        const ul = mainDocument.createElement('ul');
        const addInfo = mainDocument.querySelector('.additional-info')
        console.log(table)
        table.forEach(([key, value]) => {
            const li = mainDocument.createElement('li');
            const strong = mainDocument.createElement('strong');
            strong.textContent = key;
            const span = mainDocument.createElement('span');
            span.textContent = ` ${value}`;
            li.appendChild(strong);
            li.appendChild(span);
            ul.appendChild(li);
        });
        addInfo.appendChild(ul)
    }else{
        console.log('no table found')
    }

    const updatedHTML = mainDom.serialize();

    const files = fs.readdirSync('./');
    let maxNum = 0;

    files.forEach(file => {
        const baseName = path.basename(file, '.html');
        const num = parseInt(baseName);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    })
    const pageNum = maxNum + 1;
    const newFileName = `${pageNum}.html`;
    const road = path.join('', newFileName)
    fs.writeFileSync('template/swoo_html/inner_pages/single_product.html', updatedHTML, 'utf8');
    console.log(`HTML file ${newFileName} saved!`)
}
articleToHTML(`# STANLEY IceFlow Stainless Steel Tumbler: The Perfect Hydration Companion for Every Adventure

## Introduction

In today's fast-paced world, staying hydrated is more important than ever. Whether you're at home, in the office, or on the go, having a reliable and stylish tumbler by your side can make all the difference. That's where the STANLEY IceFlow Stainless Steel Tumbler comes in. With its innovative design and exceptional features, this tumbler is not just a cup but a statement piece that elevates your beverage experience wherever you are.

## Stay Hydrated for the Whole Day

One of the key benefits of the STANLEY IceFlow Stainless Steel Tumbler is its large capacity. With a 30 oz size, this tumbler can hold enough thirst-quenching beverage to power you through even your longest days. Whether it's water to keep you refreshed or smoothies and iced coffee to fuel your energy levels, simply fill up this tumbler and get on with your day without worrying about constant refills.

## Keeps Cold for a Long Time

When it comes to keeping your drinks cold, the STANLEY IceFlow Tumbler truly excels. Thanks to its double-wall vacuum insulation and high-quality 18/8 stainless steel construction, this tumbler ensures that your beverages stay nice and chilled for up to an impressive 12 hours or even keeps them icy cold for up to two days when filled with ice.

Gone are the days of settling for lukewarm water or melted ice-cold drinks after just a few hours. With the STANLEY IceFlow Tumbler by your side, enjoy refreshing sips throughout the day no matter how long it takes.

## Straw Perfected: Effortless Sipping Anytime

Say goodbye to flimsy disposable straws that create unnecessary waste or reusable straws that make a mess when tipped over. The STANLEY IceFlow Tumbler features an exclusive IceFlow flip straw that takes sipping to a whole new level of convenience.

With this innovative design, you can effortlessly sip your favorite beverages without any spills or leaks. Simply snap the straw shut when you're done and enjoy peace of mind knowing that your tumbler is leak-resistant and ready for any adventure.

## Made to Fit Your Life

The STANLEY IceFlow Tumbler is not just about functionality; it's also designed with your lifestyle in mind. Its ergonomic rotating handle allows you to quickly grab the tumbler and go, making it perfect for those busy mornings or on-the-go moments.

Additionally, this tumbler fits comfortably in cup holders both in your car and on exercise machines, ensuring that hydration is always within reach no matter where life takes you. And when it comes time to clean up, rest assured that the STANLEY IceFlow Tumbler is dishwasher safe, making maintenance a breeze.

## Built for Life: A Promise You Can Count On

When investing in a high-quality product like the STANLEY IceFlow Stainless Steel Tumbler, durability and longevity are crucial factors to consider. That's why Stanley has been trusted since 1913 as a brand committed to providing rugged gear built to last a lifetime.

In line with their "BUILT FOR LIFE" promise, all Stanley products purchased from authorized resellers come with a lifetime warranty. This means that if anything goes wrong with your tumbler due to manufacturing defects or workmanship issues, Stanley will stand behind their product and ensure customer satisfaction.

## Reviews Speak Volumes

Don't just take our word for it - let satisfied customers share their experiences with the STANLEY IceFlow Stainless Steel Tumbler:

- One reviewer praises how this tumbler keeps drinks at the perfect temperature throughout the day, whether it's ice-cold water on a scorching Southern day or piping hot coffee during early morning commutes. The leakproof flip lid is also highlighted as a small detail that makes a big difference in terms of convenience and peace of mind.

- Another reviewer raves about the retro colors and how they perfectly match their aesthetic. They appreciate the collapsible straw feature, which adds an extra layer of cleanliness compared to cups with straws sticking straight up at all times. Easy cleaning and durability are also mentioned as standout features.

- A customer expresses their love for this tumbler not only for its adorable design but also for its practicality and positive impact on the environment. Made from recycled fishing nets, this tumbler aligns with their conservation interests while providing excellent insulation capabilities.

These reviews highlight some key aspects that make the STANLEY IceFlow Tumbler stand out: style, functionality, ease of use, durability, and environmental consciousness.

## Conclusion

In conclusion, if you're looking for a reliable companion to keep you hydrated throughout your daily adventures, look no further than the STANLEY IceFlow Stainless Steel Tumbler. With its large capacity, exceptional insulation capabilities, convenient flip straw design, ergonomic handle, dishwasher-safe construction,
and lifetime warranty promise from Stanley - this tumbler has it all.

Don't settle for lukewarm drinks or flimsy containers that can't withstand your active lifestyle. Invest in quality craftsmanship and timeless style with the STANLEY IceFlow Tumbler today!

Stay refreshed in style wherever you go - sip confidently with the STANLEY IceFlow Stainless Steel Tumbler by your side!`,   {
    "link": "https://www.amazon.com/dp/B096RVQWKX/ref=nosim?tag=bestmmorpg00",
    "asin": "B096RVQWKX",
    "title": "BJPKPK Insulated Water Bottles -17oz/500ml -Stainless Steel Water bottles, Sports water bottles Keep cold for 24 Hours and hot for 12 Hours,BPA Free water bottles,Mint",
    "productImages": [
      "./gen-img/639-big.webp",
      "./gen-img/642-big.webp",
      "./gen-img/640-big.webp",
      "./gen-img/641-big.webp",
      "./gen-img/643-big.webp"
    ],
    "fullPrice": "10.25",
    "brand": "BJPKPK",
    "reviewRatingAndCount": [
      "4.5 out of 5",
      "7,883 global ratings"
    ],
    "fromTheManufacturer": [
      "Keep drinks cold & hot: Adopt double wall vacuum insulation design, keep your drinks ice cold for 24 hours and hot for 12 hours within our highly performed insulated water bottle.     Safe and Reliable: Made of premium 18/8 food grade stainless steel - durable and rust proof, BPA Free Lid - leak proof, no sweat on the exterior side to keep your hands comfortable while holding, Eco-friendly.     Keep Hydration: Drinking more water with this water bottle, suitable for any sports activities, work and any scenario in your daily life.     Functional style: Our water bottles have been designed with spill proof and leak proof features for convenient use and travelling.     Perfect size: Our water bottles are designed with perfect size for daily use and also perfect fit in your car cup holder.",
      "From the manufacturer",
      "BJPKPK Stainless Steel Double Wall Insulated Water Bottles BUILT TO LAST",
      "Our highly rated water bottles are ready for any adventure, also designed to be the perfect urban companion as well. With design in mind, our stylish cola shaped bottles know how to keep you cool. Using our innovative insulated water bottles enhance the daily hydration experience by keeping drinks cold for 24 hours or hot for 12 hours. No matter where your journey, our water bottle is the best beverage companion, making sure you have high performance with you!",
      "<img alt=\"water bottle\" src=\"https://m.media-amazon.com/images/S/aplus-media/vc/87d5cb76-8433-4d69-9e65-ccb745d57a69.__CR0,0,300,300_PT0_SX300_V1___.jpg\"/>",
      "<img alt=\"water bottle\" src=\"https://m.media-amazon.com/images/S/aplus-media/vc/5afddd5d-7102-4860-9450-1276bd886527.__CR0,0,300,300_PT0_SX300_V1___.jpg\"/>",
      "<img alt=\"water bottle cup holder\" src=\"https://m.media-amazon.com/images/S/aplus-media-library-service-media/d7bf0105-41a7-4627-baeb-b9e2f0e00829.__CR0,0,1600,1600_PT0_SX300_V1___.jpg\"/>",
      "CLEANING AND MAINTENANCE:",
      "18/8 Stainless Steel Material",
      "Water tastes fresh all day long! And it feels nicer than plastic to drink.",
      "Made with 18/8 food grade stainless steel, BJPKPK metal water bottles ensure pure taste and no flavor transfer, and the durable construction stands up to whatever life brings, never sweat on your hands or in your bag.",
      "Double Wall Vacuum Insulation",
      "The unique double wall vacuum insulation protects temperature for hours. Keeps cold drinks icy cold and hot drinks piping hot for hydration any time, anywhere. Our BJPKPK insulated water bottles can keep hot beverages warm for up to 12 hours and cold beverages chilled for up to 24 hrs.",
      "The color is gorgeous, even prettier in real life!",
      "Our stainless steel water bottles are beautifully crafted and designed to last. The powder coated             finish is not a smooth glossy finish, doesn't sweat, staying slip-free and colorful, no matter where             you take it.",
      "You can use our double wall vacuum insulated water bottle in any circumstance, both for going to             the office as well as for any other common plans like hiking, go camping or making any sport.             Keep hydrated all day long! Whether you're on the road or in the office, there's a BJPKPK bottle             just for you."
    ],
    "bestReviews": [
      {
        "title": "Perfect Stanley Alternative: BJPKPK's Insulated Wonder Bottle Will Steal Your Heart",
        "rating": "5.0 out of 5 stars",
        "content": "Forget the hype, ditch the bulky beast – the BJPKPK Stainless Steel Insulated Water Bottle (25oz) is the real MVP of hydration heroes. While everyone's clinging to their Stanleys, this hidden gem takes the crown for keeping beverages ice-cold longer and piping hot for hours longer than your Stanley. Seriously, I'm talking frosty lemonade at sunset and toasty tea well into the afternoon.But it's not just about temperature. This little wonder is a champion of convenience too. Picture-perfect fit in any 3-inch car cupholder—no more awkward wedging or precarious balancing acts. Plus, the leakproof lid and durable stainless steel construction mean you can toss it in your bag without worry. Say goodbye to soggy backpacks and hello to peace of mind.And did I mention the gorgeous colors and sleek design? This bottle isn't just functional, it's eye-catching too. Ditch the boring metal cylinders and rock a vibrant pop of personality with every sip.Sure, you could follow the crowd and join the Stanley club, but why settle for good when you can have exceptional? The BJPKPK Kids Stainless Steel Insulated Water Bottle is a game-changer, a hydration hero, and an all-around awesome companion for any adventure. I love it so much, I'd buy another in a heartbeat (though with this quality, why would I need to?)Here's the lowdown:Temperature Titan: Keeps drinks ice-cold for 24 hours and piping hot for 12 hours.Cupholder Champion: Fits snugly in any 3-inch car cupholder.Leakproof Legend: No more spills, just pure hydration bliss.Durable Defender: Built to last, adventure after adventure.Style Star: Available in a range of eye-catching colors to match your personality.So, ditch the hype and grab a BJPKPK. Your taste buds (and your car cupholder) will thank you.P.S. If you're looking for a gift that's both practical and awesome, look no further! This bottle is a guaranteed crowd-pleaser for kids and adults alike."
      },
      {
        "title": "Keeping Hydration Cool and Stylish",
        "rating": "5.0 out of 5 stars",
        "content": "I recently purchased the BJPKPK Insulated Water Bottle in Sakura Pink for my niece, and it has proven to be a delightful addition to her daily routine. This stainless steel water bottle not only keeps her beverages at the perfect temperature but also offers a chic design that she adores. I'm thrilled to provide a five-star review for this fantastic gift.Impressive Temperature Retention:One of the standout features of this water bottle is its remarkable ability to keep beverages cold for 24 hours and hot for 12 hours. Whether she's enjoying a refreshing cold drink or a hot beverage during the school day, this bottle ensures that it stays at the ideal temperature.Stainless Steel Durability:The stainless steel construction is not only durable but also adds to the aesthetic appeal of the bottle. It can withstand daily use and the occasional bump or drop.Chic Sakura Pink Design:The Sakura Pink color and design are both stylish and age-appropriate for my niece. She loves showing off her water bottle at school, making it a fashionable accessory as well as a practical one.Perfect Size:The 17oz/500ml size is just right for her daily hydration needs. It's not too bulky, making it easy to carry in her school bag, while still holding enough water to keep her refreshed throughout the day.BPA-Free and Safe:The fact that this bottle is BPA-free provides peace of mind. It ensures that she's staying hydrated with a safe and non-toxic container.Easy to Clean:The design of the bottle makes it easy to clean, and it's dishwasher safe, which simplifies the cleaning process for both her and her parents.In conclusion, the BJPKPK Insulated Water Bottle is a five-star gift that combines functionality and style. Its impressive temperature retention capabilities, chic Sakura Pink design, and stainless steel durability make it a perfect choice for my niece. It's a wonderful accessory for her school days, ensuring she stays hydrated and fashionable. Whether as a gift or for personal use, this water bottle is a fantastic choice for anyone seeking a stylish and practical hydration solution. My niece absolutely loves it, and I wholeheartedly recommend it to others."
      },
      {
        "title": "Works great!",
        "rating": "5.0 out of 5 stars",
        "content": "It's a quality item for a great price; kept my drinks hot. I chose the 25 oz. size, but found the finish too slippery to hold, and it was a little difficult to hold onto due to the larger circumference. It felt a little heavy for me to hold as well. Not saying anyone else will have these same issues, but it was my experience. It's a great product, but I think this one is a little bit too big for me. I'll keep it for a backup. Seal works great and doesn't leak. I'm giving it 5 stars as it works great, I just had some difficulty using it that doesn't affect the rating."
      },
      {
        "title": "Bottle mouth is too small for most average sized ice cubes.",
        "rating": "4.0 out of 5 stars",
        "content": "I received my order two days ago, and I am happy with it. The bottle has a sleek design that fits my hand much better than most of the others I’ve owned. I was disappointed by the size of the bottle opening. It is about an inch and a half wide and I will have to buy a smaller bottle brush to clean it properly. I also couldn't get my smaller ice cubes to fit the narrow opening, so I crushed some ice in the blender. The great news is that the ice stayed frozen for at least ten hours. Today, I didn't feel like chopping ice, so I added some very cold water from my fridge to the bottle, and 6 hours later,  it was still cold. If it's possible to redesign this with a wider mouth, it would be perfect for me. However, if you have a crushed ice option on your fridge or an icemaker with small pellet ice, you should have no problems loading it with ice and enjoying a very cold beverage for several hours. Though, so far, the water in the bottle is still cold, even without any ice. I wrote this review so anyone who must have a wide-mouth bottle understands this particular style may not fit your needs. However, if the narrow opening isn't a deal breaker, this is quite a good bottle that delivers on the promise to keep beverages cold for a reasonable price."
      },
      {
        "title": "Great water bottle",
        "rating": "5.0 out of 5 stars",
        "content": "I like to take it to the bowling ally. I wish the opening was about a half inch wider , so You could put ice from the refrigerator,  the mouth is too small. Keeps your drinks cold for about 14 to 20 hours with ice. Plenty of colors to choose from."
      },
      {
        "title": "Simple but great",
        "rating": "5.0 out of 5 stars",
        "content": "This is a great water bottle that doesn't leak. I bought it as a gift and it holds well, keeps liquids cold and is durable."
      },
      {
        "title": "Sleek and attractive",
        "rating": "5.0 out of 5 stars",
        "content": "Good size, easy to hold, fits in cup holder and will probably keep water pretty cold."
      },
      {
        "title": "I like it, but...",
        "rating": "3.0 out of 5 stars",
        "content": "It has a powder coating instead of a stainless-steel look.  The mouthpiece is not smooth, providing a soft spot to prevent hurting teeth or lips.  I have a very nice stainless steel bottle that is similar that I bought for $3 at Ross that has the features mentioned.  It is not insulated though.  I will see how well my water stays cold with the one I just purchased.  It's ok for the price, but I would pay a few dollars more for the features mentioned above."
      },
      {
        "title": "Keeps it cold",
        "rating": "4.0 out of 5 stars",
        "content": "Not exactly fits 16.9 oz .. maybe 16oz.... 16.9oz maybe if filled to top. 16.9oz bottled water dint fit with the cap on. But have to sip a lil bit so the top fits without spillin. It does stay nice n cold on side pocket of my backpack. For those times u only need a lil cold hydration.  Dont work for them hot days u need more, gots the 25oz for that!!"
      },
      {
        "title": "Nice shape and color",
        "rating": "5.0 out of 5 stars",
        "content": "The bottle has a nice deep blue color and the shape is easy to hold in one's hand. It can hold 500 ml of liquid but it is longer and thinner than normal plastic bottles of the same volume. I use it nearly every day. It is easy to clean and will not leak if filled just below the neck. I have only used it for cold liquids and haven't tried hot ones."
      }
    ],
    "table": [
      [
        "Brand",
        "BJPKPK"
      ],
      [
        "Capacity",
        "17 Fluid Ounces"
      ],
      [
        "Color",
        "A-Mint"
      ],
      [
        "Recommended Uses For Product",
        "Water, Soup, Travelling, Tea, Coffee"
      ],
      [
        "Special Feature",
        "Sweat Resistant, Leak Proof, Double Wall Vaccum Insulation"
      ],
      [
        "Age Range (Description)",
        "Adult"
      ],
      [
        "Product Dimensions",
        "2.7\"W x 10.7\"H"
      ],
      [
        "Model Name",
        "KeleCG11"
      ],
      [
        "Item Weight",
        "10.88 ounces"
      ],
      [
        "Theme",
        "Holiday"
      ],
      [
        "Material",
        "Stainless Steel, Metal"
      ],
      [
        "Number of Items",
        "1"
      ],
      [
        "Included Components",
        "Insulated Water Bottle;Sticker"
      ],
      [
        "Product Care Instructions",
        "Hand Wash Only"
      ],
      [
        "Cap Type",
        "Screw Cap"
      ],
      [
        "With Lid",
        "Yes"
      ],
      [
        "Is Bpa Free",
        "Yes"
      ],
      [
        "Lid Tightness",
        "leakproof"
      ],
      [
        "Item Weight",
        "10.9 ounces"
      ],
      [
        "Manufacturer",
        "BJPKPK"
      ],
      [
        "ASIN",
        "B096RVQWKX"
      ],
      [
        "Country of Origin",
        "China"
      ],
      [
        "Item model number",
        "KeleCG11"
      ],
      [
        "Customer Reviews",
        ""
      ],
      [
        "Best Sellers Rank",
        ""
      ],
      [
        "Date First Available",
        "June 7, 2021"
      ]
    ],
    "productSmallImage": "./gen-img/639-small.webp"
  }, '', '', 1, [0, 0])