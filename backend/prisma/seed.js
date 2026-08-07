const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFailureCategory(categoryString) {
  if (!categoryString) return 'other';
  const map = {
    fraud: 'fraud',
    pmf: 'pmf',
    'product-market fit': 'pmf',
    'market timing': 'timing',
    retention: 'retention',
    monetization: 'monetization',
    cac: 'cac',
    competition: 'competition',
    team: 'team',
    regulation: 'regulation',
    legal: 'legal',
    product: 'product',
    'unit economics': 'unit_economics',
    operations: 'operations',
    leadership: 'leadership',
    cashflow: 'cashflow',
    execution: 'execution',
    pricing: 'pricing',
    strategy: 'strategy',
  };
  const lower = categoryString.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return 'other';
}

async function main() {
  const seedDataPath = path.join(__dirname, 'seed.json');
  const rawData = fs.readFileSync(seedDataPath, 'utf-8');
  const companies = JSON.parse(rawData);

  console.log(`🌱 Found ${companies.length} companies in seed.json`);
  console.log(`🚀 Starting import...`);

  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    try {
      const slug = slugify(c.name);
      const city = c.city?.split(',')[0]?.trim() || c.city || null;
      const state = c.city?.includes(',') ? c.city.split(',')[1]?.trim() : null;
      const lifetime =
        c.yearFounded && c.yearClosed ? c.yearClosed - c.yearFounded : null;

      const founders = (c.founders || []).map((name, idx) => ({
        name,
        role: idx === 0 ? 'Co-founder & CEO' : 'Co-founder',
        isPrimary: idx === 0,
      }));

      const failureReasons = (c.failureReasons || []).map((reason, idx) => ({
        description: reason,
        category: parseFailureCategory(c.failureCategory || reason),
        severityScore: 60 + Math.floor(Math.random() * 40),
        isPrimary: idx === 0,
      }));

      const lessons = c.lessonsLearned
        ? [
            {
              title: `Key Lesson from ${c.name}`,
              content: c.lessonsLearned,
              priority: 'high',
              isKey: true,
            },
          ]
        : [];

      const timeline = [];
      if (c.yearFounded) {
        timeline.push({
          stage: 'idea',
          eventDate: new Date(`${c.yearFounded}-01-01`),
          title: 'Founded',
          description: `${c.name} founded in ${c.yearFounded}`,
        });
      }
      if (c.yearClosed) {
        timeline.push({
          stage: 'shutdown',
          eventDate: new Date(`${c.yearClosed}-01-01`),
          title: 'Shut Down',
          description: c.finalStatus || `${c.name} shut down in ${c.yearClosed}`,
        });
      }
      if (c.milestones) {
        for (let j = 0; j < c.milestones.length; j++) {
          const m = c.milestones[j];
          const match = m.match(/^(\d{4}):\s*(.*)$/);
          if (match) {
            timeline.push({
              stage: 'growth',
              eventDate: new Date(`${match[1]}-06-15`),
              title: match[2].split('.')[0].trim(),
              description: m,
            });
          }
        }
      }

      const articles = [];
      if (c.sources?.techcrunch && c.sources.techcrunch !== 'Unknown') {
        articles.push({
          title: `TechCrunch: ${c.name}`,
          url: c.sources.techcrunch,
          publishedAt: new Date(c.yearClosed ? `${c.yearClosed}-01-01` : `${c.yearFounded || 2020}-01-01`),
          source: 'TechCrunch',
          summary: c.productDescription,
          isPrimary: true,
        });
      }
      if (c.sources?.wikipedia && c.sources.wikipedia !== 'Unknown') {
        articles.push({
          title: `Wikipedia: ${c.name}`,
          url: c.sources.wikipedia,
          publishedAt: new Date(c.yearClosed ? `${c.yearClosed}-01-01` : `${c.yearFounded || 2020}-01-01`),
          source: 'Wikipedia',
          summary: c.summary || c.productDescription,
        });
      }

      const companyTags = [];
      const industryTag = await prisma.tag.upsert({
        where: { slug: slugify(c.industry) },
        update: {},
        create: {
          name: c.industry,
          slug: slugify(c.industry),
          category: 'Industry',
        },
      });
      companyTags.push({ tagId: industryTag.id, isPrimary: true });

      // Optional: upsert Industry record
      const industryRecord = await prisma.industry.upsert({
        where: { slug: slugify(c.industry) },
        update: {},
        create: {
          name: c.industry,
          slug: slugify(c.industry),
          description: `${c.industry} companies`,
        },
      });

      const existing = await prisma.company.findUnique({ where: { slug } });
      if (existing) {
        await prisma.company.update({
          where: { slug },
          data: {
            name: c.name,
            alternativeNames: [c.name],
            status: 'failed',
            industry: c.industry,
            industryId: industryRecord.id,
            country: c.country || 'Unknown',
            state,
            city,
            foundingYear: c.yearFounded,
            shutdownYear: c.yearClosed,
            lifetimeMonths: lifetime ? lifetime * 12 : null,
            summary: c.productDescription || c.summary || c.lessonsLearned || `${c.name} failure postmortem`,
            description: c.founderStory || c.timeline || null,
            founderStory: c.founderStory || null,
            websiteUrl: c.sources?.crunchbase || null,
            founders: {
              deleteMany: {},
              create: founders,
            },
            failureReasons: {
              deleteMany: {},
              create: failureReasons,
            },
            lessons: {
              deleteMany: {},
              create: lessons,
            },
            timelineEvents: {
              deleteMany: {},
              create: timeline,
            },
            articles: {
              deleteMany: {},
              create: articles,
            },
            tags: {
              deleteMany: {},
              create: companyTags,
            },
          },
        });
        updatedCount++;
      } else {
        await prisma.company.create({
          data: {
            name: c.name,
            slug,
            alternativeNames: [c.name],
            status: 'failed',
            industry: c.industry,
            industryId: industryRecord.id,
            country: c.country || 'Unknown',
            state,
            city,
            foundingYear: c.yearFounded,
            shutdownYear: c.yearClosed,
            lifetimeMonths: lifetime ? lifetime * 12 : null,
            summary: c.productDescription || c.summary || c.lessonsLearned || `${c.name} failure postmortem`,
            description: c.founderStory || c.timeline || null,
            founderStory: c.founderStory || null,
            websiteUrl: c.sources?.crunchbase || null,
            founders: { create: founders },
            failureReasons: { create: failureReasons },
            lessons: { create: lessons },
            timelineEvents: { create: timeline },
            articles: { create: articles },
            tags: { create: companyTags },
          },
        });
        createdCount++;
      }

      if ((i + 1) % 50 === 0) {
        console.log(`✅ Processed ${i + 1}/${companies.length}...`);
      }
    } catch (err) {
      failedCount++;
      console.error(`❌ Failed to process #${i} (${c.name}):`, err.message);
    }
  }

  console.log(`\n🎉 Import complete!`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - Failed:  ${failedCount}`);

  // Verification queries for database counts
  try {
    const totalCompanies = await prisma.company.count();
    const totalFounders = await prisma.founder.count();
    const totalTimelineEvents = await prisma.timelineEvent.count();
    const totalTags = await prisma.tag.count();
    const totalArticles = await prisma.article.count();
    const totalFailureReasons = await prisma.failureReason.count();
    const totalLessons = await prisma.lesson.count();

    console.log(`\n📊 DATABASE VERIFICATION SUMMARY:`);
    console.log(`   ✓ Companies:       ${totalCompanies}`);
    console.log(`   ✓ Founders:        ${totalFounders}`);
    console.log(`   ✓ Timeline Events: ${totalTimelineEvents}`);
    console.log(`   ✓ Tags:            ${totalTags}`);
    console.log(`   ✓ Articles:        ${totalArticles}`);
    console.log(`   ✓ Failure Reasons: ${totalFailureReasons}`);
    console.log(`   ✓ Lessons:         ${totalLessons}`);
  } catch (verifyErr) {
    console.error(`⚠️ Failed to query verification counts:`, verifyErr.message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
