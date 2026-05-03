import type { IntentDefinition, IntentMatch } from '../types/intent-router'
import type { IntentAction } from '../types/intent-router'

const INTENTS: IntentDefinition[] = [
  {
    name: 'help',
    description: 'Show available commands',
    pattern: /^(help|\/help|\?|commands|what can you do|how do i)/i,
    handler: () => ({
      action: 'help',
      confidence: 1.0,
      params: {},
      rawInput: 'help',
    }),
  },
  {
    name: 'research',
    description: 'Research a ticker symbol',
    pattern: /^(research|analyze|look up|lookup|tell me about|info on|information on|scan)\s+([A-Z]{1,5}|[a-z]{1,5}|[A-Z][a-z]+)/i,
    handler: (match) => ({
      action: 'research',
      confidence: 0.95,
      params: { ticker: match[2]?.toUpperCase() ?? '' },
      rawInput: match[0],
    }),
  },
  {
    name: 'research_deep',
    description: 'Deep research on a company',
    pattern: /^(deep research|full analysis|comprehensive research|due diligence)\s+([A-Z]{1,5}|[a-z]{1,5}|[A-Z][a-z]+)/i,
    handler: (match) => ({
      action: 'research',
      confidence: 1.0,
      params: { ticker: match[2]?.toUpperCase() ?? '', depth: 'deep' },
      rawInput: match[0],
    }),
  },
  {
    name: 'analyze_document',
    description: 'Analyze a document for risk',
    pattern: /^(analyze (this|document)|check risk in|review document|scan text)\s*/i,
    handler: () => ({
      action: 'analyze_document',
      confidence: 0.9,
      params: {},
      rawInput: 'analyze document',
    }),
  },
  {
    name: 'add_holding',
    description: 'Add a holding to portfolio',
    pattern: /^(add|buy|purchase)\s+([\d.]+)\s*(shares?)?\s+(of\s+)?([A-Z]{1,5}|[a-z]{1,5})/i,
    handler: (match) => ({
      action: 'add_holding',
      confidence: 0.95,
      params: {
        ticker: match[5]?.toUpperCase() ?? '',
        qty: match[2] ?? '',
      },
      rawInput: match[0],
    }),
  },
  {
    name: 'add_holding_at_price',
    description: 'Add holding at specific price',
    pattern: /^(add|buy)\s+([A-Z]{1,5}|[a-z]{1,5})\s+at\s+\$?([\d.]+)/i,
    handler: (match) => ({
      action: 'add_holding',
      confidence: 0.9,
      params: {
        ticker: match[2]?.toUpperCase() ?? '',
        price: match[3] ?? '',
      },
      rawInput: match[0],
    }),
  },
  {
    name: 'remove_holding',
    description: 'Remove a holding from portfolio',
    pattern: /^(remove|sell|delete)\s+([A-Z]{1,5}|[a-z]{1,5})/i,
    handler: (match) => ({
      action: 'remove_holding',
      confidence: 0.9,
      params: { ticker: match[2]?.toUpperCase() ?? '' },
      rawInput: match[0],
    }),
  },
  {
    name: 'check_portfolio',
    description: 'Check portfolio status',
    pattern: /^(portfolio|my portfolio|portfolio summary|how am i doing|my holdings|positions)/i,
    handler: () => ({
      action: 'check_portfolio',
      confidence: 0.95,
      params: {},
      rawInput: 'check portfolio',
    }),
  },
  {
    name: 'scan_market',
    description: 'Scan market overview',
    pattern: /^(market|market scan|scan market|market overview|market status|how's the market|how is the market)/i,
    handler: () => ({
      action: 'scan_market',
      confidence: 0.95,
      params: {},
      rawInput: 'scan market',
    }),
  },
  {
    name: 'check_risk',
    description: 'Check risk metrics',
    pattern: /^(risk|risk check|risk assessment|check risk|risk profile|my risk|risk analysis)/i,
    handler: () => ({
      action: 'check_risk',
      confidence: 0.95,
      params: {},
      rawInput: 'check risk',
    }),
  },
  {
    name: 'switch_to_market',
    description: 'Switch to market tab',
    pattern: /^(show market|go to market|market tab|open market)/i,
    handler: () => ({
      action: 'switch_tab',
      confidence: 0.9,
      params: { tab: 'market' },
      rawInput: 'switch to market',
    }),
  },
  {
    name: 'switch_to_sectors',
    description: 'Switch to sectors tab',
    pattern: /^(show sectors|go to sectors|sectors tab|open sectors|sector analysis)/i,
    handler: () => ({
      action: 'switch_tab',
      confidence: 0.9,
      params: { tab: 'sectors' },
      rawInput: 'switch to sectors',
    }),
  },
  {
    name: 'switch_to_portfolio',
    description: 'Switch to portfolio tab',
    pattern: /^(show portfolio|go to portfolio|portfolio tab|open portfolio)/i,
    handler: () => ({
      action: 'switch_tab',
      confidence: 0.9,
      params: { tab: 'portfolio' },
      rawInput: 'switch to portfolio',
    }),
  },
  {
    name: 'switch_to_research',
    description: 'Switch to research tab',
    pattern: /^(show research|go to research|research tab|open research)/i,
    handler: () => ({
      action: 'switch_tab',
      confidence: 0.9,
      params: { tab: 'research' },
      rawInput: 'switch to research',
    }),
  },
  {
    name: 'switch_to_settings',
    description: 'Switch to settings tab',
    pattern: /^(show settings|go to settings|settings tab|open settings|preferences)/i,
    handler: () => ({
      action: 'switch_tab',
      confidence: 0.9,
      params: { tab: 'settings' },
      rawInput: 'switch to settings',
    }),
  },
]

function fuzzyMatchIntent(input: string): IntentMatch | null {
  const normalized = input.toLowerCase().trim()

  for (const intent of INTENTS) {
    const match = normalized.match(intent.pattern)
    if (match) {
      return intent.handler(match, input)
    }
  }

  const tickerPattern = /\b([A-Z]{1,5})\b/
  const tickerMatch = input.match(tickerPattern)
  if (tickerMatch && input.length < 50) {
    return {
      action: 'research',
      confidence: 0.6,
      params: { ticker: tickerMatch[1] },
      rawInput: input,
    }
  }

  return null
}

export function routeCommand(input: string): IntentMatch {
  const trimmed = input.trim()

  if (trimmed.startsWith('/')) {
    const [command, ...args] = trimmed.slice(1).split(' ')
    const actionMap: Record<string, IntentAction> = {
      research: 'research',
      analyze: 'analyze_document',
      add: 'add_holding',
      buy: 'add_holding',
      sell: 'remove_holding',
      remove: 'remove_holding',
      portfolio: 'check_portfolio',
      positions: 'check_portfolio',
      market: 'scan_market',
      scan: 'scan_market',
      risk: 'check_risk',
      help: 'help',
    }

    const action = actionMap[command] ?? 'unknown'
    return {
      action,
      confidence: 1.0,
      params: args.length > 0 ? { args: args.join(' ') } : {},
      rawInput: trimmed,
    }
  }

  return fuzzyMatchIntent(trimmed) ?? {
    action: 'unknown',
    confidence: 0,
    params: {},
    rawInput: trimmed,
  }
}

export function getIntentHelp(): string {
  return `Available commands:

Research:
  research AAPL          Research a ticker
  deep research TSLA     In-depth company analysis
  analyze document       Analyze text for risk

Portfolio:
  add 10 shares AAPL     Add holding to portfolio
  buy AAPL at $150       Add holding at price
  remove AAPL            Remove holding
  portfolio              View portfolio summary

Market:
  market                 Scan market overview
  risk                   Check risk metrics

Navigation:
  show market            Switch to market tab
  show sectors           Switch to sectors tab
  show portfolio         Switch to portfolio tab
  show research          Switch to research tab
  show settings          Switch to settings tab

Slash commands:
  /research AAPL
  /portfolio
  /market
  /risk
  /help`
}

export function parseDocumentForAnalysis(input: string): string | null {
  const trimmed = input.trim()
  const intent = routeCommand(trimmed)

  if (intent.action === 'analyze_document') {
    const documentPattern = /(?:analyze|check risk|review|scan)\s*(?:this|document|text)?\s*[:\n]?\s*([\s\S]+)/i
    const match = trimmed.match(documentPattern)
    return match?.[1]?.trim() ?? null
  }

  return null
}
