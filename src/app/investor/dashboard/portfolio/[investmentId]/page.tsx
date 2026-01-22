import InvestmentDetailsContent from "./content";

export default function InvestmentDetailsPage({ params: { investmentId } }: { params: { investmentId: string } }) {
    return <InvestmentDetailsContent investmentId={investmentId} />;
}
