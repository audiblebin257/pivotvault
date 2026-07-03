const { PrismaClient, GraphEdgeType } = require('@prisma/client');

const prisma = new PrismaClient();

class GraphService {
  // Helper: Normalize slug
  static toSlug(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // 1. Generate edges for a single company
  static async generateEdgesForCompany(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        founders: true,
        companyInvestors: { include: { investor: true } },
        failureReasons: true,
        companyTechnologies: { include: { technology: true } },
        companyMarkets: { include: { market: true } },
        companyProducts: { include: { product: true } },
        companyAccelerators: { include: { accelerator: true } },
        competitorsFrom: { include: { targetCompany: true } },
        acquisitions: { include: { acquiredCompany: true } },
        acquiredIn: { include: { acquiringCompany: true } },
        industryRecord: true,
      },
    });

    if (!company) throw new Error('Company not found');

    const edgesToCreate = [];

    // Founder → Company
    if (company.founders.length > 0) {
      for (const founder of company.founders) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.FOUNDER_COMPANY,
          sourceType: 'FOUNDER',
          sourceId: founder.id,
          targetType: 'COMPANY',
          targetId: company.id,
          description: `${founder.name} was a founder of ${company.name}`,
          edgeWeight: 0.9,
        });
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPANY_FOUNDER,
          sourceType: 'COMPANY',
          sourceId: company.id,
          targetType: 'FOUNDER',
          targetId: founder.id,
          description: `${company.name} was founded by ${founder.name}`,
          edgeWeight: 0.9,
        });
      }
    }

    // Investor → Company
    if (company.companyInvestors.length > 0) {
      for (const ci of company.companyInvestors) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.INVESTOR_COMPANY,
          sourceType: 'INVESTOR',
          sourceId: ci.investorId,
          targetType: 'COMPANY',
          targetId: company.id,
          description: `${ci.investor.name} invested in ${company.name}`,
          edgeWeight: 0.8,
        });
      }
    }

    // Company → Failure Pattern
    if (company.failureReasons.length > 0) {
      for (const fr of company.failureReasons) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPANY_FAILURE_PATTERN,
          sourceType: 'COMPANY',
          sourceId: company.id,
          targetType: 'FAILURE_PATTERN',
          targetId: fr.category,
          description: `${company.name} failed due to ${fr.category}`,
          edgeWeight: fr.severityScore / 100,
        });
      }
    }

    // Company → Industry
    if (company.industryRecord) {
      edgesToCreate.push({
        edgeType: GraphEdgeType.COMPANY_INDUSTRY,
        sourceType: 'COMPANY',
        sourceId: company.id,
        targetType: 'INDUSTRY',
        targetId: company.industryRecord.id,
        description: `${company.name} operates in ${company.industryRecord.name}`,
        edgeWeight: 0.85,
      });
    }

    // Company → Technology
    if (company.companyTechnologies.length > 0) {
      for (const ct of company.companyTechnologies) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPANY_TECHNOLOGY,
          sourceType: 'COMPANY',
          sourceId: company.id,
          targetType: 'TECHNOLOGY',
          targetId: ct.technologyId,
          description: `${company.name} uses ${ct.technology.name}`,
          edgeWeight: ct.isPrimary ? 0.9 : 0.7,
        });
      }
    }

    // Company → Market
    if (company.companyMarkets.length > 0) {
      for (const cm of company.companyMarkets) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPANY_MARKET,
          sourceType: 'COMPANY',
          sourceId: company.id,
          targetType: 'MARKET',
          targetId: cm.marketId,
          description: `${company.name} targets ${cm.market.name}`,
          edgeWeight: cm.isPrimary ? 0.9 : 0.7,
        });
      }
    }

    // Company → Product
    if (company.companyProducts.length > 0) {
      for (const cp of company.companyProducts) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPANY_PRODUCT,
          sourceType: 'COMPANY',
          sourceId: company.id,
          targetType: 'PRODUCT',
          targetId: cp.productId,
          description: `${company.name} built ${cp.product.name}`,
          edgeWeight: cp.isPrimary ? 0.9 : 0.7,
        });
      }
    }

    // Company → Accelerator
    if (company.companyAccelerators.length > 0) {
      for (const ca of company.companyAccelerators) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPANY_ACCELERATOR,
          sourceType: 'COMPANY',
          sourceId: company.id,
          targetType: 'ACCELERATOR',
          targetId: ca.acceleratorId,
          description: `${company.name} went through ${ca.accelerator.name}`,
          edgeWeight: 0.8,
        });
      }
    }

    // Company → Competitor
    if (company.competitorsFrom.length > 0) {
      for (const comp of company.competitorsFrom) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPETITOR_COMPANY,
          sourceType: 'COMPANY',
          sourceId: company.id,
          targetType: 'COMPANY',
          targetId: comp.targetCompanyId,
          description: `${company.name} competed with ${comp.targetCompany.name}`,
          edgeWeight: 0.75,
        });
        // Bidirectional
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPETITOR_COMPANY,
          sourceType: 'COMPANY',
          sourceId: comp.targetCompanyId,
          targetType: 'COMPANY',
          targetId: company.id,
          description: `${comp.targetCompany.name} competed with ${company.name}`,
          edgeWeight: 0.75,
        });
      }
    }

    // Company → Acquisition
    if (company.acquisitions.length > 0) {
      for (const acq of company.acquisitions) {
        edgesToCreate.push({
          edgeType: GraphEdgeType.COMPANY_ACQUISITION,
          sourceType: 'COMPANY',
          sourceId: company.id,
          targetType: 'COMPANY',
          targetId: acq.acquiredCompanyId,
          description: `${company.name} acquired ${acq.acquiredCompanyName}`,
          edgeWeight: 0.85,
        });
      }
    }

    if (company.acquiredIn) {
      edgesToCreate.push({
        edgeType: GraphEdgeType.COMPANY_ACQUISITION,
        sourceType: 'COMPANY',
        sourceId: company.acquiredIn.acquiringCompanyId,
        targetType: 'COMPANY',
        targetId: company.id,
        description: `${company.acquiredIn.acquiringCompany.name} acquired ${company.name}`,
        edgeWeight: 0.85,
      });
    }

    // Delete existing edges first, then create new ones
    await prisma.graphEdge.deleteMany({
      where: {
        OR: [
          { sourceId: company.id, sourceType: 'COMPANY' },
          { targetId: company.id, targetType: 'COMPANY' },
        ],
      },
    });

    // Create new edges in batches
    const batchSize = 50;
    for (let i = 0; i < edgesToCreate.length; i += batchSize) {
      const batch = edgesToCreate.slice(i, i + batchSize);
      await prisma.graphEdge.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    return edgesToCreate.length;
  }

  // 2. Get graph data for a company/query
  static async getGraphData(options = {}) {
    const {
      companyId,
      limit = 100,
      types = null,
    } = options;

    let where = {};
    if (companyId) {
      where = {
        OR: [
          { sourceId: companyId, sourceType: 'COMPANY' },
          { targetId: companyId, targetType: 'COMPANY' },
        ],
      };
    }
    if (types && types.length > 0) {
      where.edgeType = { in: types };
    }

    const edges = await prisma.graphEdge.findMany({
      take: limit,
      where,
      orderBy: { edgeWeight: 'desc' },
    });

    // Collect all unique node ids
    const nodeRefs = new Map();

    edges.forEach(edge => {
      nodeRefs.set(`${edge.sourceType}-${edge.sourceId}`, { type: edge.sourceType, id: edge.sourceId });
      nodeRefs.set(`${edge.targetType}-${edge.targetId}`, { type: edge.targetType, id: edge.targetId });
    });

    // Fetch nodes in parallel
    const companies = [];
    const industries = [];
    const technologies = [];
    const markets = [];
    const products = [];
    const accelerators = [];
    const founders = [];
    const investors = [];
    const failurePatterns = new Set();

    for (const [key, ref] of nodeRefs) {
      switch (ref.type) {
        case 'COMPANY':
          companies.push(ref.id);
          break;
        case 'INDUSTRY':
          industries.push(ref.id);
          break;
        case 'TECHNOLOGY':
          technologies.push(ref.id);
          break;
        case 'MARKET':
          markets.push(ref.id);
          break;
        case 'PRODUCT':
          products.push(ref.id);
          break;
        case 'ACCELERATOR':
          accelerators.push(ref.id);
          break;
        case 'FOUNDER':
          founders.push(ref.id);
          break;
        case 'INVESTOR':
          investors.push(ref.id);
          break;
        case 'FAILURE_PATTERN':
          failurePatterns.add(ref.id);
          break;
      }
    }

    // Parallel fetch all node types
    const [
      companyNodes,
      industryNodes,
      techNodes,
      marketNodes,
      productNodes,
      acceleratorNodes,
      founderNodes,
      investorNodes,
    ] = await Promise.all([
      companies.length > 0 ? prisma.company.findMany({
        where: { id: { in: companies } },
        select: { id: true, name: true, slug: true, industry: true, status: true, logoUrl: true },
      }) : [],
      industries.length > 0 ? prisma.industry.findMany({
        where: { id: { in: industries } },
      }) : [],
      technologies.length > 0 ? prisma.technology.findMany({
        where: { id: { in: technologies } },
      }) : [],
      markets.length > 0 ? prisma.market.findMany({
        where: { id: { in: markets } },
      }) : [],
      products.length > 0 ? prisma.product.findMany({
        where: { id: { in: products } },
      }) : [],
      accelerators.length > 0 ? prisma.accelerator.findMany({
        where: { id: { in: accelerators } },
      }) : [],
      founders.length > 0 ? prisma.founder.findMany({
        where: { id: { in: founders } },
      }) : [],
      investors.length > 0 ? prisma.investor.findMany({
        where: { id: { in: investors } },
      }) : [],
    ]);

    const nodeMap = new Map();
    // Add all company nodes
    for (const c of companyNodes) {
      nodeMap.set(c.id, {
        id: c.id,
        label: c.name,
        type: 'COMPANY',
        slug: c.slug,
        industry: c.industry,
        status: c.status,
        logoUrl: c.logoUrl,
        group: 1,
      });
    }
    // Industry
    for (const i of industryNodes) {
      nodeMap.set(i.id, {
        id: i.id,
        label: i.name,
        type: 'INDUSTRY',
        group: 2,
      });
    }
    // Technology
    for (const t of techNodes) {
      nodeMap.set(t.id, {
        id: t.id,
        label: t.name,
        type: 'TECHNOLOGY',
        category: t.category,
        group: 3,
      });
    }
    // Market
    for (const m of marketNodes) {
      nodeMap.set(m.id, {
        id: m.id,
        label: m.name,
        type: 'MARKET',
        group: 4,
      });
    }
    // Product
    for (const p of productNodes) {
      nodeMap.set(p.id, {
        id: p.id,
        label: p.name,
        type: 'PRODUCT',
        group: 5,
      });
    }
    // Accelerator
    for (const a of acceleratorNodes) {
      nodeMap.set(a.id, {
        id: a.id,
        label: a.name,
        type: 'ACCELERATOR',
        group: 6,
      });
    }
    // Founder
    for (const f of founderNodes) {
      nodeMap.set(f.id, {
        id: f.id,
        label: f.name,
        type: 'FOUNDER',
        role: f.role,
        group: 7,
      });
    }
    // Investor
    for (const i of investorNodes) {
      nodeMap.set(i.id, {
        id: i.id,
        label: i.name,
        type: 'INVESTOR',
        group: 8,
      });
    }
    // Failure Patterns
    for (const fp of failurePatterns) {
      nodeMap.set(fp, {
        id: fp,
        label: fp.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'FAILURE_PATTERN',
        group: 9,
      });
    }

    // Build links
    const links = edges.map(edge => {
      // Resolve source and target IDs based on type
      let sourceId = edge.sourceId;
      let targetId = edge.targetId;
      if (edge.targetType === 'FAILURE_PATTERN') targetId = edge.targetId;
      if (edge.sourceType === 'FAILURE_PATTERN') sourceId = edge.sourceId;

      return {
        id: edge.id,
        source: sourceId,
        target: targetId,
        edgeType: edge.edgeType,
        value: parseFloat(edge.edgeWeight),
        description: edge.description,
      };
    }).filter(link => nodeMap.has(link.source) && nodeMap.has(link.target));

    return {
      nodes: Array.from(nodeMap.values()),
      links,
      totalEdges: edges.length,
      totalNodes: nodeMap.size,
    };
  }

  // 3. Find shortest path between two companies
  static async findShortestPath(startCompanyId, endCompanyId, maxDepth = 3) {
    // Breadth-first search
    const visited = new Map([[startCompanyId, null]]);
    const queue = [startCompanyId];
    let found = false;

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === endCompanyId) {
        found = true;
        break;
      }
      if (visited.size > 1000) break; // Prevent excessive search
      // Get neighbors
      const neighbors = await prisma.graphEdge.findMany({
        where: {
          OR: [
            { sourceId: current, sourceType: 'COMPANY' },
            { targetId: current, targetType: 'COMPANY' },
          ],
        },
        select: {
          sourceId: true, sourceType: true,
          targetId: true, targetType: true,
        },
      });
      for (const neighbor of neighbors) {
        const nextId = neighbor.sourceId === current ? neighbor.targetId : neighbor.sourceId;
        if (neighbor.sourceType === 'COMPANY' && neighbor.targetType === 'COMPANY' && !visited.has(nextId)) {
          visited.set(nextId, current);
          queue.push(nextId);
        }
      }
    }

    if (!found) return null;

    // Reconstruct path
    const path = [];
    let current = endCompanyId;
    while (current !== null) {
      path.push(current);
      current = visited.get(current);
    }
    path.reverse();

    // Now get the companies
    const companies = await prisma.company.findMany({
      where: { id: { in: path } },
      select: { id: true, name: true, slug: true, industry: true, status: true, logoUrl: true },
    });
    // Sort in path order
    const companyMap = new Map(companies.map(c => [c.id, c]));
    return path.map(id => companyMap.get(id)).filter(Boolean);
  }

  // 4. Find similar companies
  static async findSimilarCompanies(companyId, limit = 10) {
    // Get original company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        industryRecord: true,
        failureReasons: true,
        companyTechnologies: { include: { technology: true } },
        companyMarkets: { include: { market: true } },
      },
    });
    if (!company) throw new Error('Company not found');

    // Find companies in same industry
    const similarCompanies = await prisma.company.findMany({
      where: {
        NOT: { id: companyId },
        industry: company.industry,
      },
      include: {
        failureReasons: true,
        companyTechnologies: { include: { technology: true } },
      },
      take: limit + 20,
    });

    // Score similarity
    const scored = similarCompanies.map(c => {
      let score = 0;
      if (c.status === company.status) score += 20;
      if (c.country === company.country) score += 15;

      // Check shared failure reasons
      const fr1 = company.failureReasons.map(fr => fr.category);
      const fr2 = c.failureReasons.map(fr => fr.category);
      const sharedFr = fr1.filter(x => fr2.includes(x)).length;
      score += sharedFr * 10;

      // Check shared technologies
      const t1 = company.companyTechnologies.map(t => t.technologyId);
      const t2 = c.companyTechnologies.map(t => t.technologyId);
      const sharedTech = t1.filter(x => t2.includes(x)).length;
      score += sharedTech * 8;

      // Founding year proximity
      if (company.foundingYear && c.foundingYear) {
        const diff = Math.abs(company.foundingYear - c.foundingYear);
        if (diff <= 2) score += 15;
        else if (diff <= 5) score += 10;
        else if (diff <= 10) score += 5;
      }

      return {
        ...c,
        similarityScore: Math.min(100, score),
      };
    });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    return scored.slice(0, limit);
  }

  // 5. Find related failures
  static async findRelatedFailures(companyId, limit = 10) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { failureReasons: true },
    });
    if (!company) throw new Error('Company not found');

    const failureCategories = company.failureReasons.map(fr => fr.category);

    const relatedCompanies = await prisma.company.findMany({
      where: {
        NOT: { id: companyId },
        failureReasons: { some: { category: { in: failureCategories } } },
      },
      include: {
        failureReasons: true,
      },
      take: limit,
      orderBy: {
        shutdownYear: 'desc',
      },
    });

    return relatedCompanies;
  }

  // 6. Regenerate all edges (for full graph refresh)
  static async regenerateAllEdges() {
    const companies = await prisma.company.findMany({ select: { id: true } });
    let total = 0;

    for (const company of companies) {
      try {
        const count = await this.generateEdgesForCompany(company.id);
        total += count;
        console.log(`Generated ${count} edges for ${company.id}`);
      } catch (e) {
        console.error(`Failed to generate edges for ${company.id}`, e.message);
      }
    }

    return total;
  }
}

module.exports = GraphService;
