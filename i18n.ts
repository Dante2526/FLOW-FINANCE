
import { AppLanguage } from './types';

export const TRANSLATIONS = {
  pt: {
    welcome: 'Bem vindo',
    balanceLabel: 'LUCRO',
    quickAccessTitle: 'ACESSO RÁPIDO',
    billsTitle: 'CONTAS',
    addBtn: 'Adicionar',
    nav: {
      home: 'INÍCIO',
      invest: 'INVEST',
      wallet: 'CARTEIRA',
      config: 'CONFIG'
    },
    months: {
        jan: 'JANEIRO', fev: 'FEVEREIRO', mar: 'MARÇO', abr: 'ABRIL', mai: 'MAIO', jun: 'JUNHO',
        jul: 'JULHO', ago: 'AGOSTO', set: 'SETEMBRO', out: 'OUTUBRO', nov: 'NOVEMBRO', dez: 'DEZEMBRO'
    },
    auth: {
      appSubtitle: 'Controle financeiro inteligente.',
      welcomeBack: 'Bem-vindo de volta',
      createAccount: 'Crie sua conta',
      loginSub: 'Entre para acessar suas finanças.',
      registerSub: 'Comece a controlar seu dinheiro hoje.',
      namePlaceholder: 'Seu Nome',
      emailPlaceholder: 'seu@email.com',
      btnEnter: 'Entrar',
      btnCreate: 'Criar Conta',
      haveAccount: 'Já possui conta? Fazer Login',
      noAccount: 'Não tem uma conta? Cadastre-se',
      verifyTitle: 'Verificar Código',
      verifySub: 'Enviamos um código para',
      spamWarning: 'Verifique a caixa de Spam',
      otpPlaceholder: '000000',
      btnVerify: 'Verificar',
      resendWait: 'Aguarde {s}s para reenviar',
      resendBtn: 'Não recebeu? Reenviar código',
      security: 'SEM SENHA · ACESSO SEGURO',
      back: 'Voltar',
      errors: {
        invalidEmail: 'Por favor, insira um e-mail válido.',
        missingName: 'Por favor, informe seu nome.',
        invalidCode: 'O código deve ter exatamente 6 dígitos.'
      }
    }
  },
  en: {
    welcome: 'Welcome',
    balanceLabel: 'PROFIT',
    quickAccessTitle: 'QUICK ACCESS',
    billsTitle: 'BILLS',
    addBtn: 'Add',
    nav: {
      home: 'HOME',
      invest: 'INVEST',
      wallet: 'WALLET',
      config: 'SETTINGS'
    },
    months: {
        jan: 'JANUARY', fev: 'FEBRUARY', mar: 'MARCH', abr: 'APRIL', mai: 'MAY', jun: 'JUNE',
        jul: 'JULY', ago: 'AUGUST', set: 'SEPTEMBER', out: 'OCTOBER', nov: 'NOVEMBER', dez: 'DECEMBER'
    },
    auth: {
      appSubtitle: 'Smart financial control.',
      welcomeBack: 'Welcome back',
      createAccount: 'Create account',
      loginSub: 'Log in to access your finances.',
      registerSub: 'Start controlling your money today.',
      namePlaceholder: 'Your Name',
      emailPlaceholder: 'your@email.com',
      btnEnter: 'Log In',
      btnCreate: 'Sign Up',
      haveAccount: 'Already have an account? Log In',
      noAccount: "Don't have an account? Sign Up",
      verifyTitle: 'Verify Code',
      verifySub: 'We sent a code to',
      spamWarning: 'Check your Spam folder',
      otpPlaceholder: '000000',
      btnVerify: 'Verify',
      resendWait: 'Wait {s}s to resend',
      resendBtn: "Didn't receive it? Resend code",
      security: 'NO PASSWORD · SECURE ACCESS',
      back: 'Back',
      errors: {
        invalidEmail: 'Please enter a valid email.',
        missingName: 'Please enter your name.',
        invalidCode: 'The code must be exactly 6 digits.'
      }
    }
  },
  es: {
    welcome: 'Bienvenido',
    balanceLabel: 'LUCRO',
    quickAccessTitle: 'ACCESO RÁPIDO',
    billsTitle: 'CUENTAS',
    addBtn: 'Añadir',
    nav: {
      home: 'INICIO',
      invest: 'INVERTIR',
      wallet: 'CARTERA',
      config: 'AJUSTES'
    },
    months: {
        jan: 'ENERO', fev: 'FEBRERO', mar: 'MARZO', abr: 'ABRIL', mai: 'MAYO', jun: 'JUNIO',
        jul: 'JULIO', ago: 'AGOSTO', set: 'SEPTIEMBRE', out: 'OCTUBRE', nov: 'NOVIEMBRE', dez: 'DICIEMBRE'
    },
    auth: {
      appSubtitle: 'Control financiero inteligente.',
      welcomeBack: 'Bienvenido de nuevo',
      createAccount: 'Crea tu cuenta',
      loginSub: 'Ingresa para acceder a tus finanzas.',
      registerSub: 'Empieza a controlar tu dinero hoy.',
      namePlaceholder: 'Tu Nombre',
      emailPlaceholder: 'tu@email.com',
      btnEnter: 'Entrar',
      btnCreate: 'Crear Cuenta',
      haveAccount: '¿Ya tienes cuenta? Iniciar Sesión',
      noAccount: '¿No tienes cuenta? Regístrate',
      verifyTitle: 'Verificar Código',
      verifySub: 'Enviamos un código a',
      spamWarning: 'Revisa tu carpeta de Spam',
      otpPlaceholder: '000000',
      btnVerify: 'Verificar',
      resendWait: 'Espera {s}s para reenviar',
      resendBtn: '¿No lo recibiste? Reenviar código',
      security: 'SIN CONTRASEÑA · ACCESO SEGURO',
      back: 'Volver',
      errors: {
        invalidEmail: 'Por favor, ingresa un correo válido.',
        missingName: 'Por favor, ingresa tu nombre.',
        invalidCode: 'El código debe tener exactamente 6 dígitos.'
      }
    }
  }
};

export const getLocale = (lang: AppLanguage) => {
    switch(lang) {
        case 'en': return 'en-US';
        case 'es': return 'es-ES';
        default: return 'pt-BR';
    }
};
