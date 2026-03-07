
import InvestorLayout from '@/components/app/investor-layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
    { value: 'item-1', question: "Is Busmo another accounting app?", answer: "No. Busmo is designed for business clarity, not complex accounting. We focus on the key metrics you need to make decisions—daily profit, cash flow, and inventory—without the confusing jargon or features built for accountants." },
    { value: 'item-2', question: "Can I use Busmo if I work offline?", answer: "Yes. Busmo is designed to be offline-first. You can record sales, track expenses, and manage inventory even without an internet connection. Your data will sync automatically and securely once you're back online." },
    { value: 'item-3', question: "Is my business data safe?", answer: "Absolutely. We use industry-standard encryption and security protocols to protect your data. Your business information is yours alone, and we are committed to keeping it safe, secure, and private." },
    { value: 'item-4', question: "What if I sell services, not products?", answer: "While Busmo is optimized for product-based businesses with inventory, you can absolutely use it to track all your income (sales) and expenses to understand your profitability. The inventory-specific features can simply be ignored." },
    { value: 'item-5', question: "How do I start selling on the Busmo Market?", answer: "From your owner dashboard, navigate to 'My Market' and follow the steps in the settings to activate your store, set up your profile, and list your products." },
];

export default function HelpCenterPage() {
  return (
    <InvestorLayout>
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
            Help Center
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Have a question? We're here to help. Find answers to common questions below.
          </p>
        </section>

        <section className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold font-headline mb-6 text-center">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
                {faqItems.map(item => (
                <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger className="text-lg font-semibold text-left">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground">
                        {item.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
        </section>

        <section className="mt-24 text-center">
             <h2 className="text-2xl font-bold font-headline">Still have questions?</h2>
             <p className="mt-2 text-muted-foreground">Our support team is ready to assist you.</p>
             <p className="mt-4 font-semibold">
               Contact us at:{' '}
               <a href="mailto:support@busmo.io" className="hover:underline">support@busmo.io</a>
             </p>
        </section>
      </div>
    </InvestorLayout>
  );
}
