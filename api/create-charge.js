
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentType, user, cardData } = req.body;
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
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
    } else {
      // Cria novo cliente
      const createRes = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: JSON.stringify({
          name: user.name || 'Cliente Flow Finance',
          email: user.email,
          cpfCnpj: user.cpf || undefined // Opcional se não tiver
        })
      });
      const createData = await createRes.json();
      customerId = createData.id;
    }

    // 2. Criar Cobrança
    const billingType = paymentType === 'pix' ? 'PIX' : 'CREDIT_CARD';
    const value = 7.00; // Valor fixo do PRO

    const paymentPayload = {
      customer: customerId,
      billingType: billingType,
      value: value,
      dueDate: new Date().toISOString().split('T')[0], // Vence hoje
      description: 'Assinatura Flow Finance PRO'
    };

    if (paymentType === 'credit_card' && cardData) {
      paymentPayload.creditCard = {
        holderName: cardData.holderName,
        number: cardData.number,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv
      };
      paymentPayload.creditCardHolderInfo = {
        name: user.name || cardData.holderName,
        email: user.email,
        cpfCnpj: cardData.cpf, // Obrigatório para cartão no Asaas
        postalCode: '01001000', // CEP genérico ou pedir ao usuário
        addressNumber: '100',
        phone: '11999999999' // Genérico ou pedir ao usuário
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
