import { createFileRoute } from "@tanstack/react-router";
import { ExamplePage } from "@/pages/example/example-page";

export const Route = createFileRoute("/")({
    component: ExamplePage
});
