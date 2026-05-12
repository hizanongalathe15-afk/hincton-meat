import api from './api'

export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'pending'

export interface BackendMessage {
  code: string
  type: MessageType
  category: string
  message: string
}

export const messageService = {
  async getCatalog() {
    const response = await api.get('/messages')
    return response.data.messages
  },

  async getMessage(category: string, key: string, values?: Record<string, string | number>) {
    const response = await api.get<BackendMessage>(`/messages/${category}/${key}`, { params: values })
    return response.data
  },
}
