const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: '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',
});


async function mainArticleAI(prompt) {
    try {
        const promptString = `Product information:
Product Name: ${cleanText(prompt.title)}
${prompt.brand ? `Product Brand: ${cleanText(prompt.brand)}` : ''}
Product Price: ${cleanText(prompt.fullPrice)}
Product Description: ${cleanText(prompt.fromTheManufacturer.join(' '))}
Review Rating And Count: ${cleanText(prompt.reviewRatingAndCount.join(' '))}
Amazon Product Reviews:
${prompt.bestReviews.map((review, index) => `Review ${index + 1}: ${cleanText(review.title)}
    Rating: ${cleanText(review.rating)}
    Content: "${cleanText(review.content)}"`).join('\n')}

Article word count should be at least 1500 words but we need to try to output 2000 words. `;

        function cleanText(text) {
            return text.replace(/\s+/g, ' ') // Replace multiple spaces with a single space
                .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with a single newline
                .trim(); // Remove leading and trailing whitespace
        }

        // console.log(promptString)


        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k-0613",
            messages: [
                {
                    "role": "system",
                    "content": `
                        Act as a world-class copywriter, generate a 2000 word article in proper US English without any grammatical or punctuation mistakes that is SEO-optimized and based on the following prompt and product information: Remember 2000 word count is important.

                        The article should be engaging and informative, tailored to potential customers. Ensure the content is unique and structured with SEO best practices in mind, including keyword optimization related to the product and its features. Incorporate the following elements: - Robert Cialdini's Principles of Persuasion: Apply these principles (Reciprocity, Scarcity, Authority, Consistency, Liking, and Consensus) strategically throughout the content to enhance its persuasive impact, but do not mention Robert Cialdini. 
                        
                        Readability and Structure: The article should be easy to read, with a clear introduction, body, and conclusion. Use H1 for the main title, H2 for major headings, and H3 for list headings. Implement all elements with markdown. Making everything markdown is very important and should not be missed. NEVER write anything but markdown. Ensure paragraphs are concise. Provide useful Information for the Reader: Highlight the benefits, features, and practical applications of the product. Address common questions or concerns raised in the Amazon product reviews. - Call to Action: Conclude with a compelling call to action that encourages the reader to consider purchasing or learning more about the product. The objective is to create content that not only ranks well on search engines but also provides real value to readers, encouraging engagement and potential conversion. 
                        
                        Do not forget, You are writing a ready to ship article. Do not include keynotes or anything for the writer. No matter what, do not copy paste reviews, use them as information to enhance the article. Do not title the last paragraph "call to action", it should have a proper name fit for a conclusion. Remember to write the paragraph in markdown. NEVER try to include any images. Do NOT use any links in the article. The article word count should be at least 1500 words but we need to try to output 2000 words. DO NOT OUTPUT LESS THAN 1500 WORDS. DO NOT DIRELY USE REVIEWS, USE THE INFORMATION IN THEM TO MAKE YOUR OWN PARAGRAPHS. Try your best to match the maximum token length. A small article is not needed. You need to generate the biggest article you can without directly using comments. Do not write anything but the article itself. DO NOT INCLUDE ANY AI WARNINGS OR A WORD COUNT.
                        `
                },
                {
                    "role": "user",
                    "content": promptString
                }
            ],
            temperature: 1,
            max_tokens: 12000,
            top_p: 0.4,
            frequency_penalty: 1,
            presence_penalty: 1,
        });
        function removeLinks(markdownString) {
            const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
            return markdownString.replace(linkRegex, '$1').replace(/H\d+:(\s*)/g, '$1');
        }
        let RawAiResault = removeLinks(response.choices[0].message.content)
        allArticles.push(RawAiResault)
        console.log('doneai')
        return RawAiResault
    } catch (err) {
        console.error(err);
    }
}

async function commentAI(prompt) {
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k-0613",
        messages: [
            {
                "role": "system",
                "content": "Given comment rephrase the comment. The answer needs to only have the name of the rephrased comment and your rephrased comment in that order in the same format that it was provided. I has to be in the same format as it was provided so {\"title\": \"your output\", \"content\": \"your output\"}"
            },
            {
                "role": "user",
                "content": JSON.stringify(prompt, null, 4).replace(/[\n\r]/g, '').replace(/"([^"]+)":/g, '$1:')
            }
        ],
        temperature: 1,
        max_tokens: 6000,
        top_p: 0.4,
        frequency_penalty: 1,
        presence_penalty: 1,
    });
    let newComment = JSON.parse(response.choices[0].message.content)
    if (newComment.title) {
        newComment.rating = prompt.rating
        return newComment
    }
}

