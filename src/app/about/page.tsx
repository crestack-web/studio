
import InvestorLayout from '@/components/app/investor-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Rocket, Eye } from 'lucide-react';

export default function AboutUsPage() {
  return (
    <InvestorLayout>
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
            About Busmo
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
            We are dedicated to empowering small and medium-sized businesses across Africa by providing simple, powerful tools to achieve financial clarity and unlock growth.
          </p>
        </section>

        <section className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center font-headline">Our Mission</h2>
          <div className="mt-8 text-center text-muted-foreground text-lg">
            <p>
              Our mission is to be the financial command center for every small business in Africa. We believe that by transforming complex data into clear, actionable insights, we can help entrepreneurs make smarter decisions, grow sustainably, and access the capital they need to thrive. We are committed to building tools that are not only powerful but also accessible and intuitive for the real-world business owner.
            </p>
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-3xl font-bold text-center font-headline">Our Values</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Owner-Centric</h3>
                <p className="mt-2 text-muted-foreground">
                  We build for the business owner, not the accountant. Our focus is on providing immediate answers and clarity, not complex reports.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-8 text-center">
                <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Simplicity is Power</h3>
                <p className="mt-2 text-muted-foreground">
                  We believe the most powerful tools are the ones that are easy to use every day. We strip away complexity to deliver essential insights.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Transparency Builds Trust</h3>
                <p className="mt-2 text-muted-foreground">
                  From financial data to investment opportunities, we create a transparent ecosystem where businesses and investors can connect with confidence.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </InvestorLayout>
  );
}
