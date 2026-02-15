"use client";

import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";

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
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className="w-8 h-8 rounded-full border-3 border-cream-200 border-t-coral-500 animate-spin mb-4"
        aria-hidden="true"
      />
      <p aria-live="polite" className="text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <Card className="border-rose-200 bg-rose-50">
      <CardBody>
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-rose-500 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <p role="alert" className="text-sm text-rose-700">
            {message}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg
        className="w-12 h-12 text-slate-300 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function AuthRequiredState({ loginHref }: AuthRequiredStateProps) {
  return (
    <Card className="max-w-sm mx-auto">
      <CardBody className="flex flex-col items-center py-8 gap-4">
        <svg
          className="w-10 h-10 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
        <p className="text-sm text-slate-600">Please log in to continue.</p>
        <Link
          href={loginHref}
          className="inline-flex items-center px-4 py-2 bg-coral-500 text-white text-sm font-medium rounded-lg hover:bg-coral-600 transition-colors duration-200 cursor-pointer"
        >
          Go to login
        </Link>
      </CardBody>
    </Card>
  );
}
