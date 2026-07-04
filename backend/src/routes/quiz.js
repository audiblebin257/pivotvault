const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prettyCategory(cat) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// GET /api/quiz?count=5 - generate quiz questions from real failure data
router.get('/', async (req, res) => {
  try {
    const count = Math.min(Math.max(parseInt(req.query.count, 10) || 5, 1), 10);

    const startups = await prisma.company.findMany({
      include: { failureReasons: true },
      take: 100,
    });

    const withReasons = startups.filter((s) => s.failureReasons.length > 0);
    if (withReasons.length < 4) {
      return res.json({ questions: [] });
    }

    const allCategories = [...new Set(startups.flatMap((s) => s.failureReasons.map((r) => r.category)))];
    const picked = shuffle(withReasons).slice(0, count);

    const questions = picked.map((s) => {
      const primary = s.failureReasons.find((r) => r.isPrimary) || s.failureReasons[0];
      const correct = primary.category;
      const distractors = shuffle(allCategories.filter((c) => c !== correct)).slice(0, 3);
      const options = shuffle([correct, ...distractors]).map(prettyCategory);
      return {
        slug: s.slug,
        startup: s.name,
        industry: s.industry,
        summary: s.summary,
        question: `What was the primary reason ${s.name} failed?`,
        options,
        answer: prettyCategory(correct),
        explanation: primary.description,
      };
    });

    res.json({ questions });
  } catch (err) {
    console.error('Quiz error:', err);
    res.status(500).json({ error: 'Could not generate quiz', code: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
