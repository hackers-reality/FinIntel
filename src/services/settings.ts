import { apiRequest } from './api'
import type { ComplianceBundle, UserSettings } from '../types/settings'

export const settingsService = {
  getCompliance: () => apiRequest<ComplianceBundle>('/system/compliance'),
  getSettings: (sessionToken: string) =>
    apiRequest<UserSettings>('/settings', {
      sessionToken,
    }),
  updateSettings: (payload: Partial<UserSettings>, sessionToken: string) =>
    apiRequest<UserSettings>('/settings', {
      method: 'PUT',
      sessionToken,
      body: payload,
    }),
}
