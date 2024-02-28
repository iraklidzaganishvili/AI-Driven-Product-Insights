// Import the Showdown converter
const Showdown = require('showdown');
const { JSDOM } = require("jsdom");
const fs = require('fs');

// Create a new converter instance
const converter = new Showdown.Converter();

// Your GPT-generated markdown text
const markdownText = `# ASUS TUF Gaming F15 (2023) Gaming Laptop: The Ultimate Gaming Experience\n\n![ASUS TUF Gaming F15](https://m.media-amazon.com/images/I/71NqbSDPAYL._AC_UY218_.jpg)\n\nAre you ready to take your gaming experience to the next level? Look no further than the ASUS TUF Gaming F15 (2023) Gaming Laptop. With its powerful hardware, stunning display, and rugged durability, this laptop is designed to meet the demands of even the most intense gaming sessions. Let's dive into the key features and benefits of this exceptional gaming laptop.\n\n## Introduction\n\nThe ASUS TUF Gaming F15 (2023) Gaming Laptop is a powerhouse that combines cutting-edge technology with rugged durability. Powered by an Intel Core i5-13500H CPU and NVIDIA GeForce RTX 4050 Laptop GPU at 140W Max TGP, this laptop delivers exceptional performance and stunning visuals. Whether you're playing the latest AAA titles or diving into virtual reality, the ASUS TUF Gaming F15 has got you covered.\n\n## Key Features\n\n### 1. Windows 11 and Powerful Hardware\n\nThe ASUS TUF Gaming F15 comes pre-installed with Windows 11, the latest operating system from Microsoft. With its sleek design and improved performance, Windows 11 provides a seamless gaming experience. Combined with the Intel Core i5-13500H CPU and NVIDIA GeForce RTX 4050 Laptop GPU, this laptop delivers smooth gameplay and realistic graphics.\n\n### 2. Swift Memory and Storage\n\nMultitasking is a breeze with 16GB of DDR4-3200MHz memory. Switch between applications and tasks without any lag or slowdown. Additionally, the 512GB PCIe 4x4 SSD ensures fast loading times, allowing you to jump into your favorite games in no time.\n\n### 3. Never Miss a Moment with FHD 144Hz Display\n\nThe ASUS TUF Gaming F15 features a fast FHD 144Hz display with 100% sRGB color. This high refresh rate display ensures smooth and lifelike gameplay, reducing lag, stuttering, and visual tearing. Immerse yourself in the action and never miss a moment.\n\n### 4. Advanced Cooling System\n\nTo keep up with the high-power CPU, the ASUS TUF Gaming F15 is equipped with a pair of 84-blade Arc Flow Fans. These fans improve cooling performance without adding extra noise, ensuring that your laptop stays cool even during intense gaming sessions.\n\n### 5. MUX Switch with Advanced Optimus\n\nThe MUX Switch technology increases laptop gaming performance by 5-10% by routing frames directly from the dedicated GPU to the display, bypassing the integrated GPU. With Advanced Optimus, the switch between the integrated GPU and dedicated GPU becomes automatic, optimizing battery life and performance based on the task at hand.\n\n### 6. Military-Grade Toughness\n\nThe ASUS TUF Gaming F15 has earned its name by successfully passing a battery of MIL-STD-810H tests. These tests include exposure to drops, vibration, humidity, and extreme temperatures, ensuring that this laptop can withstand the rigors of everyday use and gaming on the go.\n\n### 7. Xbox Game Pass Ultimate\n\nWith the ASUS TUF Gaming F15, you'll receive a free 90-day pass to Xbox Game Pass Ultimate. Gain access to over 100 high-quality games, with new games added regularly. Whether you're into action, adventure, or multiplayer games, there's always something new to play.\n\n## Amazon Product Reviews Insights\n\nWhile there are no specific reviews available for the ASUS TUF Gaming F15 (2023) Gaming Laptop at the moment, it's important to note that ASUS is a reputable brand known for producing high-quality gaming laptops. Customers have praised ASUS laptops for their performance, durability, and value for money. With the ASUS TUF Gaming F15, you can expect nothing less.\n\n## Conclusion\n\nThe ASUS TUF Gaming F15 (2023) Gaming Laptop is the ultimate gaming machine. With its powerful hardware, stunning display, and rugged durability, this laptop is designed to take your gaming experience to new heights. Whether you're a casual gamer or a hardcore enthusiast, the ASUS TUF Gaming F15 has the performance and features to meet your needs. Don't miss out on this exceptional gaming laptop. Upgrade your gaming setup today!\n\n[Check out the ASUS TUF Gaming F15 on Amazon](https://www.amazon.com/sspa/click?ie=UTF8&spc=MTo3NjExMTk4NDIxNzMyMDU4OjE3MDkxMDU4NDY6c3BfYXRmOjMwMDAzODU1Njc5ODAwMjo6MDo6&url=%2FASUS-Display-GeForce-i5-13500H-FX507VU-ES53%2Fdp%2FB0C4Q977TD%2Fref%3Dsr_1_2%3Fdib%3DeyJ2IjoiMSJ9.fsifhmNOzmLvaM4N31k67MzqvhdzCtPuD_pE23XH3P0YG563Onz1wjLaswM_xO-sMdqxr25WPtU3cn0_3h0IUljYLgUiQ9bXhopldpRnzW276jyWEOfzfKmczs1y_CzKbqp-LHY-Twt0XjxNCVfZPE7ExGEelGwNsRri4cB0v2Sf1K3wyCbR2O4aNlopmsCWHiUQ_J91q9qbO5Nev2-rX5aEPr9xXzxUq_MZOQv4Ryw.XrLRQ1F39qeQ6N_b4f8KLsiVnzzAjknAT3FmN4i1B-0%26dib_tag%3Dse%26keywords%3Dgaming%2Blaptop%26qid%3D1709105846%26sr%3D8-2-spons%26sp_csd%3Dd2lkZ2V0TmFtZT1zcF9hdGY%26psc%3D1) and elevate your gaming experience today!`
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

    const aTags = document.querySelectorAll('a');

    aTags.forEach(a => {
        const parentP = a.parentNode;
        if (parentP.tagName === 'P') {
            a.className = "btn btn-primary link2amazon"
            const div = document.createElement('div'); // Create a new div
            div.innerHTML = parentP.innerHTML; // Copy the innerHTML from the p to the div
            parentP.parentNode.replaceChild(div, parentP); // Replace the p with the div
        }
    });

    // ---------
    // const section = document.createElement('section');
    // section.id = "article";
    // // Append all body's child nodes to the section
    // while (document.body.firstChild) {
    //     section.appendChild(document.body.firstChild); // This moves the node
    // }

    // // Append the section back to the body
    // document.body.appendChild(section);
    // ------

    let outputHTML = document.body.innerHTML;

    // Regular expression to remove extra line breaks after </ul> tags
    // outputHTML = outputHTML.replace(/<\/ul>\s*\n\s*\n/g, '</ul>\n');
    outputHTML = outputHTML.replace(/<\/div>\s*\n\s*\n/g, '</div>\n');

    return outputHTML;
}

// Example HTML input

// Transform the HTML
const modifiedHtml = addListsToHTML(htmlText);
// console.log(modifiedHtml);

// ---------- insert in to the actual file ----------

// Load your HTML content
const mainHtmlContent = fs.readFileSync('blueprint.html', 'utf8');
const mainDom = new JSDOM(mainHtmlContent);
const mainDocument = mainDom.window.document;

// Find the section with the ID 'article'
const articleSection = mainDocument.querySelector('#article');
articleSection.innerHTML += modifiedHtml;
const updatedHTML = mainDom.serialize();
fs.writeFileSync('HTMLFullSave.html', updatedHTML, 'utf8');