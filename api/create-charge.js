
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentType, user, billingInfo, value, description } = req.body;
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  // Dados do pagador (Preferência para o preenchido no modal, depois o cadastro do user)
  const payerName = billingInfo?.name || user.name || 'Cliente Flow Finance';
  const payerCpf = billingInfo?.cpf || user.cpf;

  if (!payerCpf) {
      return res.status(400).json({ error: 'CPF é obrigatório para gerar cobrança.' });
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
         return res.status(400).json({ error: createData.errors[0].description });
      }
      customerId = createData.id;
    }

    // 2. Criar Cobrança
    const billingType = paymentType === 'pix' ? 'PIX' : 'CREDIT_CARD';
    
    // Use dynamic value if provided (Donation), otherwise default to PRO Price (3.00)
    const finalValue = value || 3.00;
    const finalDescription = description || 'Assinatura Flow Finance PRO';

    const paymentPayload = {
      customer: customerId,
      billingType: billingType,
      value: finalValue,
      dueDate: new Date().toISOString().split('T')[0], // Vence hoje
      description: finalDescription,
      externalReference: user.email // VINCULO ESSENCIAL PARA O WEBHOOK
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
      return res.status(400).json({ error: chargeData.errors[0].description });
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
