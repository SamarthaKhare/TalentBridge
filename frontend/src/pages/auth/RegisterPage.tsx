import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: 'HR' | 'CANDIDATE';
}

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>({
    defaultValues: { role: 'CANDIDATE' },
  });
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const selectedRole = watch('role');
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const onSubmit = async (data: RegisterForm) => {
    setApiError(null);
    try {
      await registerUser(data);
      toast.success('Account created!');
      navigate(data.role === 'HR' ? '/hr/dashboard' : '/candidate/profile');
    } catch (error: any) {
      const errData = error.response?.data?.error;
      let errorText: string;

      if (typeof errData === 'string') {
        errorText = errData;
      } else if (Array.isArray(errData)) {
        // Zod validation errors
        errorText = errData.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ');
      } else {
        errorText = 'Registration failed. Please check your inputs.';
      }

      setApiError(errorText);
      toast.error(errorText);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6">Create your account</h1>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 chars, uppercase, number, special"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Min 8 characters' },
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
                  message: 'Must include uppercase, number, and special character',
                },
              })}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {(['CANDIDATE', 'HR'] as const).map((role) => (
                <label
                  key={role}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedRole === role
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" value={role} {...register('role')} className="sr-only" />
                  <span className="text-sm font-medium">
                    {role === 'CANDIDATE' ? 'Job Seeker' : 'HR / Recruiter'}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" isLoading={isLoading}>Create Account</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-primary-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
