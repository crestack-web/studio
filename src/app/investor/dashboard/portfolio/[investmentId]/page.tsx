
import InvestmentDetailsContent from "./content";

export default function InvestmentDetailsPage({ params }: { params: { investmentId: string } }) {
    return <InvestmentDetailsContent investmentId={params.investmentId} />;
}
