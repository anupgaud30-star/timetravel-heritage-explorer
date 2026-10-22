import { useMemo, useState } from "react";
import { IconArrowLeft, IconArrowRight, IconCheck, IconRefresh, IconX } from "@tabler/icons-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { historyQuizQuestions, quizCategories, quizDifficulties, type QuizCategory, type QuizDifficulty, type QuizQuestion } from "@/lib/history-quiz-data";

type AnswerRecord = {
  question: QuizQuestion;
  selectedOptionIndex: number;
};

export function HistoryQuizSection() {
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("Easy");
  const [category, setCategory] = useState<QuizCategory | "all">("all");
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState<AnswerRecord[]>([]);
  const [answers, setAnswers] = useState<{ questionId: string; selectedOptionIndex: number }[]>([]);
  const [finished, setFinished] = useState(false);

  const questions = useMemo(
    () => historyQuizQuestions.filter((question) => question.difficulty === difficulty && (category === "all" || question.category === category)),
    [category, difficulty],
  );
  const currentQuestion = questions[questionIndex];
  const hasAnswered = selectedOptionIndex !== null;
  const isCorrect = hasAnswered && selectedOptionIndex === currentQuestion?.answerIndex;

  const startQuiz = () => {
    setQuestionIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setIncorrectAnswers([]);
    setAnswers([]);
    setFinished(false);
    setStarted(true);
  };

  const chooseAnswer = (optionIndex: number) => {
    if (hasAnswered || !currentQuestion) return;
    setSelectedOptionIndex(optionIndex);
    setAnswers((current) => [...current, { questionId: currentQuestion.id, selectedOptionIndex: optionIndex }]);
    if (optionIndex === currentQuestion.answerIndex) {
      setScore((current) => current + 1);
    } else {
      setIncorrectAnswers((current) => [...current, { question: currentQuestion, selectedOptionIndex: optionIndex }]);
    }
  };

  const nextQuestion = () => {
    if (questionIndex === questions.length - 1) {
      setFinished(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedOptionIndex(null);
  };

  const changeSettings = () => {
    setStarted(false);
    setFinished(false);
    setQuestionIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setIncorrectAnswers([]);
    setAnswers([]);
  };

  return (
    <section id="quiz" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-24 md:px-10 xl:px-16" aria-labelledby="history-quiz-title">
      <div className="overflow-hidden rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_bottom_right,rgba(142,103,46,.14),transparent_42%),linear-gradient(145deg,#211e19,#191714)] p-5 md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#d7b879]">A little history, a little wonder</p>
            <h2 id="history-quiz-title" className="mt-2 font-serif text-3xl text-[#f4ecdd] md:text-5xl">History Quiz</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eee6d7]/60">Choose a challenge and test what you know, one question at a time.</p>
          </div>
          <span className="rounded-full border border-[#d7b879]/25 px-3 py-1.5 text-[9px] uppercase tracking-[.17em] text-[#e2cfaa]/70">Demo quiz · answers checked locally</span>
        </div>

        {!started ? (
          <div className="mt-7 rounded-xl border border-[#d7b879]/15 bg-[#171512]/65 p-4 md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[10px] font-semibold uppercase tracking-[.18em] text-[#d8c49b]">
                Difficulty
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value as QuizDifficulty)}>
                  <SelectTrigger aria-label="Select quiz difficulty" className="mt-2 h-11 rounded-lg border-[#d7b879]/20 bg-[#211e19] text-xs text-[#eee6d7] focus:ring-[#d7b879]"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">{quizDifficulties.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="block text-[10px] font-semibold uppercase tracking-[.18em] text-[#d8c49b]">
                Category
                <Select value={category} onValueChange={(value) => setCategory(value as QuizCategory | "all")}>
                  <SelectTrigger aria-label="Select quiz category" className="mt-2 h-11 rounded-lg border-[#d7b879]/20 bg-[#211e19] text-xs text-[#eee6d7] focus:ring-[#d7b879]"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-[#d7b879]/20 bg-[#211e19] text-[#f6f0e4]">
                    <SelectItem value="all">All categories</SelectItem>
                    {quizCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#d7b879]/10 pt-5">
              <p className="text-xs text-[#eee6d7]/55">{questions.length} {questions.length === 1 ? "question" : "questions"} · {difficulty} · {category === "all" ? "All categories" : category}</p>
              <button type="button" onClick={startQuiz} className="inline-flex items-center gap-2 rounded-full bg-[#d7b879] px-6 py-3 text-[10px] font-semibold uppercase tracking-[.15em] text-[#211b12] transition-colors hover:bg-[#eed69f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6f0e4]">Begin quiz <IconArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        ) : finished ? (
          <div className="mt-7 rounded-xl border border-[#d7b879]/15 bg-[#171512]/65 p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#d7b879]/15 pb-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#d7b879]">Challenge complete</p>
                <h3 className="mt-2 font-serif text-3xl text-[#f4ecdd]">Your result</h3>
                <p className="mt-2 text-sm text-[#eee6d7]/65">You answered <span className="text-[#e7cb8e]">{score} of {questions.length}</span> correctly.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={changeSettings} className="inline-flex items-center gap-2 rounded-full border border-[#d7b879]/35 px-4 py-2.5 text-[10px] uppercase tracking-[.12em] text-[#e7d4ac] hover:bg-[#d7b879]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"><IconArrowLeft className="h-4 w-4" aria-hidden="true" /> Change quiz</button>
                <button type="button" onClick={startQuiz} className="inline-flex items-center gap-2 rounded-full bg-[#d7b879] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#211b12] hover:bg-[#eed69f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6f0e4]"><IconRefresh className="h-4 w-4" aria-hidden="true" /> Restart</button>
              </div>
            </div>
            {incorrectAnswers.length ? (
              <div className="mt-6">
                <h4 className="font-serif text-xl text-[#f4ecdd]">Review your answers <span className="text-sm text-[#eee6d7]/50">({incorrectAnswers.length})</span></h4>
                <div className="mt-4 space-y-3">
                  {incorrectAnswers.map(({ question, selectedOptionIndex: chosen }, index) => (
                    <article key={question.id} className="rounded-lg border border-[#d7b879]/15 bg-[#211e19] p-4">
                      <p className="text-[9px] uppercase tracking-[.17em] text-[#d7b879]">{index + 1}. {question.category}</p>
                      <h5 className="mt-2 font-serif text-lg text-[#f4ecdd]">{question.prompt}</h5>
                      <p className="mt-2 text-xs leading-5 text-[#eee6d7]/60">Your answer: <span className="text-[#e0a394]">{question.options[chosen]}</span></p>
                      <p className="mt-1 text-xs leading-5 text-[#eee6d7]/75">Correct answer: <span className="text-[#b6d1a2]">{question.options[question.answerIndex]}</span></p>
                      <p className="mt-3 border-t border-[#d7b879]/10 pt-3 text-xs leading-5 text-[#d9cdb5]/65">{question.explanation}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-[#d7b879]/15 bg-[#211e19] p-4 text-sm text-[#d9cdb5]/75">A perfect round. All answers are correct.</p>
            )}
          </div>
        ) : currentQuestion ? (
          <div className="mt-7 rounded-xl border border-[#d7b879]/15 bg-[#171512]/65 p-4 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-[.16em] text-[#d9cdb5]/65">
              <span>{difficulty} <span className="mx-1 text-[#d7b879]">·</span> {currentQuestion.category}</span>
              <span>Question {questionIndex + 1} of {questions.length} <span className="mx-1 text-[#d7b879]">·</span> Score {score}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={questionIndex + 1}>
              <div className="h-full rounded-full bg-[#d7b879] transition-all duration-500" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
            </div>
            <h3 className="mt-7 max-w-3xl font-serif text-2xl leading-snug text-[#f4ecdd] md:text-3xl">{currentQuestion.prompt}</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option, index) => {
                const isAnswer = index === currentQuestion.answerIndex;
                const isSelected = index === selectedOptionIndex;
                const resultClass = hasAnswered && isAnswer
                  ? "border-[#86a879]/70 bg-[#34452f]/55 text-[#e1efcf]"
                  : hasAnswered && isSelected
                    ? "border-[#b87f70]/70 bg-[#4a302a]/55 text-[#f0d0c7]"
                    : "border-[#d7b879]/15 bg-[#211e19] text-[#eee6d7]/80 hover:border-[#d7b879]/45 hover:bg-[#29241c]";
                return (
                  <button key={option} type="button" disabled={hasAnswered} onClick={() => chooseAnswer(index)} aria-pressed={isSelected} className={`flex min-h-14 items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879] disabled:cursor-default ${resultClass}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/25 text-[10px] uppercase">{String.fromCharCode(65 + index)}</span>
                    <span className="flex-1">{option}</span>
                    {hasAnswered && isAnswer && <IconCheck className="h-4 w-4 shrink-0" aria-hidden="true" />}
                    {hasAnswered && isSelected && !isAnswer && <IconX className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {hasAnswered && (
              <div className={`mt-5 rounded-lg border p-4 ${isCorrect ? "border-[#86a879]/30 bg-[#34452f]/20" : "border-[#b87f70]/30 bg-[#4a302a]/20"}`} aria-live="polite">
                <p className={`text-xs font-semibold uppercase tracking-[.15em] ${isCorrect ? "text-[#b6d1a2]" : "text-[#e0a394]"}`}>{isCorrect ? "Correct" : "Not quite"}</p>
                <p className="mt-2 text-sm leading-6 text-[#eee6d7]/75">{currentQuestion.explanation}</p>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              {hasAnswered && <button type="button" onClick={nextQuestion} className="inline-flex items-center gap-2 rounded-full bg-[#d7b879] px-5 py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-[#211b12] hover:bg-[#eed69f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6f0e4]">{questionIndex === questions.length - 1 ? "See results" : "Next question"}<IconArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
            </div>
            <span className="sr-only" aria-live="polite">{answers.length} answers submitted</span>
          </div>
        ) : null}
        <p className="mt-4 text-center text-[10px] text-[#eee6d7]/35">Sample questions are demo content. Ready for GET /api/quiz/questions and POST /api/quiz/submit.</p>
      </div>
    </section>
  );
}
