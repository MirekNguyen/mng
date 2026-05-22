import { createFileRoute, redirect } from "@tanstack/react-router";

// better-auth handles the OAuth callback via the API
// This route just catches any direct navigation and redirects to dashboard
export const Route = createFileRoute("/auth/callback")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => <div>Redirecting...</div>,
});
