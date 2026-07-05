
import InvestorLayout from '@/components/app/investor-layout';

export default function TermsAndConditionsPage() {
  return (
    <InvestorLayout>
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="prose dark:prose-invert max-w-4xl mx-auto">
          <h1>Terms and Conditions</h1>
          <p className="text-muted-foreground">Last updated: July 24, 2024</p>
          
          <p>Please read these terms and conditions carefully before using Our Service.</p>
          
          <h2>Interpretation and Definitions</h2>
          <h3>Interpretation</h3>
          <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
          <h3>Definitions</h3>
          <p>For the purposes of these Terms and Conditions:</p>
          <ul>
            <li><strong>Application</strong> means the software program provided by the Company downloaded by You on any electronic device, named Busmo.</li>
            <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Busmo.</li>
            <li><strong>Country</strong> refers to: Nigeria</li>
            <li><strong>Service</strong> refers to the Application.</li>
            <li><strong>Terms and Conditions</strong> (also referred as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</li>
            <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
          </ul>

          <h2>Acknowledgment</h2>
          <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
          <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>

          <h2>Limitation of Liability</h2>
          <p>To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not to, damages for loss of profits, for loss of data or other information, for business interruption, for personal injury, for loss of privacy arising out of or in any way related to the use of or inability to use the Service).</p>

          <h2>Privacy Policy</h2>
          <p>Please review our separate <a href="/privacy" className="text-primary underline">Privacy Policy</a> page.</p>
        </div>
      </div>
    </InvestorLayout>
  );
}
