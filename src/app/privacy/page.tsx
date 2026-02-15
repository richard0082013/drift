import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-slate-800">Privacy</h1>
      <Card>
        <CardBody>
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-rose-700">
              Drift is not a medical service and does not provide medical advice, diagnosis, or treatment.
            </p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Account deletion uses a soft-delete retention window before permanent purge. During this window,
            restoration can be requested through support.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            You can export your data or request account deletion from the account page.
          </p>
          <Link href="/account" className="inline-flex items-center text-sm font-medium text-coral-500 hover:text-coral-600 transition-colors">
            Go to account actions <span className="ml-1" aria-hidden="true">&rarr;</span>
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
