import { NextRequest, NextResponse } from 'next/server';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Nigerian banks with common codes
const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '063', name: 'Diamond Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '001', name: 'Globus Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Opay' },
  { code: '999', name: 'Palmpay' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'SunTrust Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
];

// GET: List banks
export async function GET() {
  return NextResponse.json({ banks: NIGERIAN_BANKS });
}

// POST: Verify account number
export async function POST(request: NextRequest) {
  try {
    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || accountNumber.length !== 10) {
      return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 });
    }
    if (!bankCode) {
      return NextResponse.json({ error: 'Bank code is required' }, { status: 400 });
    }

    if (!PAYSTACK_SECRET || PAYSTACK_SECRET === 'your-paystack-secret-key') {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 503 });
    }

    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const data = await res.json();

    if (!data.status || !data.data?.account_name) {
      return NextResponse.json({ error: 'Could not verify account. Check the account number and bank.' }, { status: 400 });
    }

    return NextResponse.json({
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
      bankCode: data.data.bank_code,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to verify account' }, { status: 500 });
  }
}
