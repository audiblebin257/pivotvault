/**
 * Documentary-style narrative data for PivotVault startups.
 * Each entry reads like "Harvard Business Review meets Netflix documentary".
 */

export const documentaryData = {
  juicero: {
    heroSummary: {
      dream: "To become the 'Apple of organic juice'—bringing the convenience of a Keurig combined with the status of an iPhone into every kitchen in America.",
      thesis: "Investors saw a massive wellness wave, a highly lucrative recurring subscription model ('razor-and-blades'), and a founder who could command Silicon Valley's absolute devotion.",
      excitement: "With a Wi-Fi-enabled device that could press raw organic fruits and vegetables with four tons of force, Juicero promised fresh-pressed juice with zero cleanup, zero hassle, and infinite elite status."
    },
    story: `In 2016, investors believed Juicero had everything required to dominate the consumer wellness market. The company was founded by Doug Evans, a charismatic raw-food evangelist who spoke of juice with the spiritual fervor of a prophet. Evans didn't just want to sell a kitchen appliance; he wanted to orchestrate a wellness revolution. He spent three years in stealth mode, hiring top-tier designers and engineers to build a device of unprecedented complexity.

The result was the Juicero Press: a beautiful, pearl-white monolith that sat on countertops like a piece of modern art. It was designed to press proprietary, pre-packaged bags of diced organic produce. The press was Wi-Fi connected, possessed a built-in QR code scanner to verify the freshness of the bags, and could exert 8,000 pounds of force—enough to lift two Teslas. Silicon Valley's elite were mesmerized. The company raised $120 million from tech royalty, including Google Ventures and Kleiner Perkins.

But the seed of its destruction was already planted in the product's extreme over-engineering. To justify a $699 price tag, the company had built a machine with hundreds of custom parts, a custom gearbox, and a military-grade aluminum press. Yet, the core value proposition remained fragile: it was a closed ecosystem. Customers had to buy the expensive machine just to be allowed to buy the juice packs. 

The illusion shattered in April 2017. A Bloomberg investigative video demonstrated a devastating truth: a human being could squeeze the Juicero packs by hand, in less time, and get almost the exact same amount of juice. The high-tech, Wi-Fi connected, 8,000-pound-force press was entirely redundant. The viral video turned Juicero from a tech darling into a global laughingstock, symbolizing the absolute peak of Silicon Valley excess and delusion.`,
    timeline: [
      { stage: "founding", dateStr: "2013", title: "The Prophet of Raw Food", description: "Doug Evans founds Juicero in San Francisco, pitching a vision of cold-pressed juice on demand with zero cleanup." },
      { stage: "funding", dateStr: "2015", title: "The $120M War Chest", description: "Kleiner Perkins, Google Ventures, and Campbell Soup pour $120M into the company, validating the 'Keurig for juice' thesis." },
      { stage: "growth", dateStr: "2016", title: "The Monolith Launches", description: "The Juicero Press launches at a staggering $699. Tech elites and luxury retailers scramble to adopt it." },
      { stage: "major_decisions", dateStr: "Late 2016", title: "The Price Cut & CEO Pivot", description: "Amid sluggish sales, the price is cut to $399, and former Coca-Cola executive Jeff Dunn is brought in as CEO to scale operations." },
      { stage: "warning_signs", dateStr: "Early 2017", title: "The Silent Squeeze", description: "Internal engineers and early users realize that the proprietary bags can easily be squeezed by hand, bypassing the machine entirely." },
      { stage: "collapse", dateStr: "April 2017", title: "The Bloomberg Exposure", description: "Bloomberg publishes a viral video showing two reporters squeezing the bags by hand. The company's value proposition vaporizes overnight." },
      { stage: "aftermath", dateStr: "September 2017", title: "The Dissolution", description: "Juicero suspends operations, offers full refunds to all press owners, and liquidates its multi-million dollar manufacturing assets." }
    ],
    failureInvestigation: {
      rootCause: "A total lack of product-market validation. The core technology (the Press) did not add any unique value that could not be replicated by a user's bare hands.",
      hiddenCause: "A classic case of 'founder capture.' Investors were so enamored by Doug Evans' charisma and the success of Keurig that they failed to perform basic physical due diligence on the product's necessity.",
      missedSignals: "Low repeat purchase rates for the juice packs among early adopters indicated that the subscription model was failing long before the Bloomberg video aired.",
      leadershipDecisions: "Choosing to build an incredibly complex hardware product in-house rather than outsourcing, which led to massive capital expenditure and a high retail price that alienated the mass market.",
      marketMistakes: "Targeting the mainstream consumer with a luxury-priced, closed-loop appliance during a time when consumers were increasingly skeptical of unnecessary 'smart' home gadgets.",
      financialProblems: "Burning through $120 million on custom manufacturing lines and inventory before proving that consumers would actually buy the recurring juice packets at scale.",
      executionMistakes: "Failing to protect the proprietary bag design or anticipate that the physical bags could be easily manipulated without the machine's QR code validation."
    },
    lessons: [
      { title: "The Hand-Squeeze Test", insight: "If a user can bypass your entire high-tech hardware stack with their bare hands in 10 seconds, you do not have a hardware product; you have a packaging problem." },
      { title: "Beware of the Keurig Mirage", insight: "The 'razor-and-blades' model only works if the razor is actually necessary to consume the blade. Never force a hardware lock-in where none is naturally required." },
      { title: "Dethrone the Charismatic Founder", insight: "Do not let a founder's storytelling blind you to basic product utility. Always ask: 'Does this solve a real, painful problem, or is it just a beautiful gadget?'" }
    ],
    similarStartups: [
      { name: "Theranos", slug: "theranos", reason: "Both startups relied on charismatic founders, raised massive capital from non-traditional tech investors, and built highly secretive, over-engineered hardware that ultimately failed to deliver on its core scientific or functional promise." },
      { name: "Pets.com", slug: "pets-com", reason: "Both suffered from broken unit economics where the cost of logistics and physical product delivery far outweighed the margins, attempting to scale a fundamentally unprofitable physical distribution business." }
    ],
    aiInvestigator: {
      overview: "Juicero stands as the definitive case study in Silicon Valley's tendency to over-engineer solutions for non-existent problems. It represents a failure of design thinking, where technology was prioritized over human utility.",
      caseAnalysis: "From a Harvard Business Review perspective, Juicero's primary strategic error was 'technology push' rather than 'market pull.' The company designed a military-grade press capable of generating 8,000 pounds of force to squeeze organic pulp. The engineering team focused on solving the technical challenge of pressing juice, rather than validating whether a press was required at all. By locking the consumer into a closed-loop subscription that required a $700 entry fee, they built a massive barrier to entry. When the Bloomberg video exposed that the hardware was redundant, the brand's credibility was instantly destroyed. It became clear that the company's intellectual property was not in the machine, but in the juice packaging—a business that did not require a hardware division.",
      forensicMetrics: "Analysis of Juicero's financial trajectory shows a catastrophic burn rate of approximately $3 million per month. The company's customer acquisition cost (CAC) was estimated at over $1,200 when accounting for manufacturing subsidies. With a customer lifetime value (LTV) that rapidly decayed due to low pack-subscription retention, the unit economics were mathematically unviable. The company would have needed each customer to remain subscribed to the juice packs for over 4 years just to break even on the hardware subsidy."
    }
  },
  theranos: {
    heroSummary: {
      dream: "To completely democratize healthcare by replacing terrifying needles and expensive laboratories with a tiny, painless finger-prick blood test.",
      thesis: "Investors fell in love with a brilliant Stanford dropout who styled herself as the female Steve Jobs, promising to disrupt a multi-billion dollar healthcare duopoly.",
      excitement: "Theranos claimed its proprietary 'Edison' machine could run over 200 medical tests—from cholesterol to cancer—using just a single drop of blood drawn at local wellness centers."
    },
    story: `In 2014, Elizabeth Holmes was the most celebrated female founder in the world. Dressed in her signature black mock turtlenecks, speaking in an unnaturally deep voice, she graced the covers of Fortune, Forbes, and Inc. Her startup, Theranos, was valued at $9 billion. She had assembled a board of directors that looked like a presidential cabinet, including former Secretaries of State George Shultz and Henry Kissinger. The promise was revolutionary: a cheap, painless blood test that would catch diseases early and save millions of lives.

But behind the locked doors of the Theranos laboratories in Palo Alto, a dark reality was unfolding. The proprietary device, named the 'Edison,' was a mechanical disaster. It regularly failed, threw erratic results, and was physically incapable of performing the hundreds of tests Holmes promised. The laws of microfluidics were stubborn: diluting a single drop of blood to run multiple tests resulted in chemical signals that were too faint to measure accurately.

Rather than admitting the scientific limitations, Holmes and her partner, Sunny Balwani, chose deception. They secretly purchased commercial analyzers from Siemens, modified them, and ran patients' blood on them while claiming the results came from the Edison. To make the tiny blood drops work on commercial machines, they diluted the samples, leading to highly inaccurate and dangerous medical results. Patients were given false positives for prostate cancer, false negatives for HIV, and incorrect dosage recommendations for blood thinners.

The house of cards collapsed in October 2015 when John Carreyrou of the Wall Street Journal published a devastating exposé. Backed by brave internal whistleblowers like Tyler Shultz and Erika Cheung, the article revealed the systematic fraud. Federal regulators descended, partnerships with Walgreens were terminated, and the company was dissolved. Elizabeth Holmes was convicted of multiple counts of wire fraud in 2022 and sentenced to 11 years in federal prison.`,
    timeline: [
      { stage: "founding", dateStr: "2003", title: "The Stanford Dropout", description: "19-year-old Elizabeth Holmes drops out of Stanford University to found Theranos, using her tuition money as seed capital." },
      { stage: "funding", dateStr: "2004-2010", title: "The Stealth Board", description: "Holmes raises over $100M while keeping the technology completely secret, recruiting high-profile political figures to her board." },
      { stage: "growth", dateStr: "2013", title: "The Walgreens Rollout", description: "Theranos launches 'Wellness Centers' inside Walgreens stores, offering finger-prick blood tests directly to the public." },
      { stage: "major_decisions", dateStr: "2014", title: "The $9B Peak", description: "The company raises more capital, valuing the startup at $9B. Holmes is declared the youngest self-made female billionaire." },
      { stage: "warning_signs", dateStr: "Early 2015", title: "The Whispers in the Lab", description: "Whistleblowers Tyler Shultz and Erika Cheung contact regulators and journalists, exposing that the Edison machine is a fraud." },
      { stage: "collapse", dateStr: "October 2015", title: "The WSJ Bombshell", description: "John Carreyrou publishes his front-page exposé in the Wall Street Journal, stripping away the company's veil of secrecy." },
      { stage: "aftermath", dateStr: "2018-2022", title: "Criminal Conviction", description: "Theranos formally dissolves. Holmes and Balwani are indicted, tried, convicted of fraud, and sentenced to federal prison." }
    ],
    failureInvestigation: {
      rootCause: "A fundamental scientific failure masquerading as a software problem. The physics and chemistry of blood dilution made the core product promise impossible.",
      hiddenCause: "A toxic, siloed organizational culture driven by paranoia, NDAs, and intimidation, which prevented scientific peer review and silenced internal whistleblowers.",
      missedSignals: "The company's refusal to publish peer-reviewed studies, its avoidance of blind comparisons with traditional labs, and its extreme secrecy regarding its lab equipment.",
      leadershipDecisions: "Elizabeth Holmes and Sunny Balwani's decision to actively deceive regulators, board members, corporate partners, and patients rather than pivot the company's focus.",
      marketMistakes: "Entering a highly regulated, life-and-death industry (healthcare) with a 'fake it till you make it' consumer-tech mindset.",
      financialProblems: "Using investor funds to subsidize cheap, inaccurate tests and to pay millions in legal fees to intimidate whistleblowers and journalists.",
      executionMistakes: "Failing to build a functional quality control system, resulting in the release of thousands of erroneous patient lab reports."
    },
    lessons: [
      { title: "Science is Not Software", insight: "You cannot 'patch' the laws of physics in a software update. In deep tech and biotech, scientific validation must precede marketing and scaling." },
      { title: "Beware the Board of Icons", insight: "A board composed entirely of elderly politicians and generals who lack scientific expertise is a major red flag. Ensure your board has deep domain-specific technical competence." },
      { title: "Whistleblowers are an Early Warning System", insight: "If your employees are raising ethical or functional alarms, listening to them is a survival mechanism. Silencing them only delays—and magnifies—the eventual collapse." }
    ],
    similarStartups: [
      { name: "Juicero", slug: "juicero", reason: "Both companies built a cult of personality around a charismatic founder, raised massive capital based on beautiful hardware prototypes, and aggressively enforced secrecy to hide the fact that the product did not work." },
      { name: "WeWork", slug: "wework", reason: "Both startups were driven by messianic founder figures who used grand, world-changing rhetoric to inflate valuations, ignoring basic unit economics and corporate governance." }
    ],
    aiInvestigator: {
      overview: "Theranos is the ultimate cautionary tale of corporate fraud and ethical failure in the technology era. It exposes the extreme danger of applying the Silicon Valley 'hype cycle' to medical diagnostics.",
      caseAnalysis: "An HBR analysis of Theranos reveals a total breakdown of corporate governance. The board of directors, while filled with legendary figures, possessed zero medical or scientific expertise. This allowed Elizabeth Holmes to operate with zero technical oversight. She exploited the FOMO (Fear Of Missing Out) of investors, securing capital under strict non-disclosure agreements that prevented due diligence. Strategically, Theranos attempted to bypass the scientific community entirely, refusing to publish in peer-reviewed journals. This isolation prevented the early course-corrections that peer feedback naturally provides. When forced to deliver on commercial contracts with Walgreens, the company crossed the line from premature scaling into criminal fraud, demonstrating that without ethical boundaries, the pressure to succeed can lead to catastrophic failure.",
      forensicMetrics: "Forensic analysis of Theranos' testing data showed that over 80% of the tests run during their commercial peak were executed on modified Siemens machines, not the Edison. The dilution of blood samples introduced an error margin of up to 40% in critical potassium and glucose readings. The company spent over $300 million of its $700 million funding solely on legal defense, public relations damage control, and aggressive litigation against former employees."
    }
  },
  wework: {
    heroSummary: {
      dream: "To elevate the world's consciousness by transforming boring, sterile office buildings into vibrant, community-driven hubs of human connection.",
      thesis: "SoftBank's Masayoshi Son believed WeWork was the next tech giant, investing billions based on the idea that communal office space was a high-margin 'space-as-a-service' platform.",
      excitement: "Led by the messianic, barefoot billionaire Adam Neumann, WeWork grew at a breakneck pace, offering free-flowing beer, beautiful glass offices, and a lifestyle brand that captivated millennials."
    },
    story: `In early 2019, WeWork was the most valuable startup in America, boasting a staggering $47 billion valuation. Its co-founder, Adam Neumann, was a towering, charismatic figure who didn't just want to rent desks—he wanted to build a utopian empire. He spoke of WeWork as a community, a feeling, and a movement. Supported by SoftBank's Masayoshi Son, who told Neumann he wasn't being 'crazy enough,' WeWork signed long-term leases on prime real estate in major cities worldwide, transforming them into trendy, glass-walled co-working spaces.

But beneath the hip aesthetic and the free-flowing kombucha lay a structural disaster. WeWork was fundamentally a real estate company pretending to be a software startup. It took on massive, inflexible 15-year lease liabilities while renting to members on flexible, short-term month-to-month memberships. This created a massive asset-liability mismatch. Furthermore, the company was burning cash at an alarming rate—losing $219,000 every single hour of 2018.

The illusion shattered in August 2019 when WeWork filed its S-1 document to go public. The filing was a masterclass in corporate red flags. It revealed that WeWork had committed to $47 billion in future lease payments, while only bringing in a fraction of that in revenue. Even worse, it exposed shocking self-dealing by Neumann. He had personally bought buildings and leased them back to WeWork, taken out personal loans backed by WeWork stock, and even charged the company $5.9 million to buy the trademark for the word 'We' (which he personally owned).

The public market recoiled in horror. The IPO collapsed, the valuation plummeted from $47 billion to under $8 billion, and Adam Neumann was ousted with a controversial $1.7 billion buyout. The company filed for bankruptcy in 2023, leaving behind empty buildings, devastated investors, and a permanent warning about the dangers of unchecked founder power and valuation bubble.`,
    timeline: [
      { stage: "founding", dateStr: "2010", title: "The SoHo Genesis", description: "Adam Neumann and Miguel McKelvey open the first WeWork space in SoHo, New York, targeting freelancers and tech startups." },
      { stage: "funding", dateStr: "2017", title: "The SoftBank Influx", description: "SoftBank's Masayoshi Son invests $4.4B, telling Neumann to make the company ten times bigger and prioritizing speed over efficiency." },
      { stage: "growth", dateStr: "2018", title: "The Global Land Grab", description: "WeWork becomes the largest private occupier of office space in Manhattan, London, and Washington D.C., expanding into WeLive and WeGrow." },
      { stage: "major_decisions", dateStr: "Early 2019", title: "The $47B Valuation", description: "A new funding round from SoftBank values WeWork at $47B, cementing its status as the crown jewel of the venture capital world." },
      { stage: "warning_signs", dateStr: "August 2019", title: "The S-1 Revelation", description: "WeWork files its S-1 prospectus. Wall Street analysts and public investors express shock at the massive losses and Neumann's self-dealing." },
      { stage: "collapse", dateStr: "September 2019", title: "The Ousting of Neumann", description: "The IPO is shelved. Under pressure from board members and SoftBank, Adam Neumann steps down as CEO. The valuation collapses by 80%." },
      { stage: "aftermath", dateStr: "2023", title: "Chapter 11 Bankruptcy", description: "After years of restructuring and the impact of remote work, WeWork officially files for Chapter 11 bankruptcy to renegotiate its toxic leases." }
    ],
    failureInvestigation: {
      rootCause: "A catastrophic asset-liability mismatch. Taking on long-term fixed lease liabilities (10-15 years) while relying on short-term, volatile revenue (month-to-month rentals).",
      hiddenCause: "The arbitrage of valuation. By branding a traditional, low-margin real estate business as a high-margin 'tech platform,' the company secured tech-multiplier valuations that the public market ultimately rejected.",
      missedSignals: "The fact that WeWork was unprofitable even in its oldest, most mature co-working locations, proving that the business model did not benefit from economies of scale.",
      leadershipDecisions: "Allowing Adam Neumann absolute voting control (20 votes per share) and tolerating his extensive, flagrant self-dealing and erratic personal behavior.",
      marketMistakes: "Over-estimating the defensibility of co-working. WeWork had no moat; when they entered new markets, local competitors easily copied the aesthetic at a lower cost.",
      financialProblems: "Accumulating over $47 billion in lease obligations with less than $2 billion in annual revenue, leaving the company highly vulnerable to any economic slowdown.",
      executionMistakes: "Spending exorbitant sums on premium office fit-outs, lavish parties, and non-core acquisitions (like a wave-pool company) instead of optimizing occupancy rates."
    },
    lessons: [
      { title: "A Desk is Not code", insight: "You cannot value a physical real estate business using software margins. Physical assets have marginal costs that do not scale to zero. Respect your industry's fundamental economics." },
      { title: "Governance is a Shield", insight: "Dual-class shares and absolute founder control are dangerous. A strong, independent board is not a bureaucratic hurdle; it is a vital guardrail to prevent founder self-destruction." },
      { title: "Scale Magnifies Flaws", insight: "If your unit economics are negative at small scale, growing larger will not make them positive. It will only accelerate your cash burn and make the eventual collapse catastrophic." }
    ],
    similarStartups: [
      { name: "MoviePass", slug: "moviepass", reason: "Both companies subsidized their core service to achieve explosive, unprofitable growth, hoping that scale would magically solve their mathematically impossible unit economics." },
      { name: "Webvan", slug: "webvan", reason: "Both startups invested billions in physical infrastructure (warehouses/office leases) before validating long-term demand, leading to massive fixed-cost debt that strangled the business." }
    ],
    aiInvestigator: {
      overview: "WeWork represents the peak of the 'blitzscaling' era, where venture capital was used to buy market share in a traditional industry, temporarily suspending the laws of economics through sheer financial force.",
      caseAnalysis: "In a classic Harvard Business Review analysis, WeWork's failure is categorized as a failure of corporate governance and financial engineering. By claiming a proprietary 'physical social network' technology, WeWork achieved a price-to-sales multiple of over 20x, typical of software companies, whereas traditional real estate firms like IWG (Regus) traded at 1.5x. This valuation arbitrage was sustainable only as long as private venture capital (specifically SoftBank's Vision Fund) was willing to subsidize the losses. The moment the company attempted to transition to the public markets, the S-1 filing forced a comparison with public real estate metrics. The market immediately re-priced WeWork as a real estate firm, exposing the fact that the company was structurally insolvent without continuous external cash injections.",
      forensicMetrics: "At its peak in 2019, WeWork's lease-to-revenue ratio was an astronomical 120%, meaning it committed to pay more in rent than it collected from members, even at 100% occupancy. The company's net loss in 2018 was $1.9 billion on $1.8 billion in revenue—essentially losing $1.05 for every dollar it earned. The average cost to build out a single WeWork desk was $7,300, requiring an occupancy rate of 85% for 24 months just to recoup the capital expenditure."
    }
  },
  quibi: {
    heroSummary: {
      dream: "To create the 'next generation of television'—bringing Hollywood-grade, A-list storytelling into the palm of your hand in 10-minute 'quick bites.'",
      thesis: "Hollywood titan Jeffrey Katzenberg and tech CEO Meg Whitman convinced every major studio that mobile users wanted premium, professional content during their daily commutes.",
      excitement: "With $1.75 billion in capital, Quibi signed Steven Spielberg, Reese Witherspoon, and Kevin Hart to produce short-form shows optimized for mobile screens using patented portrait-to-landscape technology."
    },
    story: `In April 2020, Quibi launched with a level of fanfare that only Hollywood could orchestrate. The company had raised an astonishing $1.75 billion before a single user had even downloaded the app. Founded by Jeffrey Katzenberg, the legendary former chairman of Disney, and led by Meg Whitman, the former CEO of eBay, Quibi was built on a bold thesis: mobile users wanted premium, professional, short-form content. Katzenberg called them "quick bites"—5 to 10-minute episodes designed to be watched while commuting, waiting in line, or during the gaps in a busy day.

Quibi's technology was undeniably impressive. They patented 'Turnstyle,' a technology that allowed video to transition seamlessly between portrait and landscape modes depending on how the user held their phone. They spent up to $100,000 per minute on content, commissioning high-budget dramas, comedies, and news programs. The Hollywood establishment fell in line, eager to cash in on the new gold rush.

But Quibi launched into a world that no longer existed. On April 6, 2020, the United States was in the grip of the first COVID-19 lockdown. The very consumer behavior around which Quibi was built—the daily commute, the active on-the-go lifestyle—disappeared overnight. People were stuck at home, sitting in front of large television screens, not staring at their phones in transit.

Yet, Quibi's issues went far deeper than pandemic timing. The product was crippled by restrictive, anti-consumer features. In an era where social media sharing drives virality, Quibi blocked users from taking screenshots, recording clips, or sharing content on Twitter or TikTok. Furthermore, the app could not be cast to a television screen at launch. Locked inside their homes, users preferred free short-form video on TikTok and YouTube, or long-form streaming on Netflix and Disney+. Just six months after its lavish launch, Quibi announced it was shutting down, returning its remaining $350 million to investors.`,
    timeline: [
      { stage: "founding", dateStr: "2018", title: "The Hollywood Alliance", description: "Jeffrey Katzenberg partners with Meg Whitman to found NewTV, later renamed Quibi (Quick Bites), combining Hollywood storytelling with tech expertise." },
      { stage: "funding", dateStr: "2018-2020", title: "The $1.75B War Chest", description: "Quibi raises $1.75B from Disney, NBCUniversal, WarnerMedia, Sony, Alibaba, and major venture capital firms before launch." },
      { stage: "growth", dateStr: "Late 2019", title: "The Super Bowl Debut", description: "Quibi spends millions on a massive Super Bowl ad campaign, building intense hype for its upcoming mobile-only streaming service." },
      { stage: "launch", dateStr: "April 6, 2020", title: "The Lockdown Launch", description: "Quibi launches into the peak of global COVID-19 lockdowns. It achieves 1.7M downloads in its first week, driven by a 90-day free trial." },
      { stage: "warning_signs", dateStr: "July 2020", title: "The Retention Cliff", description: "As the 90-day free trial ends, only 8% of users convert to paid subscriptions. The app drops out of the top 50 App Store chart." },
      { stage: "collapse", dateStr: "October 21, 2020", title: "The White Flag", description: "Just 199 days after launch, Katzenberg and Whitman publish an open letter announcing the shutdown of the service." },
      { stage: "aftermath", dateStr: "2021", title: "The Fire Sale", description: "Quibi's content library, which cost over $1B to produce, is sold to Roku for a reported $100M to anchor Roku's free ad-supported channel." }
    ],
    failureInvestigation: {
      rootCause: "A profound lack of product-market fit. Quibi misjudged the consumer's willingness to pay for short-form content when high-quality alternatives (TikTok, YouTube) were available for free.",
      hiddenCause: "A generational disconnect. The company's leadership was composed of older executives who did not understand modern mobile culture, resulting in a product that banned social sharing, memes, and community interaction.",
      missedSignals: "The explosive rise of TikTok during 2019, which proved that mobile users preferred raw, authentic, community-generated content over polished, over-produced Hollywood dramas on their phones.",
      leadershipDecisions: "Choosing to launch as a mobile-only app without TV casting capability, and refusing to allow social media sharing, which strangled any organic, viral growth.",
      marketMistakes: "Charging a subscription fee ($4.99 with ads) for short-form content, failing to realize that the psychological value of short-form video in the consumer's mind was $0.",
      financialProblems: "Committing to massive, non-cancelable content budgets (up to $6 million per hour) before validating user retention, leaving the company with an unsustainable burn rate.",
      executionMistakes: "Focusing heavily on proprietary technology ('Turnstyle') that added significant engineering cost but did not improve the core viewing experience for the average user."
    },
    lessons: [
      { title: "Social is the Product", insight: "In the mobile era, if users cannot screenshot, clip, meme, and share your content on social media, your product is practically invisible. Virality is not an add-on; it is the distribution channel." },
      { title: "Respect the Psychological Price Point", insight: "Consumers categorize content by format. Long-form (Netflix) is worth a subscription. Short-form (YouTube/TikTok) is expected to be free. Do not try to charge premium prices for a format consumers associate with zero cost." },
      { title: "Validate the Use Case, Not the Hype", insight: "Just because you can raise $1.7 billion from institutional FOMO does not mean you have validated a consumer need. Never mistake investor enthusiasm for customer demand." }
    ],
    similarStartups: [
      { name: "Color Labs", slug: "color-labs", reason: "Both startups raised massive pre-launch funding based on executive pedigree, built over-engineered mobile technology, and launched products that completely ignored how actual consumers interact on mobile devices." },
      { name: "Aereo", slug: "aereo", reason: "Both attempted to disrupt the television industry by leveraging proprietary technology, but failed due to a combination of legal/regulatory hurdles and a failure to align with long-term consumer viewing habits." }
    ],
    aiInvestigator: {
      overview: "Quibi's collapse is a classic case of top-down corporate hubris, where industry veterans attempted to manufacture a consumer habit through sheer capital and star power, ignoring the organic evolution of mobile user behavior.",
      caseAnalysis: "From an academic strategic perspective, Quibi's failure represents a classic 'blue ocean' strategy gone wrong. The company identified what they believed was an untapped space: premium, short-form mobile video. However, they failed to recognize that this space was already occupied by highly adaptive, free alternatives. TikTok and YouTube did not just offer entertainment; they offered social connection, interactivity, and a sense of participation. Quibi's content was passive, one-way broadcasting masquerading as mobile tech. By restricting the app to mobile-only and blocking social features, they stripped mobile video of its native advantages. The pandemic was a contributing factor, but it merely accelerated the exposure of a fundamental truth: there was no market demand for Hollywood-budget soap operas designed for 10-minute gaps in a day.",
      forensicMetrics: "Quibi's customer acquisition cost was estimated at a staggering $40 per active user, while its monthly average revenue per user (ARPU) was less than $2 due to heavy promotional discounting. The company burned through $1.4 billion of its capital in under two years. At the time of shutdown, the app had fewer than 500,000 active paying subscribers, against an initial first-year projection of 7.4 million."
    }
  },
  webvan: {
    heroSummary: {
      dream: "To completely reinvent the global grocery industry by delivering fresh food directly to your kitchen within a 30-minute window at the click of a button.",
      thesis: "During the height of the dot-com boom, investors believed that massive, automated regional warehouses would allow Webvan to bypass traditional grocery store overhead and achieve massive economies of scale.",
      excitement: "With an $800 million war chest, Webvan built sprawling, high-tech distribution centers equipped with robotic conveyors, promising to deliver groceries cheaper and faster than a trip to the supermarket."
    },
    story: `In 1999, Webvan was hailed as the undisputed future of retail. Founded by Louis Borders, the brilliant co-founder of Borders Books, the startup promised to liberate consumers from the weekly chore of grocery shopping. Webvan's plan was breathtakingly ambitious: customers would order groceries online, and a fleet of custom-designed vans would deliver them fresh to their doors within a precise 30-minute window. Capital poured in, culminating in an IPO that valued the company at $8 billion.

Webvan's strategy was defined by 'blitzscaling' before the term even existed. Flush with cash, the company signed a massive $1 billion contract with Bechtel to build 26 highly automated, robotic warehouses across the United States. Each warehouse cost upwards of $40 million and was a marvel of engineering, featuring miles of conveyor belts that brought items directly to workers. The company expanded rapidly, launching in San Francisco, Atlanta, Chicago, Seattle, and several other major cities.

But Webvan was building an expensive cathedral on a foundation of sand. The grocery industry is notoriously brutal, defined by razor-thin margins of 1% to 2% and highly perishable inventory. Webvan's automated warehouses were designed for massive volume, but the demand never materialized. The company was forced to operate these expensive facilities at a fraction of their capacity, resulting in astronomical fixed overhead costs.

Worse, the consumer behavior of online grocery shopping was decades away. In 2000, high-speed internet was rare, online payment was distrusted, and consumers still wanted to touch their peaches and select their own meats. Webvan was losing up to $130 on every single delivery. When the dot-com bubble burst in 2000, the capital markets dried up. Unable to fund its massive burn rate, Webvan shut down in July 2001, laying off 2,000 employees and liquidating its brand-new warehouses for pennies on the dollar.`,
    timeline: [
      { stage: "founding", dateStr: "1996", title: "The Retail Pioneer", description: "Louis Borders founds Webvan, aiming to apply modern logistics and internet technology to the $450B US grocery market." },
      { stage: "funding", dateStr: "1997-1998", title: "The VC Influx", description: "Benchmark Capital, Sequoia, and SoftBank invest heavily, convinced that Webvan can capture a massive share of consumer retail spend." },
      { stage: "growth", dateStr: "1999", title: "The $8B IPO", description: "Webvan goes public at the height of the dot-com bubble, raising $375M. The stock skyrockets, valuing the pre-revenue company at $8B." },
      { stage: "major_decisions", dateStr: "Late 1999", title: "The $1B Bechtel Contract", description: "Webvan commits to building 26 automated warehouses nationwide before proving profitability or demand in its first market (San Francisco)." },
      { stage: "warning_signs", dateStr: "2000", title: "The Margin Bleed", description: "As the company expands to 10 cities, losses mount. The cost of maintaining high-tech warehouses, delivery fleets, and spoilage outpaces revenue." },
      { stage: "collapse", dateStr: "July 2001", title: "The Sudden Halt", description: "Running out of cash and unable to raise capital post-bubble, Webvan files for Chapter 11 bankruptcy, shutting down all operations immediately." },
      { stage: "aftermath", dateStr: "2010s", title: "The Vindication", description: "Years later, Webvan's assets and intellectual property are acquired by Amazon, serving as the foundational blueprint for Amazon Fresh." }
    ],
    failureInvestigation: {
      rootCause: "Premature scaling of physical infrastructure. The company committed to billions in fixed capital expenditure (automated warehouses) before validating customer demand and density.",
      hiddenCause: "The low density of orders. Grocery delivery is a local density game; without a high concentration of customers in a specific neighborhood, the cost of driving vans between homes destroys any potential margin.",
      missedSignals: "Low average order values and high customer churn. Customers loved the convenience of free delivery, but refused to pay the actual cost of the service once subsidies were removed.",
      leadershipDecisions: "Prioritizing national expansion over local unit-economic profitability, driven by the dot-com belief that 'getting big fast' was the only path to survival.",
      marketMistakes: "Launching a service that required high-speed internet and high trust in online commerce at a time when dial-up was the norm and consumers were highly skeptical of online transactions.",
      financialProblems: "High fixed capital depreciation. The automated warehouses had massive fixed operating costs that could only be offset by operating at 90%+ capacity, which the company never achieved.",
      executionMistakes: "Acquiring competitor HomeGrocer for $1.2 billion in stock, which doubled the company's operational complexity and cash burn without solving the core logistics problem."
    },
    lessons: [
      { title: "Get the Unit Economics Right Locally", insight: "In logistics and delivery, scale does not fix broken unit economics; it only makes them bigger. Prove that you can make a single neighborhood profitable before building a national footprint." },
      { title: "Don't Build a Cathedral for a Tent", insight: "Avoid committing massive capital to permanent, automated infrastructure before you have validated long-term consumer demand. Start with manual, low-cost operations and automate only when demand forces you to." },
      { title: "Density is Destiny", insight: "In last-mile delivery, the distance between drop-offs is the single most important metric. Focus on geographical density rather than raw customer acquisition." }
    ],
    similarStartups: [
      { name: "Pets.com", slug: "pets-com", reason: "Both were iconic dot-com failures that attempted to sell low-margin, heavy physical goods online, subsidizing shipping costs and burning through millions in capital before realizing the logistics were unviable." },
      { name: "Beepi", slug: "beepi", reason: "Both startups attempted to build high-overhead, service-heavy marketplaces for physical goods (groceries vs. used cars), where the cost of inspection, logistics, and delivery exceeded transaction margins." }
    ],
    aiInvestigator: {
      overview: "Webvan is the textbook case of 'Get Big Fast' hubris. It serves as a warning of what happens when a startup attempts to blitzscale a capital-intensive physical business before establishing product-market fit.",
      caseAnalysis: "An HBR analysis of Webvan highlights the danger of capital-induced blindness. The company's massive funding allowed it to bypass the traditional stage-gate process of startup growth. Instead of iterating on a minimum viable product, Webvan designed a fully integrated, automated system from day one. They treated grocery delivery as a technology scaling problem, failing to realize it was actually a local logistics and consumer behavior problem. They assumed that consumer habits would change overnight. In reality, the technology infrastructure (broadband, mobile apps) and social trust required for online grocery shopping took another fifteen years to mature. Webvan was conceptually correct—as evidenced by the success of Instacart and Amazon Fresh today—but strategically and chronologically bankrupt.",
      forensicMetrics: "Webvan burned through $830 million in cash. At its peak, the San Francisco warehouse operated at only 25% of its designed capacity. The company's delivery cost per order was $38, while the average gross margin per order was only $15, resulting in a net loss of $23 per transaction before accounting for corporate overhead and warehouse depreciation."
    }
  },
  moviepass: {
    heroSummary: {
      dream: "To become the 'Netflix of movie theaters'—allowing consumers to watch unlimited movies in actual theaters for a low, flat monthly fee.",
      thesis: "The company believed that by offering an irresistible consumer price, they could acquire millions of subscribers and force major theater chains to share ticket and concession revenue.",
      excitement: "At just $9.95 per month for a movie a day, MoviePass became an overnight sensation, growing to 3 million subscribers who felt they had discovered the ultimate life hack."
    },
    story: `In the summer of 2017, MoviePass pulled off one of the most aggressive growth hacks in tech history. The company announced a new pricing plan: for just $9.95 a month, subscribers could see one movie in theaters every single day. The consumer reaction was euphoric. MoviePass was a license to print entertainment. The app climbed to the top of the charts, and within a year, the subscriber base exploded from 20,000 to over 3 million. 

The strategy, orchestrated by CEO Mitch Lowe (an early Netflix executive) and parent company Helios & Matheson (HMNY), was a high-stakes game of chicken. MoviePass did not have discounts with theaters. When a subscriber used their MoviePass debit card to buy a ticket, MoviePass paid the theater the full retail price—often $12 to $15 per ticket. This meant that if a subscriber watched just a single movie a month, MoviePass lost money. If they watched three, MoviePass lost a fortune.

The company's thesis was that theaters were desperate for foot traffic and would eventually agree to share a percentage of their ticket and high-margin concession revenue (popcorn and soda) once MoviePass controlled a significant portion of the box office. They also planned to monetize the valuable data of millions of moviegoers.

But the theater giants, led by AMC, refused to bend. They saw MoviePass' business model as unsustainable and simply waited for the startup to bleed out. The bleed was catastrophic. By mid-2018, MoviePass was burning through $40 million a month. HMNY was forced to continuously issue new shares of stock to fund the losses, diluting its share price to fractions of a penny. 

In a desperate bid to survive, MoviePass began changing its terms weekly. They introduced surge pricing, blocked popular movies on opening weekends, restricted users to three movies a month, and frequently shut down the app entirely during peak hours, claiming 'technical difficulties.' The user base, feeling betrayed, revolted. Churn skyrocketed, and in September 2019, the company finally shut down, leaving behind a legacy of the most consumer-subsidized business model in history.`,
    timeline: [
      { stage: "founding", dateStr: "2011", title: "The Early Struggles", description: "Stacy Spikes and Hamet Watt launch MoviePass, experimenting with various high-priced subscription tiers ($30-$50/month) with slow adoption." },
      { stage: "funding", dateStr: "2017", title: "The HMNY Acquisition", description: "Helios & Matheson (HMNY) acquires a majority stake in MoviePass, installing Mitch Lowe as CEO with a mandate for rapid growth." },
      { stage: "growth", dateStr: "August 2017", title: "The $9.95 Disruption", description: "MoviePass slashes its price to $9.95/month. The service goes viral, causing the website to crash under unprecedented demand." },
      { stage: "major_decisions", dateStr: "Mid 2018", title: "The AMC Standoff", description: "With 3 million subscribers, MoviePass accounts for 6% of the US box office. AMC refuses to share revenue and announces its own competing subscription." },
      { stage: "warning_signs", dateStr: "July 2018", title: "The Midnight Outage", description: "MoviePass temporarily runs out of cash, causing a service outage. HMNY takes an emergency $5M loan to bring the system back online." },
      { stage: "collapse", dateStr: "Late 2018", title: "The Death Spiral", description: "To curb losses, MoviePass restricts movie choices, throttles heavy users, and implements surge pricing. Subscribers cancel in droves." },
      { stage: "aftermath", dateStr: "September 2019", title: "The Final Curtain", description: "MoviePass officially suspends operations. HMNY files for Chapter 7 liquidation in 2020, facing SEC investigations into market manipulation." }
    ],
    failureInvestigation: {
      rootCause: "Fundamentally broken unit economics. The marginal cost of delivering the service (the price of a movie ticket) was entirely variable and exceeded the subscription price on the very first transaction.",
      hiddenCause: "A flawed assumption of leverage. MoviePass believed they could hold the theater chains hostage by threatening to redirect their subscribers. They underestimated the theaters' financial resilience and ability to launch their own competing products.",
      missedSignals: "The rapid growth of the subscriber base was celebrated as traction, when in reality, it was a liability. The faster the company grew, the faster it approached bankruptcy.",
      leadershipDecisions: "Choosing to launch a price point ($9.95) that was mathematically suicidal without having secured revenue-sharing agreements with the major theater chains beforehand.",
      marketMistakes: "Underestimating the speed at which incumbents (like AMC and Regal) could launch their own loyalty subscription programs, completely neutralizing MoviePass' value proposition.",
      financialProblems: "Exhausting all venture capital and relying on continuous, highly dilutive public stock issuance by parent company HMNY, which eventually destroyed all shareholder value.",
      executionMistakes: "Implementing aggressive, deceptive tactics to prevent users from using the service (such as changing passwords and shutting down servers) which destroyed the brand's reputation."
    },
    lessons: [
      { title: "Growth is Not Always Good", insight: "If you lose money on every transaction, scaling is not a path to profitability; it is a race to insolvency. Ensure you have a positive contribution margin before pushing the growth accelerator." },
      { title: "Establish Leverage Before You Bleed", insight: "Never launch a business model that relies on forcing your suppliers to cooperate after you've already started subsidizing their product. Secure your partnerships before you launch the discount." },
      { title: "Beware the Variable Cost Trap", insight: "Subscription models work when marginal costs are near zero (like software or digital streaming). When your marginal cost is a physical, full-price ticket, subscription is highly dangerous." }
    ],
    similarStartups: [
      { name: "WeWork", slug: "wework", reason: "Both startups used massive venture subsidies to offer their services at below-market rates, prioritizing vanity growth metrics over sustainable unit economics." },
      { name: "Beepi", slug: "beepi", reason: "Both companies suffered from high transaction fulfillment costs that exceeded their margins, failing to develop secondary monetization streams before running out of capital." }
    ],
    aiInvestigator: {
      overview: "MoviePass is a modern classic of capital-destructive growth. It demonstrates the limits of 'growth hacking' when applied to physical services with fixed, high variable costs.",
      caseAnalysis: "In a Harvard Business Review analysis, MoviePass' strategy is identified as a failed attempt at platform intermediation. The company attempted to insert itself as a middleman between moviegoers and theaters, hoping to capture the value of customer relationship ownership. However, for intermediation to succeed, the platform must possess a credible threat or unique value that the suppliers cannot replicate. MoviePass possessed neither. The theaters owned the physical assets (the screens and seats) and the high-margin concessions. When MoviePass accumulated 3 million subscribers, AMC simply launched 'AMC Stubs A-List,' offering a sustainable subscription model using their own inventory. This instantly disintermediated MoviePass, leaving the startup with the unprofitable customers while AMC captured the high-value, loyal moviegoers.",
      forensicMetrics: "MoviePass lost an average of $15.50 per subscriber per month in 2018. The parent company, HMNY, saw its stock price decline from a split-adjusted peak of $38,000,000 per share to $0.0001 per share, executing multiple reverse stock splits to maintain listing before being delisted. Total capital destroyed exceeded $600 million."
    }
  }
};

