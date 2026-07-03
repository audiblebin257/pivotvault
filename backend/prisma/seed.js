const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PivotVault database...');

  // ─────────────────────────────────────────────
  // STARTUPS
  // ─────────────────────────────────────────────

  const quibi = await prisma.company.upsert({
    where: { slug: 'quibi' },
    update: {},
    create: {
      name: 'Quibi',
      slug: 'quibi',
      status: 'failed',
      industry: 'Media / Entertainment',
      country: 'USA',
      foundingYear: 2018,
      shutdownYear: 2020,
      lifetimeMonths: 24,
      fundingInr: 145250000000n, // ~$1.75B
      peakUsers: 1500000,
      teamSize: 200,
      summary: 'Mobile-first premium streaming platform with episodes under 10 minutes, designed for on-the-go viewing. Raised $1.75B and shut down within 6 months of launch.',
      founderStory: '# The Quibi Story\n\nFounded by Jeffrey Katzenberg and Meg Whitman, Quibi had arguably the most expensive failure in startup history. The vision was bold: Hollywood-quality short-form video for mobile users commuting, waiting, or in-between moments.\n\n## The Premise\n"Quick bites" of premium content — 10 minutes or less, portrait-mode optimized. Compelling on paper. Studios signed on. $1.75B raised before a single user downloaded the app.\n\n## What Went Wrong\nQuibi launched in April 2020 — the same month the world entered COVID-19 lockdown. Nobody was commuting. Nobody was on the go. The one user behavior the entire product was designed around disappeared overnight.\n\nWorse, users discovered they couldn\'t cast Quibi to their TVs, couldn\'t take screenshots, and couldn\'t share clips on social media. In 2020, social sharing IS the product. Quibi had none of it.\n\nTikTok and YouTube already owned short-form mobile video, and they were free.\n\n## The Shutdown\nBy October 2020, just 6 months after launch, Quibi announced shutdown. Assets were sold to Roku for a fraction of the capital raised.',
      failureReasons: {
        create: [
          { category: 'timing', severityScore: 95, description: 'Launched a mobile commute product during a global lockdown. The core use-case vanished overnight.', isPrimary: true },
          { category: 'pmf', severityScore: 80, description: 'Misjudged how people consume premium short-form content — users preferred free platforms.' },
          { category: 'product', severityScore: 65, description: 'No TV casting, no screenshots, no social sharing — missing table-stakes features in 2020.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2018-01-01'), title: 'Concept Founded', description: 'Katzenberg pitches "quick bites" of Hollywood-grade mobile content.' },
          { stage: 'growth', eventDate: new Date('2019-06-01'), title: '$1B+ Raised', description: 'Raised $1.75B from major studios and investors before launch.' },
          { stage: 'launch', eventDate: new Date('2020-04-06'), title: 'Public Launch', description: 'Launched into COVID-19 lockdown. 1.5M downloads in first week.' },
          { stage: 'decline', eventDate: new Date('2020-06-01'), title: 'Retention Crisis', description: 'Only 8% of free trial users converted to paid.' },
          { stage: 'shutdown', eventDate: new Date('2020-10-21'), title: 'Shutdown Announced', description: 'Quibi announces shutdown. Assets sold to Roku.' },
        ],
      },
      metricsSnapshots: {
        create: [
          { recordedMonth: new Date('2020-04-01'), users: 1500000, revenueInr: 0n, burnRateInr: 4150000000n, churnRate: 92 },
          { recordedMonth: new Date('2020-07-01'), users: 500000, revenueInr: 250000000n, burnRateInr: 4150000000n, churnRate: 97 },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 92,
          monetizationScore: 70,
          pmfScore: 85,
          marketingScore: 55,
          primaryCause: 'Timing & Market Conditions',
          confidence: 91,
          recommendations: [
            { priority: 'high', action: 'Validate core use-case assumption before raising mega-rounds.', rationale: 'The commute behavior was never validated at scale; one external disruption killed the thesis.' },
            { priority: 'high', action: 'Ensure cross-platform accessibility from day one.', rationale: 'Mobile-only restriction cut off TV households and eliminated social virality.' },
            { priority: 'medium', action: 'Never assume user behavior will change because executives believe it should.', rationale: 'Users already had TikTok and YouTube. There was no switching incentive.' },
          ],
        },
      },
    },
  });

  const juicero = await prisma.company.upsert({
    where: { slug: 'juicero' },
    update: {},
    create: {
      name: 'Juicero',
      slug: 'juicero',
      status: 'failed',
      industry: 'Consumer Hardware',
      country: 'USA',
      foundingYear: 2013,
      shutdownYear: 2017,
      lifetimeMonths: 48,
      fundingInr: 9960000000n, // ~$120M
      peakUsers: 10000,
      teamSize: 70,
      summary: 'Wi-Fi connected $400 juicing machine that pressed proprietary juice packets — which users discovered could be squeezed by hand just as effectively.',
      founderStory: '# The Juicero Story\n\nJuicero was the poster child of Silicon Valley excess — a $400 Wi-Fi connected juice press that solved a problem nobody had. The machine required proprietary juice packets delivered via subscription, creating a "Keurig for juice" model.\n\n## The Reveal\nIn April 2017, Bloomberg published a video showing that the $400 machine could be entirely bypassed — users could squeeze the juice packets by hand and get the same result in the same time. The internet exploded.\n\n## The Collapse\nInvestors, already uncomfortable, began pushing for an exit. Without the DRM-like lock-in of the machine, the entire business model collapsed. The company shut down 4 months after the Bloomberg video.\n\n## The Lesson\nNever create an expensive solution for an insignificant problem. The juice was good. The hardware was unnecessary.',
      failureReasons: {
        create: [
          { category: 'pmf', severityScore: 95, description: 'The hardware solved a problem that did not exist — packets could be squeezed by hand.', isPrimary: true },
          { category: 'monetization', severityScore: 80, description: '$400 hardware plus ongoing subscription was an enormous barrier for a juice product.' },
          { category: 'product', severityScore: 70, description: 'Core value proposition was destroyed in a single viral video.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2013-01-01'), title: 'Founded', description: 'Doug Evans founds Juicero with vision of connected kitchen appliance.' },
          { stage: 'launch', eventDate: new Date('2016-04-01'), title: 'Product Launch', description: 'Juicero launches at $699 ($400 after price cut). Strong VC backing.' },
          { stage: 'decline', eventDate: new Date('2017-04-19'), title: 'Bloomberg Video', description: 'Bloomberg publishes video showing packets can be squeezed by hand.' },
          { stage: 'shutdown', eventDate: new Date('2017-09-01'), title: 'Shutdown', description: 'Juicero shuts down, offers refunds to customers.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 60,
          monetizationScore: 85,
          pmfScore: 96,
          marketingScore: 45,
          primaryCause: 'Product-Market Fit',
          confidence: 95,
          recommendations: [
            { priority: 'high', action: 'Test whether hardware genuinely adds unique value users cannot replicate manually.', rationale: 'A hardware product that can be bypassed by hand has no defensible moat.' },
            { priority: 'high', action: 'Avoid creating expensive solutions for insignificant problems.', rationale: 'The juice preparation problem was not significant enough to justify $400 hardware.' },
          ],
        },
      },
    },
  });

  const theranos = await prisma.company.upsert({
    where: { slug: 'theranos' },
    update: {},
    create: {
      name: 'Theranos',
      slug: 'theranos',
      status: 'failed',
      industry: 'Health Tech',
      country: 'USA',
      foundingYear: 2003,
      shutdownYear: 2018,
      lifetimeMonths: 180,
      fundingInr: 58100000000n, // ~$700M+
      peakUsers: 800000,
      teamSize: 800,
      summary: 'Blood testing startup claiming to run hundreds of tests from a few drops of blood. Technology never worked as claimed; founder Elizabeth Holmes convicted of fraud.',
      founderStory: '# The Theranos Story\n\nFounded by 19-year-old Stanford dropout Elizabeth Holmes in 2003, Theranos promised to democratize healthcare with cheap, painless blood tests from a finger-prick. The vision was genuinely powerful — blood testing was expensive, slow, and painful.\n\n## The Deception\nThe problem was the technology never worked. Theranos ran most tests on commercially available machines from Siemens and others, secretly diluting samples. The proprietary "Edison" device was largely fiction.\n\n## The Exposure\nWSJ reporter John Carreyrou broke the story in 2015. Patients received inaccurate results. Regulatory agencies began investigations. Holmes stepped down in 2018 as the company collapsed.\n\n## The Verdict\nElizabeth Holmes was convicted of fraud in January 2022. The company was shut down in 2018.\n\n## The Lesson\nTrust and transparency are non-negotiable in healthcare. No amount of charisma compensates for non-functional technology.',
      failureReasons: {
        create: [
          { category: 'fraud', severityScore: 100, description: 'Core technology was fabricated. Tests ran on third-party machines while claiming proprietary tech.', isPrimary: true },
          { category: 'ethics', severityScore: 95, description: 'Patient health endangered by inaccurate results from malfunctioning technology.' },
          { category: 'leadership', severityScore: 90, description: 'Culture of secrecy and intimidation prevented internal whistleblowing for years.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2003-01-01'), title: 'Founded', description: 'Elizabeth Holmes drops out of Stanford at 19 to found Theranos.' },
          { stage: 'growth', eventDate: new Date('2013-09-01'), title: 'Walgreens Partnership', description: 'Theranos launches blood testing in Walgreens stores.' },
          { stage: 'growth', eventDate: new Date('2014-06-01'), title: 'Peak Valuation', description: 'Valued at $9B. Holmes on magazine covers worldwide.' },
          { stage: 'decline', eventDate: new Date('2015-10-16'), title: 'WSJ Investigation', description: 'John Carreyrou publishes exposé questioning the technology.' },
          { stage: 'shutdown', eventDate: new Date('2018-09-05'), title: 'Company Dissolved', description: 'Theranos officially shuts down after fraud charges.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 10,
          monetizationScore: 20,
          pmfScore: 5,
          marketingScore: 10,
          primaryCause: 'Fraud & Ethics Violation',
          confidence: 99,
          recommendations: [
            { priority: 'high', action: 'Healthcare products must be clinically validated before deployment.', rationale: 'Inaccurate medical results directly harm patients.' },
            { priority: 'high', action: 'Transparency is a non-negotiable in regulated industries.', rationale: 'Secrecy protected the fraud for over a decade but ultimately led to criminal conviction.' },
          ],
        },
      },
    },
  });

  const petsDotCom = await prisma.company.upsert({
    where: { slug: 'pets-com' },
    update: {},
    create: {
      name: 'Pets.com',
      slug: 'pets-com',
      status: 'failed',
      industry: 'E-Commerce',
      country: 'USA',
      foundingYear: 1998,
      shutdownYear: 2000,
      lifetimeMonths: 24,
      fundingInr: 24900000000n, // ~$300M
      peakUsers: 570000,
      teamSize: 320,
      summary: 'Dot-com era online pet supply store with a famous sock puppet mascot. Spent more on marketing than it ever earned in revenue.',
      founderStory: '# The Pets.com Story\n\nPets.com was the symbol of dot-com bubble excess. The company spent $1.2M on a Super Bowl ad before it was even profitable, featuring a famous sock puppet that became more famous than the business itself.\n\n## The Economics\nShipping a 40-pound bag of dog food from a warehouse to a doorstep cost more than the margin on the product. Every sale was a loss. The company grew revenue while hemorrhaging cash on logistics.\n\n## The IPO and Collapse\nPets.com IPO\'d in February 2000 at $11/share. By November 2000, the stock was at $0.19 and the company was liquidated. It lasted 268 days as a public company.\n\n## The Lesson\nRevenue growth cannot compensate for broken unit economics. If you lose money on every transaction, scale kills you faster.',
      failureReasons: {
        create: [
          { category: 'unit_economics', severityScore: 95, description: 'Shipping heavy pet supplies cost more than the product margins. Every sale was a net loss.', isPrimary: true },
          { category: 'cac', severityScore: 75, description: '$1.2M Super Bowl ad spend before achieving profitability.' },
          { category: 'timing', severityScore: 60, description: 'Dot-com bubble burst eliminated investor patience for loss-making growth.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('1998-08-01'), title: 'Founded', description: 'Greg McLemore founds Pets.com. Amazon later invests.' },
          { stage: 'growth', eventDate: new Date('2000-01-30'), title: 'Super Bowl Ad', description: 'Famous sock puppet Super Bowl ad airs. $1.2M spent.' },
          { stage: 'launch', eventDate: new Date('2000-02-11'), title: 'IPO', description: 'IPO raises $82.5M at $11/share.' },
          { stage: 'shutdown', eventDate: new Date('2000-11-07'), title: 'Liquidation', description: 'Company liquidated. Stock at $0.19.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 50,
          monetizationScore: 95,
          pmfScore: 60,
          marketingScore: 80,
          primaryCause: 'Broken Unit Economics',
          confidence: 93,
          recommendations: [
            { priority: 'high', action: 'Achieve contribution-positive unit economics before scaling.', rationale: 'Pets.com\'s logistics costs made every order a guaranteed loss at scale.' },
            { priority: 'medium', action: 'Brand marketing should follow, not precede, product-market validation.', rationale: 'A $1.2M Super Bowl ad for an unprofitable business accelerated the burn without fixing the model.' },
          ],
        },
      },
    },
  });

  const webvan = await prisma.company.upsert({
    where: { slug: 'webvan' },
    update: {},
    create: {
      name: 'Webvan',
      slug: 'webvan',
      status: 'failed',
      industry: 'Grocery Delivery',
      country: 'USA',
      foundingYear: 1996,
      shutdownYear: 2001,
      lifetimeMonths: 60,
      fundingInr: 66400000000n, // ~$800M
      peakUsers: 750000,
      teamSize: 4500,
      summary: 'Grocery delivery startup that built a billion-dollar logistics infrastructure before validating demand. Shut down after burning through $800M.',
      founderStory: '# The Webvan Story\n\nWebvan had the right idea — 20 years too early. Home grocery delivery is now a massive industry. In 1999, Webvan signed a $1B contract with Bechtel to build 26 automated warehouses across the US before the company had even validated demand in its first market.\n\n## The Overreach\nThe company expanded from San Francisco to Atlanta, Chicago, Dallas, and other cities while still burning through capital trying to reach profitability in its original market. The logistics infrastructure costs were enormous.\n\n## The Collapse\nWhen the dot-com bubble burst and investor patience ran out, Webvan could not sustain its burn rate. It filed for bankruptcy in July 2001, one of the largest dot-com collapses in history.\n\n## The Lesson\nScale only after product-market fit. Never sign billion-dollar infrastructure contracts before proving the model works at a single-city level.',
      failureReasons: {
        create: [
          { category: 'strategy', severityScore: 97, description: 'Signed $1B infrastructure contract and expanded to 26 cities before validating demand.', isPrimary: true },
          { category: 'unit_economics', severityScore: 80, description: 'Grocery delivery margins were razor-thin; logistics costs were enormous.' },
          { category: 'timing', severityScore: 65, description: 'Consumer behavior and smartphone adoption were 15 years behind the business model.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('1996-01-01'), title: 'Founded', description: 'Louis Borders (of Borders Books) founds Webvan.' },
          { stage: 'growth', eventDate: new Date('1999-08-01'), title: '$1B Bechtel Contract', description: 'Signs $1B contract to build 26 warehouses before validating demand.' },
          { stage: 'launch', eventDate: new Date('1999-11-05'), title: 'IPO', description: 'IPO raises $375M. Stock opens at $15.' },
          { stage: 'decline', eventDate: new Date('2001-04-01'), title: 'Expansion Halted', description: 'Halts expansion. Announces layoffs of 2,000 employees.' },
          { stage: 'shutdown', eventDate: new Date('2001-07-09'), title: 'Bankruptcy Filed', description: 'Files Chapter 11 bankruptcy. 2,000 jobs lost.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 65,
          monetizationScore: 75,
          pmfScore: 70,
          marketingScore: 40,
          primaryCause: 'Premature Scaling',
          confidence: 94,
          recommendations: [
            { priority: 'high', action: 'Prove the model works profitably in one city before committing to national infrastructure.', rationale: 'Webvan\'s $1B infrastructure commitment created irreversible fixed costs before PMF was established.' },
            { priority: 'high', action: 'Scale only after achieving product-market fit.', rationale: 'Rapid multi-city expansion amplified losses rather than leveraging economies of scale.' },
          ],
        },
      },
    },
  });

  const moviepass = await prisma.company.upsert({
    where: { slug: 'moviepass' },
    update: {},
    create: {
      name: 'MoviePass',
      slug: 'moviepass',
      status: 'failed',
      industry: 'Entertainment',
      country: 'USA',
      foundingYear: 2011,
      shutdownYear: 2019,
      lifetimeMonths: 96,
      fundingInr: 5810000000n, // ~$70M
      peakUsers: 3000000,
      teamSize: 80,
      summary: 'Unlimited movie subscription at $9.95/month. Grew to 3M subscribers but paid theaters full ticket price, making the unit economics mathematically impossible.',
      founderStory: '# The MoviePass Story\n\nMoviePass was a product users genuinely loved — see unlimited movies for $9.95/month. The problem was the company paid theaters full ticket prices of $12–15 per movie, meaning every active user was a direct financial loss.\n\n## The Growth Trap\nWhen they dropped the price to $9.95/month in 2017, subscribers exploded from 20,000 to 3 million in a year. That growth killed them. Three million subscribers each watching 2 movies/month meant MoviePass was losing $30–50M per month.\n\n## The Death Spiral\nMoviePass began restricting access for heavy users — blocking them during peak hours, removing popular films, forcing 3-factor authentication. The loyal users revolted. Subscribers churned. New investors refused to fund the model.\n\n## The Lesson\nA great user offer must still make business sense. Negative-margin growth is not a strategy.',
      failureReasons: {
        create: [
          { category: 'unit_economics', severityScore: 99, description: 'Paid theaters full ticket price (~$13) while charging users $9.95/month. Loss guaranteed on any active subscriber.', isPrimary: true },
          { category: 'monetization', severityScore: 85, description: 'No viable alternative revenue stream (data monetization, theatre partnerships) developed before capital ran out.' },
          { category: 'product', severityScore: 70, description: 'Throttling loyal heavy users destroyed trust and accelerated churn.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2011-01-01'), title: 'Founded', description: 'Stacy Spikes and Hamet Watt found MoviePass.' },
          { stage: 'growth', eventDate: new Date('2017-08-15'), title: 'Price Drop to $9.95', description: 'Price drop triggers explosive growth: 20K to 3M subscribers in 12 months.' },
          { stage: 'growth', eventDate: new Date('2018-02-01'), title: '3M Subscribers', description: 'Peak subscriber count. Company losing $40M/month.' },
          { stage: 'decline', eventDate: new Date('2018-07-01'), title: 'Throttling Begins', description: 'Begins blocking movies and restricting heavy users. Public backlash.' },
          { stage: 'shutdown', eventDate: new Date('2019-09-14'), title: 'Service Shutdown', description: 'MoviePass service suspended indefinitely.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 70,
          monetizationScore: 99,
          pmfScore: 50,
          marketingScore: 30,
          primaryCause: 'Broken Unit Economics',
          confidence: 98,
          recommendations: [
            { priority: 'high', action: 'Never launch a consumer subscription where the cost of service exceeds subscription revenue with no plan to close the gap.', rationale: 'MoviePass\'s model was mathematically guaranteed to fail unless theatre partnerships or data revenues materialized — they never did.' },
            { priority: 'medium', action: 'Build throttling and fair-use policies BEFORE heavy users expose the flaw, not after.', rationale: 'Retroactively restricting users who signed up for unlimited service is a trust-destroying PR disaster.' },
          ],
        },
      },
    },
  });

  const beepi = await prisma.company.upsert({
    where: { slug: 'beepi' },
    update: {},
    create: {
      name: 'Beepi',
      slug: 'beepi',
      status: 'failed',
      industry: 'Marketplace',
      country: 'USA',
      foundingYear: 2013,
      shutdownYear: 2017,
      lifetimeMonths: 48,
      fundingInr: 12450000000n, // ~$150M
      peakUsers: 25000,
      teamSize: 200,
      summary: 'Managed peer-to-peer used car marketplace. Raised $150M but operational costs for car inspection and logistics exceeded margins.',
      founderStory: '# The Beepi Story\n\nBeepi promised a safe, transparent way to buy and sell used cars online. The company would inspect every car, handle all paperwork, and deliver the vehicle. A genuinely better experience — at an unsustainable cost.\n\n## The Operations Problem\nTo deliver on the quality promise, Beepi employed inspectors in each city, handled DMV paperwork in 50 states, and managed logistics of moving vehicles. Each transaction cost the company ~$3,000–5,000 to execute.\n\n## The Economics\nWith an average car sale margin of ~$1,000–1,500, every transaction was a guaranteed loss. The more cars Beepi sold, the more money it lost.\n\n## The Lesson\nMarketplaces fail when unit economics fail. A premium experience means nothing if the cost of delivering that experience exceeds what customers pay.',
      failureReasons: {
        create: [
          { category: 'unit_economics', severityScore: 93, description: 'Operational costs ($3-5K per transaction) far exceeded transaction margins (~$1-1.5K).', isPrimary: true },
          { category: 'operations', severityScore: 80, description: 'Multi-state DMV and logistics complexity created enormous fixed costs before scale.' },
          { category: 'cashflow', severityScore: 60, description: 'Failed to raise Series C after burn rate became apparent to investors.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2013-01-01'), title: 'Founded', description: 'Ale Resnik and Owen Savir found Beepi.' },
          { stage: 'growth', eventDate: new Date('2015-06-01'), title: '$60M Series B', description: 'Raises $60M, expands to multiple cities.' },
          { stage: 'decline', eventDate: new Date('2016-09-01'), title: 'Series C Falls Through', description: 'Planned $50M Series C collapses. Begins cutting costs.' },
          { stage: 'shutdown', eventDate: new Date('2017-02-01'), title: 'Shutdown', description: 'Operations wind down. Assets acquired by Fair.com.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 55,
          monetizationScore: 90,
          pmfScore: 65,
          marketingScore: 50,
          primaryCause: 'Broken Unit Economics',
          confidence: 89,
          recommendations: [
            { priority: 'high', action: 'Map every cost of fulfillment before committing to a service-heavy marketplace model.', rationale: 'Beepi\'s quality promise was real but each delivery cost more than it earned.' },
            { priority: 'medium', action: 'Marketplaces must achieve contribution-positive transactions before scaling geographically.', rationale: 'Expanding to new cities multiplied losses before the core model was profitable.' },
          ],
        },
      },
    },
  });

  const homejoy = await prisma.company.upsert({
    where: { slug: 'homejoy' },
    update: {},
    create: {
      name: 'Homejoy',
      slug: 'homejoy',
      status: 'failed',
      industry: 'Home Services',
      country: 'USA',
      foundingYear: 2010,
      shutdownYear: 2015,
      lifetimeMonths: 60,
      fundingInr: 3320000000n, // ~$40M
      peakUsers: 50000,
      teamSize: 100,
      summary: 'On-demand home cleaning platform. Shut down amid worker misclassification lawsuits after strong early growth.',
      founderStory: '# The Homejoy Story\n\nHomejoy was growing well — on-demand cleaning bookings, expanding cities, happy customers. Then came the lawsuits.\n\n## The Legal Problem\nHomejoy classified cleaners as independent contractors, not employees. Multiple lawsuits alleged this was misclassification — that the company controlled the work like an employer should. Four simultaneous misclassification lawsuits made it impossible to raise additional capital.\n\n## The Collapse\nYY Tang, the co-founder, acknowledged the lawsuits were the primary reason for shutdown. The company could not raise a new round with the legal liability looming.\n\n## The Lesson\nLegal risk can destroy an otherwise successful product. The gig economy model requires careful legal structuring — not as an afterthought, but from day one.',
      failureReasons: {
        create: [
          { category: 'legal', severityScore: 95, description: 'Four simultaneous worker misclassification lawsuits made fundraising impossible.', isPrimary: true },
          { category: 'retention', severityScore: 70, description: 'High worker churn as cleaners found direct clients and bypassed the platform.' },
          { category: 'competition', severityScore: 50, description: 'Amazon Home Services and others entered the market with stronger balance sheets.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2010-01-01'), title: 'Founded', description: 'Adora Cheung and Aaron Tang found Homejoy.' },
          { stage: 'growth', eventDate: new Date('2013-07-01'), title: '$38M Raised', description: 'Raises $38M Series A, expands to 35 cities.' },
          { stage: 'decline', eventDate: new Date('2014-12-01'), title: 'Lawsuits Filed', description: 'Worker misclassification lawsuits filed. Fundraising stalls.' },
          { stage: 'shutdown', eventDate: new Date('2015-07-31'), title: 'Shutdown', description: 'Homejoy shuts down, citing lawsuits as primary reason.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 60,
          monetizationScore: 55,
          pmfScore: 40,
          marketingScore: 45,
          primaryCause: 'Legal Risk',
          confidence: 87,
          recommendations: [
            { priority: 'high', action: 'Engage employment lawyers to structure contractor relationships before scaling.', rationale: 'Misclassification lawsuits are existential for gig-economy businesses and cannot be resolved quickly.' },
            { priority: 'medium', action: 'Build worker retention into the platform — not just customer retention.', rationale: 'Cleaner bypass (finding clients directly) eroded the marketplace network effect.' },
          ],
        },
      },
    },
  });

  const jawbone = await prisma.company.upsert({
    where: { slug: 'jawbone' },
    update: {},
    create: {
      name: 'Jawbone',
      slug: 'jawbone',
      status: 'failed',
      industry: 'Wearables',
      country: 'USA',
      foundingYear: 1999,
      shutdownYear: 2017,
      lifetimeMonths: 216,
      fundingInr: 74730000000n, // ~$900M
      peakUsers: 5000000,
      teamSize: 450,
      summary: 'Wearable fitness tracker and Bluetooth speaker maker. Raised nearly $1B but was outcompeted by Apple, Fitbit, and Samsung with deeper pockets.',
      founderStory: '# The Jawbone Story\n\nJawbone was actually a pioneer — their Bluetooth headsets and later fitness trackers were genuinely innovative. At peak, they were a billion-dollar company. The collapse was a masterclass in what happens when execution falters under competitive pressure.\n\n## The Competition\nWhen Apple Watch launched in 2015, Fitbit was growing explosively, and Samsung was pouring resources into wearables — Jawbone could not keep up. Manufacturing issues, hardware defects, and delayed products eroded customer trust.\n\n## The Funding Trap\nDespite raising nearly $1B, Jawbone spent most of it on hardware manufacturing and legal battles with Fitbit. They could not out-invest the bigger players.\n\n## The Lesson\nExecution matters more than funding. A strong balance sheet cannot save a company that cannot ship reliable product on time against better-resourced competitors.',
      failureReasons: {
        create: [
          { category: 'competition', severityScore: 88, description: 'Apple, Fitbit, and Samsung entered the wearables space with superior resources and brand.', isPrimary: true },
          { category: 'execution', severityScore: 82, description: 'Hardware defects and manufacturing delays damaged the brand significantly.' },
          { category: 'legal', severityScore: 60, description: 'Expensive legal battles with Fitbit drained resources from product development.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('1999-01-01'), title: 'Founded', description: 'Founded as Aliph, focused on Bluetooth headsets.' },
          { stage: 'growth', eventDate: new Date('2011-11-01'), title: 'UP Fitness Band', description: 'Launches UP fitness tracker. Strong initial demand.' },
          { stage: 'decline', eventDate: new Date('2015-04-01'), title: 'Apple Watch Launch', description: 'Apple Watch launches. Competitive pressure intensifies dramatically.' },
          { stage: 'shutdown', eventDate: new Date('2017-07-06'), title: 'Liquidation', description: 'Jawbone begins liquidation proceedings. Assets acquired for medical wearables pivot.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 65,
          monetizationScore: 60,
          pmfScore: 50,
          marketingScore: 55,
          primaryCause: 'Competitive Displacement',
          confidence: 85,
          recommendations: [
            { priority: 'high', action: 'Identify and build defensible moats before large incumbents enter the space.', rationale: 'Jawbone had a head start but no moat that could survive Apple entering the category.' },
            { priority: 'medium', action: 'Hardware quality and shipping reliability are non-negotiable customer trust signals.', rationale: 'Defective products and delayed launches eroded the brand ahead of the key competitive battle.' },
          ],
        },
      },
    },
  });

  const colorLabs = await prisma.company.upsert({
    where: { slug: 'color-labs' },
    update: {},
    create: {
      name: 'Color Labs',
      slug: 'color-labs',
      status: 'failed',
      industry: 'Social Media',
      country: 'USA',
      foundingYear: 2011,
      shutdownYear: 2012,
      lifetimeMonths: 18,
      fundingInr: 3403000000n, // ~$41M
      peakUsers: 50000,
      teamSize: 30,
      summary: 'Location-based photo sharing app that raised $41M but users could not understand what it did. Shut down in under 2 years.',
      founderStory: '# The Color Labs Story\n\nColor Labs raised $41M before launching a single line of code — one of the largest pre-launch raises in startup history at the time. When the app launched in March 2011, nobody could figure out what it was supposed to do.\n\n## The Confusion\nColor was a location-based social photo sharing app where strangers near you could see your photos. The concept was novel but completely opaque to users. Tech journalists couldn\'t explain it. Normal users certainly couldn\'t.\n\n## The Result\nWithout a clear use case, adoption was minimal. The $41M lasted the company about 18 months before it was acquired by Apple and shut down.\n\n## The Lesson\nIf people cannot explain your product to others, they will not use it. No amount of funding compensates for a product that confuses its intended users.',
      failureReasons: {
        create: [
          { category: 'product', severityScore: 95, description: 'Users could not understand the core value proposition. Journalists could not explain it either.', isPrimary: true },
          { category: 'pmf', severityScore: 85, description: 'Location-based stranger photo sharing was a solution looking for a problem.' },
          { category: 'cashflow', severityScore: 50, description: 'Enormous pre-launch raise created outsized expectations the product could never meet.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2011-03-23'), title: 'Launch with $41M', description: 'Launches with record pre-launch funding. Immediate confusion from users and press.' },
          { stage: 'decline', eventDate: new Date('2011-06-01'), title: 'Usage Stagnates', description: 'Retention near zero. Multiple product pivots attempted.' },
          { stage: 'shutdown', eventDate: new Date('2012-10-17'), title: 'Acquired by Apple', description: 'Apple acqui-hires the team. App shuts down.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 97,
          monetizationScore: 50,
          pmfScore: 95,
          marketingScore: 70,
          primaryCause: 'Incomprehensible Product',
          confidence: 92,
          recommendations: [
            { priority: 'high', action: 'Test whether users can explain your product back to you in one sentence before raising capital.', rationale: 'Color could not pass this test. No user could summarize the value proposition.' },
            { priority: 'high', action: 'If people cannot explain your product, they will not share it — and social apps die without sharing.', rationale: 'Color\'s organic growth was zero because nobody knew what to invite their friends to.' },
          ],
        },
      },
    },
  });

  const secret = await prisma.company.upsert({
    where: { slug: 'secret-app' },
    update: {},
    create: {
      name: 'Secret',
      slug: 'secret-app',
      status: 'failed',
      industry: 'Social Media',
      country: 'USA',
      foundingYear: 2013,
      shutdownYear: 2015,
      lifetimeMonths: 24,
      fundingInr: 2490000000n, // ~$30M
      peakUsers: 15000000,
      teamSize: 15,
      summary: 'Anonymous secret-sharing social app. Grew to millions of users but devolved into cyberbullying, harassment, and hate speech that the team could not moderate.',
      founderStory: '# The Secret Story\n\nSecret was one of the hottest apps of 2014. The concept: share anonymous "secrets" with friends and strangers. The initial use was surprisingly heartfelt — personal confessions, mental health reflections, career anxieties.\n\n## The Moderation Problem\nAnonymity without accountability always trends dark. Within months of viral growth, Secret became a vehicle for targeted bullying, doxxing, and harassment. The small team was overwhelmed by moderation demands.\n\n## The Shutdown\nFounder David Byttow shut down the app voluntarily in April 2015, stating he did not want to be responsible for the harm the platform was causing. He returned investor money.\n\n## The Lesson\nAnonymous social communities without strong moderation systems eventually trend toxic. Anonymity + scale = moderation impossibility without dedicated infrastructure.',
      failureReasons: {
        create: [
          { category: 'community', severityScore: 92, description: 'Anonymous platform became a vector for targeted harassment, bullying, and doxxing at scale.', isPrimary: true },
          { category: 'product', severityScore: 70, description: 'Anonymity features made it impossible to enforce community standards consistently.' },
          { category: 'ethics', severityScore: 80, description: 'Founder chose to shut down rather than allow ongoing harm — a rare ethical decision.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2014-01-01'), title: 'Launch', description: 'Secret launches to immediate viral growth in Silicon Valley.' },
          { stage: 'growth', eventDate: new Date('2014-08-01'), title: 'Peak Growth', description: 'Millions of active users. Raises $25M Series A.' },
          { stage: 'decline', eventDate: new Date('2014-10-01'), title: 'Harassment Epidemic', description: 'Press coverage of bullying and harm on the platform intensifies.' },
          { stage: 'shutdown', eventDate: new Date('2015-04-29'), title: 'Voluntary Shutdown', description: 'Founder shuts down voluntarily. Returns investor capital.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 60,
          monetizationScore: 50,
          pmfScore: 55,
          marketingScore: 40,
          primaryCause: 'Community Moderation Failure',
          confidence: 88,
          recommendations: [
            { priority: 'high', action: 'Anonymous communities require moderation infrastructure before reaching scale, not after.', rationale: 'Retroactive moderation at scale is operationally impossible for a small team.' },
            { priority: 'medium', action: 'Design anonymity features with accountability mechanisms — ephemeral content, rate limiting, report queues.', rationale: 'Unlimited anonymous speech with no consequences predictably produces harassment.' },
          ],
        },
      },
    },
  });

  const yikYak = await prisma.company.upsert({
    where: { slug: 'yik-yak' },
    update: {},
    create: {
      name: 'Yik Yak',
      slug: 'yik-yak',
      status: 'failed',
      industry: 'Social Media',
      country: 'USA',
      foundingYear: 2013,
      shutdownYear: 2017,
      lifetimeMonths: 48,
      fundingInr: 7470000000n, // ~$90M
      peakUsers: 1800000,
      teamSize: 50,
      summary: 'Location-based anonymous social network popular on college campuses. Grew fast, became a harassment vector, lost users, and sold for $1M after raising $73M.',
      founderStory: '# The Yik Yak Story\n\nYik Yak was a phenomenon on college campuses. Anonymous, local posts visible within a 1.5-mile radius — essentially a digital town square for each campus.\n\n## The Growth\nAt peak, Yik Yak had 1.8M users and was valued at $400M. It was in the top 10 social apps in the App Store.\n\n## The Toxicity\nBullying, threats, racism, and harassment became rampant. Universities and schools sought to ban the app. A 12-year-old was expelled for posting threats. The company was under constant legal pressure.\n\n## The Death\nAttempts to add usernames to reduce anonymity drove away the core user base — the product was the anonymity. Growth collapsed. Sold to Square for $1M in 2017 after raising $73M.\n\n## The Lesson\nGrowth without healthy community systems creates toxicity. Toxicity destroys growth.',
      failureReasons: {
        create: [
          { category: 'community', severityScore: 90, description: 'Rampant harassment, threats, and bullying without adequate moderation infrastructure.', isPrimary: true },
          { category: 'product', severityScore: 75, description: 'Adding usernames to combat abuse destroyed the anonymous appeal that created growth.' },
          { category: 'legal', severityScore: 65, description: 'Constant legal pressure from schools and law enforcement drained resources.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2013-08-01'), title: 'Campus Launch', description: 'Launches at Furman University. Spreads virally across US colleges.' },
          { stage: 'growth', eventDate: new Date('2014-11-01'), title: '$400M Valuation', description: 'Raises $73M. Top 10 social app in App Store.' },
          { stage: 'decline', eventDate: new Date('2016-04-01'), title: 'Username Rollout', description: 'Adds usernames to combat abuse. Core users abandon platform.' },
          { stage: 'shutdown', eventDate: new Date('2017-04-28'), title: 'Acquired for $1M', description: 'Sold to Square for $1M. App shut down.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 70,
          monetizationScore: 65,
          pmfScore: 60,
          marketingScore: 45,
          primaryCause: 'Toxic Community Dynamics',
          confidence: 86,
          recommendations: [
            { priority: 'high', action: 'Build community health systems in parallel with growth, not as a reaction to crises.', rationale: 'Yik Yak\'s harassment problem was predictable and required proactive investment in safety systems.' },
            { priority: 'high', action: 'Understand that features driving growth can also drive harm — design with both in mind.', rationale: 'Anonymity was both the growth engine and the toxicity engine. There was no surgical fix.' },
          ],
        },
      },
    },
  });

  const rdio = await prisma.company.upsert({
    where: { slug: 'rdio' },
    update: {},
    create: {
      name: 'Rdio',
      slug: 'rdio',
      status: 'failed',
      industry: 'Music Streaming',
      country: 'USA',
      foundingYear: 2008,
      shutdownYear: 2015,
      lifetimeMonths: 84,
      fundingInr: 1245000000n, // ~$15M (less, but had Skype co-founders' credibility)
      peakUsers: 5000000,
      teamSize: 150,
      summary: 'Music streaming service from Skype co-founders. Beautifully designed but unable to compete with Spotify\'s aggressive expansion and Pandora\'s brand.',
      founderStory: '# The Rdio Story\n\nRdio was genuinely excellent. Founded by Janus Friis and Niklas Zennström, the creators of Skype and Kazaa, Rdio offered a beautiful, social music streaming experience. Music critics loved it.\n\n## The Competition\nSpotify, backed by enormous European capital, expanded into the US with aggressive free-tier marketing. Pandora owned the US streaming radio market. Apple had iTunes. Rdio had a superior interface and weaker distribution.\n\n## The Survival Fight\nRdio tried licensing deals, family plans, and demographic pivots. None worked fast enough. Pandora acquired Rdio\'s assets for $75M in November 2015 — far below any reasonable valuation for the team and product.\n\n## The Lesson\nCompeting against dominant incumbents with better-capitalized distribution requires a unique, defensible moat. Beautiful product design alone is not a sustainable competitive advantage.',
      failureReasons: {
        create: [
          { category: 'competition', severityScore: 92, description: 'Spotify\'s US expansion with massive free tier marketing overwhelmed Rdio\'s distribution.', isPrimary: true },
          { category: 'cashflow', severityScore: 80, description: 'Underfunded relative to Spotify for the cost of music licensing and user acquisition.' },
          { category: 'operations', severityScore: 70, description: 'Weaker carrier and device partnerships meant less default placement than competitors.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2010-08-01'), title: 'US Launch', description: 'Rdio launches in the US with strong press reception.' },
          { stage: 'growth', eventDate: new Date('2011-06-01'), title: 'Spotify US Launch', description: 'Spotify launches in the US. Competitive battle begins.' },
          { stage: 'decline', eventDate: new Date('2014-01-01'), title: 'Market Share Loss', description: 'Rdio loses significant market share to Spotify. Cost-cutting begins.' },
          { stage: 'shutdown', eventDate: new Date('2015-11-17'), title: 'Pandora Acquisition', description: 'Pandora acquires key Rdio assets for $75M. Service shuts down.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 55,
          monetizationScore: 60,
          pmfScore: 45,
          marketingScore: 65,
          primaryCause: 'Competitive Displacement',
          confidence: 84,
          recommendations: [
            { priority: 'high', action: 'Design defensible distribution moats early — carrier deals, device bundles, exclusive content.', rationale: 'Rdio had product quality but Spotify had distribution. Distribution won.' },
            { priority: 'medium', action: 'In winner-take-most markets, raise aggressively or find a niche to own.', rationale: 'Music streaming was not a market that could support three strong players long-term.' },
          ],
        },
      },
    },
  });

  const fab = await prisma.company.upsert({
    where: { slug: 'fab-com' },
    update: {},
    create: {
      name: 'Fab',
      slug: 'fab-com',
      status: 'failed',
      industry: 'E-Commerce',
      country: 'USA',
      foundingYear: 2010,
      shutdownYear: 2015,
      lifetimeMonths: 60,
      fundingInr: 16550000000n, // ~$200M
      peakUsers: 10000000,
      teamSize: 700,
      summary: 'Design-focused e-commerce marketplace that pivoted from gay social network to flash sales to custom furniture. Constant pivots destroyed focus and culture.',
      founderStory: '# The Fab Story\n\nFab began as a gay social network (Fabulis), pivoted to flash design sales, raised $200M at a $1B valuation, hired 700 people, then collapsed to a $15M acqui-hire.\n\n## The Pivot Spiral\nEvery time growth stalled, Fab changed direction. Flash sales → curated marketplace → custom furniture. Each pivot required new supplier relationships, new logistics, new marketing. The team never stabilized around a singular vision.\n\n## The Cultural Damage\nHiring 700 people for a flash sale site and then pivoting to custom furniture is operationally catastrophic. Multiple rounds of layoffs destroyed morale and talent.\n\n## The Lesson\nConstant pivots confuse customers and teams. A pivot should be a decisive strategy change — not a habit of avoiding hard decisions.',
      failureReasons: {
        create: [
          { category: 'strategy', severityScore: 90, description: 'Three major business model pivots in 4 years: social network → flash sales → custom furniture.', isPrimary: true },
          { category: 'execution', severityScore: 80, description: 'Hired 700 employees for a flash sale model before the model was proven.' },
          { category: 'team', severityScore: 70, description: 'Multiple layoff rounds destroyed team morale and institutional knowledge.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2010-01-01'), title: 'Founded as Fabulis', description: 'Gay social network. Struggles to gain traction.' },
          { stage: 'launch', eventDate: new Date('2011-06-01'), title: 'Pivot to Flash Design Sales', description: 'Relaunches as Fab. 1M members in 6 months.' },
          { stage: 'growth', eventDate: new Date('2013-01-01'), title: '$1B Valuation', description: 'Raises $150M at $1B valuation. 700 employees.' },
          { stage: 'decline', eventDate: new Date('2013-08-01'), title: 'Pivot to Custom Furniture', description: 'Major pivot. Layoffs begin. Culture fractures.' },
          { stage: 'shutdown', eventDate: new Date('2015-03-01'), title: 'Acqui-hire', description: 'Sold to PCH International for ~$15M.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 65,
          monetizationScore: 70,
          pmfScore: 75,
          marketingScore: 60,
          primaryCause: 'Strategic Incoherence',
          confidence: 88,
          recommendations: [
            { priority: 'high', action: 'A pivot should be a strategic decision — not a reflex to avoid fixing a broken model.', rationale: 'Fab pivoted instead of fixing unit economics, creating compounding confusion for customers and team.' },
            { priority: 'high', action: 'Never hire for a business model before that model has proven PMF.', rationale: '700 hires for an unproven flash sale model created irreversible burn pressure.' },
          ],
        },
      },
    },
  });

  const zirtual = await prisma.company.upsert({
    where: { slug: 'zirtual' },
    update: {},
    create: {
      name: 'Zirtual',
      slug: 'zirtual',
      status: 'failed',
      industry: 'Future of Work',
      country: 'USA',
      foundingYear: 2011,
      shutdownYear: 2015,
      lifetimeMonths: 48,
      fundingInr: 830000000n, // ~$10M
      peakUsers: 5000,
      teamSize: 400,
      summary: 'Virtual assistant service matching clients with dedicated US-based assistants. Strong revenue but collapsed overnight due to payroll crisis from accounting errors.',
      founderStory: '# The Zirtual Story\n\nZirtual was growing and had real revenue. $5.6M ARR, 400 employees, 5,000 clients. Then one Monday in August 2015, every employee received an email saying they were laid off effective immediately. No warning.\n\n## The Cash Flow Crisis\nA botched financial model had miscalculated the cost of benefits, payroll taxes, and worker classification for 400 full-time employees. The company was hemorrhaging cash without realizing it. By the time the accounting error surfaced, there was no runway left.\n\n## The Shutdown\nClients lost access overnight. Employees lost jobs with no notice. The reputational damage was severe. Maren Kate Donovan was forced to publicly apologize.\n\n## The Lesson\nCash flow management is more important than vanity growth. Revenue without accurate cost accounting is a slow-moving disaster.',
      failureReasons: {
        create: [
          { category: 'cashflow', severityScore: 97, description: 'Accounting error miscalculated true cost of 400 full-time employees. Cash crisis was invisible until collapse.', isPrimary: true },
          { category: 'operations', severityScore: 75, description: 'Classifying workers as full-time employees created enormous fixed cost base.' },
          { category: 'leadership', severityScore: 65, description: 'No real-time financial dashboards to catch the payroll discrepancy before it became critical.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'growth', eventDate: new Date('2014-01-01'), title: 'Strong Revenue Growth', description: '$5.6M ARR, 400 employees, 5,000 clients.' },
          { stage: 'shutdown', eventDate: new Date('2015-08-10'), title: 'Overnight Shutdown', description: '400 employees laid off via email. No notice. Client access cut off.' },
          { stage: 'shutdown', eventDate: new Date('2015-08-14'), title: 'Marin Software Acquisition', description: 'Assets acquired by Marin Software days after collapse.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 35,
          monetizationScore: 40,
          pmfScore: 30,
          marketingScore: 40,
          primaryCause: 'Cash Flow Mismanagement',
          confidence: 93,
          recommendations: [
            { priority: 'high', action: 'Implement real-time cash flow dashboards with alerts for burn rate deviations.', rationale: 'Zirtual\'s crisis was invisible in their financial model until it was too late.' },
            { priority: 'high', action: 'Cash flow is more important than revenue. Model the true cost of your workforce before hiring.', rationale: 'The company had strong revenue but the true cost of employment was materially miscalculated.' },
          ],
        },
      },
    },
  });

  const betterPlace = await prisma.company.upsert({
    where: { slug: 'better-place' },
    update: {},
    create: {
      name: 'Better Place',
      slug: 'better-place',
      status: 'failed',
      industry: 'Electric Vehicles',
      country: 'Israel',
      foundingYear: 2007,
      shutdownYear: 2013,
      lifetimeMonths: 72,
      fundingInr: 69720000000n, // ~$850M
      peakUsers: 1000,
      teamSize: 900,
      summary: 'Electric vehicle battery-swap network. Raised $850M to build infrastructure for a car ownership model that never reached critical adoption.',
      founderStory: '# The Better Place Story\n\nBetter Place had a genuinely elegant solution to EV range anxiety: instead of charging, you would swap your depleted battery for a full one in under 5 minutes. Think of it as a gas station for EVs.\n\n## The Infrastructure Bet\nBuilding swap stations required enormous upfront capital before a single car was sold. Better Place raised $850M and built stations in Israel and Denmark — but only one car model (Renault Fluence) was compatible.\n\n## The Adoption Failure\nOnly ~1,000 cars were sold in Israel. The network needed tens of thousands of compatible EVs to justify the infrastructure. Without volume, the stations sat empty.\n\n## The Lesson\nInfrastructure-heavy businesses need realistic adoption forecasts. Building the supply side of a two-sided market requires the demand side to exist first.',
      failureReasons: {
        create: [
          { category: 'pmf', severityScore: 95, description: 'Battery swap network needed large EV fleet to be viable. EV fleet needed the network first.', isPrimary: true },
          { category: 'strategy', severityScore: 85, description: 'Built expensive infrastructure before validating adoption at scale.' },
          { category: 'strategy', severityScore: 70, description: 'Only Renault Fluence compatibility meant the serviceable market was tiny.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2007-10-01'), title: 'Founded', description: 'Shai Agassi founds Better Place with vision of battery-swap EV infrastructure.' },
          { stage: 'growth', eventDate: new Date('2010-01-01'), title: 'Station Construction', description: 'Begins building swap stations in Israel and Denmark.' },
          { stage: 'launch', eventDate: new Date('2012-01-01'), title: 'Consumer Launch', description: 'First consumer cars sold. Target: 100,000 cars. Actual: ~1,000.' },
          { stage: 'shutdown', eventDate: new Date('2013-05-26'), title: 'Bankruptcy', description: 'Files for bankruptcy with $850M raised and fewer than 1,000 customers.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 40,
          monetizationScore: 65,
          pmfScore: 80,
          marketingScore: 55,
          primaryCause: 'Infrastructure Chicken-and-Egg',
          confidence: 90,
          recommendations: [
            { priority: 'high', action: 'Validate demand at small scale before committing to infrastructure investment.', rationale: 'Better Place needed thousands of paying customers before building hundreds of swap stations.' },
            { priority: 'high', action: 'Infrastructure-heavy businesses need adoption forecasts based on validated demand, not executive optimism.', rationale: 'The 100,000-car forecast was never grounded in real consumer purchase data.' },
          ],
        },
      },
    },
  });

  const aereo = await prisma.company.upsert({
    where: { slug: 'aereo' },
    update: {},
    create: {
      name: 'Aereo',
      slug: 'aereo',
      status: 'failed',
      industry: 'Media / Streaming',
      country: 'USA',
      foundingYear: 2012,
      shutdownYear: 2014,
      lifetimeMonths: 24,
      fundingInr: 9130000000n, // ~$110M
      peakUsers: 50000,
      teamSize: 100,
      summary: 'Startup offering live broadcast TV over the internet via tiny antennas. Killed by a Supreme Court ruling that it infringed broadcaster copyright.',
      founderStory: '# The Aereo Story\n\nAereo had a genuinely clever legal architecture. Instead of redistributing broadcast signals (illegal), each subscriber was assigned a tiny individual antenna in a warehouse — technically making it personal off-air recording. Broadcasters hated it.\n\n## The Legal Strategy as Product\nAereo\'s entire business model was a legal argument. The product worked technically. The question was always whether courts would agree with the clever antenna workaround.\n\n## The Supreme Court\nIn June 2014, the US Supreme Court ruled 6-3 against Aereo, finding it was effectively transmitting broadcast content without a license. The ruling was swift and total — the business model ceased to exist overnight.\n\n## The Lesson\nLegal challenges can kill a startup overnight when the core product is essentially a legal argument. Build businesses on technical moats, not regulatory arbitrage alone.',
      failureReasons: {
        create: [
          { category: 'legal', severityScore: 100, description: 'Supreme Court ruled 6-3 that Aereo\'s retransmission constituted copyright infringement. Business model ceased to exist.', isPrimary: true },
          { category: 'strategy', severityScore: 75, description: 'Entire business was built on a legal interpretation that courts ultimately rejected.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2012-05-01'), title: 'NYC Launch', description: 'Launches in New York City. Broadcasters immediately sue.' },
          { stage: 'growth', eventDate: new Date('2013-04-01'), title: 'Appeals Court Win', description: 'Second Circuit Court rules in Aereo\'s favor. Raises $97M.' },
          { stage: 'shutdown', eventDate: new Date('2014-06-25'), title: 'Supreme Court Loss', description: 'Supreme Court rules 6-3 against Aereo. Service suspended same day.' },
          { stage: 'shutdown', eventDate: new Date('2014-11-21'), title: 'Bankruptcy Filed', description: 'Files Chapter 11 bankruptcy.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 40,
          monetizationScore: 50,
          pmfScore: 45,
          marketingScore: 55,
          primaryCause: 'Regulatory/Legal Risk',
          confidence: 96,
          recommendations: [
            { priority: 'high', action: 'Never build a business where the entire model is a legal arbitrage that courts have not yet validated.', rationale: 'Aereo\'s product was its legal argument. When courts disagreed, there was no product.' },
            { priority: 'medium', action: 'Obtain copyright licenses proactively rather than designing around them.', rationale: 'Broadcaster licensing deals would have been expensive but survivable; Supreme Court defeat was not.' },
          ],
        },
      },
    },
  });

  const sprig = await prisma.company.upsert({
    where: { slug: 'sprig' },
    update: {},
    create: {
      name: 'Sprig',
      slug: 'sprig',
      status: 'failed',
      industry: 'Food Delivery',
      country: 'USA',
      foundingYear: 2013,
      shutdownYear: 2017,
      lifetimeMonths: 48,
      fundingInr: 5810000000n, // ~$70M
      peakUsers: 20000,
      teamSize: 150,
      summary: 'On-demand healthy meal delivery startup. Shut down after failing to achieve density needed to make food delivery margins sustainable.',
      founderStory: '# The Sprig Story\n\nSprig was better than most food delivery: chef-prepared healthy meals delivered in 15 minutes, hot, for $12–15. The product quality was genuinely excellent. The math was impossible.\n\n## The Density Problem\nFood delivery requires density — enough orders per square mile per hour to justify driver costs. Sprig was active in San Francisco and Chicago but never achieved the order density that made unit economics work.\n\n## The Shutdown\nDespite raising $70M and executing well on product, Sprig couldn\'t reach the volume threshold to become profitable. CEO Nate Keller shut down in May 2017.\n\n## The Lesson\nFood delivery margins are difficult to sustain without massive volume. "Doing it better" is insufficient when the underlying economics require density that takes years to build.',
      failureReasons: {
        create: [
          { category: 'unit_economics', severityScore: 90, description: 'Food delivery requires density to cover labor costs. Order density never reached profitability threshold.', isPrimary: true },
          { category: 'competition', severityScore: 70, description: 'UberEats, Postmates, and DoorDash had better supply-side economics and brand awareness.' },
          { category: 'operations', severityScore: 65, description: 'Own kitchen + own delivery fleet = high fixed costs that required massive volume.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2014-06-01'), title: 'SF Launch', description: 'Launches in San Francisco with chef-prepared meals, 15-minute delivery.' },
          { stage: 'growth', eventDate: new Date('2015-09-01'), title: 'Chicago Expansion', description: 'Expands to Chicago. $45M Series B raised.' },
          { stage: 'shutdown', eventDate: new Date('2017-05-27'), title: 'Shutdown', description: 'Operations halted. CEO cites margin challenges.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 50,
          monetizationScore: 75,
          pmfScore: 65,
          marketingScore: 50,
          primaryCause: 'Structural Margin Problem',
          confidence: 86,
          recommendations: [
            { priority: 'high', action: 'Model the minimum order density required for profitability before expanding cities.', rationale: 'Sprig expanded before achieving density milestones in any single market.' },
            { priority: 'medium', action: 'Food delivery startups must reach geographic density before they can compete with aggregators.', rationale: 'UberEats\' existing driver supply gave it a structural unit economics advantage.' },
          ],
        },
      },
    },
  });

  const dopplerLabs = await prisma.company.upsert({
    where: { slug: 'doppler-labs' },
    update: {},
    create: {
      name: 'Doppler Labs',
      slug: 'doppler-labs',
      status: 'failed',
      industry: 'Consumer Hardware / Audio',
      country: 'USA',
      foundingYear: 2013,
      shutdownYear: 2017,
      lifetimeMonths: 48,
      fundingInr: 4150000000n, // ~$50M
      peakUsers: 40000,
      teamSize: 80,
      summary: 'Made "Here One" smart earbuds that could filter and augment real-world audio in real time. Technically impressive. The market wasn\'t ready.',
      founderStory: '# The Doppler Labs Story\n\nDoppler Labs created something genuinely futuristic: earbuds that could let you turn down crowd noise at a concert, tune out the person next to you on the subway, or amplify a speaker across the room — all in real time.\n\n## The Market Reality\nThe product was real and technically impressive. But at $299, for a product that required consistent charging, a learning curve, and a companion app, mass adoption was elusive.\n\n## The Apple Problem\nAirPods launched in December 2016. Apple\'s distribution, brand, and ecosystem meant that for most consumers, "smart earbuds" would now mean AirPods. Competing on audio features against Apple\'s scale was untenable.\n\n## The Lesson\nInnovative technology does not guarantee market demand. Market timing and distribution power matter more than technical novelty at the consumer hardware layer.',
      failureReasons: {
        create: [
          { category: 'timing', severityScore: 85, description: 'AirPods launch gave Apple\'s distribution advantage dominance in the smart earbuds category.', isPrimary: true },
          { category: 'pmf', severityScore: 80, description: 'Augmented audio was a feature, not a market. Insufficient consumer demand for standalone device.' },
          { category: 'competition', severityScore: 75, description: 'Competing with Apple in consumer electronics is structurally disadvantaged.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2016-09-01'), title: 'Here One Launch', description: 'Here One earbuds launch at $299. Strong press reviews.' },
          { stage: 'decline', eventDate: new Date('2016-12-13'), title: 'AirPods Release', description: 'Apple AirPods launch. Competitive landscape fundamentally shifts.' },
          { stage: 'shutdown', eventDate: new Date('2017-10-01'), title: 'Shutdown', description: 'Doppler Labs shuts down operations.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 55,
          monetizationScore: 65,
          pmfScore: 75,
          marketingScore: 55,
          primaryCause: 'Market Timing & Competitive Entry',
          confidence: 83,
          recommendations: [
            { priority: 'high', action: 'Map your competitive moat against scenarios where a mega-platform enters your category.', rationale: 'Doppler had no answer if Apple decided to build smart earbuds — and Apple did.' },
            { priority: 'medium', action: 'Technical innovation requires a distribution strategy that scales independently of the tech itself.', rationale: 'Here One\'s features were genuinely superior in some dimensions but couldn\'t match AirPods\' distribution.' },
          ],
        },
      },
    },
  });

  const shyp = await prisma.company.upsert({
    where: { slug: 'shyp' },
    update: {},
    create: {
      name: 'Shyp',
      slug: 'shyp',
      status: 'failed',
      industry: 'Logistics',
      country: 'USA',
      foundingYear: 2013,
      shutdownYear: 2018,
      lifetimeMonths: 60,
      fundingInr: 5810000000n, // ~$70M
      peakUsers: 100000,
      teamSize: 140,
      summary: 'On-demand package pickup and shipping service. Convenience was real but operational costs of sending couriers to each pickup made unit economics unworkable.',
      founderStory: '# The Shyp Story\n\nShyp\'s pitch was delightful: take a photo of what you want to ship, a courier picks it up, packages it, and sends it at the best rate. No post office. No boxes. No hassle.\n\n## The Operations Trap\nShyp employed couriers to handle every pickup — a huge variable cost. Each pickup required a courier visit whether the package was a $5 book or a $500 camera. The cost of dispatching a courier was the same regardless of the package value or shipping revenue.\n\n## The Pivot\nShyp tried to pivot to B2B (e-commerce returns) and larger shippers. The pivot came too late. Shutdown was announced in March 2018.\n\n## The Lesson\nConvenience businesses that rely on physical labor per transaction face structural margin challenges that technology cannot easily solve.',
      failureReasons: {
        create: [
          { category: 'unit_economics', severityScore: 92, description: 'Courier pickup cost per order was constant regardless of shipment value, creating structural losses.', isPrimary: true },
          { category: 'operations', severityScore: 78, description: 'Labor-intensive model was expensive to scale and difficult to automate.' },
          { category: 'competition', severityScore: 55, description: 'USPS, FedEx, and UPS offered increasingly convenient shipping options.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2014-03-01'), title: 'SF Launch', description: 'Launches in San Francisco. $2.99 pickup fee.' },
          { stage: 'growth', eventDate: new Date('2015-08-01'), title: '$50M Raised', description: 'Raises $50M Series B. Expands to 5 cities.' },
          { stage: 'decline', eventDate: new Date('2017-01-01'), title: 'B2B Pivot', description: 'Pivots to focus on business shippers. Layoffs begin.' },
          { stage: 'shutdown', eventDate: new Date('2018-03-27'), title: 'Shutdown', description: 'Shyp announces shutdown after failing to achieve profitability.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 55,
          monetizationScore: 70,
          pmfScore: 60,
          marketingScore: 45,
          primaryCause: 'Structural Unit Economics Failure',
          confidence: 87,
          recommendations: [
            { priority: 'high', action: 'Model the cost structure of labor-per-transaction services against best-case volume before investing in expansion.', rationale: 'Shyp\'s courier cost per order was fixed regardless of shipment value.' },
            { priority: 'medium', action: 'Convenience businesses must find ways to batch transactions to reduce per-unit labor costs.', rationale: 'Shyp could have explored locker drop-offs or cluster pickups to reduce courier dispatch costs.' },
          ],
        },
      },
    },
  });

  const powaTech = await prisma.company.upsert({
    where: { slug: 'powa-technologies' },
    update: {},
    create: {
      name: 'Powa Technologies',
      slug: 'powa-technologies',
      status: 'failed',
      industry: 'FinTech / Payments',
      country: 'UK',
      foundingYear: 2007,
      shutdownYear: 2016,
      lifetimeMonths: 108,
      fundingInr: 18640000000n, // ~$225M
      peakUsers: 50000,
      teamSize: 400,
      summary: 'UK-based mobile payments and commerce startup once valued at $2.7B. Collapsed amid reports of lavish spending, leadership dysfunction, and financial mismanagement.',
      founderStory: '# The Powa Technologies Story\n\nPowa was valued at $2.7 billion in 2015 and described itself as "the PayPal of the mobile era." In February 2016, it collapsed almost overnight.\n\n## The Culture of Excess\nFounder Dan Wagner was known for chartered jets, lavish parties, and aggressive recruitment of executives with sky-high salaries and option packages. The London offices were described as opulent.\n\n## The Reality\nRevenue was minimal. The flagship product — PowaTag, a QR-based shopping tool — had almost no merchant adoption. The $2.7B valuation was based on projections and founder charisma, not traction.\n\n## The Collapse\nWhen $16M in bridge funding failed to close in early 2016, the company ran out of cash within days. Administrators were appointed. 300 employees lost jobs.\n\n## The Lesson\nLeadership mistakes compound quickly at scale. Cultural excess and revenue theater in a high-burn business is fatal.',
      failureReasons: {
        create: [
          { category: 'leadership', severityScore: 95, description: 'CEO culture of excess and financial mismanagement obscured lack of real traction.', isPrimary: true },
          { category: 'pmf', severityScore: 85, description: 'PowaTag had almost no merchant adoption despite billions in implied valuation.' },
          { category: 'cashflow', severityScore: 90, description: 'Cash management was catastrophic; company was weeks from insolvency when collapse happened.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'growth', eventDate: new Date('2014-01-01'), title: 'Hyped Growth Phase', description: 'Media coverage of $2.7B valuation. Lavish London offices.' },
          { stage: 'growth', eventDate: new Date('2015-05-01'), title: 'Peak Valuation', description: 'Described as "PayPal of mobile." VC confidence high.' },
          { stage: 'shutdown', eventDate: new Date('2016-02-19'), title: 'Administration', description: 'Bridge financing fails. Administrators appointed. 300 jobs lost.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 30,
          monetizationScore: 40,
          pmfScore: 35,
          marketingScore: 30,
          primaryCause: 'Leadership & Financial Mismanagement',
          confidence: 91,
          recommendations: [
            { priority: 'high', action: 'Build board-level financial oversight that cannot be suppressed by a charismatic founder.', rationale: 'Powa\'s collapse was predictable months earlier but leadership culture prevented disclosure.' },
            { priority: 'high', action: 'Valuation must be anchored to revenue traction, not projection theater.', rationale: '$2.7B implied valuation with near-zero merchant adoption is a governance failure at investor level.' },
          ],
        },
      },
    },
  });

  const airware = await prisma.company.upsert({
    where: { slug: 'airware' },
    update: {},
    create: {
      name: 'Airware',
      slug: 'airware',
      status: 'failed',
      industry: 'Drones / Enterprise',
      country: 'USA',
      foundingYear: 2011,
      shutdownYear: 2018,
      lifetimeMonths: 84,
      fundingInr: 9130000000n, // ~$110M
      peakUsers: 200,
      teamSize: 140,
      summary: 'Enterprise drone software and operating system platform. Shut down after market matured faster than expected and Chinese hardware giants commoditized the space.',
      founderStory: '# The Airware Story\n\nAirware was ahead of the commercial drone wave. Founded in 2011, it built the operating system and software stack for commercial drones before DJI had dominated the market.\n\n## The Platform Bet\nAirware bet that enterprise drones would need a common software layer — an "Android for drones." A reasonable thesis in 2012. By 2016, DJI had captured 70% of the market and was building its own integrated software ecosystem.\n\n## The Market Shift\nAs DJI\'s hardware got cheaper and more capable, the need for a third-party OS disappeared. Enterprise customers wanted integrated solutions, not mix-and-match platforms.\n\n## The Lesson\nTiming matters as much as technology. Airware was technically right about the need for drone software — but the window for an independent platform closed when vertically integrated hardware players won.',
      failureReasons: {
        create: [
          { category: 'timing', severityScore: 88, description: 'The window for an independent drone OS closed when DJI won the hardware market and built its own software.', isPrimary: true },
          { category: 'competition', severityScore: 85, description: 'DJI\'s vertical integration eliminated the market need for a third-party drone operating system.' },
          { category: 'strategy', severityScore: 65, description: 'Platform plays require neutrality between hardware partners — difficult when one hardware player wins.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'idea', eventDate: new Date('2011-01-01'), title: 'Founded', description: 'Jonathan Downey founds Airware to build drone operating system.' },
          { stage: 'growth', eventDate: new Date('2015-03-01'), title: '$30M Series C', description: 'Raises $30M. Expansion into enterprise commercial drone software.' },
          { stage: 'decline', eventDate: new Date('2016-09-01'), title: 'DJI Market Dominance', description: 'DJI reaches 70% market share. Launches own enterprise software platform.' },
          { stage: 'shutdown', eventDate: new Date('2018-09-14'), title: 'Shutdown', description: 'Airware shuts down. ~100 employees lose jobs.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 50,
          monetizationScore: 60,
          pmfScore: 65,
          marketingScore: 45,
          primaryCause: 'Market Timing & Platform Risk',
          confidence: 85,
          recommendations: [
            { priority: 'high', action: 'Platform businesses require hardware fragmentation to survive. Monitor consolidation signals actively.', rationale: 'When DJI\'s market share crossed 50%, the independent platform thesis was already invalidated.' },
            { priority: 'medium', action: 'Timing matters as much as technology. Being right too early in a winner-take-most market is still losing.', rationale: 'Airware was technically correct about the need for drone software — 3 years before the market structure made it unviable.' },
          ],
        },
      },
    },
  });

  const vine = await prisma.company.upsert({
    where: { slug: 'vine' },
    update: {},
    create: {
      name: 'Vine',
      slug: 'vine',
      status: 'failed',
      industry: 'Social Media',
      country: 'USA',
      foundingYear: 2012,
      shutdownYear: 2016,
      lifetimeMonths: 48,
      fundingInr: 0n, // acquired by Twitter before public funding
      peakUsers: 200000000,
      teamSize: 50,
      summary: 'Twitter-owned 6-second looping video platform. Pioneered short-form video but failed to monetize for creators, who left for YouTube and Instagram.',
      founderStory: '# The Vine Story\n\nVine invented a format that is now worth hundreds of billions of dollars — short, looping, vertical video. Vine creators like King Bach, Logan Paul, and Lele Pons had tens of millions of followers. It was the birthplace of internet video culture.\n\n## The Monetization Failure\nVine never built a creator monetization program. When Instagram launched 15-second videos and YouTube offered AdSense revenue sharing, Vine\'s biggest creators were offered real money to leave. They left.\n\n## The Twitter Problem\nTwitter acquired Vine for $30M before launch and never gave it the resources or strategic autonomy it needed. When ad revenue stalled, Twitter chose to shut it down rather than invest in fixing the creator economy problem.\n\n## The Lesson\nCreators need monetization incentives. Content platforms without creator economics lose their best creators to platforms that pay.',
      failureReasons: {
        create: [
          { category: 'product', severityScore: 92, description: 'No creator monetization program. Top creators were paid nothing while generating enormous value.', isPrimary: true },
          { category: 'strategy', severityScore: 80, description: 'Twitter acquisition starved Vine of investment and strategic direction.' },
          { category: 'competition', severityScore: 75, description: 'Instagram video and YouTube offered creators real revenue. Vine offered nothing.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2013-01-24'), title: 'App Store Launch', description: 'Vine launches. Reaches 13M users in first month.' },
          { stage: 'growth', eventDate: new Date('2015-01-01'), title: '200M Users', description: 'Reaches 200M monthly active users. Meme culture thrives.' },
          { stage: 'decline', eventDate: new Date('2015-06-01'), title: 'Creator Exodus Begins', description: 'Instagram and YouTube actively recruit Vine stars with monetization deals.' },
          { stage: 'shutdown', eventDate: new Date('2016-10-27'), title: 'Shutdown Announced', description: 'Twitter announces Vine shutdown. App offline January 2017.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 55,
          monetizationScore: 80,
          pmfScore: 45,
          marketingScore: 50,
          primaryCause: 'Creator Economy Neglect',
          confidence: 93,
          recommendations: [
            { priority: 'high', action: 'Content platforms must build creator monetization before creators have leverage to leave.', rationale: 'Vine\'s top creators had millions of followers — enough leverage to demand payment elsewhere.' },
            { priority: 'high', action: 'Creators are the product. Losing creators means losing the users who follow them.', rationale: 'When King Bach left Vine, his 17M followers had no reason to stay.' },
          ],
        },
      },
    },
  });

  const googlePlus = await prisma.company.upsert({
    where: { slug: 'google-plus' },
    update: {},
    create: {
      name: 'Google Plus',
      slug: 'google-plus',
      status: 'failed',
      industry: 'Social Media',
      country: 'USA',
      foundingYear: 2011,
      shutdownYear: 2019,
      lifetimeMonths: 96,
      fundingInr: 0n, // Google internal product
      peakUsers: 395000000,
      teamSize: 1000,
      summary: 'Google\'s social network that peaked at 395M users but 90% were never active. Shut down in 2019 after a data breach and years of low engagement.',
      founderStory: '# The Google Plus Story\n\nGoogle launched Google+ in June 2011 with enormous fanfare. "Circles" was genuinely innovative. Larry Page tied all executive bonuses to its success. The company threw every resource at making it work.\n\n## The Engagement Problem\nUsers signed up — because you had to for Gmail and YouTube. But they didn\'t engage. The platform was a ghost town. A 2015 internal study found that users spent an average of 3 minutes per month on Google+.\n\n## The Data Breach\nIn 2018, Google disclosed a security vulnerability that had exposed private profile data of up to 500,000 users. The company had known about it for months and not disclosed it. The resulting scrutiny accelerated the shutdown decision.\n\n## The Lesson\nEven large companies with massive distribution cannot force social adoption. Users go where their friends are. Network effects cannot be manufactured by mandating sign-up.',
      failureReasons: {
        create: [
          { category: 'pmf', severityScore: 93, description: 'Users signed up but never engaged. Average session was 3 minutes per month.', isPrimary: true },
          { category: 'product', severityScore: 80, description: 'Forced integration with Gmail/YouTube created sign-ups without genuine interest.' },
          { category: 'competition', severityScore: 85, description: 'Could not break the Facebook-Twitter duopoly. Users\' social graphs were elsewhere.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2011-06-28'), title: 'Launch', description: 'Google+ launches with major internal resources. 10M users in 2 weeks.' },
          { stage: 'growth', eventDate: new Date('2013-05-01'), title: '500M Accounts', description: '500M accounts registered but <10% active monthly.' },
          { stage: 'decline', eventDate: new Date('2018-10-08'), title: 'Data Breach Disclosed', description: 'Google discloses security vulnerability. Accelerates shutdown planning.' },
          { stage: 'shutdown', eventDate: new Date('2019-04-02'), title: 'Shutdown', description: 'Google+ shut down for consumers. Enterprise version continues briefly.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 93,
          monetizationScore: 50,
          pmfScore: 90,
          marketingScore: 30,
          primaryCause: 'Forced Adoption Without Genuine Engagement',
          confidence: 94,
          recommendations: [
            { priority: 'high', action: 'Never conflate account creation with engagement. Track active usage, not signups.', rationale: 'Google+ had 500M accounts and a ghost town. They optimized for signups, not for genuine social behavior.' },
            { priority: 'high', action: 'Even massive distribution cannot override where users\' social graphs already exist.', rationale: 'Facebook had 10 years of social graph data. Google+ had no way to replicate that with integration tricks.' },
          ],
        },
      },
    },
  });

  const parse = await prisma.company.upsert({
    where: { slug: 'parse' },
    update: {},
    create: {
      name: 'Parse',
      slug: 'parse',
      status: 'failed',
      industry: 'Developer Tools / BaaS',
      country: 'USA',
      foundingYear: 2011,
      shutdownYear: 2017,
      lifetimeMonths: 72,
      fundingInr: 830000000n, // ~$10M before Facebook acquisition
      peakUsers: 500000,
      teamSize: 100,
      summary: 'Backend-as-a-Service platform acquired by Facebook for $85M. Shut down in 2017 when Facebook decided it no longer fit strategic priorities, stranding 600,000 apps.',
      founderStory: '# The Parse Story\n\nParse was a genuinely great developer product — a backend-as-a-service that let mobile developers ship apps without building backend infrastructure. It was acquired by Facebook in 2013 for $85M.\n\n## The Platform Dependency\nAt peak, 600,000 apps were built on Parse. The entire mobile development community had integrated deeply. Then in January 2016, Facebook announced it would shut down Parse in 12 months.\n\n## The Developer Scramble\nDevelopers worldwide scrambled to migrate 600,000 apps. Some apps died. Many migrated to Firebase (Google). The shutdown was orderly but the damage to developer trust in platform dependencies was lasting.\n\n## The Lesson\nPlatform dependence creates strategic risk. Building your core infrastructure on a product controlled by a company whose priorities can change is an existential risk to your business.',
      failureReasons: {
        create: [
          { category: 'strategy', severityScore: 95, description: 'Facebook shut down Parse as it no longer fit company strategy. 600,000 apps stranded overnight.', isPrimary: true },
          { category: 'strategy', severityScore: 88, description: 'Acqui-hire dynamic meant Facebook bought the team, not the product roadmap.' },
          { category: 'platform_risk', severityScore: 90, description: 'Developers who built on Parse had no backup plan when platform was discontinued.' },
        ],
      },
      timelineEvents: {
        create: [
          { stage: 'launch', eventDate: new Date('2011-07-01'), title: 'Launch', description: 'Parse launches as mobile BaaS. Developer community adopts rapidly.' },
          { stage: 'growth', eventDate: new Date('2013-04-25'), title: 'Facebook Acquisition', description: 'Facebook acquires Parse for $85M.' },
          { stage: 'growth', eventDate: new Date('2015-01-01'), title: '600K Apps', description: '600,000 apps built on Parse. Platform at peak usage.' },
          { stage: 'shutdown', eventDate: new Date('2016-01-28'), title: 'Shutdown Announced', description: 'Facebook announces Parse will shut down in 12 months.' },
          { stage: 'shutdown', eventDate: new Date('2017-01-28'), title: 'Service Ends', description: 'Parse servers go offline. Open-source version continues.' },
        ],
      },
      aiAnalyses: {
        create: {
          retentionScore: 30,
          monetizationScore: 40,
          pmfScore: 25,
          marketingScore: 35,
          primaryCause: 'Platform Dependency & Acquirer Strategy Change',
          confidence: 92,
          recommendations: [
            { priority: 'high', action: 'Never build core infrastructure on a third-party platform without an exit plan.', rationale: 'Parse\'s users built 600,000 apps with no contingency for platform discontinuation.' },
            { priority: 'high', action: 'Platform dependence creates strategic risk that can end your business overnight through no fault of your own.', rationale: 'Parse worked perfectly. Facebook\'s strategic realignment ended it anyway.' },
            { priority: 'medium', action: 'When building developer tools, prioritize open-source or portable architectures.', rationale: 'The open-source release of Parse was the only reason developers could migrate at all.' },
          ],
        },
      },
    },
  });

  // ─────────────────────────────────────────────
  // GRAPH EDGES
  // ─────────────────────────────────────────────

  await prisma.graphEdge.createMany({
    data: [
      { sourceStartupId: quibi.id, mistakeCategory: 'bad_timing', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: quibi.id, mistakeCategory: 'no_pmf', outcome: 'shutdown', edgeWeight: 0.6 },
      { sourceStartupId: juicero.id, mistakeCategory: 'no_pmf', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: juicero.id, mistakeCategory: 'bad_pricing', outcome: 'shutdown', edgeWeight: 0.75 },
      { sourceStartupId: theranos.id, mistakeCategory: 'fraud', outcome: 'shutdown', edgeWeight: 1.0 },
      { sourceStartupId: theranos.id, mistakeCategory: 'ethics_violation', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: petsDotCom.id, mistakeCategory: 'broken_unit_economics', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: petsDotCom.id, mistakeCategory: 'overspend_marketing', outcome: 'shutdown', edgeWeight: 0.7 },
      { sourceStartupId: webvan.id, mistakeCategory: 'strategy', outcome: 'shutdown', edgeWeight: 0.97 },
      { sourceStartupId: webvan.id, mistakeCategory: 'broken_unit_economics', outcome: 'shutdown', edgeWeight: 0.8 },
      { sourceStartupId: moviepass.id, mistakeCategory: 'broken_unit_economics', outcome: 'shutdown', edgeWeight: 0.99 },
      { sourceStartupId: moviepass.id, mistakeCategory: 'no_monetization', outcome: 'shutdown', edgeWeight: 0.85 },
      { sourceStartupId: beepi.id, mistakeCategory: 'broken_unit_economics', outcome: 'shutdown', edgeWeight: 0.93 },
      { sourceStartupId: beepi.id, mistakeCategory: 'high_ops_cost', outcome: 'shutdown', edgeWeight: 0.8 },
      { sourceStartupId: homejoy.id, mistakeCategory: 'legal_risk', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: homejoy.id, mistakeCategory: 'high_churn', outcome: 'shutdown', edgeWeight: 0.7 },
      { sourceStartupId: jawbone.id, mistakeCategory: 'competitive_displacement', outcome: 'shutdown', edgeWeight: 0.88 },
      { sourceStartupId: jawbone.id, mistakeCategory: 'poor_execution', outcome: 'shutdown', edgeWeight: 0.82 },
      { sourceStartupId: colorLabs.id, mistakeCategory: 'no_pmf', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: colorLabs.id, mistakeCategory: 'confusing_product', outcome: 'shutdown', edgeWeight: 0.9 },
      { sourceStartupId: secret.id, mistakeCategory: 'moderation_failure', outcome: 'shutdown', edgeWeight: 0.92 },
      { sourceStartupId: yikYak.id, mistakeCategory: 'moderation_failure', outcome: 'shutdown', edgeWeight: 0.9 },
      { sourceStartupId: yikYak.id, mistakeCategory: 'toxic_community', outcome: 'shutdown', edgeWeight: 0.85 },
      { sourceStartupId: rdio.id, mistakeCategory: 'competitive_displacement', outcome: 'shutdown', edgeWeight: 0.92 },
      { sourceStartupId: rdio.id, mistakeCategory: 'underfunded', outcome: 'shutdown', edgeWeight: 0.8 },
      { sourceStartupId: fab.id, mistakeCategory: 'strategy_incoherence', outcome: 'shutdown', edgeWeight: 0.9 },
      { sourceStartupId: fab.id, mistakeCategory: 'premature_hiring', outcome: 'shutdown', edgeWeight: 0.8 },
      { sourceStartupId: zirtual.id, mistakeCategory: 'cash_flow_mismanagement', outcome: 'shutdown', edgeWeight: 0.97 },
      { sourceStartupId: betterPlace.id, mistakeCategory: 'strategy', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: betterPlace.id, mistakeCategory: 'chicken_egg_problem', outcome: 'shutdown', edgeWeight: 0.9 },
      { sourceStartupId: aereo.id, mistakeCategory: 'legal_risk', outcome: 'shutdown', edgeWeight: 1.0 },
      { sourceStartupId: sprig.id, mistakeCategory: 'broken_unit_economics', outcome: 'shutdown', edgeWeight: 0.9 },
      { sourceStartupId: sprig.id, mistakeCategory: 'density_failure', outcome: 'shutdown', edgeWeight: 0.85 },
      { sourceStartupId: dopplerLabs.id, mistakeCategory: 'bad_timing', outcome: 'shutdown', edgeWeight: 0.85 },
      { sourceStartupId: dopplerLabs.id, mistakeCategory: 'no_pmf', outcome: 'shutdown', edgeWeight: 0.8 },
      { sourceStartupId: shyp.id, mistakeCategory: 'broken_unit_economics', outcome: 'shutdown', edgeWeight: 0.92 },
      { sourceStartupId: powaTech.id, mistakeCategory: 'leadership_failure', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: powaTech.id, mistakeCategory: 'no_pmf', outcome: 'shutdown', edgeWeight: 0.85 },
      { sourceStartupId: airware.id, mistakeCategory: 'bad_timing', outcome: 'shutdown', edgeWeight: 0.88 },
      { sourceStartupId: airware.id, mistakeCategory: 'competitive_displacement', outcome: 'shutdown', edgeWeight: 0.85 },
      { sourceStartupId: vine.id, mistakeCategory: 'no_creator_monetization', outcome: 'shutdown', edgeWeight: 0.92 },
      { sourceStartupId: vine.id, mistakeCategory: 'competitive_displacement', outcome: 'shutdown', edgeWeight: 0.75 },
      { sourceStartupId: googlePlus.id, mistakeCategory: 'no_pmf', outcome: 'shutdown', edgeWeight: 0.93 },
      { sourceStartupId: googlePlus.id, mistakeCategory: 'forced_adoption', outcome: 'shutdown', edgeWeight: 0.85 },
      { sourceStartupId: parse.id, mistakeCategory: 'platform_dependency', outcome: 'shutdown', edgeWeight: 0.95 },
      { sourceStartupId: parse.id, mistakeCategory: 'acquirer_strategy_change', outcome: 'shutdown', edgeWeight: 0.9 },
    ],
    skipDuplicates: true,
  });

  // ─────────────────────────────────────────────
  // CONFESSIONS
  // ─────────────────────────────────────────────

  await prisma.confession.createMany({
    data: [
      { text: "I spent 6 months building a feature nobody used because I was too scared to talk to customers.", upvotes: 142 },
      { text: "We raised a seed round and immediately moved to a fancy office. We shut down 9 months later with ₹0 in the bank.", upvotes: 89 },
      { text: "I lied to my board about our retention metrics for two quarters. Closing the company was a relief.", upvotes: 215 },
      { text: "We had a Super Bowl ad before we had a profitable transaction. I still cringe.", upvotes: 178 },
      { text: "Our unit economics were broken from day one. Every investor told us. We called them 'unimaginative.'", upvotes: 312 },
      { text: "I hired 200 people before we had product-market fit. The layoffs destroyed me emotionally.", upvotes: 267 },
      { text: "We knew our biggest competitor was entering our market 8 months before it happened. We did nothing.", upvotes: 198 },
      { text: "We had 2M users and $0 in revenue. When we tried to monetize, 80% churned in 30 days.", upvotes: 445 },
      { text: "I thought a better product would win over better distribution. I was wrong. Distribution always wins.", upvotes: 389 },
      { text: "We built the entire platform assuming users would behave differently than they actually do. Classic.", upvotes: 223 },
    ],
    skipDuplicates: true,
  });

  console.log('✅ PivotVault seeding completed! 25 startups seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
