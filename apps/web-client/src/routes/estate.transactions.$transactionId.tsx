import { createFileRoute } from "@tanstack/react-router";
import { EstateTransactionParamsSchema } from "@nmm/shared";
import { EstateTransactionDetailPage } from "@/pages/estate/estate-transaction-detail-page";

export const Route = createFileRoute("/estate/transactions/$transactionId")({
    component: EstateTransactionRoute
});

function EstateTransactionRoute() {
    const { transactionId } = EstateTransactionParamsSchema.parse(Route.useParams());

    return <EstateTransactionDetailPage transactionId={transactionId} />;
}
