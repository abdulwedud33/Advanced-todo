import { Suspense } from 'react';
import SignInComp from "@/components/SignInComp";

export default function SignInPage() {
  return (
    <section className="flex flex-col items-center justify-center">
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-800"></div>
        </div>
      }>
        <SignInComp />
      </Suspense>
    </section>
  );
}
