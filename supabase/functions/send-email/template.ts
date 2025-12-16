interface EmailTemplateInput {
  subject: string;
  body: string;
  audience: string;
  terminalCodes?: string[];
  brandUrl?: string;
  accentColor?: string;
}

export const renderEmailTemplate = ({
  subject,
  body,
  audience,
  terminalCodes,
  brandUrl = 'https://iag-lol.github.io/Asiss',
  accentColor = '#2563eb',
}: EmailTemplateInput) => {
  const terminals = terminalCodes?.length ? terminalCodes.join(', ') : 'Todos';
  const year = new Date().getFullYear();
  const dateTime = new Date().toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { box-sizing: border-box; }
    
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    
    .container {
      max-width: 640px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      text-align: center;
      padding: 24px 0;
    }
    
    .logo-container {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 50px;
      backdrop-filter: blur(10px);
    }
    
    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 18px;
    }
    
    .logo-text {
      color: #fff;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    
    .card {
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    
    .card-header {
      background: linear-gradient(135deg, ${accentColor} 0%, #1d4ed8 100%);
      padding: 32px;
      text-align: center;
    }
    
    .badge {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(255,255,255,0.2);
      border-radius: 50px;
      color: rgba(255,255,255,0.9);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    
    .card-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      line-height: 1.3;
    }
    
    .card-body {
      padding: 32px;
    }
    
    .content-box {
      background: #f8fafc;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      border-left: 4px solid ${accentColor};
    }
    
    .content-box p {
      margin: 0;
      color: #334155;
      font-size: 15px;
      line-height: 1.7;
    }
    
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 24px;
    }
    
    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .data-table tr:last-child td {
      border-bottom: none;
    }
    
    .data-table .label {
      color: #64748b;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: 140px;
      background: #f8fafc;
      border-radius: 8px 0 0 8px;
    }
    
    .data-table .value {
      color: #1e293b;
      font-weight: 500;
      font-size: 15px;
      background: #f8fafc;
      border-radius: 0 8px 8px 0;
    }
    
    .status-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid #fcd34d;
    }
    
    .status-box.authorized {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-color: #86efac;
    }
    
    .status-box.rejected {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-color: #fca5a5;
    }
    
    .status-label {
      font-size: 12px;
      font-weight: 600;
      color: #92400e;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    
    .status-value {
      font-size: 18px;
      font-weight: 800;
      color: #78350f;
      margin: 0;
    }
    
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, ${accentColor} 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
      transition: transform 0.2s;
    }
    
    .btn:hover {
      transform: translateY(-2px);
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .info-card {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e2e8f0;
    }
    
    .info-card .label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    
    .info-card .value {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .footer {
      text-align: center;
      padding: 32px 20px;
    }
    
    .footer-text {
      color: rgba(255,255,255,0.6);
      font-size: 13px;
      margin: 0 0 8px 0;
    }
    
    .footer-brand {
      color: rgba(255,255,255,0.4);
      font-size: 12px;
      margin: 0;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 24px 0;
    }
    
    @media (max-width: 600px) {
      .card-header { padding: 24px 20px; }
      .card-body { padding: 24px 20px; }
      .card-title { font-size: 20px; }
      .info-grid { grid-template-columns: 1fr; }
      .data-table .label { width: 120px; font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo-container">
        <div class="logo-icon">A</div>
        <span class="logo-text">ASISS</span>
      </div>
    </div>
    
    <!-- Main Card -->
    <div class="card">
      <div class="card-header">
        <span class="badge">Notificación de Sistema</span>
        <h1 class="card-title">${subject}</h1>
      </div>
      
      <div class="card-body">
        <!-- Content -->
        <div class="content-box">
          ${body}
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
          <div class="info-card">
            <div class="label">Terminales</div>
            <div class="value">${terminals}</div>
          </div>
          <div class="info-card">
            <div class="label">Audiencia</div>
            <div class="value">${audience === 'manual' ? 'Directo' : audience === 'todos' ? 'General' : 'Por Terminal'}</div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <!-- CTA -->
        <div style="text-align: center;">
          <a href="${brandUrl}" class="btn">
            Ir al Panel de Asistencia →
          </a>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">Este correo fue generado automáticamente el ${dateTime}</p>
      <p class="footer-brand">© ${year} Asiss · Operaciones y Logística · Transdev</p>
    </div>
  </div>
</body>
</html>`;
};
