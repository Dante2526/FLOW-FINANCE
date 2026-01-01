
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
