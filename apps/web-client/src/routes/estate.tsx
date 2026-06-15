import { createFileRoute } from "@tanstack/react-router";
import { EstateSearchPage } from "@/pages/estate/estate-search-page";

export const Route = createFileRoute("/estate")({
  component: EstateSearchPage
});