/**
 * Generate a documentary-style narrative on the fly for startups not in the pre-written dictionary.
 */
export const getDocumentaryData = (slug, startup) => {
  // If we have custom-written data, return it
  if (documentaryData[slug]) {
    return documentaryData[slug];
  }

  // Otherwise, dynamically generate highly structured documentary data from the existing startup fields
  const name = startup?.name || "This Startup";
  const industry = startup?.industry || "Tech";
  const primaryReason = startup?.failureReasons?.find(r => r.isPrimary)?.description || 
                        startup?.failureReasons?.[0]?.description || 
                        "unviable unit economics";
  
  const formattedReasons = startup?.failureReasons || [];

  return {
    heroSummary: {
      dream: `To revolutionize the ${industry} space by introducing a disruptive business model that promised to redefine how consumers interact with the market.`,
      thesis: `Investors were captivated by the massive market opportunity, the early customer adoption signals, and the promise of a high-growth scale play.`,
      excitement: `With substantial early backing, the company set out to build a dominant position, generating significant industry buzz and media attention.`
    },
    story: `In the beginning, investors believed ${name} had everything required to dominate the ${industry} market. The founders presented a compelling vision that seemed perfectly aligned with emerging market trends. The early growth phase was characterized by intense enthusiasm, rapid hiring, and a sense that the company was on the verge of a massive breakthrough.

However, the foundation of this growth was highly fragile. As ${name} scaled, the operational complexities and underlying financial realities began to catch up with the venture. The company was forced to maintain high burn rates to support its growth, prioritizing market share expansion over sustainable unit economics. 

The turning point arrived when the market conditions shifted or the core product assumptions were put to the test. It became clear that the cost of acquiring and retaining customers was far higher than anticipated, and the path to profitability was blocked by structural obstacles. The company scrambled to pivot and cut costs, but the runway was too short. The venture serves as a powerful reminder of the delicate balance between rapid scaling and economic sustainability.`,
    timeline: [
      { stage: "founding", dateStr: startup?.foundingYear || "Founding", title: "The Vision Born", description: `${name} is established, launching its initial product concept to address a significant perceived gap in the market.` },
      { stage: "funding", dateStr: "Growth Phase", title: "The Capital Infusion", description: "The company raises venture funding, enabling rapid expansion, team growth, and aggressive marketing campaigns." },
      { stage: "growth", dateStr: "Peak Operations", title: "Scaling the Model", description: "User acquisition accelerates. The company expands its geographic footprint or product line to capture market share." },
      { stage: "major_decisions", dateStr: "Pivot Point", title: "Strategic Adjustments", description: "In response to early challenges, leadership makes key decisions regarding pricing, product focus, or operational structure." },
      { stage: "warning_signs", dateStr: "Decline Phase", title: "The Cracks Appear", description: "Rising customer acquisition costs, churn, or regulatory hurdles begin to strain the company's financial runway." },
      { stage: "collapse", dateStr: startup?.shutdownYear || "Shutdown", title: "The Wind Down", description: "Faced with exhausted capital options and unsustainable burn, the company announces the suspension of its operations." },
      { stage: "aftermath", dateStr: "Postmortem", title: "The Legacy & Lessons", description: "The assets are liquidated or acquired, and the industry absorbs the critical lessons left behind by the venture's journey." }
    ],
    failureInvestigation: {
      rootCause: primaryReason,
      hiddenCause: formattedReasons[1]?.description || "A failure to align the cost of service delivery with customer lifetime value, hidden behind vanity growth metrics.",
      missedSignals: "Declining cohort retention and increasing payback periods on customer acquisition spend.",
      leadershipDecisions: "Prioritizing aggressive expansion and top-line growth over product utility and unit profitability.",
      marketMistakes: "Underestimating the competitive response and the difficulty of changing ingrained consumer habits.",
      financialProblems: "Maintaining a high burn rate without a clear, validated path to positive contribution margins.",
      executionMistakes: "Over-engineering the initial product release and scaling marketing before achieving true product-market fit."
    },
    lessons: [
      { title: "Validate Before Scaling", insight: "Never scale marketing or operations before proving that your core transaction is profitable and that customers are highly retained." },
      { title: "Watch the Core Metrics", insight: "Do not get distracted by vanity metrics like total downloads or media coverage. Focus on cohort retention, LTV/CAC ratio, and cash runway." },
      { title: "Maintain Operational Agility", insight: "Keep fixed costs low in the early stages so that you can pivot your business model when the market exposes your initial assumptions." }
    ],
    similarStartups: [
      { name: "Juicero", slug: "juicero", reason: "Both startups struggled with product-market fit and over-engineered their initial solutions, leading to unsustainable capital requirements." },
      { name: "MoviePass", slug: "moviepass", reason: "Both companies attempted to acquire customers through heavy subsidies, resulting in negative contribution margins that became unsustainable at scale." }
    ],
    aiInvestigator: {
      overview: `Our forensic analysis indicates that ${name} represents a classic case of premature scaling. The company attempted to build a large-scale enterprise on top of a business model whose unit economics were not yet validated.`,
      caseAnalysis: `From a strategic management perspective, ${name} failed to establish a sustainable competitive advantage. The value proposition, while attractive to early adopters, did not translate into a mass-market offering with high willingness to pay. The leadership team focused on execution speed at the expense of strategic flexibility. When the capital markets tightened, the company did not have the runway required to execute a meaningful pivot, highlighting the necessity of maintaining a buffer and prioritizing cash-flow sustainability.`,
      forensicMetrics: `The venture's financial model suffered from high fixed operating leverage. As transaction volume increased, the expected economies of scale were offset by rising customer acquisition costs and low customer lifetime value. The burn-to-revenue ratio remained unsustainable throughout the scaling phase, leading to rapid capital depletion.`
    }
  };
};
