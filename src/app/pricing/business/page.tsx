import { redirect } from 'next/navigation';

/** Business pricing lives on the main pricing page. */
export default function BusinessPricingPage() {
  redirect('/pricing#business');
}
