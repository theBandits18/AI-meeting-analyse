import type { TranscriptAnalysis } from '../types'

const DECISION_PHRASES = ['we will', 'agreed', 'action item', 'owner', 'deadline']
const FILLER_PHRASES = [
  'um',
  'uh',
  'you know',
  'like',
  'basically',
  'actually',
  'kind of',
  'sort of',
  'i think',
  'maybe',
]

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const countPhraseMatches = (text: string, phrase: string) => {
  const matcher = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'g')
  return text.match(matcher)?.length ?? 0
}

export function analyzeTranscript(
  transcript: string,
  totalCost: number,
): TranscriptAnalysis {
  const normalizedText = transcript.toLowerCase()
  const wordCount = normalizedText.match(/\b[\w'-]+\b/g)?.length ?? 0
  const sentences = transcript
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const sentenceCount = sentences.length
  const questionCount = transcript.match(/\?/g)?.length ?? 0
  const decisionPhraseCount = DECISION_PHRASES.reduce(
    (total, phrase) => total + countPhraseMatches(normalizedText, phrase),
    0,
  )
  const fillerCount = FILLER_PHRASES.reduce(
    (total, phrase) => total + countPhraseMatches(normalizedText, phrase),
    0,
  )

  const questionDensity = sentenceCount > 0 ? questionCount / sentenceCount : 0
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0
  const decisionDensity = wordCount > 0 ? (decisionPhraseCount * 100) / wordCount : 0
  const costPerDecision =
    decisionPhraseCount > 0 ? totalCost / decisionPhraseCount : totalCost

  const questionBalance =
    questionDensity === 0
      ? 0
      : 1 - Math.min(Math.abs(questionDensity - 0.22) / 0.22, 1)

  let roiScore = 25
  roiScore += Math.min(40, decisionDensity * 9)
  roiScore += Math.min(15, questionBalance * 15)
  roiScore += Math.min(15, decisionPhraseCount * 2.5)
  roiScore -= Math.min(22, fillerRatio * 180)
  roiScore -= Math.min(25, costPerDecision / 14)

  if (questionCount === 0) {
    roiScore -= 6
  }

  if (decisionPhraseCount === 0) {
    roiScore -= 12
  }

  if (wordCount < 30) {
    roiScore -= 5
  }

  const roundedRoiScore = clamp(Math.round(roiScore), 0, 100)
  const verdict =
    roundedRoiScore >= 82
      ? 'High value meeting'
      : roundedRoiScore >= 64
        ? 'Good sync'
        : roundedRoiScore >= 42
          ? "Could've been shorter"
          : "Should've been an email"

  return {
    wordCount,
    sentenceCount,
    decisionPhraseCount,
    questionCount,
    questionDensity,
    fillerCount,
    fillerRatio,
    roiScore: roundedRoiScore,
    verdict,
  }
}
