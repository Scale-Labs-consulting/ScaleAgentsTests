# Email Branding Setup Guide

This guide will help you customize the confirmation emails sent by Supabase with your ScaleAgents branding.

## 🎨 Overview

Supabase sends confirmation emails when users:
- Sign up with email/password
- Reset their password
- Change their email address

By default, these emails use Supabase's generic template. We'll customize them with your ScaleAgents branding.

## 🚀 Setup Instructions

### 1. Access Supabase Email Templates

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. You'll see several email templates:
   - **Confirm signup**
   - **Reset password**
   - **Magic Link**
   - **Change email address**

### 2. Customize the "Confirm signup" Template

This is the most important template for new user registrations.

#### Replace the default template with this branded version:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme a sua conta - ScaleAgents</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 30px;
            background: white;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        h1 {
            color: white;
            font-size: 28px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            margin-bottom: 30px;
        }
        .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin: 20px 0;
            text-align: left;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin-top: 30px;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature {
            text-align: center;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
        }
        .feature-icon {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .feature-title {
            color: white;
            font-weight: 600;
            margin-bottom: 5px;
        }
        .feature-desc {
            color: rgba(255,255,255,0.8);
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">S</div>
        <h1>Bem-vindo ao ScaleAgents!</h1>
        <p class="subtitle">Confirme a sua conta para começar a usar a nossa plataforma de IA</p>
        
        <div class="content">
            <p>Olá!</p>
            <p>Obrigado por se registar no ScaleAgents. Para ativar a sua conta e começar a usar as nossas ferramentas de IA, clique no botão abaixo:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirmar Conta</a>
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">{{ .ConfirmationURL }}</p>
            
            <p><strong>O que pode fazer com o ScaleAgents:</strong></p>
            <ul>
                <li>📊 <strong>Sales Analyst:</strong> Analise chamadas de vendas com IA</li>
                <li>🤖 <strong>Scale Expert:</strong> Assistentes de IA personalizados</li>
            </ul>
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">📈</div>
                <div class="feature-title">Análise Avançada</div>
                <div class="feature-desc">IA para otimizar vendas</div>
            </div>
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <div class="feature-title">Rápido & Eficiente</div>
                <div class="feature-desc">Resultados em segundos</div>
            </div>
            <div class="feature">
                <div class="feature-icon">🔒</div>
                <div class="feature-title">Seguro</div>
                <div class="feature-desc">Dados protegidos</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Este link expira em 24 horas por motivos de segurança.</p>
            <p>Se não criou uma conta no ScaleAgents, pode ignorar este email.</p>
            <p>© 2024 ScaleAgents. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
```

### 3. Customize the "Reset password" Template

For password reset emails, use this template:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Palavra-passe - ScaleAgents</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 30px;
            background: white;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        h1 {
            color: white;
            font-size: 28px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .subtitle {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            margin-bottom: 30px;
        }
        .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin: 20px 0;
            text-align: left;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin-top: 30px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">S</div>
        <h1>Redefinir Palavra-passe</h1>
        <p class="subtitle">ScaleAgents - Recuperação de conta</p>
        
        <div class="content">
            <p>Olá!</p>
            <p>Recebemos um pedido para redefinir a palavra-passe da sua conta ScaleAgents.</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Redefinir Palavra-passe</a>
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">{{ .ConfirmationURL }}</p>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Se não solicitou esta redefinição, ignore este email. A sua conta permanece segura.
            </div>
            
            <p><strong>Dicas de segurança:</strong></p>
            <ul>
                <li>Use uma palavra-passe forte com pelo menos 8 caracteres</li>
                <li>Inclua letras maiúsculas, minúsculas, números e símbolos</li>
                <li>Não partilhe a sua palavra-passe com ninguém</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Este link expira em 1 hora por motivos de segurança.</p>
            <p>© 2024 ScaleAgents. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
```

### 4. Configure Email Settings

In your Supabase Dashboard:

1. Go to **Authentication** → **Settings**
2. Configure the following:

#### Site URL
```
https://your-domain.com
```

#### Redirect URLs
```
https://your-domain.com/dashboard
https://your-domain.com/auth/callback
```

#### Email Settings
- **Enable email confirmations**: ✅
- **Enable email change confirmations**: ✅
- **Enable secure email change**: ✅

### 5. Custom SMTP (Optional but Recommended)

For better deliverability and branding, configure custom SMTP:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Configure with your email provider:

#### Example with Gmail/SendGrid:
```
SMTP Host: smtp.gmail.com (or your provider)
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
SMTP Admin Email: your-email@gmail.com
SMTP Sender Name: ScaleAgents
```

### 6. Test the Email Templates

1. **Test Confirmation Email:**
   - Go to your registration page
   - Register with a test email
   - Check the email for proper branding

2. **Test Password Reset:**
   - Go to login page
   - Click "Forgot password"
   - Enter test email
   - Check the reset email

## 🎨 Customization Options

### Colors
Update the gradient colors in the CSS:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Logo
Replace the text logo with an image:
```html
<div class="logo">
    <img src="https://your-domain.com/logo.png" alt="ScaleAgents" style="width: 60px; height: 60px;">
</div>
```

### Content
Modify the text content to match your brand voice and add any specific features or benefits.

## 🔧 Advanced Customization

### Custom Email Domain
For professional branding, use a custom email domain:
- Set up `noreply@your-domain.com`
- Configure SPF, DKIM, and DMARC records
- Use this as your SMTP sender

### Email Analytics
Consider integrating with email analytics services:
- SendGrid Analytics
- Mailgun Analytics
- Postmark Analytics

## 📱 Mobile Optimization

The templates are already mobile-responsive, but you can further optimize:
- Test on various email clients
- Use media queries for specific adjustments
- Ensure buttons are touch-friendly

## 🚀 Next Steps

1. **Apply the templates** in your Supabase dashboard
2. **Test thoroughly** with different email providers
3. **Monitor delivery rates** and user engagement
4. **Iterate and improve** based on user feedback

## 📞 Support

If you need help with email configuration:
1. Check Supabase documentation
2. Test with different email providers
3. Monitor Supabase logs for delivery issues
4. Consider using a dedicated email service for production

---

**Note:** Remember to replace `{{ .ConfirmationURL }}` with the actual Supabase template variable when copying these templates.

