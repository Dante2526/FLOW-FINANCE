import { AppLanguage } from './types';

export const getBrowserLanguage = (): AppLanguage => {
  if (typeof navigator === 'undefined') return 'pt';
  
  const lang = navigator.language.toLowerCase();
  
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';
  
  // Default to Portuguese
  return 'pt';
};

export const TRANSLATIONS = {
  pt: {
    welcome: 'Bem vindo',
    balanceLabel: 'LUCRO',
    quickAccessTitle: 'ACESSO RÁPIDO',
    billsTitle: 'CONTAS',
    addBtn: 'Adicionar',
    meta: {
      title: "Flow Finance",
      description: "Controle financeiro inteligente e moderno."
    },
    ai: {
      disabled: "Funcionalidade de IA desativada."
    },
    common: {
      defaultUser: "Usuário",
      confirmDeleteMonth: "Apagar Mês?",
      deleteMonthTitle: "Deletar Mês",
      hideBalance: "Esconder saldo",
      showBalance: "Mostrar saldo",
      duplicateMonth: "Duplicar contas para o próximo mês",
      addSource: "Adicionar Nova Fonte de Renda",
      monthExists: "O mês de {month}/{year} já existe.",
      splashVersion: "Flow Finance v1.5"
    },
    nav: {
      home: 'INÍCIO',
      invest: 'INVEST',
      wallet: 'CARTEIRA',
      config: 'CONFIG'
    },
    home: {
      support: {
        tag: "Apoie",
        title: "Apoie o Projeto",
        subtitle: "Doe qualquer valor via Pix."
      },
      jeitto: {
        tag: "Indicação",
        title: "Limite Extra Disponível?",
        subtitle: "Baixe o Jeitto e confira sua aprovação."
      }
    },
    transactionList: {
      types: {
        purchase: 'Compra',
        subscription: 'Assinatura',
        transfer: 'Transferência'
      },
      due: 'Vence:',
      today: 'Hoje',
      methods: {
        pix: 'PIX',
        card: 'CARTAO'
      },
      actions: {
        edit: "Editar",
        delete: "Excluir"
      }
    },
    months: {
        jan: 'JANEIRO', fev: 'FEVEREIRO', mar: 'MARÇO', abr: 'ABRIL', mai: 'MAIO', jun: 'JUNHO',
        jul: 'JULHO', ago: 'AGOSTO', set: 'SETEMBRO', out: 'OUTUBRO', nov: 'NOVEMBRO', dez: 'DEZEMBRO'
    },
    calculator: {
      title: "Calculadora",
      copied: "Copiado",
      copy: "Copiar",
      error: "Erro",
      clearEntry: "C",
      allClear: "AC"
    },
    analytics: {
      title: "Análise",
      subtitle: "Estatísticas de Gastos",
      chartTitle: "Histórico Mensal",
      kpiAverage: "Média Mensal",
      kpiHighest: "Maior Gasto",
      insightsTitle: "Insights",
      insightFrequent: "Mais Frequente",
      insightSplitTitle: "Assinaturas vs Compras",
      insightSplitSubtitle: "Distribuição de gastos",
      subscriptions: "Assinaturas",
      purchases: "Compras"
    },
    calendar: {
      title: "Calendário",
      subtitle: "Agenda Financeira",
      weekDays: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
      empty: "Nada agendado.",
      typeSubscription: "Assinatura",
      typePurchase: "Compra",
      paidTag: "PAGO",
      monthsShort: {
        'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
      }
    },
    notepad: {
      title: "Bloco de Notas",
      subtitle: "Texto e Desenho livres",
      placeholder: "Digite suas anotações aqui...",
      clearTitle: "Limpar Tudo",
      clearConfirm: "Confirmar?",
      tools: {
        type: "Digitar",
        draw: "Desenhar"
      },
      helper: "Modo Digitação: O desenho acompanha o texto."
    },
    addTransaction: {
      newTitle: "Nova Conta",
      editTitle: "Editar Conta",
      amountLabel: "Valor",
      descLabel: "Descrição",
      descPlaceholder: "DO QUE SE TRATA?",
      dateLabel: "Data de Vencimento",
      iconLabel: "Ícone",
      submitAdd: "Adicionar Conta",
      submitEdit: "Salvar Alterações",
      types: {
        purchase: "Compra",
        subscription: "Assinatura"
      },
      categories: {
        shopping: "Compras",
        food: "Comida",
        transport: "Carro",
        motorcycle: "Moto",
        insurance: "Seguro",
        wifi: "Wifi",
        mobile: "Celular",
        rent: "Aluguel",
        home: "Casa",
        utility: "Contas",
        education: "Estudos",
        project: "Projetos",
        funeral: "Funeral",
        health: "Saúde",
        medicine: "Remédio",
        pet: "Pets",
        travel: "Viagem",
        leisure: "Lazer",
        bar: "Bar",
        game: "Jogos",
        gift: "Presentes",
        beauty: "Salão",
        makeup: "Beleza Fem.",
        aesthetic: "Estética",
        wedding: "Casamento",
        generic: "Outros",
        // Subscriptions
        netflix: "Netflix",
        spotify: "Spotify",
        amazon: "Prime",
        youtube: "YouTube",
        apple: "Apple",
        disney: "Disney+",
        max: "Max",
        globo: "Globoplay",
        mercadolivre: "Meli+"
      }
    },
    addAccount: {
      newTitle: "Nova Fonte de Renda",
      editTitle: "Editar Fonte de Renda",
      balanceLabel: "Valor Atual (Opcional)",
      nameLabel: "Nome da Fonte de Renda",
      namePlaceholder: "Ex: Reserva, Salário...",
      colorLabel: "Cor do Cartão",
      submitAdd: "Criar Fonte de Renda",
      submitEdit: "Salvar Alterações",
      themes: {
        default: "Padrão",
        lime: "Verde Cana",
        purple: "Roxo",
        blue: "Azul",
        orange: "Laranja",
        red: "Vermelho"
      }
    },
    notifications: {
      title: "Central",
      inbox: "Recebidas",
      send: "Enviar",
      empty: "Caixa de entrada vazia.",
      howTo: "Como funciona?",
      howToDesc: "Crie uma notificação aqui e envie diretamente para o WhatsApp de quem divide as contas com você.",
      recipientLabel: "Para quem?",
      recipientPlaceholder: "Nome do contato...",
      typeWarning: "AVISO",
      typeCharge: "COBRANÇA",
      amountLabel: "Valor",
      messageLabel: "Mensagem",
      messagePlaceholderCharge: "Ex: Preciso que pague sua parte da internet...",
      messagePlaceholderWarning: "Ex: Já paguei a conta de luz...",
      activeStatus: "Notificações Automáticas Ativas",
      enableBtn: "Ativar Alertas em Nuvem",
      permissionBtn: "Permitir Notificações",
      registering: "Registrando...",
      permissionHint: 'Isso permite que o app te avise sobre contas vencendo "Hoje", mesmo com o navegador fechado.',
      markAllRead: "Limpar Notificações",
      sendWhatsApp: "Enviar via WhatsApp",
      shareTitle: "Notificação Flow Finance",
      shareChargeTitle: "🚨 *FLOW FINANCE - NOTIFICACIÓN DE COBRANÇA*",
      shareWarningTitle: "🔔 *FLOW FINANCE - NOVO AVISO*",
      shareHello: "Olá",
      shareChargeBody: "Consta um pendência financeira que precisa da sua atenção.",
      shareValue: "Valor",
      shareDetail: "Detalhe",
      shareFooterCharge: "Por favor, verifique assim que possível.",
      shareDefaultCharge: "Pagamento pendente",
      shareDefaultWarning: "Você tem uma nova mensagem do sistema financeiro.",
      generatedAt: "Gerado às",
      alerts: {
        errorPush: "Erro ao conectar com servidor de notificações. Tente novamente.",
        errorPermission: "Não foi possível ativar as notificações. Verifique as configurações do navegador."
      },
      system: {
        billDueTitle: "Conta Vencendo Hoje",
        billDueMessage: "A conta \"{name}\" no valor de {value} vence hoje.",
        todayAt: "Hoje, {time}"
      }
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
      shares: "Cotas",
      yieldLabelCDI: "CDI",
      yieldLabelDY: "DY",
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
          btnAdd: "Adicionar",
          placeholders: {
            institutionCdi: "Ex: PICPAY, NUBANK...",
            institutionFii: "Ex: RICO, XP...",
            nameCdi: "Ex: CAIXINHA RESERVA",
            nameFii: "Ex: MXRF11",
            yieldCdi: "Ex: 100 (para 100%)",
            yieldFii: "Ex: 12.5"
          }
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
        titlePlaceholder: "EX: MOTO",
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
        editTooltip: "Editar valor e data",
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
      feedbackTitle: "Enviar Comentários",
      feedbackSubtitle: "Reportar bugs ou sugestões",
      feedbackSubject: "Flow Finance - Relatório de Bug / Feedback",
      feedbackBody: "Olá Naylan,\n\nEncontrei um problema/tenho uma sugestão:\n\n[Descreva aqui o que aconteceu]\n\nImportante: Anexei prints ou um vídeo da tela para ajudar na correção.",
      confirmColor: "Confirmar Cor",
      performanceLabel: "Performance 100%",
      appVersion: "Flow Finance v1.5.0",
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
      },
      privacyContent: {
        modalTitle: "Privacidade",
        modalSubtitle: "Termos e Condições",
        sections: [
           { title: "1. Coleta de Dados", text: "O Flow Finance coleta apenas as informações estritamente necessárias para o funcionamento do aplicativo, como seu endereço de e-mail (para autenticação) e os dados financeiros inseridos manualmente por você (transações, contas e investimentos)." },
           { title: "2. Armazenamento e Segurança", text: "Seus dados são armazenados de forma segura utilizando serviços de nuvem criptografados (Supabase/Firebase). O aplicativo também utiliza o armazenamento local do seu dispositivo para garantir o funcionamento offline e melhorar a performance. Não compartilhamos seus dados financeiros com terceiros." },
           { title: "3. Uso das Informações", text: "As informações inseridas são utilizadas exclusivamente para gerar os gráficos, relatórios e cálculos exibidos no seu painel. O Flow Finance não analisa seus dados para fins de publicidade ou venda de informações." },
           { title: "4. Notificações", text: "Ao ativar as notificações, você concorda em receber alertas sobre vencimentos de contas. Você pode desativar este recurso a qualquer momento nas configurações do seu navegador ou dispositivo." },
           { title: "5. Exclusão de Conta", text: "Você tem o direito de solicitar a exclusão total dos seus dados a qualquer momento através da opção \"Excluir Conta\" presente no menu de perfil. Esta ação é irreversível e remove todas as informações dos nossos servidores." }
        ],
        footer: "Flow Finance © 2025",
        closeBtn: "Entendi"
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
      copyright: "© 2025 Flow Finance",
      errors: {
        invalidEmail: 'Por favor, insira um e-mail válido.',
        missingName: 'Por favor, informe seu nome.',
        invalidCode: 'O código deve ter exatamente 6 dígitos.',
        genericSend: "Erro ao enviar código.",
        genericVerify: "Erro de verificação. Tente novamente.",
        userNotFound: "Usuário não encontrado.",
        emailExists: "Este e-mail já possui cadastro.",
        invalidCodeServer: "Código inválido ou expirado."
      }
    },
    donationModal: {
      title: "Apoiar",
      subtitle: "Contribuição Voluntária",
      desc: "Sua doação ajuda a manter o sistema online e a desenvolver novas funções.",
      valueLabel: "Valor da Doação",
      cpfLabel: "CPF (Para o Pix)",
      btnGenerate: "Gerar Pix",
      copyTitle: "Copia e Cola",
      btnCopy: "Copiar Código",
      btnCopied: "Copiado!",
      errors: {
        min: "Valor mínimo de 1,00",
        cpf: "CPF Obrigatório",
        generic: "Erro ao gerar doação. Tente novamente."
      }
    },
    proModal: {
      header: "Assinatura Premium",
      title: "Desbloqueie Tudo",
      features: {
        analytics: { title: "Análise Avançada", desc: "Gráficos detalhados." },
        invest: { title: "Investimentos", desc: "Controle FIIs e Renda Fixa." },
        themes: { title: "Temas Exclusivos", desc: "Personalize o app." },
        backup: { title: "Backup Nuvem", desc: "Dados seguros sempre." }
      },
      priceLabel: "Valor Mensal",
      period: "/mês",
      btnSubscribe: "Quero ser PRO",
      btnPix: "Pix",
      btnCard: "Cartão",
      generating: "Gerando Cobrança...",
      pixInstructions: "O Asaas exige CPF para gerar o Pix.",
      placeholderName: "Nome Completo",
      placeholderCpf: "CPF (Somente números)",
      btnGeneratePix: "Gerar Pix de",
      expiresIn: "Expira em",
      copyPaste: "Copia e Cola:",
      btnCopy: "Copiar Código",
      btnCopied: "Copiado!",
      warningTitle: "Não use a Carteira do Google / Google Pay",
      warningBody: "Este código Pix não funciona na Carteira do Google. Use o app do seu banco.",
      waitingPayment: "Aguardando Pagamento...",
      processing: "Processando...",
      processingBody: "Seu pagamento está sendo analisado. O PRO será liberado automaticamente.",
      verifying: "Verificando...",
      cardName: "Nome no Cartão",
      cardCpf: "CPF do Titular",
      cardNumber: "Número do Cartão",
      btnPay: "Pagar",
      securedBy: "Pagamento Seguro via Asaas",
      errors: {
        cpf: "Por favor, informe um CPF válido.",
        name: "Por favor, informe o nome completo.",
        generic: "Erro ao criar cobrança. Tente novamente."
      }
    }
  },
  en: {
    welcome: 'Welcome',
    balanceLabel: 'PROFIT',
    quickAccessTitle: 'QUICK ACCESS',
    billsTitle: 'BILLS',
    addBtn: 'Add',
    meta: {
      title: "Flow Finance",
      description: "Smart and modern financial control."
    },
    ai: {
      disabled: "AI functionality is disabled."
    },
    common: {
      defaultUser: "User",
      confirmDeleteMonth: "Delete Month?",
      deleteMonthTitle: "Delete Month",
      hideBalance: "Hide balance",
      showBalance: "Show balance",
      duplicateMonth: "Duplicate bills to next month",
      addSource: "Add New Income Source",
      monthExists: "The month of {month}/{year} already exists.",
      splashVersion: "Flow Finance v1.5"
    },
    nav: {
      home: 'HOME',
      invest: 'INVEST',
      wallet: 'WALLET',
      config: 'SETTINGS'
    },
    home: {
      support: {
        tag: "Support",
        title: "Support the Project",
        subtitle: "Donate any amount via Pix."
      },
      jeitto: {
        tag: "Referral",
        title: "Extra Limit Available?",
        subtitle: "Download Jeitto and check your approval."
      }
    },
    transactionList: {
      types: {
        purchase: 'Purchase',
        subscription: 'Subscription',
        transfer: 'Transfer'
      },
      due: 'Due:',
      today: 'Today',
      methods: {
        pix: 'PIX',
        card: 'CARD'
      },
      actions: {
        edit: "Edit",
        delete: "Delete"
      }
    },
    months: {
        jan: 'JANUARY', fev: 'FEBRUARY', mar: 'MARCH', abr: 'APRIL', mai: 'MAYO', jun: 'JUNE',
        jul: 'JULY', ago: 'AGOSTO', set: 'SEPTEMBER', out: 'OCTOBER', nov: 'NOVEMBER', dez: 'DECEMBER'
    },
    calculator: {
      title: "Calculator",
      copied: "Copied",
      copy: "Copy",
      error: "Error",
      clearEntry: "C",
      allClear: "AC"
    },
    analytics: {
      title: "Analytics",
      subtitle: "Spending Statistics",
      chartTitle: "Monthly History",
      kpiAverage: "Monthly Average",
      kpiHighest: "Highest Spend",
      insightsTitle: "Insights",
      insightFrequent: "Most Frequent",
      insightSplitTitle: "Subscriptions vs Purchases",
      insightSplitSubtitle: "Spending distribution",
      subscriptions: "Subscriptions",
      purchases: "Purchases"
    },
    calendar: {
      title: "Calendar",
      subtitle: "Financial Agenda",
      weekDays: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      empty: "Nothing scheduled.",
      typeSubscription: "Subscription",
      typePurchase: "Bill",
      paidTag: "PAID",
      monthsShort: {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      }
    },
    notepad: {
      title: "Notepad",
      subtitle: "Free text and drawing",
      placeholder: "Type your notes here...",
      clearTitle: "Clear All",
      clearConfirm: "Confirm?",
      tools: {
        type: "Type",
        draw: "Draw"
      },
      helper: "Typing Mode: The drawing moves with the text."
    },
    addTransaction: {
      newTitle: "New Bill",
      editTitle: "Edit Bill",
      amountLabel: "Amount",
      descLabel: "Description",
      descPlaceholder: "WHAT IS IT?",
      dateLabel: "Due Date",
      iconLabel: "Icon",
      submitAdd: "Add Bill",
      submitEdit: "Save Changes",
      types: {
        purchase: "Purchase",
        subscription: "Subscription"
      },
      categories: {
        shopping: "Shopping",
        food: "Food",
        transport: "Car",
        motorcycle: "Moto",
        insurance: "Insurance",
        wifi: "Wifi",
        mobile: "Mobile",
        rent: "Rent",
        home: "Home",
        utility: "Bills",
        education: "Education",
        project: "Projects",
        funeral: "Funeral",
        health: "Health",
        medicine: "Medicine",
        pet: "Pets",
        travel: "Travel",
        leisure: "Leisure",
        bar: "Bar",
        game: "Games",
        gift: "Gifts",
        beauty: "Salon",
        makeup: "Beauty",
        aesthetic: "Aesthetics",
        wedding: "Wedding",
        generic: "Others",
        // Subscriptions - Brand names usually stay same, but keeping consistency
        netflix: "Netflix",
        spotify: "Spotify",
        amazon: "Prime",
        youtube: "YouTube",
        apple: "Apple",
        disney: "Disney+",
        max: "Max",
        globo: "Globoplay",
        mercadolivre: "Meli+"
      }
    },
    addAccount: {
      newTitle: "New Income Source",
      editTitle: "Edit Income Source",
      balanceLabel: "Current Balance (Optional)",
      nameLabel: "Income Source Name",
      namePlaceholder: "Ex: Savings, Salary...",
      colorLabel: "Card Color",
      submitAdd: "Create Income Source",
      submitEdit: "Save Changes",
      themes: {
        default: "Default",
        lime: "Lime Green",
        purple: "Purple",
        blue: "Blue",
        orange: "Orange",
        red: "Red"
      }
    },
    notifications: {
      title: "Center",
      inbox: "Inbox",
      send: "Send",
      empty: "Inbox is empty.",
      howTo: "How it works?",
      howToDesc: "Create a notification here and send it directly to the WhatsApp of those who share bills with you.",
      recipientLabel: "To whom?",
      recipientPlaceholder: "Contact name...",
      typeWarning: "NOTICE",
      typeCharge: "CHARGE",
      amountLabel: "Amount",
      messageLabel: "Message",
      messagePlaceholderCharge: "Ex: Need you to pay your share of internet...",
      messagePlaceholderWarning: "Ex: I already paid the electricity bill...",
      activeStatus: "Automatic Notifications Active",
      enableBtn: "Enable Cloud Alerts",
      permissionBtn: "Allow Notifications",
      registering: "Registering...",
      permissionHint: 'This allows the app to notify you about bills due "Today", even with the browser closed.',
      markAllRead: "Clear Notifications",
      sendWhatsApp: "Send via WhatsApp",
      shareTitle: "Flow Finance Notification",
      shareChargeTitle: "🚨 *FLOW FINANCE - CHARGE NOTIFICATION*",
      shareWarningTitle: "🔔 *FLOW FINANCE - NEW NOTICE*",
      shareHello: "Hello",
      shareChargeBody: "There is a financial pending issue that needs your attention.",
      shareValue: "Amount",
      shareDetail: "Detail",
      shareFooterCharge: "Please check as soon as possible.",
      shareDefaultCharge: "Payment pending",
      shareDefaultWarning: "You have a new message from the financial system.",
      generatedAt: "Generated at",
      alerts: {
        errorPush: "Error connecting to notification server. Please try again.",
        errorPermission: "Could not enable notifications. Please check browser settings."
      },
      system: {
        billDueTitle: "Bill Due Today",
        billDueMessage: "The bill \"{name}\" of {value} is due today.",
        todayAt: "Today, {time}"
      }
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
      shares: "Shares",
      yieldLabelCDI: "CDI",
      yieldLabelDY: "DY",
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
          btnAdd: "Add",
          placeholders: {
            institutionCdi: "Ex: CHASE, REVOLUT...",
            institutionFii: "Ex: VANGUARD, ROBINHOOD...",
            nameCdi: "Ex: EMERGENCY FUND",
            nameFii: "Ex: O",
            yieldCdi: "Ex: 100 (for 100%)",
            yieldFii: "Ex: 12.5"
          }
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
        titlePlaceholder: "EX: MOTORCYCLE",
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
        editTooltip: "Edit value and date",
        monthlyValue: "Monthly Value",
        paymentStatus: "Payment",
        totalValue: "Total Value",
        installmentHeader: "INSTALLMENT",
        dateHeader: "PAYMENT DATE",
        valueHeader: "VALOR",
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
      feedbackTitle: "Send Feedback",
      feedbackSubtitle: "Report bugs or suggestions",
      feedbackSubject: "Flow Finance - Bug Report / Feedback",
      feedbackBody: "Hello Naylan,\n\nI found an issue/have a suggestion:\n\n[Describe what happened here]\n\nImportant: I've attached screenshots or a screen recording to help with the fix.",
      confirmColor: "Confirm Color",
      performanceLabel: "Performance 100%",
      appVersion: "Flow Finance v1.5.0",
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
      },
      privacyContent: {
        modalTitle: "Privacy",
        modalSubtitle: "Terms and Conditions",
        sections: [
           { title: "1. Data Collection", text: "Flow Finance collects only the information strictly necessary for the application to function, such as your email address (for authentication) and financial data entered manually by you (transactions, accounts, and investments)." },
           { title: "2. Storage and Security", text: "Your data is securely stored using encrypted cloud services (Supabase/Firebase). The app also uses your device's local storage to ensure offline functionality and improve performance. We do not share your financial data with third parties." },
           { title: "3. Use of Information", text: "The information entered is used exclusively to generate charts, reports, and calculations displayed on your dashboard. Flow Finance does not analyze your data for advertising or information sale purposes." },
           { title: "4. Notifications", text: "By enabling notifications, you agree to receive alerts about bill due dates. You can disable this feature at any time in your browser or device settings." },
           { title: "5. Account Deletion", text: "You have the right to request the total deletion of your data at any time via the \"Delete Account\" option in the profile menu. This action is irreversible and removes all information from our servers." }
        ],
        footer: "Flow Finance © 2025",
        closeBtn: "I Understand"
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
      copyright: "© 2025 Flow Finance",
      errors: {
        invalidEmail: 'Please enter a valid email.',
        missingName: 'Please enter your name.',
        invalidCode: 'The code must be exactly 6 digits.',
        genericSend: "Error sending code.",
        genericVerify: "Verification error. Please try again.",
        userNotFound: "User not found.",
        emailExists: "This email is already registered.",
        invalidCodeServer: "Invalid or expired code."
      }
    },
    donationModal: {
      title: "Support",
      subtitle: "Voluntary Contribution",
      desc: "Your donation helps keep the system online and develop new features.",
      valueLabel: "Donation Amount",
      cpfLabel: "Tax ID (For Pix)",
      btnGenerate: "Generate Pix",
      copyTitle: "Copy and Paste",
      btnCopy: "Copy Code",
      btnCopied: "Copied!",
      errors: {
        min: "Minimum value of $ 1.00",
        cpf: "Tax ID Required",
        generic: "Error generating donation. Please try again."
      }
    },
    proModal: {
      header: "Premium Subscription",
      title: "Unlock Everything",
      features: {
        analytics: { title: "Advanced Analytics", desc: "Detailed charts." },
        invest: { title: "Investments", desc: "Track FIIs and Fixed Income." },
        themes: { title: "Exclusive Themes", desc: "Customize the app." },
        backup: { title: "Cloud Backup", desc: "Always secure data." }
      },
      priceLabel: "Monthly Price",
      period: "/mo",
      btnSubscribe: "Go PRO",
      btnPix: "Pix",
      btnCard: "Card",
      generating: "Generating Charge...",
      pixInstructions: "Asaas requires Tax ID (CPF) to generate Pix.",
      placeholderName: "Full Name",
      placeholderCpf: "Tax ID / CPF (Numbers only)",
      btnGeneratePix: "Generate Pix of",
      expiresIn: "Expires in",
      copyPaste: "Copy and Paste:",
      btnCopy: "Copy Code",
      btnCopied: "¡Copiado!",
      warningTitle: "Do not use Google Wallet / Google Pay",
      warningBody: "This Pix code does not work in Google Wallet. Use your bank app.",
      waitingPayment: "Waiting Payment...",
      processing: "Procesando...",
      processingBody: "Tu pago está siendo analizado. PRO se desbloqueará automáticamente.",
      verifying: "Verificando...",
      cardName: "Name on Card",
      cardCpf: "Holder Tax ID",
      cardNumber: "Card Number",
      btnPay: "Pagar",
      securedBy: "Secured by Asaas",
      errors: {
        cpf: "Please enter a valid Tax ID.",
        name: "Please enter full name.",
        generic: "Error creating charge. Please try again."
      }
    }
  },
  es: {
    welcome: 'Bienvenido',
    balanceLabel: 'LUCRO',
    quickAccessTitle: 'ACCESO RÁPIDO',
    billsTitle: 'CUENTAS',
    addBtn: 'Añadir',
    meta: {
      title: "Flow Finance",
      description: "Control financiero inteligente y moderno."
    },
    ai: {
      disabled: "Funcionalidad de IA desactivada."
    },
    common: {
      defaultUser: "Usuario",
      confirmDeleteMonth: "¿Borrar Mes?",
      deleteMonthTitle: "Borrar Mes",
      hideBalance: "Ocultar saldo",
      showBalance: "Mostrar saldo",
      duplicateMonth: "Duplicar contas al próximo mes",
      addSource: "Añadir Nueva Fuente de Ingresos",
      monthExists: "El mes de {month}/{year} ya existe.",
      splashVersion: "Flow Finance v1.5"
    },
    nav: {
      home: 'INICIO',
      invest: 'INVERTIR',
      wallet: 'CARTERA',
      config: 'AJUSTES'
    },
    home: {
      support: {
        tag: "Apoyar",
        title: "Apoya el Proyecto",
        subtitle: "Dona cualquier monto vía Pix."
      },
      jeitto: {
        tag: "Indicación",
        title: "¿Límite Extra Disponible?",
        subtitle: "Descarga Jeitto y verifica tu aprobación."
      }
    },
    transactionList: {
      types: {
        purchase: 'Compra',
        subscription: 'Suscripción',
        transfer: 'Transferencia'
      },
      due: 'Vence:',
      today: 'Hoy',
      methods: {
        pix: 'PIX',
        card: 'TARJETA'
      },
      actions: {
        edit: "Editar",
        delete: "Eliminar"
      }
    },
    months: {
        jan: 'ENERO', fev: 'FEBRERO', mar: 'MARZO', abr: 'ABRIL', mai: 'MAYO', jun: 'JUNIO',
        jul: 'JULIO', ago: 'AGOSTO', set: 'SEPTIEMBRE', out: 'OCTUBRE', nov: 'NOVIEMBRE', dez: 'DICIEMBRE'
    },
    calculator: {
      title: "Calculadora",
      copied: "Copiado",
      copy: "Copiar",
      error: "Error",
      clearEntry: "C",
      allClear: "AC"
    },
    analytics: {
      title: "Análisis",
      subtitle: "Estadísticas de Gastos",
      chartTitle: "Historial Mensual",
      kpiAverage: "Promedio Mensual",
      kpiHighest: "Mayor Gasto",
      insightsTitle: "Insights",
      insightFrequent: "Más Frecuente",
      insightSplitTitle: "Suscripciones vs Compras",
      insightSplitSubtitle: "Distribución de gastos",
      subscriptions: "Suscripciones",
      purchases: "Compras"
    },
    calendar: {
      title: "Calendario",
      subtitle: "Agenda Financiera",
      weekDays: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
      empty: "Nada programado.",
      typeSubscription: "Suscripción",
      typePurchase: "Compra",
      paidTag: "PAGADO",
      monthsShort: {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
      }
    },
    notepad: {
      title: "Bloc de Notas",
      subtitle: "Texto e dibujo libre",
      placeholder: "Escribe tus notas aquí...",
      clearTitle: "Borrar Todo",
      clearConfirm: "¿Confirmar?",
      tools: {
        type: "Escribir",
        draw: "Dibujar"
      },
      helper: "Modo Escritura: El dibujo acompaña al texto."
    },
    addTransaction: {
      newTitle: "Nueva Cuenta",
      editTitle: "Editar Cuenta",
      amountLabel: "Valor",
      descLabel: "Descripción",
      descPlaceholder: "¿DE QUÉ SE TRATA?",
      dateLabel: "Fecha Vencimiento",
      iconLabel: "Icono",
      submitAdd: "Añadir Cuenta",
      submitEdit: "Guardar Cambios",
      types: {
        purchase: "Compra",
        subscription: "Suscripción"
      },
      categories: {
        shopping: "Compras",
        food: "Comida",
        transport: "Auto",
        motorcycle: "Moto",
        insurance: "Seguro",
        wifi: "Wifi",
        mobile: "Celular",
        rent: "Alquiler",
        home: "Casa",
        utility: "Facturas",
        education: "Estudios",
        project: "Proyectos",
        funeral: "Funeral",
        health: "Salud",
        medicine: "Remedio",
        pet: "Mascotas",
        travel: "Viaje",
        leisure: "Ocio",
        bar: "Bar",
        game: "Juegos",
        gift: "Regalos",
        beauty: "Salón",
        makeup: "Belleza",
        aesthetic: "Estética",
        wedding: "Boda",
        generic: "Otros",
        // Subscriptions
        netflix: "Netflix",
        spotify: "Spotify",
        amazon: "Prime",
        youtube: "YouTube",
        apple: "Apple",
        disney: "Disney+",
        max: "Max",
        globo: "Globoplay",
        mercadolivre: "Meli+"
      }
    },
    addAccount: {
      newTitle: "Nueva Fuente de Ingresos",
      editTitle: "Editar Fuente de Ingresos",
      balanceLabel: "Saldo Actual (Opcional)",
      nameLabel: "Nombre de Fuente",
      namePlaceholder: "Ej: Ahorros, Salario...",
      colorLabel: "Color de Tarjeta",
      submitAdd: "Crear Fuente",
      submitEdit: "Guardar Cambios",
      themes: {
        default: "Por Defecto",
        lime: "Verde Lima",
        purple: "Púrpura",
        blue: "Azul",
        orange: "Naranja",
        red: "Rojo"
      }
    },
    notifications: {
      title: "Central",
      inbox: "Recibidos",
      send: "Enviar",
      empty: "Bandeja de entrada vacía.",
      howTo: "¿Cómo funciona?",
      howToDesc: "Crea una notificación aquí y envíala directamente al WhatsApp de quienes comparten gastos contigo.",
      recipientLabel: "¿Para quién?",
      recipientPlaceholder: "Nombre del contacto...",
      typeWarning: "AVISO",
      typeCharge: "COBRO",
      amountLabel: "Valor",
      messageLabel: "Mensaje",
      messagePlaceholderCharge: "Ej: Necesito que pagues tu parte del internet...",
      messagePlaceholderWarning: "Ej: Ya pagué la cuenta de luz...",
      activeStatus: "Notificaciones Automáticas Activas",
      enableBtn: "Activar Alertas en Nube",
      permissionBtn: "Permitir Notificações",
      registering: "Registrando...",
      permissionHint: 'Esto permite que la app te avise sobre cuentas que vencen "Hoy", incluso con el navegador cerrado.',
      markAllRead: "Limpiar Notificaciones",
      sendWhatsApp: "Enviar vía WhatsApp",
      shareTitle: "Notificación Flow Finance",
      shareChargeTitle: "🚨 *FLOW FINANCE - NOTIFICACIÓN DE COBRO*",
      shareWarningTitle: "🔔 *FLOW FINANCE - NUEVO AVISO*",
      shareHello: "Hola",
      shareChargeBody: "Hay un asunto financiero pendiente que requiere tu atención.",
      shareValue: "Valor",
      shareDetail: "Detalle",
      shareFooterCharge: "Por favor, verifica lo antes posible.",
      shareDefaultCharge: "Pago pendiente",
      shareDefaultWarning: "Tienes un nuevo mensaje del sistema financiero.",
      generatedAt: "Generado a las",
      alerts: {
        errorPush: "Error al conectar con servidor de notificaciones. Intente nuevamente.",
        errorPermission: "No se pudieron activar las notificaciones. Verifique la configuración del navegador."
      },
      system: {
        billDueTitle: "Cuenta Vence Hoy",
        billDueMessage: "La cuenta \"{name}\" por valor de {value} vence hoy.",
        todayAt: "Hoy, {time}"
      }
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
      shares: "Cuotas",
      yieldLabelCDI: "CDI",
      yieldLabelDY: "DY",
      form: {
          newTitle: "Nueva Inversión",
          editTitle: "Editar Inversión",
          typeFixed: "Renta Fija / CDI",
          typeFii: "Fondo Inmob. (FII)",
          institution: "Instituição",
          assetName: "Nombre del Activo",
          qty: "Cant",
          totalValue: "Valor Total",
          yieldLabel: "% del CDI (Rentabilidad)",
          yieldLabelFii: "Dividend Yield (Est. Anual)",
          btnSave: "Guardar Cambios",
          btnAdd: "Añadir",
          placeholders: {
            institutionCdi: "Ej: MERCADO PAGO...",
            institutionFii: "Ej: RENTA 4...",
            nameCdi: "Ej: FONDO EMERGENCIA",
            nameFii: "Ej: TEF",
            yieldCdi: "Ej: 100 (para 100%)",
            yieldFii: "Ej: 12.5"
          }
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
        titlePlaceholder: "EJ: MOTO",
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
        editTooltip: "Editar valor y fecha",
        monthlyValue: "Valor Mensal",
        paymentStatus: "Pago",
        totalValue: "Valor Total",
        installmentHeader: "CUOTA",
        dateHeader: "FECHA PAGO",
        valueHeader: "VALOR",
        start: "Inicio",
        end: "Fin",
        modals: {
           newMonthlyTitle: "Nuevo Valor Mensal",
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
      feedbackTitle: "Enviar Comentarios",
      feedbackSubtitle: "Reportar errores o sugerencias",
      feedbackSubject: "Flow Finance - Reporte de Error / Comentarios",
      feedbackBody: "Hola Naylan,\n\nEncontré un problema/tengo una sugerencia:\n\n[Describe qué pasó aquí]\n\nImportante: He adjuntado capturas de pantalla o un video para ayudar con la corrección.",
      confirmColor: "Confirmar Color",
      performanceLabel: "Rendimiento 100%",
      appVersion: "Flow Finance v1.5.0",
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
      },
      privacyContent: {
        modalTitle: "Privacidad",
        modalSubtitle: "Términos y Condiciones",
        sections: [
           { title: "1. Recopilación de Datos", text: "Flow Finance solo recopila la información estrictamente necesaria para el funcionamiento de la aplicación, como su dirección de correo electrónico (para autenticación) e los datos financieros ingresados manualmente por usted (transacciones, cuentas e inversiones)." },
           { title: "2. Almacenamiento y Seguridad", text: "Sus datos se almacenan de forma segura utilizando servicios en la nube encriptados (Supabase/Firebase). La aplicación também utiliza el almacenamiento local de su dispositivo para garantizar el funcionamiento sin conexión y mejorar el rendimiento. No compartimos sus datos financieros com terceros." },
           { title: "3. Uso de la Información", text: "La información ingresada se utiliza exclusivamente para generar gráficos, informes y cálculos que se muestran en su panel. Flow Finance no analiza sus datos con fines publicitarios o de venta de información." },
           { title: "4. Notificaciones", text: "Al activar las notificaciones, acepta recibir alertas sobre vencimientos de cuentas. Puede desactivar esta función en cualquier momento en la configuración de su navegador o dispositivo." },
           { title: "5. Eliminación de Cuenta", text: "Tiene derecho a solicitar la eliminación total de sus datos en cualquier momento a través da opción \"Eliminar Cuenta\" en el menú de perfil. Esta acción es irreversible y elimina toda la información de nuestros servidores." }
        ],
        footer: "Flow Finance © 2025",
        closeBtn: "Entendido"
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
      copyright: "© 2025 Flow Finance",
      errors: {
        invalidEmail: 'Por favor, ingresa un correo válido.',
        missingName: 'Por favor, ingresa tu nombre.',
        invalidCode: 'El código deve ter exatamente 6 dígitos.',
        genericSend: "Error al enviar código.",
        genericVerify: "Error de verificación. Inténtalo de nuevo.",
        userNotFound: "Usuario no encontrado.",
        emailExists: "Este correo ya está registrado.",
        invalidCodeServer: "Código inválido o expirado."
      }
    },
    donationModal: {
      title: "Apoyar",
      subtitle: "Contribución Voluntaria",
      desc: "Tu donación ayuda a mantener el sistema en línea y desarrollar nuevas funciones.",
      valueLabel: "Monto de Donación",
      cpfLabel: "CPF (Para Pix)",
      btnGenerate: "Generar Pix",
      copyTitle: "Copia y Pega",
      btnCopy: "Copiar Código",
      btnCopied: "¡Copiado!",
      errors: {
        min: "Monto mínimo de $ 1.00",
        cpf: "Tax ID Obligatorio",
        generic: "Error al generar la donación. Por favor, inténtalo de nuevo."
      }
    },
    proModal: {
      header: "Suscripción Premium",
      title: "Desbloquear Todo",
      features: {
        analytics: { title: "Análisis Avanzado", desc: "Gráficos detallados." },
        invest: { title: "Inversiones", desc: "Rastrea FIIs y Renta Fija." },
        themes: { title: "Temas Exclusivos", desc: "Personalize la app." },
        backup: { title: "Respaldo en Nube", desc: "Datos seguros siempre." }
      },
      priceLabel: "Precio Mensual",
      period: "/mes",
      btnSubscribe: "Ser PRO",
      btnPix: "Pix",
      btnCard: "Tarjeta",
      generating: "Generando Cobro...",
      pixInstructions: "Asaas requiere Tax ID (CPF) para generar Pix.",
      placeholderName: "Nombre Completo",
      placeholderCpf: "Tax ID / CPF (Solo números)",
      btnGeneratePix: "Generar Pix de",
      expiresIn: "Expira en",
      copyPaste: "Copia y Pega:",
      btnCopy: "Copiar Código",
      btnCopied: "¡Copiado!",
      warningTitle: "No uses Google Wallet / Google Pay",
      warningBody: "Este código Pix no funciona en Google Wallet. Usa la app de tu banco.",
      waitingPayment: "Esperando Pago...",
      processing: "Procesando...",
      processingBody: "Tu pago está siendo analizado. PRO se desbloqueará automáticamente.",
      verifying: "Verificando...",
      cardName: "Nombre en Tarjeta",
      cardCpf: "Tax ID Titular",
      cardNumber: "Número de Tarjeta",
      btnPay: "Pagar",
      securedBy: "Pago Seguro vía Asaas",
      errors: {
        cpf: "Por favor, ingresa un Tax ID válido.",
        name: "Por favor, ingresa nombre completo.",
        generic: "Error creando cobro. Inténtalo de nuevo."
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