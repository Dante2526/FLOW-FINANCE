
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
    profile: {
      title: "Editar Perfil",
      proExpiry: "até",
      nameLabel: "Seu Nome",
      namePlaceholder: "SEU NOME",
      avatarLabel: "Escolher Avatar",
      lockedLabel: "Bloqueados",
      btnSave: "Salvar Perfil",
      btnLogout: "Sair da Conta",
      btnDelete: "Excluir Conta Permanentemente"
    },
    investments: {
      title: "Investimentos",
      totalEquity: "Patrimônio Total",
      yieldMonth: "Rendimento (Mês)",
      yieldYear: "Total Estimado (Ano)",
      yourAssets: "Seus Ativos",
      emptyList: "Nenhum ativo cadastrado.",
      updating: "Atualizando...",
      cdiLabel: "% do CDI a.a.",
      modalCDITitle: "Taxa CDI / Selic",
      btnUpdateRate: "Atualizar Taxa",
      form: {
          newTitle: "Novo Investimento",
          editTitle: "Editar Investimento",
          typeFixed: "Renda Fixa / CDI",
          typeFii: "Fundo Imob (FII)",
          institution: "Instituição",
          assetName: "Nome do Ativo",
          qty: "Qtd",
          totalValue: "Valor Total",
          yieldLabel: "% do CDI (Rentabilidade)",
          yieldLabelFii: "Dividend Yield (Anual Estimado)",
          btnSave: "Salvar Alterações",
          btnAdd: "Adicionar"
      }
    },
    wallet: {
      title: "Longo Prazo",
      subtitle: "GERENCIE SUAS PARCELAS",
      empty: "Nenhuma transação parcelada.",
      paid: "Pagas",
      total: "Total",
      alreadyPaid: "JÁ FOI PAGO",
      newTitle: "Nova Parcela",
      form: {
        titleLabel: "Título",
        titlePlaceholder: "EX: CARRO",
        monthlyLabel: "Valor Parcela",
        countLabel: "Vezes",
        totalLabel: "Valor Total",
        startDateLabel: "Data Início",
        hint: "Preencha apenas o Valor da Parcela OU o Valor Total. O sistema calculará o outro automaticamente ao criar.",
        cancel: "Cancelar",
        create: "Criar"
      },
      details: {
        editValuesHint: "Clique nos blocos para editar valores",
        monthlyValue: "Valor Mensal",
        paymentStatus: "Pagamento",
        totalValue: "Valor Total",
        installmentHeader: "PARCELA",
        dateHeader: "DATA PAGAMENTO",
        valueHeader: "VALOR",
        start: "Início",
        end: "Fim",
        modals: {
           newMonthlyTitle: "Novo Valor Mensal",
           newMonthlySubtitle: "Isso atualizará parcelas futuras e recalculará o total.",
           editNameTitle: "Editar Nome",
           editTotalTitle: "Editar Valor Total",
           editTotalSubtitle: "Isso ajustará o valor base das parcelas (Total / Qtd).",
           editInstallmentTitle: "Editar Parcela",
           save: "Salvar",
           cancel: "Cancelar"
        }
      }
    },
    settings: {
      title: "Configuração",
      subtitle: "Personalize sua experiência",
      proActive: "PRO ATIVO",
      systemColors: "Cores do Sistema",
      privacyTitle: "Política de Privacidade",
      privacySubtitle: "Termos de uso e dados",
      confirmColor: "Confirmar Cor",
      themes: {
        'sunset-orange': 'Sunset',
        'cyber-yellow': 'Cyber',
        'crimson-red': 'Crimson',
        'emerald-green': 'Emerald',
        'neon-lime': 'Neon',
        'ocean-blue': 'Ocean',
        'royal-purple': 'Royal',
        'hot-pink': 'Barbie',
        'rose-gold': 'Rose',
        'lavender': 'Soft',
        'aqua': 'Aqua'
      }
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
    profile: {
      title: "Edit Profile",
      proExpiry: "until",
      nameLabel: "Your Name",
      namePlaceholder: "YOUR NAME",
      avatarLabel: "Choose Avatar",
      lockedLabel: "Locked",
      btnSave: "Save Profile",
      btnLogout: "Log Out",
      btnDelete: "Delete Account Permanently"
    },
    investments: {
      title: "Investments",
      totalEquity: "Total Net Worth",
      yieldMonth: "Yield (Month)",
      yieldYear: "Est. Total (Year)",
      yourAssets: "Your Assets",
      emptyList: "No assets found.",
      updating: "Updating...",
      cdiLabel: "% of CDI p.a.",
      modalCDITitle: "CDI / Selic Rate",
      btnUpdateRate: "Update Rate",
      form: {
          newTitle: "New Investment",
          editTitle: "Edit Investment",
          typeFixed: "Fixed Income / CDI",
          typeFii: "Real Estate Fund (REIT)",
          institution: "Institution",
          assetName: "Asset Name",
          qty: "Qty",
          totalValue: "Total Value",
          yieldLabel: "% of CDI (Profitability)",
          yieldLabelFii: "Dividend Yield (Est. Yearly)",
          btnSave: "Save Changes",
          btnAdd: "Add"
      }
    },
    wallet: {
      title: "Long Term",
      subtitle: "MANAGE YOUR INSTALLMENTS",
      empty: "No installment transactions.",
      paid: "Paid",
      total: "Total",
      alreadyPaid: "ALREADY PAID",
      newTitle: "New Installment",
      form: {
        titleLabel: "Title",
        titlePlaceholder: "EX: CAR",
        monthlyLabel: "Monthly Amount",
        countLabel: "Count",
        totalLabel: "Total Amount",
        startDateLabel: "Start Date",
        hint: "Fill in only Monthly Amount OR Total Amount. The system will calculate the other automatically.",
        cancel: "Cancel",
        create: "Create"
      },
      details: {
        editValuesHint: "Click blocks to edit values",
        monthlyValue: "Monthly Value",
        paymentStatus: "Payment",
        totalValue: "Total Value",
        installmentHeader: "INSTALLMENT",
        dateHeader: "PAYMENT DATE",
        valueHeader: "VALUE",
        start: "Start",
        end: "End",
        modals: {
           newMonthlyTitle: "New Monthly Value",
           newMonthlySubtitle: "This will update future installments and recalculate total.",
           editNameTitle: "Edit Name",
           editTotalTitle: "Edit Total Value",
           editTotalSubtitle: "This will adjust base installment value (Total / Count).",
           editInstallmentTitle: "Edit Installment",
           save: "Save",
           cancel: "Cancel"
        }
      }
    },
    settings: {
      title: "Settings",
      subtitle: "Customize your experience",
      proActive: "PRO ACTIVE",
      systemColors: "System Colors",
      privacyTitle: "Privacy Policy",
      privacySubtitle: "Terms of use and data",
      confirmColor: "Confirm Color",
      themes: {
        'sunset-orange': 'Sunset',
        'cyber-yellow': 'Cyber',
        'crimson-red': 'Crimson',
        'emerald-green': 'Emerald',
        'neon-lime': 'Neon',
        'ocean-blue': 'Ocean',
        'royal-purple': 'Royal',
        'hot-pink': 'Barbie',
        'rose-gold': 'Rose',
        'lavender': 'Soft',
        'aqua': 'Aqua'
      }
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
    profile: {
      title: "Editar Perfil",
      proExpiry: "hasta",
      nameLabel: "Tu Nombre",
      namePlaceholder: "TU NOMBRE",
      avatarLabel: "Elegir Avatar",
      lockedLabel: "Bloqueados",
      btnSave: "Guardar Perfil",
      btnLogout: "Cerrar Sesión",
      btnDelete: "Eliminar Cuenta Permanentemente"
    },
    investments: {
      title: "Inversiones",
      totalEquity: "Patrimonio Total",
      yieldMonth: "Rendimiento (Mes)",
      yieldYear: "Total Estimado (Año)",
      yourAssets: "Tus Activos",
      emptyList: "Ningún activo registrado.",
      updating: "Actualizando...",
      cdiLabel: "% del CDI a.a.",
      modalCDITitle: "Tasa CDI / Selic",
      btnUpdateRate: "Actualizar Tasa",
      form: {
          newTitle: "Nueva Inversión",
          editTitle: "Editar Inversión",
          typeFixed: "Renta Fija / CDI",
          typeFii: "Fondo Inmob. (FII)",
          institution: "Institución",
          assetName: "Nombre del Activo",
          qty: "Cant",
          totalValue: "Valor Total",
          yieldLabel: "% del CDI (Rentabilidad)",
          yieldLabelFii: "Dividend Yield (Est. Anual)",
          btnSave: "Guardar Cambios",
          btnAdd: "Añadir"
      }
    },
    wallet: {
      title: "Largo Plazo",
      subtitle: "ADMINISTRA TUS CUOTAS",
      empty: "Ninguna transacción en cuotas.",
      paid: "Pagadas",
      total: "Total",
      alreadyPaid: "YA PAGADO",
      newTitle: "Nueva Cuota",
      form: {
        titleLabel: "Título",
        titlePlaceholder: "EJ: COCHE",
        monthlyLabel: "Valor Cuota",
        countLabel: "Veces",
        totalLabel: "Valor Total",
        startDateLabel: "Fecha Inicio",
        hint: "Rellena solo Valor Cuota O Valor Total. El sistema calculará el otro automáticamente.",
        cancel: "Cancelar",
        create: "Crear"
      },
      details: {
        editValuesHint: "Haz clic en bloques para editar",
        monthlyValue: "Valor Mensual",
        paymentStatus: "Pago",
        totalValue: "Valor Total",
        installmentHeader: "CUOTA",
        dateHeader: "FECHA PAGO",
        valueHeader: "VALOR",
        start: "Inicio",
        end: "Fin",
        modals: {
           newMonthlyTitle: "Nuevo Valor Mensual",
           newMonthlySubtitle: "Esto actualizará cuotas futuras y recalculará el total.",
           editNameTitle: "Editar Nombre",
           editTotalTitle: "Editar Valor Total",
           editTotalSubtitle: "Esto ajustará el valor base de cuotas (Total / Cant).",
           editInstallmentTitle: "Editar Cuota",
           save: "Guardar",
           cancel: "Cancelar"
        }
      }
    },
    settings: {
      title: "Ajustes",
      subtitle: "Personaliza tu experiencia",
      proActive: "PRO ACTIVO",
      systemColors: "Colores del Sistema",
      privacyTitle: "Política de Privacidad",
      privacySubtitle: "Términos de uso y datos",
      confirmColor: "Confirmar Color",
      themes: {
        'sunset-orange': 'Sunset',
        'cyber-yellow': 'Cyber',
        'crimson-red': 'Crimson',
        'emerald-green': 'Emerald',
        'neon-lime': 'Neon',
        'ocean-blue': 'Ocean',
        'royal-purple': 'Royal',
        'hot-pink': 'Barbie',
        'rose-gold': 'Rose',
        'lavender': 'Soft',
        'aqua': 'Aqua'
      }
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
      verifySub: 'Enviamos um código a',
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