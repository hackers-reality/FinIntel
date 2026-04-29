import { useEffect, useState } from 'react'

import { brokerService } from '../services/broker'
import type { BrokerAccountSummary } from '../types/broker'

export function useBroker(sessionToken: string | null) {
  const [account, setAccount] = useState<BrokerAccountSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionToken) {
      return
    }
    void brokerService.getAccountSummary(sessionToken).then((response) => {
      setAccount(response)
      setError(null)
    }).catch(() => {
      setError('Unable to load broker account summary.')
    })
  }, [sessionToken])

  return {
    account,
    error,
  }
}
