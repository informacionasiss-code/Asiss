import { TerminalCode } from './terminal';

export type EmailAudience = 'todos' | 'por_terminal' | 'manual';

export interface EmailAttachment {
  filename: string;
  content: string; // base64
}

export interface EmailPayload {
  audience: EmailAudience;
  terminalCodes?: TerminalCode[];
  manualRecipients?: string[];
  cc?: string[];
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  module?: 'asistencia' | 'credenciales' | 'informativos' | 'minicheck';
}

export interface EmailService {
  sendEmail: (payload: EmailPayload) => Promise<{ accepted: boolean; messageId: string }>;
}
