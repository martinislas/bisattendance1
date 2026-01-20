import apiClient from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Send message to AI chat
export const sendChatMessage = async (
  message: string,
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> => {
  const response = await apiClient.post('/chat', {
    message,
    conversationHistory,
  });
  return response.data;
};
