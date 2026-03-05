import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#fafaf9]">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)]',
          },
        }}
      />
    </div>
  );
}
