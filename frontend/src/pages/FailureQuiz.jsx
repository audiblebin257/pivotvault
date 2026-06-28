import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, RefreshCw, ArrowRight, Trophy, Flame, Zap, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { clsx } from 'clsx';
import { getFounderRank } from '../lib/quizData';

const FailureQuiz = () => {
  const [questions, setQuestions] = React.useState([]);
  const [answers, setAnswers] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [difficulty, setDifficulty] = React.useState("mixed");
  const [quizCount, setQuizCount] = React.useState(5);
  // Persistent stats in localStorage
  const [totalXP, setTotalXP] = React.useState(() => parseInt(localStorage.getItem("pivotvault_quiz_xp") || "0"));
  const [currentStreak, setCurrentStreak] = React.useState(() => parseInt(localStorage.getItem("pivotvault_quiz_streak") || "0"));
  const [lastPlayed, setLastPlayed] = React.useState(localStorage.getItem("pivotvault_quiz_last_played") || "");

  const loadQuiz = React.useCallback(async () => {
    setLoading(true);
    setAnswers({});
    try {
      const { data } = await api.get(`/quiz?count=${quizCount}&difficulty=${difficulty}`);
      setQuestions(data.questions || []);
    } finally {
      setLoading(false);
    }
  }, [quizCount, difficulty]);

  React.useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const calculateScore = () => {
    let score = 0;
    let totalXP = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) {
        score++;
        totalXP += q.xp || 10;
      }
    });
    return { score, totalXP };
  };
  const { score, totalXP: earnedXP } = calculateScore();
  const complete = questions.length > 0 && Object.keys(answers).length === questions.length;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const founderRank = getFounderRank(totalXP);

  React.useEffect(() => {
    if (complete) {
      // Update XP
      const newTotalXP = totalXP + earnedXP;
      setTotalXP(newTotalXP);
      localStorage.setItem("pivotvault_quiz_xp", newTotalXP.toString());
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      if (lastPlayed !== today) {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);
        localStorage.setItem("pivotvault_quiz_streak", newStreak.toString());
        localStorage.setItem("pivotvault_quiz_last_played", today);
      }
    }
  }, [complete]);

  const keyLessons = questions
    .filter((q, i) => answers[i] !== undefined)
    .map((q, i) => ({
      question: q.question,
      correct: answers[i] === q.answer,
      lesson: q.explanation
    }));

  return (
    <div className="pv-content-container py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <div className="text-xs text-accent font-bold uppercase tracking-widest mb-2">Pattern Training</div>
          <h1 className="text-4xl font-display font-extrabold">Failure Quiz</h1>
          <p className="text-text-secondary mt-2">Train your founder intuition against real postmortem data.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Stats Badges */}
          <div className="flex gap-3 bg-surface-2 p-2 rounded-xl border border-border">
            <div className="px-3 py-1 flex items-center gap-2 bg-accent/10 text-accent rounded-lg">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-bold">{totalXP} XP</span>
            </div>
            <div className="px-3 py-1 flex items-center gap-2 bg-danger/10 text-danger rounded-lg">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold">{currentStreak} day streak</span>
            </div>
            <div className="px-3 py-1 flex items-center gap-2 bg-success/10 text-success rounded-lg">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold">{founderRank.rank}</span>
            </div>
          </div>
          <button onClick={loadQuiz} className="pv-btn-secondary">
            <RefreshCw className="w-4 h-4" />
            New Quiz
          </button>
        </div>
      </div>

      {/* Quiz Settings */}
      {!loading && questions.length === 0 && (
        <div className="pv-card p-8 text-center">
          <Brain className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Generate your quiz</h2>
          <p className="text-text-secondary text-sm mb-6">Choose your difficulty and question count.</p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Difficulty</label>
              <select
                className="w-full bg-surface-2 border border-border rounded-lg p-3 focus:outline-none focus:border-accent"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="mixed">Mixed</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Questions</label>
              <select
                className="w-full bg-surface-2 border border-border rounded-lg p-3 focus:outline-none focus:border-accent"
                value={quizCount}
                onChange={(e) => setQuizCount(parseInt(e.target.value))}
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            <button
              onClick={loadQuiz}
              className="pv-btn-primary mt-4 sm:mt-0"
            >
              <Zap className="w-4 h-4" />
              Start Quiz
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="pv-card p-16 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin mx-auto" />
          <div className="text-text-secondary">Loading questions...</div>
        </div>
      )}

      {/* Quiz Content */}
      {!loading && questions.length > 0 && (
        <>
          {/* Results Header (when complete) */}
          {complete && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pv-card p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-accent/30"
            >
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-accent/10">
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                </div>
                <div>
                  <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1">Quiz Complete!</div>
                  <div className="text-3xl font-display font-extrabold">
                    {score}/{questions.length} • {percentage}%
                  </div>
                  <div className="text-sm text-text-secondary">
                    +{earnedXP} XP earned • {founderRank.rank}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/explore" className="pv-btn-secondary">
                  Study Postmortems
                </Link>
                <button
                  onClick={loadQuiz}
                  className="pv-btn-primary flex items-center gap-2"
                >
                  Play Again <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((q, i) => {
              const picked = answers[i];
              const answered = Boolean(picked);
              const correct = answered && picked === q.answer;
              const incorrect = answered && picked !== q.answer;
              return (
                <section key={`${q.slug || i}-${i}`} className="pv-card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-muted uppercase font-bold tracking-wider bg-surface-2 px-2 py-1 rounded">
                          Question {i + 1}/{questions.length}
                        </span>
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{
                          backgroundColor: q.difficulty === 'Easy' ? 'rgba(22, 163, 74, 0.1)' : q.difficulty === 'Medium' ? 'rgba(255, 196, 0, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: q.difficulty === 'Easy' ? '#16a34a' : q.difficulty === 'Medium' ? '#ffc400' : '#ef4444'
                        }}>
                          {q.difficulty} • {q.xp} XP
                        </span>
                        <span className="text-xs text-text-muted">
                          {q.category}
                        </span>
                      </div>
                      <h2 className="text-xl font-display font-bold">{q.question}</h2>
                      <p className="text-sm text-text-secondary">{q.summary}</p>
                    </div>
                    {q.slug && (
                      <Link to={`/startup/${q.slug}`} className="text-xs text-accent font-semibold shrink-0">
                        View Case
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((option) => {
                      const isCorrect = option === q.answer;
                      const isSelected = picked === option;
                      return (
                        <button
                          key={option}
                          disabled={answered}
                          onClick={() => setAnswers((prev) => ({ ...prev, [i]: option }))}
                          className={clsx(
                            "text-left border-2 rounded-xl p-4 transition-all duration-200",
                            !answered && "bg-surface-2/40 border-border hover:border-accent/40 hover:translate-y-[-2px]",
                            answered && isCorrect && "bg-success/10 border-success/40 text-success",
                            answered && isSelected && !isCorrect && "bg-danger/10 border-danger/40 text-danger",
                            answered && !isSelected && !isCorrect && "bg-surface/40 border-border/60 text-text-secondary"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{option}</span>
                            {answered && isCorrect && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                            {answered && isSelected && !isCorrect && <XCircle className="w-5 h-5 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <div className="mt-5 text-sm text-text-secondary bg-bg/40 border border-border/60 rounded-xl p-4">
                      <div className="font-bold text-text-primary mb-2 flex items-center gap-2">
                        {correct ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-danger" />}
                        {correct ? "Great job!" : "Not quite."}
                      </div>
                      <div className="text-text-secondary leading-relaxed">
                        <span className="font-semibold">Lesson: </span>{q.explanation}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Key Lessons Section */}
          {complete && (
            <div className="mt-10 pv-card p-8">
              <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent" />
                Key Lessons
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keyLessons.map((lesson, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border bg-surface-2/30">
                    <div className="flex items-center gap-2 mb-2">
                      {lesson.correct ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger" />
                      )}
                      <span className="font-semibold text-sm text-text-primary line-clamp-1">
                        {lesson.question}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{lesson.lesson}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FailureQuiz;
