
import { AppLanguage } from './types';

export const TRANSLATIONS = {
  pt: {
    welcome: 'Bem vindo',
    balanceLabel: 'LUCRO',
    quickAccessTitle: 'ACESSO RÁPIDO',
    billsTitle: 'CONTAS',
    addBtn: 'Adicionar',
    common: {
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        edit: 'Editar',
        back: 'Voltar',
        confirm: 'Confirmar'
    },
    app: {
        duplicateAlert: 'O mês de {month} já existe.',
        splash: 'Performance 100%'
    },
    calculator: {
        title: 'Calculadora',
        copy: 'Copiar',
        copied: 'Copiado',
        error: 'Erro'
    },
    balanceCard: {
        show: 'Mostrar saldo',
        hide: 'Esconder saldo',
        duplicate: 'Duplicar contas para o próximo mês'
    },
    contacts: {
        addIncome: 'Adicionar Nova Fonte de Renda',
        notes: 'Notas',
        calendar: 'Calendário',
        analytics: 'Análise'
    },
    themes: {
        default: 'Padrão',
        lime: 'Verde Cana',
        purple: 'Roxo',
        blue: 'Azul',
        orange: 'Laranja',
        red: 'Vermelho'
    },
    card: {
        expires: 'Vence:',
        today: 'Hoje',
        pix: 'Pix',
        card: 'Cartão',
        deleteMonth: 'Apagar Mês?'
    },
    nav: {
      home: 'INÍCIO',
      invest: 'INVEST',
      wallet: 'CARTEIRA',
      config: 'CONFIG'
    },
    auth: {
        tagline: 'Controle financeiro inteligente.',
        welcomeBack: 'Bem-vindo de volta',
        createAccount: 'Crie sua conta',
        loginDesc: 'Entre para acessar suas finanças.',
        registerDesc: 'Comece a controlar seu dinheiro hoje.',
        namePlaceholder: 'Seu Nome',
        emailPlaceholder: 'seu@email.com',
        btnEnter: 'Entrar',
        btnRegister: 'Criar Conta',
        toggleLogin: 'Já possui conta? Fazer Login',
        toggleRegister: 'Não tem uma conta? Cadastre-se',
        verifyTitle: 'Verificar Código',
        verifyDesc: 'Enviamos um código para',
        spam: 'Verifique a caixa de Spam',
        otpPlaceholder: '000000',
        btnVerify: 'Verificar',
        resend: 'Não recebeu? Reenviar código',
        resendWait: 'Aguarde {s}s para reenviar',
        back: 'Voltar',
        security: 'SEM SENHA · ACESSO SEGURO',
        errorEmail: 'Por favor, insira um e-mail válido.',
        errorName: 'Por favor, informe seu nome.',
        errorCode: 'O código deve ter exatamente 6 dígitos.'
    },
    months: {
        jan: 'JANEIRO', fev: 'FEVEREIRO', mar: 'MARÇO', abr: 'ABRIL', mai: 'MAIO', jun: 'JUNHO',
        jul: 'JULHO', ago: 'AGOSTO', set: 'SETEMBRO', out: 'OUTUBRO', nov: 'NOVEMBRO', dez: 'DEZEMBRO'
    },
    addTransaction: {
        titleNew: 'Nova Conta',
        titleEdit: 'Editar Conta',
        amount: 'Valor',
        description: 'Descrição',
        descPlaceholder: 'DO QUE SE TRATA?',
        date: 'Data de Vencimento',
        typePurchase: 'Compra',
        typeSub: 'Assinatura',
        icon: 'Ícone',
        submitNew: 'Adicionar Conta',
        submitEdit: 'Salvar Alterações',
        categories: {
            shopping: 'Compras', food: 'Comida', transport: 'Carro', motorcycle: 'Moto',
            insurance: 'Seguro', wifi: 'Wifi', mobile: 'Celular', rent: 'Aluguel',
            home: 'Casa', utility: 'Contas', education: 'Estudos', project: 'Projetos',
            funeral: 'Funeral', health: 'Saúde', medicine: 'Remédio', pet: 'Pets',
            travel: 'Viagem', leisure: 'Lazer', bar: 'Bar', game: 'Jogos',
            gift: 'Presentes', beauty: 'Salão', makeup: 'Beleza', aesthetic: 'Estética',
            wedding: 'Casamento', generic: 'Outros'
        }
    },
    addAccount: {
        titleNew: 'Nova Fonte de Renda',
        titleEdit: 'Editar Fonte de Renda',
        balance: 'Valor Atual (Opcional)',
        name: 'Nome da Fonte de Renda',
        namePlaceholder: 'Ex: Reserva, Salário...',
        color: 'Cor do Cartão',
        submitNew: 'Criar Fonte de Renda',
        submitEdit: 'Salvar Alterações'
    },
    profile: {
        title: 'Editar Perfil',
        nameLabel: 'Seu Nome',
        namePlaceholder: 'SEU NOME',
        avatarLabel: 'Escolher Avatar',
        locked: 'Bloqueados',
        saveBtn: 'Salvar Perfil',
        logoutBtn: 'Sair da Conta',
        deleteBtn: 'Excluir Conta Permanentemente'
    },
    settings: {
        title: 'Configuração',
        subtitle: 'Personalize sua experiência',
        colors: 'Cores do Sistema',
        privacy: 'Política de Privacidade',
        terms: 'Termos de uso e dados',
        confirmColor: 'Confirmar Cor'
    },
    analytics: {
        title: 'Análise',
        subtitle: 'Estatísticas de Gastos',
        monthlyHistory: 'Histórico Mensal',
        avgMonthly: 'Média Mensal',
        highestSpend: 'Maior Gasto',
        insights: 'Insights',
        mostFrequent: 'Mais Frequente',
        splitTitle: 'Assinaturas vs Compras',
        splitSubtitle: 'Distribuição de gastos'
    },
    pro: {
        title: 'PRO',
        subtitle: 'Assinatura Premium',
        unlock: 'Desbloqueie Tudo',
        priceLabel: 'Valor Único',
        btn: 'Quero ser PRO',
        features: {
            analytics: 'Análise Avançada',
            analyticsDesc: 'Gráficos detalhados.',
            invest: 'Investimentos',
            investDesc: 'Controle FIIs e Renda Fixa.',
            themes: 'Temas Exclusivos',
            themesDesc: 'Personalize o app.',
            backup: 'Backup Nuvem',
            backupDesc: 'Dados seguros sempre.'
        },
        payment: {
            pix: 'Pix',
            card: 'Cartão',
            payBtn: 'Pagar',
            generating: 'Gerando Cobrança...',
            processing: 'Processando Pagamento...',
            copyPaste: 'Copia e Cola:',
            copyBtn: 'Copiar Código',
            copied: 'Copiado!',
            waiting: 'Aguardando Pagamento...',
            cpfRequired: 'O Asaas exige <strong>CPF</strong>.',
            bankApp: 'App de Banco',
            bankAppDesc: 'Use o App do seu banco e escolha "Pix Copia e Cola".',
            secure: 'Asaas Secure',
            verifying: 'Verificando...'
        }
    },
    investments: {
        title: 'Investimentos',
        totalAssets: 'Patrimônio Total',
        monthlyYield: 'Rendimento (Mês)',
        yearlyTotal: 'Total Estimado (Ano)',
        yourAssets: 'Seus Ativos',
        empty: 'Nenhum ativo cadastrado.',
        updating: 'Atualizando...',
        rateLabel: '% do CDI a.a.',
        add: {
            titleNew: 'Novo Investimento',
            titleEdit: 'Editar Investimento',
            typeFixed: 'Renda Fixa / CDI',
            typeFii: 'Fundo Imob (FII)',
            institution: 'Instituição',
            institutionPlaceholder: 'Ex: NUBANK, XP...',
            name: 'Nome do Ativo',
            namePlaceholder: 'Ex: CAIXINHA, MXRF11...',
            quantity: 'Qtd',
            totalValue: 'Valor Total',
            yieldCdi: '% do CDI (Rentabilidade)',
            yieldFii: 'Dividend Yield (Anual Estimado)',
            submitNew: 'Adicionar',
            submitEdit: 'Salvar Alterações'
        }
    },
    longTerm: {
        title: 'Longo Prazo',
        subtitle: 'GERENCIE SUAS PARCELAS',
        empty: 'Nenhuma transação parcelada.',
        paid: 'Pagas',
        total: 'Total',
        newTitle: 'Nova Parcela',
        form: {
            title: 'Título',
            monthlyVal: 'Valor Parcela',
            count: 'Vezes',
            totalVal: 'Valor Total',
            startDate: 'Data Início',
            hint: 'Preencha apenas o Valor da Parcela OU o Valor Total. O sistema calculará o outro automaticamente ao criar.',
            create: 'Criar'
        },
        details: {
            monthly: 'Valor Mensal',
            status: 'Pagamento',
            total: 'Valor Total',
            headerParcel: 'PARCELA',
            headerDate: 'DATA PAGAMENTO',
            headerValue: 'VALOR',
            paidFooter: 'JÁ FOI PAGO',
            editMonthlyTitle: 'Novo Valor Mensal',
            editMonthlyDesc: 'Isso atualizará parcelas futuras e recalculará o total.',
            editNameTitle: 'Editar Nome',
            editTotalTitle: 'Editar Valor Total',
            editTotalDesc: 'Isso ajustará o valor base das parcelas (Total / Qtd).',
            editParcelTitle: 'Editar Parcela'
        }
    },
    notepad: {
        title: 'Bloco de Notas',
        subtitle: 'Texto e Desenho livres',
        type: 'Digitar',
        draw: 'Desenhar',
        hint: 'Modo Digitação: O desenho acompanha o texto.',
        placeholder: 'Digite suas anotações aqui...',
        clearConfirm: 'Confirmar?'
    },
    calendar: {
        title: 'Calendário',
        subtitle: 'Agenda Financeira',
        empty: 'Nada agendado.',
        paid: 'PAGO'
    },
    notifications: {
        title: 'Central',
        tabInbox: 'Recebidas',
        tabSend: 'Enviar',
        emptyInbox: 'Caixa de entrada vazia.',
        howWorks: 'Como funciona?',
        howWorksDesc: 'Crie uma notificação aqui e envie diretamente para o WhatsApp de quem divide as contas com você.',
        recipient: 'Para quem?',
        recipientPlaceholder: 'Nome do contato...',
        typeNotice: 'AVISO',
        typeCharge: 'COBRANÇA',
        amount: 'Valor',
        message: 'Mensagem',
        msgPlaceholderCharge: 'Ex: Preciso que pague sua parte da internet...',
        msgPlaceholderNotice: 'Ex: Já paguei a conta de luz...',
        active: 'Notificações Automáticas Ativas',
        enableBtn: 'Permitir Notificações',
        enableBtnActive: 'Ativar Alertas em Nuvem',
        registering: 'Registrando...',
        permissionHint: 'Isso permite que o app te avise sobre contas vencendo "Hoje", mesmo com o navegador fechado.',
        markRead: 'Marcar todas como lidas',
        sendWhatsapp: 'Enviar via WhatsApp'
    },
    privacy: {
        title: 'Privacidade',
        subtitle: 'Termos e Condições',
        collection: '1. Coleta de Dados',
        collectionText: 'O Flow Finance coleta apenas as informações estritamente necessárias para o funcionamento do aplicativo, como seu endereço de e-mail (para autenticação) e os dados financeiros inseridos manualmente por você (transações, contas e investimentos).',
        storage: '2. Armazenamento e Segurança',
        storageText: 'Seus dados são armazenados de forma segura utilizando serviços de nuvem criptografados (Supabase). O aplicativo também utiliza o armazenamento local do seu dispositivo para garantir o funcionamento offline e melhorar a performance. Não compartilhamos seus dados financeiros com terceiros.',
        usage: '3. Uso das Informações',
        usageText: 'As informações inseridas são utilizadas exclusivamente para gerar os gráficos, relatórios e cálculos exibidos no seu painel. O Flow Finance não analisa seus dados para fins de publicidade ou venda de informações.',
        notifications: '4. Notificações',
        notificationsText: 'Ao ativar as notificações, você concorda em receber alertas sobre vencimentos de contas. Você pode desativar este recurso a qualquer momento nas configurações do seu navegador ou dispositivo.',
        deletion: '5. Exclusão de Conta',
        deletionText: 'Você tem o direito de solicitar a exclusão total dos seus dados a qualquer momento através da opção "Excluir Conta" presente no menu de perfil. Esta ação é irreversível e remove todas as informações dos nossos servidores.',
        btn: 'Entendi'
    }
  },
  en: {
    welcome: 'Welcome',
    balanceLabel: 'PROFIT',
    quickAccessTitle: 'QUICK ACCESS',
    billsTitle: 'BILLS',
    addBtn: 'Add',
    common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        back: 'Back',
        confirm: 'Confirm'
    },
    app: {
        duplicateAlert: 'The month {month} already exists.',
        splash: 'Performance 100%'
    },
    calculator: {
        title: 'Calculator',
        copy: 'Copy',
        copied: 'Copied',
        error: 'Error'
    },
    balanceCard: {
        show: 'Show balance',
        hide: 'Hide balance',
        duplicate: 'Duplicate bills for next month'
    },
    contacts: {
        addIncome: 'Add New Income Source',
        notes: 'Notes',
        calendar: 'Calendar',
        analytics: 'Analytics'
    },
    themes: {
        default: 'Default',
        lime: 'Lime Green',
        purple: 'Purple',
        blue: 'Blue',
        orange: 'Orange',
        red: 'Red'
    },
    card: {
        expires: 'Expires:',
        today: 'Today',
        pix: 'Pix',
        card: 'Card',
        deleteMonth: 'Delete Month?'
    },
    nav: {
      home: 'HOME',
      invest: 'INVEST',
      wallet: 'WALLET',
      config: 'SETTINGS'
    },
    auth: {
        tagline: 'Smart financial control.',
        welcomeBack: 'Welcome back',
        createAccount: 'Create account',
        loginDesc: 'Log in to access your finances.',
        registerDesc: 'Start controlling your money today.',
        namePlaceholder: 'Your Name',
        emailPlaceholder: 'your@email.com',
        btnEnter: 'Enter',
        btnRegister: 'Create Account',
        toggleLogin: 'Already have an account? Login',
        toggleRegister: 'No account? Sign up',
        verifyTitle: 'Verify Code',
        verifyDesc: 'We sent a code to',
        spam: 'Check your Spam folder',
        otpPlaceholder: '000000',
        btnVerify: 'Verify',
        resend: 'Didn\'t receive it? Resend code',
        resendWait: 'Wait {s}s to resend',
        back: 'Back',
        security: 'NO PASSWORD · SECURE ACCESS',
        errorEmail: 'Please enter a valid email.',
        errorName: 'Please enter your name.',
        errorCode: 'The code must be exactly 6 digits.'
    },
    months: {
        jan: 'JANUARY', fev: 'FEBRUARY', mar: 'MARCH', abr: 'APRIL', mai: 'MAIO', jun: 'JUNE',
        jul: 'JULY', ago: 'AUGUST', set: 'SEPTEMBER', out: 'OCTOBER', nov: 'NOVEMBER', dez: 'DECEMBER'
    },
    addTransaction: {
        titleNew: 'New Bill',
        titleEdit: 'Edit Bill',
        amount: 'Amount',
        description: 'Description',
        descPlaceholder: 'WHAT IS IT?',
        date: 'Due Date',
        typePurchase: 'Purchase',
        typeSub: 'Subscription',
        icon: 'Icon',
        submitNew: 'Add Bill',
        submitEdit: 'Save Changes',
        categories: {
            shopping: 'Shopping', food: 'Food', transport: 'Car', motorcycle: 'Moto',
            insurance: 'Insurance', wifi: 'Wifi', mobile: 'Mobile', rent: 'Rent',
            home: 'Home', utility: 'Utilities', education: 'Education', project: 'Projects',
            funeral: 'Funeral', health: 'Health', medicine: 'Medicine', pet: 'Pets',
            travel: 'Travel', leisure: 'Leisure', bar: 'Bar', game: 'Games',
            gift: 'Gifts', beauty: 'Salon', makeup: 'Beauty', aesthetic: 'Aesthetic',
            wedding: 'Wedding', generic: 'Other'
        }
    },
    addAccount: {
        titleNew: 'New Income Source',
        titleEdit: 'Edit Income Source',
        balance: 'Current Balance (Optional)',
        name: 'Income Name',
        namePlaceholder: 'Ex: Salary, Savings...',
        color: 'Card Color',
        submitNew: 'Create Income Source',
        submitEdit: 'Save Changes'
    },
    profile: {
        title: 'Edit Profile',
        nameLabel: 'Your Name',
        namePlaceholder: 'YOUR NAME',
        avatarLabel: 'Choose Avatar',
        locked: 'Locked',
        saveBtn: 'Save Profile',
        logoutBtn: 'Logout',
        deleteBtn: 'Delete Account Permanently'
    },
    settings: {
        title: 'Settings',
        subtitle: 'Customize your experience',
        colors: 'System Colors',
        privacy: 'Privacy Policy',
        terms: 'Terms and data',
        confirmColor: 'Confirm Color'
    },
    analytics: {
        title: 'Analytics',
        subtitle: 'Spending Statistics',
        monthlyHistory: 'Monthly History',
        avgMonthly: 'Monthly Average',
        highestSpend: 'Highest Spend',
        insights: 'Insights',
        mostFrequent: 'Most Frequent',
        splitTitle: 'Subscriptions vs Purchases',
        splitSubtitle: 'Spending distribution'
    },
    pro: {
        title: 'PRO',
        subtitle: 'Premium Subscription',
        unlock: 'Unlock Everything',
        priceLabel: 'One-time Fee',
        btn: 'Become PRO',
        features: {
            analytics: 'Advanced Analytics',
            analyticsDesc: 'Detailed charts.',
            invest: 'Investments',
            investDesc: 'Track Stocks & Fixed Income.',
            themes: 'Exclusive Themes',
            themesDesc: 'Customize the app.',
            backup: 'Cloud Backup',
            backupDesc: 'Data always safe.'
        },
        payment: {
            pix: 'Pix',
            card: 'Card',
            payBtn: 'Pay',
            generating: 'Generating Charge...',
            processing: 'Processing Payment...',
            copyPaste: 'Copy & Paste:',
            copyBtn: 'Copy Code',
            copied: 'Copied!',
            waiting: 'Waiting Payment...',
            cpfRequired: 'Asaas requires <strong>CPF</strong>.',
            bankApp: 'Bank App',
            bankAppDesc: 'Use your bank app and choose "Pix Copy and Paste".',
            secure: 'Asaas Secure',
            verifying: 'Verifying...'
        }
    },
    investments: {
        title: 'Investments',
        totalAssets: 'Total Assets',
        monthlyYield: 'Yield (Month)',
        yearlyTotal: 'Estimated Total (Year)',
        yourAssets: 'Your Assets',
        empty: 'No assets registered.',
        updating: 'Updating...',
        rateLabel: '% of CDI p.a.',
        add: {
            titleNew: 'New Investment',
            titleEdit: 'Edit Investment',
            typeFixed: 'Fixed Income / CDI',
            typeFii: 'Real Estate Fund (FII)',
            institution: 'Institution',
            institutionPlaceholder: 'Ex: BANK, BROKER...',
            name: 'Asset Name',
            namePlaceholder: 'Ex: SAVINGS, STOCK...',
            quantity: 'Qty',
            totalValue: 'Total Value',
            yieldCdi: '% of CDI (Yield)',
            yieldFii: 'Dividend Yield (Est. Yearly)',
            submitNew: 'Add',
            submitEdit: 'Save Changes'
        }
    },
    longTerm: {
        title: 'Long Term',
        subtitle: 'MANAGE INSTALLMENTS',
        empty: 'No installment transactions.',
        paid: 'Paid',
        total: 'Total',
        newTitle: 'New Plan',
        form: {
            title: 'Title',
            monthlyVal: 'Monthly Value',
            count: 'Count',
            totalVal: 'Total Value',
            startDate: 'Start Date',
            hint: 'Fill in only Monthly Value OR Total Value. The system calculates the other automatically.',
            create: 'Create'
        },
        details: {
            monthly: 'Monthly Value',
            status: 'Payment',
            total: 'Total Value',
            headerParcel: 'INSTALLMENT',
            headerDate: 'PAYMENT DATE',
            headerValue: 'VALUE',
            paidFooter: 'ALREADY PAID',
            editMonthlyTitle: 'New Monthly Value',
            editMonthlyDesc: 'This updates future installments and recalculates total.',
            editNameTitle: 'Edit Name',
            editTotalTitle: 'Edit Total Value',
            editTotalDesc: 'This adjusts the base installment value (Total / Count).',
            editParcelTitle: 'Edit Installment'
        }
    },
    notepad: {
        title: 'Notepad',
        subtitle: 'Free Text & Drawing',
        type: 'Type',
        draw: 'Draw',
        hint: 'Typing Mode: Drawing scrolls with text.',
        placeholder: 'Type your notes here...',
        clearConfirm: 'Confirm?'
    },
    calendar: {
        title: 'Calendar',
        subtitle: 'Financial Agenda',
        empty: 'Nothing scheduled.',
        paid: 'PAID'
    },
    notifications: {
        title: 'Center',
        tabInbox: 'Inbox',
        tabSend: 'Send',
        emptyInbox: 'Inbox empty.',
        howWorks: 'How it works?',
        howWorksDesc: 'Create a notification here and send it directly to WhatsApp of those you split bills with.',
        recipient: 'To whom?',
        recipientPlaceholder: 'Contact name...',
        typeNotice: 'NOTICE',
        typeCharge: 'CHARGE',
        amount: 'Amount',
        message: 'Message',
        msgPlaceholderCharge: 'Ex: Need you to pay your part of internet...',
        msgPlaceholderNotice: 'Ex: I already paid the electricity bill...',
        active: 'Auto Notifications Active',
        enableBtn: 'Enable Notifications',
        enableBtnActive: 'Enable Cloud Alerts',
        registering: 'Registering...',
        permissionHint: 'This allows the app to warn you about bills due "Today", even when closed.',
        markRead: 'Mark all as read',
        sendWhatsapp: 'Send via WhatsApp'
    },
    privacy: {
        title: 'Privacy',
        subtitle: 'Terms and Conditions',
        collection: '1. Data Collection',
        collectionText: 'Flow Finance collects only the information strictly necessary for the app to function, such as your email address (for authentication) and financial data entered manually by you (transactions, accounts, and investments).',
        storage: '2. Storage and Security',
        storageText: 'Your data is securely stored using encrypted cloud services (Supabase). The app also uses your device\'s local storage to ensure offline functionality and improve performance. We do not share your financial data with third parties.',
        usage: '3. Use of Information',
        usageText: 'The entered information is used exclusively to generate charts, reports, and calculations displayed on your dashboard. Flow Finance does not analyze your data for advertising or selling information.',
        notifications: '4. Notifications',
        notificationsText: 'By enabling notifications, you agree to receive alerts about bill due dates. You can disable this feature at any time in your browser or device settings.',
        deletion: '5. Account Deletion',
        deletionText: 'You have the right to request full deletion of your data at any time via the "Delete Account" option in the profile menu. This action is irreversible and removes all information from our servers.',
        btn: 'Understood'
    }
  },
  es: {
    welcome: 'Bienvenido',
    balanceLabel: 'LUCRO',
    quickAccessTitle: 'ACCESO RÁPIDO',
    billsTitle: 'CUENTAS',
    addBtn: 'Añadir',
    common: {
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        back: 'Volver',
        confirm: 'Confirmar'
    },
    app: {
        duplicateAlert: 'El mes de {month} ya existe.',
        splash: 'Rendimiento 100%'
    },
    calculator: {
        title: 'Calculadora',
        copy: 'Copiar',
        copied: '¡Copiado!',
        error: 'Error'
    },
    balanceCard: {
        show: 'Mostrar saldo',
        hide: 'Ocultar saldo',
        duplicate: 'Duplicar cuentas para el próximo mes'
    },
    contacts: {
        addIncome: 'Añadir Nueva Fuente de Ingresos',
        notes: 'Notas',
        calendar: 'Calendario',
        analytics: 'Análisis'
    },
    themes: {
        default: 'Estándar',
        lime: 'Verde Caña',
        purple: 'Púrpura',
        blue: 'Azul',
        orange: 'Naranja',
        red: 'Rojo'
    },
    card: {
        expires: 'Vence:',
        today: 'Hoy',
        pix: 'Pix',
        card: 'Tarjeta',
        deleteMonth: '¿Borrar Mes?'
    },
    nav: {
      home: 'INICIO',
      invest: 'INVERTIR',
      wallet: 'CARTERA',
      config: 'AJUSTES'
    },
    auth: {
        tagline: 'Control financiero inteligente.',
        welcomeBack: 'Bienvenido de nuevo',
        createAccount: 'Crea tu cuenta',
        loginDesc: 'Inicia sesión para acceder a tus finanzas.',
        registerDesc: 'Empieza a controlar tu dinero hoy.',
        namePlaceholder: 'Tu Nombre',
        emailPlaceholder: 'tu@email.com',
        btnEnter: 'Entrar',
        btnRegister: 'Crear Cuenta',
        toggleLogin: '¿Ya tienes cuenta? Iniciar sesión',
        toggleRegister: '¿No tienes cuenta? Regístrate',
        verifyTitle: 'Verificar Código',
        verifyDesc: 'Enviamos un código a',
        spam: 'Revisa la carpeta de Spam',
        otpPlaceholder: '000000',
        btnVerify: 'Verificar',
        resend: '¿No lo recibiste? Reenviar código',
        resendWait: 'Espera {s}s para reenviar',
        back: 'Volver',
        security: 'SIN CONTRASEÑA · ACCESO SEGURO',
        errorEmail: 'Por favor, introduce un email válido.',
        errorName: 'Por favor, introduce tu nombre.',
        errorCode: 'El código debe tener exactamente 6 dígitos.'
    },
    months: {
        jan: 'ENERO', fev: 'FEBRERO', mar: 'MARZO', abr: 'ABRIL', mai: 'MAYO', jun: 'JUNIO',
        jul: 'JULIO', ago: 'AGOSTO', set: 'SEPTIEMBRE', out: 'OCTUBRE', nov: 'NOVIEMBRE', dez: 'DICIEMBRE'
    },
    addTransaction: {
        titleNew: 'Nueva Cuenta',
        titleEdit: 'Editar Cuenta',
        amount: 'Valor',
        description: 'Descripción',
        descPlaceholder: '¿DE QUÉ SE TRATA?',
        date: 'Fecha de Vencimiento',
        typePurchase: 'Compra',
        typeSub: 'Suscripción',
        icon: 'Icono',
        submitNew: 'Añadir Cuenta',
        submitEdit: 'Guardar Cambios',
        categories: {
            shopping: 'Compras', food: 'Comida', transport: 'Coche', motorcycle: 'Moto',
            insurance: 'Seguro', wifi: 'Wifi', mobile: 'Móvil', rent: 'Alquiler',
            home: 'Casa', utility: 'Servicios', education: 'Estudios', project: 'Proyectos',
            funeral: 'Funeral', health: 'Salud', medicine: 'Medicina', pet: 'Mascotas',
            travel: 'Viaje', leisure: 'Ocio', bar: 'Bar', game: 'Juegos',
            gift: 'Regalos', beauty: 'Salón', makeup: 'Belleza', aesthetic: 'Estética',
            wedding: 'Boda', generic: 'Otros'
        }
    },
    addAccount: {
        titleNew: 'Nueva Fuente de Ingresos',
        titleEdit: 'Editar Fuente',
        balance: 'Saldo Actual (Opcional)',
        name: 'Nombre de la Fuente',
        namePlaceholder: 'Ej: Ahorros, Salario...',
        color: 'Color de la Tarjeta',
        submitNew: 'Crear Fuente',
        submitEdit: 'Guardar Cambios'
    },
    profile: {
        title: 'Editar Perfil',
        nameLabel: 'Tu Nombre',
        namePlaceholder: 'TU NOMBRE',
        avatarLabel: 'Elegir Avatar',
        locked: 'Bloqueado',
        saveBtn: 'Guardar Perfil',
        logoutBtn: 'Cerrar Sesión',
        deleteBtn: 'Eliminar Cuenta Permanentemente'
    },
    settings: {
        title: 'Ajustes',
        subtitle: 'Personaliza tu experiencia',
        colors: 'Colores del Sistema',
        privacy: 'Política de Privacidad',
        terms: 'Términos y datos',
        confirmColor: 'Confirmar Color'
    },
    analytics: {
        title: 'Análisis',
        subtitle: 'Estadísticas de Gastos',
        monthlyHistory: 'Historial Mensual',
        avgMonthly: 'Promedio Mensual',
        highestSpend: 'Mayor Gasto',
        insights: 'Insights',
        mostFrequent: 'Más Frecuente',
        splitTitle: 'Suscripciones vs Compras',
        splitSubtitle: 'Distribución de gastos'
    },
    pro: {
        title: 'PRO',
        subtitle: 'Suscripción Premium',
        unlock: 'Desbloquear Todo',
        priceLabel: 'Pago Único',
        btn: 'Quiero ser PRO',
        features: {
            analytics: 'Análisis Avanzado',
            analyticsDesc: 'Gráficos detallados.',
            invest: 'Inversiones',
            investDesc: 'Control de Acciones y Renta Fija.',
            themes: 'Temas Exclusivos',
            themesDesc: 'Personaliza la app.',
            backup: 'Respaldo en Nube',
            backupDesc: 'Datos seguros siempre.'
        },
        payment: {
            pix: 'Pix',
            card: 'Tarjeta',
            payBtn: 'Pagar',
            generating: 'Generando Cobro...',
            processing: 'Procesando Pago...',
            copyPaste: 'Copia y Pega:',
            copyBtn: 'Copiar Código',
            copied: '¡Copiado!',
            waiting: 'Esperando Pago...',
            cpfRequired: 'Asaas exige <strong>CPF</strong>.',
            bankApp: 'App del Banco',
            bankAppDesc: 'Usa la App de tu banco y elige "Pix Copia y Pega".',
            secure: 'Asaas Secure',
            verifying: 'Verificando...'
        }
    },
    investments: {
        title: 'Inversiones',
        totalAssets: 'Patrimonio Total',
        monthlyYield: 'Rendimiento (Mes)',
        yearlyTotal: 'Total Estimado (Año)',
        yourAssets: 'Tus Activos',
        empty: 'Ningún activo registrado.',
        updating: 'Actualizando...',
        rateLabel: '% del CDI a.a.',
        add: {
            titleNew: 'Nueva Inversión',
            titleEdit: 'Editar Inversión',
            typeFixed: 'Renta Fija / CDI',
            typeFii: 'Fondo Inmob (FII)',
            institution: 'Institución',
            institutionPlaceholder: 'Ej: BANCO, BROKER...',
            name: 'Nombre del Activo',
            namePlaceholder: 'Ej: AHORROS, ACCIONES...',
            quantity: 'Cant',
            totalValue: 'Valor Total',
            yieldCdi: '% del CDI (Rendimiento)',
            yieldFii: 'Dividend Yield (Est. Anual)',
            submitNew: 'Añadir',
            submitEdit: 'Guardar Cambios'
        }
    },
    longTerm: {
        title: 'Largo Plazo',
        subtitle: 'ADMINISTRA TUS CUOTAS',
        empty: 'Ninguna transacción en cuotas.',
        paid: 'Pagadas',
        total: 'Total',
        newTitle: 'Nuevo Plan',
        form: {
            title: 'Título',
            monthlyVal: 'Valor Cuota',
            count: 'Veces',
            totalVal: 'Valor Total',
            startDate: 'Fecha Inicio',
            hint: 'Rellena solo el Valor de la Cuota O el Valor Total. El sistema calculará el otro automáticamente.',
            create: 'Crear'
        },
        details: {
            monthly: 'Valor Mensual',
            status: 'Pago',
            total: 'Valor Total',
            headerParcel: 'CUOTA',
            headerDate: 'FECHA PAGO',
            headerValue: 'VALOR',
            paidFooter: 'YA PAGADO',
            editMonthlyTitle: 'Nuevo Valor Mensual',
            editMonthlyDesc: 'Esto actualizará cuotas futuras y recalculará el total.',
            editNameTitle: 'Editar Nombre',
            editTotalTitle: 'Editar Valor Total',
            editTotalDesc: 'Esto ajustará el valor base de las cuotas (Total / Cant).',
            editParcelTitle: 'Editar Cuota'
        }
    },
    notepad: {
        title: 'Bloc de Notas',
        subtitle: 'Texto y Dibujo libres',
        type: 'Escribir',
        draw: 'Dibujar',
        hint: 'Modo Escritura: El dibujo acompaña al texto.',
        placeholder: 'Escribe tus notas aquí...',
        clearConfirm: '¿Confirmar?'
    },
    calendar: {
        title: 'Calendario',
        subtitle: 'Agenda Financiera',
        empty: 'Nada programado.',
        paid: 'PAGADO'
    },
    notifications: {
        title: 'Central',
        tabInbox: 'Recibidas',
        tabSend: 'Enviar',
        emptyInbox: 'Bandeja vacía.',
        howWorks: '¿Cómo funciona?',
        howWorksDesc: 'Crea una notificación aquí y envíala directamente al WhatsApp de quienes comparten gastos contigo.',
        recipient: '¿Para quién?',
        recipientPlaceholder: 'Nombre del contacto...',
        typeNotice: 'AVISO',
        typeCharge: 'COBRO',
        amount: 'Valor',
        message: 'Mensaje',
        msgPlaceholderCharge: 'Ej: Necesito que pagues tu parte de internet...',
        msgPlaceholderNotice: 'Ej: Ya pagué la cuenta de luz...',
        active: 'Notificaciones Automáticas Activas',
        enableBtn: 'Permitir Notificaciones',
        enableBtnActive: 'Activar Alertas en Nube',
        registering: 'Registrando...',
        permissionHint: 'Esto permite que la app te avise sobre cuentas que vencen "Hoy", incluso con el navegador cerrado.',
        markRead: 'Marcar todas como leídas',
        sendWhatsapp: 'Enviar por WhatsApp'
    },
    privacy: {
        title: 'Privacidad',
        subtitle: 'Términos y Condiciones',
        collection: '1. Recolección de Datos',
        collectionText: 'Flow Finance solo recolecta la información estrictamente necesaria para el funcionamiento de la aplicación, como tu dirección de correo electrónico (para autenticación) y los datos financieros ingresados manualmente por ti (transacciones, cuentas e inversiones).',
        storage: '2. Almacenamiento y Seguridad',
        storageText: 'Tus datos se almacenan de forma segura utilizando servicios en la nube encriptados (Supabase). La aplicación también utiliza el almacenamiento local de tu dispositivo para garantizar el funcionamiento sin conexión y mejorar el rendimiento. No compartimos tus datos financieros con terceros.',
        usage: '3. Uso de la Información',
        usageText: 'La información ingresada se utiliza exclusivamente para generar gráficos, informes y cálculos mostrados en tu panel. Flow Finance no analiza tus datos con fines publicitarios o de venta de información.',
        notifications: '4. Notificaciones',
        notificationsText: 'Al activar las notificaciones, aceptas recibir alertas sobre vencimientos de cuentas. Puedes desactivar esta función en cualquier momento en la configuración de tu navegador o dispositivo.',
        deletion: '5. Eliminación de Cuenta',
        deletionText: 'Tienes derecho a solicitar la eliminación total de tus datos en cualquier momento a través de la opción "Eliminar Cuenta" en el menú de perfil. Esta acción es irreversible y elimina toda la información de nuestros servidores.',
        btn: 'Entendido'
    }
  }
};
