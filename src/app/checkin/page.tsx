import { CheckinForm } from "@/components/checkin-form";

export default function CheckinPage() {
  return (
    <main>
      <h1>Daily Check-in</h1>
      <p>Complete your daily check-in in under 10 seconds.</p>
      <p>Use neutral wording only and avoid entering highly sensitive personal details.</p>
      <CheckinForm />
    </main>
  );
}
