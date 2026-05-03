export type IntentAction =
  | 'research'
  | 'analyze_document'
  | 'add_holding'
  | 'remove_holding'
  | 'check_portfolio'
  | 'scan_market'
  | 'check_risk'
  | 'switch_tab'
  | 'help'
  | 'unknown'

export interface IntentMatch {
  action: IntentAction
  confidence: number
  params: Record<string, string>
  rawInput: string
}

export interface IntentDefinition {
  name: string
  description: string
  pattern: RegExp
  handler: (match: RegExpMatchArray, rawInput: string) => IntentMatch
}
