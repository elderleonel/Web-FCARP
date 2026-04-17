import { Suspense } from 'react';
import { ResetPasswordForm } from '@/app/admin/reset-password/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
