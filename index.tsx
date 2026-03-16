"use client";

import { useState, useEffect, useCallback } from "react";
import datasetJson from "./data.json";

interface QuizEntry {
  text: string;
  source: "ai" | "child";
  context: string;
  age?: number;
  model?: string;
}

const dataset: QuizEntry[] = datasetJson as QuizEntry[];

const ROUNDS_PER_GAME = 20;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRating(score: number): string {
  if (score >= 18) return "Turing Test Administrator";
  if (score >= 14) return "Pretty Good Pattern Matcher";
  if (score >= 10) return "It's Harder Than It Looks";
  return "Maybe You're the AI";
}

type GamePhase = "playing" | "revealed" | "finished";

export default function AIOrChild() {
  const [questions, setQuestions] = useState<QuizEntry[]>(() =>
    shuffle(dataset).slice(0, ROUNDS_PER_GAME)
  );
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  const startGame = useCallback(() => {
    const shuffled = shuffle(dataset).slice(0, ROUNDS_PER_GAME);
    setQuestions(shuffled);
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setPhase("playing");
    setLastCorrect(null);
    setFlashColor(null);
  }, []);

  const handleGuess = useCallback(
    (guess: "ai" | "child") => {
      if (phase !== "playing" || !questions[round]) return;
      const correct = guess === questions[round].source;
      setLastCorrect(correct);
      if (correct) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        setFlashColor("rgba(34,197,94,0.15)");
      } else {
        setStreak(0);
        setFlashColor("rgba(239,68,68,0.15)");
      }
      setPhase("revealed");
      setTimeout(() => setFlashColor(null), 400);
    },
    [phase, questions, round]
  );

  const handleNext = useCallback(() => {
    if (round + 1 >= ROUNDS_PER_GAME) {
      setPhase("finished");
    } else {
      setRound((r) => r + 1);
      setPhase("playing");
      setLastCorrect(null);
    }
  }, [round]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (phase === "playing") {
        if (key === "a") handleGuess("ai");
        else if (key === "c") handleGuess("child");
      } else if (phase === "revealed") {
        if (key === " " || key === "enter") {
          e.preventDefault();
          handleNext();
        }
      } else if (phase === "finished") {
        if (key === " " || key === "enter") {
          e.preventDefault();
          startGame();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleGuess, handleNext, startGame]);

  const current = questions[round];

  if (!current && phase !== "finished") {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: flashColor || "#1a1a2e",
        transition: "background-color 0.4s ease",
      }}
    >
      <style>{`
        .aoc-btn:focus-visible {
          outline: 2px solid rgba(99, 179, 237, 0.8);
          outline-offset: 2px;
        }
        @media (max-width: 400px) {
          .aoc-bottom {
            padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)) !important;
            padding-top: 0.75rem !important;
          }
          .aoc-bottom button {
            padding: 0.75rem 1rem !important;
            font-size: 1rem !important;
          }
        }
      `}</style>
      {phase !== "finished" ? (
        <>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <span style={styles.roundLabel}>
                {round + 1} / {ROUNDS_PER_GAME}
              </span>
            </div>
            <div style={styles.headerCenter}>
              <span style={styles.scoreLabel}>
                Score: {score}
              </span>
              {streak > 1 && (
                <span style={styles.streakLabel}>
                  {streak} streak
                </span>
              )}
            </div>
            <div style={styles.headerRight} />
          </div>

          {/* Quote area */}
          <div style={styles.quoteArea}>
            <div style={styles.quoteContainer}>
              <div style={styles.quoteBorder} />
              <p style={styles.quoteText}>{current.text}</p>
            </div>

            {/* Reveal area */}
            <div
              style={{
                ...styles.revealArea,
                opacity: phase === "revealed" ? 1 : 0,
                transform: phase === "revealed" ? "translateY(0)" : "translateY(8px)",
              }}
            >
              {phase === "revealed" && (
                <>
                  <div
                    style={{
                      ...styles.revealBadge,
                      color: lastCorrect ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {lastCorrect ? "Correct" : "Wrong"}
                  </div>
                  <div style={styles.revealSource}>
                    {current.source === "child" ? "Child" : "AI"}
                  </div>
                  <div style={styles.revealContext}>{current.context}</div>
                </>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="aoc-bottom" style={styles.buttonArea}>
            {phase === "playing" ? (
              <div style={styles.buttonRow}>
                <button
                  className="aoc-btn"
                  style={styles.aiButton}
                  onClick={() => handleGuess("ai")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(6,182,212,0.2)";
                    e.currentTarget.style.borderColor = "rgba(6,182,212,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(6,182,212,0.08)";
                    e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)";
                  }}
                >
                  <span style={styles.buttonLabel}>AI</span>
                  <span style={styles.buttonHint}>A</span>
                </button>
                <button
                  className="aoc-btn"
                  style={styles.childButton}
                  onClick={() => handleGuess("child")}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.2)";
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.08)";
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)";
                  }}
                >
                  <span style={styles.buttonLabel}>Child</span>
                  <span style={styles.buttonHint}>C</span>
                </button>
              </div>
            ) : (
              <button
                className="aoc-btn"
                style={styles.nextButton}
                onClick={handleNext}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                }}
              >
                {round + 1 >= ROUNDS_PER_GAME ? "See Results" : "Next"}
              </button>
            )}
          </div>
        </>
      ) : (
        /* Final screen */
        <div style={styles.finalScreen}>
          <h1 style={styles.finalTitle}>Game Over</h1>
          <div style={styles.finalScore}>
            {score} / {ROUNDS_PER_GAME}
          </div>
          <div style={styles.finalAccuracy}>
            {Math.round((score / ROUNDS_PER_GAME) * 100)}% accuracy
          </div>
          {bestStreak > 1 && (
            <div style={styles.finalStreak}>Best streak: {bestStreak}</div>
          )}
          <div style={styles.finalRating}>{getRating(score)}</div>
          <button
            className="aoc-btn"
            style={styles.playAgainButton}
            onClick={startGame}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    top: 64,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1a1a2e",
    color: "#e5e5e5",
    fontFamily: "system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  loading: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.125rem",
    color: "#737373",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 1.5rem",
    flexShrink: 0,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
  },
  headerRight: {
    flex: 1,
  },
  roundLabel: {
    fontSize: "0.875rem",
    color: "#737373",
    letterSpacing: "0.05em",
  },
  scoreLabel: {
    fontSize: "1rem",
    fontWeight: 500,
    color: "#d4d4d4",
  },
  streakLabel: {
    fontSize: "0.8125rem",
    color: "#a3a3a3",
    padding: "0.125rem 0.5rem",
    borderRadius: "9999px",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // Quote
  quoteArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1.5rem",
    minHeight: 0,
  },
  quoteContainer: {
    position: "relative",
    maxWidth: "40rem",
    width: "100%",
    paddingLeft: "1.5rem",
  },
  quoteBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "3px",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: "2px",
  },
  quoteText: {
    fontSize: "clamp(1.25rem, 3.5vw, 1.75rem)",
    lineHeight: 1.6,
    fontStyle: "italic",
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: "#f5f5f5",
    margin: 0,
  },

  // Reveal
  revealArea: {
    marginTop: "2rem",
    textAlign: "center",
    transition: "opacity 0.35s ease, transform 0.35s ease",
    minHeight: "5rem",
  },
  revealBadge: {
    fontSize: "0.875rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    marginBottom: "0.5rem",
  },
  revealSource: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#e5e5e5",
    marginBottom: "0.25rem",
  },
  revealContext: {
    fontSize: "0.9375rem",
    color: "#a3a3a3",
    fontStyle: "italic",
  },

  // Buttons
  buttonArea: {
    padding: "1.5rem",
    flexShrink: 0,
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#1a1a2e",
  },
  buttonRow: {
    display: "flex",
    gap: "1rem",
    width: "100%",
    maxWidth: "28rem",
  },
  aiButton: {
    flex: 1,
    padding: "1rem 1.5rem",
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "rgba(6,182,212,0.9)",
    backgroundColor: "rgba(6,182,212,0.08)",
    border: "1px solid rgba(6,182,212,0.3)",
    borderRadius: "0.75rem",
    cursor: "pointer",
    transition: "background-color 0.2s, border-color 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  childButton: {
    flex: 1,
    padding: "1rem 1.5rem",
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "rgba(245,158,11,0.9)",
    backgroundColor: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.3)",
    borderRadius: "0.75rem",
    cursor: "pointer",
    transition: "background-color 0.2s, border-color 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  buttonLabel: {},
  buttonHint: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "0.25rem",
    padding: "0.0625rem 0.375rem",
    fontWeight: 400,
  },
  nextButton: {
    padding: "0.875rem 2.5rem",
    fontSize: "1rem",
    fontWeight: 500,
    color: "#d4d4d4",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "0.75rem",
    cursor: "pointer",
    transition: "background-color 0.2s",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },

  // Final screen
  finalScreen: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    gap: "0.75rem",
  },
  finalTitle: {
    fontSize: "1.125rem",
    fontWeight: 400,
    color: "#737373",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    margin: 0,
  },
  finalScore: {
    fontSize: "3.5rem",
    fontWeight: 700,
    color: "#f5f5f5",
    lineHeight: 1.1,
  },
  finalAccuracy: {
    fontSize: "1.125rem",
    color: "#a3a3a3",
  },
  finalStreak: {
    fontSize: "0.9375rem",
    color: "#737373",
  },
  finalRating: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#e5e5e5",
    marginTop: "1rem",
    fontStyle: "italic",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  playAgainButton: {
    marginTop: "1.5rem",
    padding: "0.875rem 2.5rem",
    fontSize: "1rem",
    fontWeight: 500,
    color: "#d4d4d4",
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "0.75rem",
    cursor: "pointer",
    transition: "background-color 0.2s",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
};
