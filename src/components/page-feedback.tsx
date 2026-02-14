"use client";

import Link from "next/link";

type LoadingStateProps = {
  message?: string;
};

type ErrorStateProps = {
  message: string;
};

type EmptyStateProps = {
  message: string;
};

type AuthRequiredStateProps = {
  loginHref: string;
};

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return <p aria-live="polite">{message}</p>;
}

export function ErrorState({ message }: ErrorStateProps) {
  return <p role="alert">{message}</p>;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <p>{message}</p>;
}

export function AuthRequiredState({ loginHref }: AuthRequiredStateProps) {
  return (
    <>
      <ErrorState message="Please log in to continue." />
      <Link href={loginHref}>Go to login</Link>
    </>
  );
}
