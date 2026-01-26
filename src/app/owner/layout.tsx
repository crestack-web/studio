'use client';

// This layout component has been stripped of its authentication and onboarding
// logic to allow for UI/UX prototyping. In a real application, this is where
// you would protect the /owner routes and handle redirection based on the
// user's authentication and onboarding status.

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