async function kewordsAI(input) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: [
                {
                    "role": "system",
                    "content": `
                    Objective: Your task is to analyze the input, which will be a product name including the brand and the item type, and generate a list of SEO-optimized meta keywords. These keywords should be carefully selected to improve the product's search engine visibility, considering relevance, search volume, and specificity.

Input Description: The input is a string containing the brand name and the product type, formatted as "Brand Name - Product Type" (e.g., "AcmeCorp - Wireless Headphones").

Output Requirements:
Format: Output a comma-separated list of keywords. There should be no leading or trailing spaces, and no additional text or punctuation beyond the commas.

Content:
Start with the brand name and product type as primary keywords.
Include long-tail keywords, which are more specific phrases that potential customers might use when searching for this type of product. These often have lower search volume but can be less competitive and more targeted.
Add keywords that reflect product features, benefits, and applications, focusing on terms with a good balance between search volume and relevance to the product.
Consider related search terms that potential customers might use, which are indirectly related to the product but could lead to its discovery.
SEO Optimization Techniques:

Ensure the keywords are relevant to the product’s features and potential uses.
Incorporate a mix of broad and specific keywords to balance visibility and targeting.
Utilize semantic variations of the main keywords to cover possible search intents and synonyms.
Avoid keyword stuffing; ensure the keywords are natural and directly related to the product.
Examples:

Input: "AcmeCorp - Wireless Headphones"

Output: "AcmeCorp, wireless headphones, Bluetooth headphones, noise-cancelling audio, high fidelity sound, portable audio devices, best wireless headphones for travel"

Input: "GigaTech - Smartwatch"

Output: "GigaTech, smartwatch, fitness tracking watch, waterproof smart devices, heart rate monitor wearable, smart notifications wristwatch, best smartwatch for athletes"

Constraints:
Limit the output to a maximum of 50 keywords to maintain focus and relevance.
Ensure the keywords are realistic and reflect actual search behaviors and patterns.
Special Considerations:

Research commonly searched terms related to the product type to inform your keyword selection.
For niche products, prioritize keywords that accurately describe the product’s unique features or target market to attract more qualified traffic.
                    `
                },
                {
                    "role": "user",
                    "content": input
                }
            ],
            temperature: 1,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });
        let RawAiResault = response.choices[0].message.content
        RawAiResault = RawAiResault.replace(/\.$/, '')
        return RawAiResault
    } catch (err) {
        console.error(err);
    }

}

