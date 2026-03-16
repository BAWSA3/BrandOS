export type SignalValue = 'a' | 'b' | 'c'
export type ProfileType = 'intuitive' | 'grinder' | 'builder'
export type InterviewStatus = 'draft' | 'complete'
export type TrackKey = 't2' | 't3' | 't4' | 't5'

export interface T1Signals {
  t1q1?: SignalValue
  t1q2?: SignalValue
  t1q3?: SignalValue
}

export interface Question {
  id: string
  text: string
  profiles: ProfileType[]
  track: TrackKey
}

export interface InterviewSummary {
  headline: string
  profileSummary: string
  painPoints: string[]
  brandOSSignals: string[]
  keyInsights: string[]
  followUp: string
}

export interface Interview {
  id: string
  username: string
  tier: string
  date: string
  signals: T1Signals
  profile: ProfileType | null
  responses: Record<string, string>
  summary: InterviewSummary | null
  status: InterviewStatus
}

export interface InterviewMeta {
  id: string
  username: string
  tier: string
  date: string
  profile: ProfileType | null
  status: InterviewStatus
}
