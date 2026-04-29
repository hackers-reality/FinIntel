import { apiRequest } from './api'
import type { ComplianceBundle, ProviderSettingInput, ProviderSettingStatus, UserSettings } from '../types/settings'

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
  listProviders: (sessionToken: string) =>
    apiRequest<ProviderSettingStatus[]>('/settings/providers', {
      sessionToken,
    }),
  saveProvider: (payload: ProviderSettingInput, sessionToken: string) =>
    apiRequest<ProviderSettingStatus>('/settings/providers', {
      method: 'POST',
      sessionToken,
      body: payload,
    }),
  verifyProvider: (provider: string, sessionToken: string) =>
    apiRequest<ProviderSettingStatus>(`/settings/providers/${provider}/verify`, {
      method: 'POST',
      sessionToken,
    }),
}
