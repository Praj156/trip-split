import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <SignIn 
        appearance={{
          layout: {
            socialButtonsPlacement: "top",
            showOptionalFields: false,
          },
          elements: {
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
            card: "shadow-2xl border border-slate-200 rounded-2xl",
            headerTitle: "text-gray-900 font-black",
            headerSubtitle: "text-gray-500"
          }
        }}
        // This keeps the flow passwordless if configured in Clerk Dashboard
      />
    </div>
  );
}