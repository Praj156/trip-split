import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <SignUp 
        appearance={{
          layout: {
            socialButtonsPlacement: "top",
          },
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            card: "shadow-2xl border border-slate-200 rounded-2xl",
            headerTitle: "text-gray-900 font-black",
            headerSubtitle: "text-gray-500"
          }
        }}
      />
    </div>
  );
}