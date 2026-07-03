const { PrismaClient } = require('@prisma/client');
const ragService = require('./rag');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const prisma = new PrismaClient();
const logger = console;

class FounderIntelligenceService {
  // 1. Generate Investor Readiness Score
  async generateInvestorReadinessScore(companyId) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          fundingRounds: true,
          metricsSnapshots: {
            orderBy: { recordedMonth: 'desc' },
            take: 1
          },
          failureReasons: true,
          aiAnalyses: true
        }
      });

      let score = 50; // Default middle score

      // Factors influencing score
      if (company.fundingRounds.length > 0) score += 10;
      if (company.fundingRounds.length > 1) score += 10;
      if (company.websiteUrl) score += 5;
      if (company.industry) score += 5;
      if (company.description && company.description.length > 200) score += 5;

      const aiAnalysis = company.aiAnalyses[0];
      if (aiAnalysis) {
        if (aiAnalysis.pmfScore > 70) score += 10;
        if (aiAnalysis.retentionScore > 70) score += 5;
        if (aiAnalysis.monetizationScore > 70) score += 5;
      }

      const latestMetrics = company.metricsSnapshots[0];
      if (latestMetrics) {
        if (latestMetrics.mrrUsd && latestMetrics.mrrUsd > 10000) score += 10;
        if (latestMetrics.users && latestMetrics.users > 1000) score += 5;
      }

      return {
        score: Math.min(score, 100),
        factors: [
          { name: 'Funding Rounds', points: Math.min(company.fundingRounds.length * 10, 20) },
          { name: 'PMF Score', points: aiAnalysis?.pmfScore ? Math.min(aiAnalysis.pmfScore / 7, 10) : 0 },
          { name: 'MRR', points: latestMetrics?.mrrUsd > 10000 ? 10 : 0 },
          { name: 'Product Market Fit', points: aiAnalysis?.pmfScore ? Math.min(aiAnalysis.pmfScore / 7, 10) : 0 }
        ],
        recommendations: [
          'Validate your product market fit with customer interviews',
          'Gather early traction metrics',
          'Create a compelling investor deck'
        ]
      };
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to generate readiness score');
    }
  }

  // 2. Market Validation Engine
  async analyzeMarketValidation(query, industry, market) {
    try {
      // RAG retrieval first
      const searchResults = await ragService.hybridSearch(
        `${query} ${industry} ${market} market size competitors`
      );

      // Build context for LLM
      const contextText = searchResults
        .map((chunk, idx) => `[${idx + 1}] ${chunk.company?.name || 'Unknown'}\n${chunk.content}\n---`)
        .join('\n');

      const model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.2
      });

      const systemPrompt = `
        You are a senior market analyst at a VC firm.
        Based ONLY on the provided context, provide a market validation report.
        Return ONLY valid JSON:
        {
          "marketSize": "textual estimate",
          "competitionLevel": "low|medium|high",
          "keyCompetitors": ["names"],
          "opportunities": ["list"],
          "risks": ["list"],
          "confidence": 0-100,
          "sources": ["list of source company names"]
        }
      `;

      const result = await model.invoke([
        ['system', systemPrompt],
        ['human', `Query: ${query}\nIndustry: ${industry}\nMarket: ${market}\n\nContext:\n${contextText}`]
      ]);

      let report = null;
      try {
        report = JSON.parse(result.content.replace(/```json|```/g, '').trim());
      } catch {
        report = {
          marketSize: 'Unknown',
          competitionLevel: 'medium',
          keyCompetitors: [],
          opportunities: ['Conduct customer interviews'],
          risks: ['Market competition'],
          confidence: 50,
          sources: []
        };
      }

      return report;
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to analyze market');
    }
  }

  // 3. Competitor Monitoring
  async monitorCompetitors(companyId) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          competitorsTo: {
            include: { targetCompany: true }
          }
        }
      });

      const competitors = company.competitorsTo.map(c => c.targetCompany);

      return {
        competitors,
        latestUpdates: competitors.slice(0, 5).map(c => ({
          id: c.id,
          name: c.name,
          lastUpdate: c.updatedAt
        }))
      };
    } catch (err) {
      logger.error(err);
      throw new Error('Failed to get competitors');
    }
  }

  // 4. Startup Health Dashboard Data
  async getStartupHealthData(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        aiAnalyses: true,
        metricsSnapshots: true,
        failureReasons: true
      }
    });

    const aiAnalysis = company.aiAnalyses[0];
    return {
      company,
      scores: {
        overall: aiAnalysis ? (
          aiAnalysis.pmfScore * 0.3 +
          aiAnalysis.retentionScore * 0.25 +
          aiAnalysis.monetizationScore * 0.25 +
          aiAnalysis.marketingScore * 0.2
        ) : 50,
        pmf: aiAnalysis?.pmfScore || 50,
        retention: aiAnalysis?.retentionScore || 50,
        monetization: aiAnalysis?.monetizationScore || 50,
        marketing: aiAnalysis?.marketingScore || 50
      },
      risks: company.failureReasons
    };
  }

  // 5. Risk Prediction Engine
  async predictRisks(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        aiAnalyses: true,
        failureReasons: true
      }
    });

    const risks = [];
    if (company.failureReasons) {
      company.failureReasons.forEach(fr => {
        risks.push({
          category: fr.category,
          severity: fr.severityScore,
          description: fr.description,
          mitigationPlan: 'Consider exploring lessons from similar failures'
        });
      });
    }

    return { predictedRisks: risks };
  }

  // 6. Weekly Intelligence Report
  async generateWeeklyReport(userId, companyId = null) {
    const date = new Date();
    const weekNumber = Math.ceil((date - new Date(date.getFullYear(), 0, 1)) / 604800000);
    const year = date.getFullYear();

    const report = {
      dateGenerated: date,
      weekNumber,
      year,
      summary: 'Weekly intelligence snapshot',
      keyHighlights: [
        'Check your personalized AI mentor for tailored advice',
        'Review market trends in your industry',
        'Analyze your competitors'
      ],
      relatedStartups: [],
      lessonsLearned: []
    };

    // Create DB entry
    const existing = await prisma.weeklyReport.findFirst({
      where: { userId, weekNumber, year }
    });

    if (!existing) {
      await prisma.weeklyReport.create({
        data: {
          userId,
          weekNumber,
          year,
          reportData: report,
          isGenerated: true
        }
      });
    }

    return report;
  }

  // 7. Startup Benchmarking
  async benchmarkStartup(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        metricsSnapshots: true,
        fundingRounds: true,
        industryRecord: true
      }
    });

    const peerCompanies = await prisma.company.findMany({
      where: {
        industry: company.industry,
        id: { not: companyId }
      },
      include: {
        metricsSnapshots: true,
        fundingRounds: true
      },
      take: 20
    });

    const latestRevenue = company.metricsSnapshots[0]?.revenueUsd || 0;
    const latestUsers = company.metricsSnapshots[0]?.users || 0;

    const peerRevenues = peerCompanies.flatMap(pc =>
      pc.metricsSnapshots.map(m => m.revenueUsd).filter(Boolean)
    );
    const peerUsers = peerCompanies.flatMap(pc =>
      pc.metricsSnapshots.map(m => m.users).filter(Boolean)
    );

    // Calculate percentiles
    const getPercentile = (val, arr) => {
      if (!arr.length) return 50;
      const sorted = [...arr].sort((a, b) => a - b);
      let count = 0;
      for (const v of sorted) {
        if (v <= val) count++;
      }
      return Math.round((count / sorted.length) * 100);
    };

    return {
      revenuePercentile: getPercentile(latestRevenue, peerRevenues),
      usersPercentile: getPercentile(latestUsers, peerUsers),
      fundingRoundsPercentile: getPercentile(company.fundingRounds.length, peerCompanies.map(pc => pc.fundingRounds.length))
    };
  }
}

module.exports = new FounderIntelligenceService();
