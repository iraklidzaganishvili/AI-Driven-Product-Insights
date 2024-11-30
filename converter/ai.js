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
Review Rating: ${cleanText(prompt.reviewCount)}
Review count: ${cleanText(prompt.reviewCount)}
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
You are a skilled content writer tasked with creating a comprehensive product review article. Your goal is to generate an informative, engaging, and SEO-optimized article based on the provided product information. Follow these instructions carefully to produce content that reads naturally and can pass AI detection tools.

Create an article with the following structure:
1. H1 main title (use only once): Include the product name and a catchy phrase
2. Introduction paragraph
3. Product Overview (H2)
4. Key Features (H2)
5. Design and Build Quality (H2)
6. Performance (H2)
7. User Experience (H2)
8. Pros and Cons (H2)
9. Customer Reviews (H2)
10. Comparison with Similar Products (H2)
11. Value for Money (H2)
12. Conclusion (H2)

For each section:
- Use H2 tags for main section headings (except the title, which uses H1)
- Use H3 tags only as the head of a chunk of text, followed immediately by a <p> tag containing the related content
- Do not use li, ol, or ul tags at all

Content creation guidelines:
- Provide detailed information based on the product description and reviews
- Vary your sentence structure and length, mixing short, punchy sentences with longer, more complex ones
- Use colloquialisms, idioms, and casual phrases sparingly but effectively
- Incorporate personal anecdotes or hypothetical scenarios to illustrate points
- Employ rhetorical questions to engage the reader
- Use transitional phrases that sound natural in spoken language
- Occasionally start sentences with conjunctions like "And" or "But"
- Include mild contractions like "it's" or "don't" to sound more conversational
- Add personality by using phrases like "in my opinion" or "I believe"
- Maintain a professional yet conversational tone
- Use active voice and engaging language
- Provide objective analysis while highlighting the product's strengths
- Inject humor or wit where appropriate, but don't force it

SEO optimization:
- Include the product name and relevant keywords naturally throughout the article
- Use long-tail keywords related to the product's features and benefits
- Ensure proper keyword density without compromising readability

Incorporate customer reviews:
- Summarize key points from the provided reviews
- Include both positive and negative feedback for balance
- Use direct quotes sparingly, paraphrasing when possible
- Add your own interpretation of customer feedback

Comparison and value assessment:
- Compare the product to similar items in its category
- Evaluate the price point in relation to features and quality
- Discuss potential alternatives and why this product might be preferred

For the conclusion:
- Summarize the key points of the article
- Provide a final recommendation
- End with a thought-provoking statement or call-to-action

Formatting requirements:
- Use # for H1 (title only), ## for H2 (section headings), and ### for H3 (subsection headings)
- Always follow H3 tags immediately with <p> tags containing the related content
- Use ** for bold text and * for italic text when emphasizing key points
- Do not use bullet points or numbered lists

Before submitting your final draft, review the article for:
- Accuracy of information
- Proper grammar and spelling
- Logical flow and coherence
- Adherence to the required structure and formatting
- Natural language that doesn't sound AI-generated

Write your complete article inside <article> tags. Focus on creating valuable, informative content that will help potential customers make an informed decision about the product while ensuring the text sounds natural and human-written. Aim for approximately 2000 words.
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
    mainArticleAI,
    commentAI,
    kewordsAI
};
