const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

const insightsCache = { data: null, timestamp: 0 };

// GET /api/insights - Failure trend analytics
router.get('/', async (req, res, next) => {
  try {
    // Check cache (24h)
    if (insightsCache.data && (Date.now() - insightsCache.timestamp) < 86400000) {
      return res.json(insightsCache.data);
    }

    const [failureData, yearlyData, topViewed, industryData, totalCount, fundingAggregate, fastestStartup, averageRisk, deathZoneData] = await Promise.all([
      // Top failure reasons by industry
      prisma.failureReason.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10,
      }),
      // Yearly failure count
      prisma.company.groupBy({
        by: ['shutdownYear'],
        _count: { id: true },
        where: { shutdownYear: { not: null } },
        orderBy: { shutdownYear: 'asc' },
      }),
      // Top viewed (use lifetime months as proxy)
      prisma.company.findMany({
        orderBy: { lifetimeMonths: 'desc' },
        take: 5,
        select: { name: true, slug: true, industry: true, lifetimeMonths: true },
      }),
      // Industry breakdown
      prisma.company.groupBy({
        by: ['industry'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      // Total failed startups count
      prisma.company.count(),
      // Total funding lost
      prisma.company.aggregate({
        _sum: {
          fundingInr: true,
        },
      }),
      // Fastest startup collapse
      prisma.company.findFirst({
        where: {
          lifetimeMonths: { not: null, gt: 0 },
        },
        orderBy: {
          lifetimeMonths: 'asc',
        },
        select: {
          name: true,
          lifetimeMonths: true,
        },
      }),
      // Industry risk score calculation
      prisma.aiAnalysis.aggregate({
        _avg: {
          pmfScore: true,
          retentionScore: true,
          monetizationScore: true,
        },
      }),
      // Death Zones (High failure industries with low average lifetime)
      prisma.company.groupBy({
        by: ['industry'],
        _count: { id: true },
        _avg: { lifetimeMonths: true },
        where: { status: 'failed' },
        orderBy: { _count: { id: 'desc' } },
        take: 4,
      }),
    ]);

    const totalFunding = fundingAggregate._sum.fundingInr ? fundingAggregate._sum.fundingInr.toString() : '0';
    const mostCommonReason = failureData[0]?.category || 'pmf';
    const fastestCollapseName = fastestStartup ? `${fastestStartup.name} (${fastestStartup.lifetimeMonths} Months)` : 'N/A';
    const avgRisk = averageRisk._avg.pmfScore 
      ? Math.round((averageRisk._avg.pmfScore + averageRisk._avg.retentionScore + averageRisk._avg.monetizationScore) / 3) 
      : 74;

    const result = {
      metrics: {
        totalFailed: totalCount,
        totalFundingLost: totalFunding,
        mostCommonReason: mostCommonReason,
        fastestCollapse: fastestCollapseName,
        industryRiskScore: avgRisk,
      },
      topFailureReasonsByIndustry: failureData.map(f => ({
        category: f.category,
        count: f._count.category,
      })),
      yearlyTrends: yearlyData.map(y => ({
        year: y.shutdownYear,
        count: y._count.id,
      })),
      topViewed: topViewed.map(t => ({
        name: t.name,
        slug: t.slug,
        industry: t.industry,
        lifetimeMonths: t.lifetimeMonths,
      })),
      industryBreakdown: industryData.map(i => ({
        industry: i.industry,
        count: i._count.id,
      })),
      deathZones: deathZoneData.map(d => {
        const avgLife = d._avg.lifetimeMonths || 0;
        let riskLevel = 'high';
        let reason = 'Market oversaturation and high acquisition costs.';
        if (avgLife < 12) {
          riskLevel = 'critical';
          reason = 'Severe PMF issues and rapid capital depletion.';
        } else if (d._count.id > 100) {
          riskLevel = 'extreme';
          reason = 'Systemic industry decline and regulatory headwinds.';
        }
        return {
          industry: d.industry,
          deathCount: d._count.id,
          avgLifespan: Math.round(avgLife),
          riskLevel,
          reason
        };
      })
    };

    insightsCache.data = result;
    insightsCache.timestamp = Date.now();

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
