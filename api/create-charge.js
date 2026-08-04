
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { paymentType, user, billingInfo, value, chargeType } = req.body || {};
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';

  if (!apiKey) {
    return res.status(500).json({ error: 'SERVER_CONFIG_ERROR' });
  }

  if (!user || !user.email) {
    return res.status(400).json({ error: 'USER_EMAIL_REQUIRED' });
  }

  // Dados do pagador (Preferência para o preenchido no modal, depois o cadastro do user)
  const payerName = billingInfo?.name || user.name || 'Cliente Flow Finance';
  const payerCpf = billingInfo?.cpf || user.cpf;

  if (!payerCpf) {
      return res.status(400).json({ error: 'CPF_REQUIRED' });
  }

  const billingType = paymentType === 'pix' ? 'PIX' : paymentType === 'credit_card' ? 'CREDIT_CARD' : null;
  if (!billingType) {
      return res.status(400).json({ error: 'INVALID_PAYMENT_TYPE' });
  }

  // Configuração de Preço e Descrição segura no Servidor (nunca confiar no valor do cliente para PRO)
  const PRO_PRICE = 3.00;
  const isDonation = chargeType === 'donation';

  let finalValue;
  let finalDescription;
  let externalReference;

  if (isDonation) {
    if (paymentType !== 'pix') {
      return res.status(400).json({ error: 'DONATION_PIX_ONLY' });
    }
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 1.00) {
      return res.status(400).json({ error: 'INVALID_DONATION_AMOUNT' });
    }
    finalValue = Math.round(numValue * 100) / 100;
    finalDescription = `Doação ao Projeto - ${payerName}`;
    externalReference = `donation:${user.email}`;
  } else {
    // Assinatura PRO: Preço fixo no servidor, ignora o valor enviado pelo cliente
    finalValue = PRO_PRICE;
    finalDescription = 'Assinatura Flow Finance PRO';
    externalReference = user.email;
  }

  try {
    // 1. Criar ou Recuperar Cliente no Asaas
    let customerId = '';
    
    // Busca cliente pelo email
    const searchRes = await fetch(`${apiUrl}/customers?email=${user.email}`, {
      headers: { 'access_token': apiKey }
    });
    const searchData = await searchRes.json();

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
      
      // Opcional: Atualizar CPF se o existente não tiver (Melhoria de robustez)
      if (searchData.data[0].cpfCnpj !== payerCpf) {
         await fetch(`${apiUrl}/customers/${customerId}`, {
            method: 'POST', // Asaas usa POST para update em alguns endpoints ou PUT
            headers: {
              'Content-Type': 'application/json',
              'access_token': apiKey
            },
            body: JSON.stringify({ cpfCnpj: payerCpf, name: payerName })
         });
      }

    } else {
      // Cria novo cliente
      const createRes = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify({
          name: payerName,
          email: user.email,
          cpfCnpj: payerCpf
        })
      });
      const createData = await createRes.json();
      
      if (createData.errors) {
         return res.status(400).json({ error: 'ASAAS_CUSTOMER_ERROR' });
      }
      customerId = createData.id;
    }

    // 2. Criar Cobrança
    const paymentPayload = {
      customer: customerId,
      billingType: billingType,
      value: finalValue,
      dueDate: new Date().toISOString().split('T')[0], // Vence hoje
      description: finalDescription,
      externalReference: externalReference // VINCULO ESSENCIAL PARA O WEBHOOK
    };

    if (paymentType === 'credit_card' && billingInfo) {
      paymentPayload.creditCard = {
        holderName: billingInfo.name, // Nome no Cartão
        number: billingInfo.number,
        expiryMonth: billingInfo.expiryMonth,
        expiryYear: billingInfo.expiryYear,
        ccv: billingInfo.ccv
      };
      paymentPayload.creditCardHolderInfo = {
        name: billingInfo.name,
        email: user.email,
        cpfCnpj: billingInfo.cpf,
        postalCode: '01001000', 
        addressNumber: '100',
        phone: '11999999999' 
      };
    }

    const chargeRes = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey
      },
      body: JSON.stringify(paymentPayload)
    });

    const chargeData = await chargeRes.json();

    if (chargeData.errors) {
      return res.status(400).json({ error: 'ASAAS_CHARGE_ERROR' });
    }

    // 3. Se for PIX, buscar o QR Code
    let pixData = null;
    if (billingType === 'PIX') {
      const qrRes = await fetch(`${apiUrl}/payments/${chargeData.id}/pixQrCode`, {
        headers: { 'access_token': apiKey }
      });
      pixData = await qrRes.json();
    }

    return res.status(200).json({
      success: true,
      paymentId: chargeData.id,
      status: chargeData.status,
      pix: pixData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}
