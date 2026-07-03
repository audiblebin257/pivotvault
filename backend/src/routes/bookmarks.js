const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

function serializeStartup(s) {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    status: s.status,
    industry: s.industry,
    summary: s.summary,
    foundingYear: s.foundingYear,
    shutdownYear: s.shutdownYear,
    lifetimeMonths: s.lifetimeMonths,
    fundingInr: s.fundingInr != null ? s.fundingInr.toString() : null,
    fundingUsd: s.fundingUsd != null ? s.fundingUsd.toString() : null,
    peakUsers: s.peakUsers,
    topFailureReason: s.failureReasons && s.failureReasons[0] ? s.failureReasons[0].category : null,
  };
}

// GET /api/bookmarks - list current user's bookmarked startups
router.get('/', requireAuth, async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    const companyIds = bookmarks.map((b) => b.companyId);
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      include: { failureReasons: { where: { isPrimary: true }, take: 1 } },
    });
    const byId = new Map(companies.map((s) => [s.id, s]));
    const ordered = companyIds.map((id) => byId.get(id)).filter(Boolean).map(serializeStartup);
    res.json({ slugs: companies.map((s) => s.slug), data: ordered });
  } catch (err) {
    console.error('List bookmarks error:', err);
    res.status(500).json({ error: 'Could not load bookmarks', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/bookmarks { slug } - add a bookmark
router.post('/', requireAuth, async (req, res) => {
  try {
    const { slug } = req.body || {};
    if (!slug) return res.status(400).json({ error: 'slug is required', code: 'VALIDATION_ERROR' });
    const startup = await prisma.company.findUnique({ where: { slug } });
    if (!startup) return res.status(404).json({ error: 'Startup not found', code: 'NOT_FOUND' });
    await prisma.bookmark.upsert({
      where: { userId_companyId: { userId: req.user.id, companyId: startup.id } },
      update: {},
      create: { userId: req.user.id, companyId: startup.id },
    });
    res.status(201).json({ ok: true, slug });
  } catch (err) {
    console.error('Add bookmark error:', err);
    res.status(500).json({ error: 'Could not save bookmark', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/bookmarks/:slug - remove a bookmark
router.delete('/:slug', requireAuth, async (req, res) => {
  try {
    const startup = await prisma.company.findUnique({ where: { slug: req.params.slug } });
    if (!startup) return res.status(404).json({ error: 'Startup not found', code: 'NOT_FOUND' });
    await prisma.bookmark.deleteMany({ where: { userId: req.user.id, companyId: startup.id } });
    res.json({ ok: true, slug: req.params.slug });
  } catch (err) {
    console.error('Delete bookmark error:', err);
    res.status(500).json({ error: 'Could not remove bookmark', code: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
