import { T1Signals, ProfileType } from '../types'

const signalScore = (v?: string): number => v === 'a' ? 2 : v === 'b' ? 1 : 0

export function classifyProfile(signals: T1Signals): ProfileType {
  const total =
    signalScore(signals.t1q1) +
    signalScore(signals.t1q2) +
    signalScore(signals.t1q3)

  if (total >= 5) return 'builder'
  if (total >= 2) return 'grinder'
  return 'intuitive'
}
