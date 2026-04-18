const {
  isContext7Configured,
  validateContext7Request,
  executeContext7Request
} = require('../lib/context7-service');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  if (!isContext7Configured()) {
    return res.status(503).json({
      success: false,
      error: 'Context7 belum dikonfigurasi di server'
    });
  }

  const input = validateContext7Request(req.body);
  if (input.error) {
    return res.status(400).json({
      success: false,
      error: input.error
    });
  }

  try {
    const result = await executeContext7Request(input);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Gagal mengambil data dari Context7',
      message: error.message
    });
  }
};
