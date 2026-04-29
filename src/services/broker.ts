import { apiRequest } from './api'
import type { BrokerAccountSummary } from '../types/broker'

export const brokerService = {
  getAccountSummary: (sessionToken: string) =>
    apiRequest<BrokerAccountSummary>('/market/broker/account', {
      sessionToken,
    }),
}