async function fakeAI(prompt) {
    RawAiResault = `Here's the comprehensive product review article as requested:

<article>

# STANLEY IceFlow Tumbler: Your Ultimate Hydration Companion

The STANLEY IceFlow Stainless Steel Tumbler is revolutionizing the way we stay hydrated on the go. With its innovative design, superior insulation, and versatile features, this tumbler is quickly becoming a must-have for anyone who values both style and functionality in their daily hydration routine.

## Product Overview

The STANLEY IceFlow Tumbler is a 30 oz vacuum-insulated stainless steel container designed to keep your beverages at the perfect temperature for hours. Whether you're sipping on ice-cold water during a scorching summer day or enjoying a hot coffee on your morning commute, this tumbler has got you covered. Its leak-resistant flip straw and ergonomic handle make it ideal for use at home, in the office, or while traveling.

## Key Features

### Impressive Temperature Retention

- Double-wall vacuum insulation keeps drinks cold for up to 12 hours
- Maintains ice for an impressive 2 days
- Suitable for both hot and cold beverages

### Innovative Straw Design

- Exclusive IceFlow flip straw for effortless sipping
- Leak-resistant when closed
- Eliminates the need for disposable straws

### Durable Construction

- Made from 18/8 stainless steel
- BPA-free materials
- Built to withstand daily use and accidental drops

### Convenient Design

- Ergonomic, rotating handle for easy carrying
- Fits in most car cup holders and exercise machine holders
- Dishwasher safe for easy cleaning

### Eco-Friendly

- Made from recycled fishing nets, contributing to ocean conservation
- Reusable design reduces reliance on single-use plastics

## Design and Build Quality

The STANLEY IceFlow Tumbler boasts a sleek and modern design that appeals to a wide range of users. Its stainless steel body not only adds a touch of sophistication but also ensures durability for long-term use. The tumbler comes in various colors, including retro-inspired options and a stylish rose gold finish, allowing users to express their personal style.

### Handle and Lid

The ergonomic top handle is a standout feature, offering superior portability compared to traditional side-handled tumblers. The lid is well-constructed and includes the innovative flip straw mechanism, which can be easily closed when not in use.

### Size and Portability

At 30 oz, this tumbler strikes a perfect balance between capacity and portability. It's large enough to keep you hydrated throughout the day but still compact enough to fit comfortably in most cup holders and bags.

## Performance

The STANLEY IceFlow Tumbler lives up to its promises when it comes to temperature retention. Users consistently report that their beverages stay cold for extended periods, with ice remaining intact for up to two days. This impressive insulation performance makes it ideal for long workdays, outdoor activities, or extended travel.

### Leak Resistance

While the majority of users praise the tumbler's leak-resistant design, some have reported minor leakage issues. However, when the flip straw is properly closed, the tumbler generally performs well in preventing spills and leaks.

## User Experience

The STANLEY IceFlow Tumbler has garnered overwhelmingly positive feedback from users across various lifestyles and needs.

### Ease of Use

- The flip straw allows for convenient, one-handed operation
- The collapsible straw design is praised for its sanitary benefits
- Easy to clean, with most parts being dishwasher safe

### Versatility

Users appreciate the tumbler's versatility, using it for everything from water and smoothies to coffee and tea. Its ability to maintain temperature makes it suitable for both hot summer days and chilly winter mornings.

### Durability

Many users report that the tumbler holds up well to daily use and occasional drops, living up to STANLEY's reputation for durability.

## Pros and Cons

### Pros:

- Excellent temperature retention for both hot and cold beverages
- Durable stainless steel construction
- Convenient flip straw design
- Eco-friendly materials and reusable concept
- Stylish appearance with various color options
- Fits most cup holders
- Dishwasher safe

### Cons:

- Some users report minor leakage issues
- Relatively heavy when full due to its size and construction
- Premium price point compared to basic tumblers

## Customer Reviews

The STANLEY IceFlow Tumbler has received overwhelmingly positive reviews, with an average rating of 4.6 out of 5 stars based on over 29,000 global ratings.

### Positive Feedback:

- Many users praise the tumbler's ability to keep drinks cold for extended periods
- The flip straw design is frequently mentioned as a favorite feature
- Customers appreciate the stylish appearance and color options
- The durability and build quality receive consistent praise

### Critical Feedback:

- Some users have experienced leakage issues, particularly when the tumbler is not upright
- A few customers noted that the tumbler arrived with minor scratches or imperfections

## Comparison with Similar Products

When compared to other insulated tumblers on the market, the STANLEY IceFlow stands out in several ways:

- Superior insulation performance, particularly for maintaining ice
- Innovative flip straw design not commonly found in competitors
- Eco-friendly materials and construction
- STANLEY's reputation for durability and lifetime warranty

While there are cheaper alternatives available, the STANLEY IceFlow justifies its premium price through its combination of performance, design, and brand reliability.

## Value for Money

At $35.00, the STANLEY IceFlow Tumbler is positioned in the premium range of insulated tumblers. However, considering its features, performance, and durability, many users find it to be a worthwhile investment. The lifetime warranty provided by STANLEY adds significant value, ensuring that this tumbler can truly be a long-term hydration solution.

### Long-term Benefits:

- Reduced need for single-use plastics
- Potential savings on bottled beverages
- Durability that outlasts cheaper alternatives

## Conclusion

The STANLEY IceFlow Stainless Steel Tumbler emerges as a top-tier choice for those seeking a reliable, stylish, and eco-friendly hydration solution. Its impressive insulation capabilities, innovative design features, and robust construction make it stand out in a crowded market of insulated tumblers.

While it comes with a premium price tag, the combination of performance, durability, and STANLEY's lifetime warranty justifies the investment for many users. The minor issues reported by some customers, such as occasional leakage, are outweighed by the overwhelmingly positive experiences of most users.

Whether you're a busy professional, an outdoor enthusiast, or simply someone who values keeping their beverages at the perfect temperature, the STANLEY IceFlow Tumbler is likely to exceed your expectations. Its versatility makes it suitable for a wide range of beverages and situations, from office use to outdoor adventures.

In conclusion, if you're in the market for a high-quality insulated tumbler that combines style, functionality, and eco-consciousness, the STANLEY IceFlow Stainless Steel Tumbler is definitely worth considering. It's not just a tumbler; it's a long-term companion for your hydration needs.

</article>`
    await new Promise(resolve => setTimeout(resolve, 20 * 1000));
    return RawAiResault
}

module.exports = {
    mainArticleAI: fakeAI,
    commentAI,
    kewordsAI
};
