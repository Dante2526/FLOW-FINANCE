
export default async function handler(req, res) {
  const { id } = req.query;
  const apiKey = process.env.ASAAS_API_KEY;
  const apiUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';

  if (!id) {
    return res.status(400).json({ error: 'Payment ID required' });
  }

  try {
    const response = await fetch(`${apiUrl}/payments/${id}`, {
      headers: { 'access_token': apiKey }
    });
    
    const data = await response.json();

    // Status de sucesso no Asaas: RECEIVED ou CONFIRMED
    const isPaid = data.status === 'RECEIVED' || data.status === 'CONFIRMED';

    return res.status(200).json({ 
      paid: isPaid, 
      status: data.status 
    });

  } catch (error) {
    return res.status(500).json({ error: 'Error checking status' });
  }
}
