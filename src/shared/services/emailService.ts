import { EmailPayload, EmailService } from '../types/email';

export const emailService: EmailService = {
  sendEmail: async (payload: EmailPayload) => {
    console.info('Mock sendEmail', payload);
    return { accepted: true, messageId: `mock-${Date.now()}` };
  },
};
