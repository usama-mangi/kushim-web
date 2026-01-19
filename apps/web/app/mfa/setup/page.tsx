'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function MfaSetupPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initMfa = async () => {
      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          router.push('/login');
          return;
        }

        // Check status first
        const statusRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/mfa/status`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (statusRes.data.enabled) {
          setIsEnabled(true);
        } else {
          // If not enabled, generate new secret
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/mfa/generate`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          setQrCodeUrl(response.data.qrCodeUrl);
        }
      } catch (error) {
        console.error('Failed to init MFA', error);
      } finally {
        setLoading(false);
      }
    };
    initMfa();
  }, [router]);

  const handleVerify = async () => {
    try {
      const authToken = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/mfa/verify`,
        { token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      alert('MFA Enabled Successfully!');
      router.push('/');
    } catch (error) {
      alert('Invalid Token. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  if (isEnabled) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <ShieldCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">MFA is Active</h2>
          <p className="text-gray-500 mb-6">Your account is secured with Two-Factor Authentication.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-indigo-100 rounded-full">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup 2-Factor Auth</h2>
        <p className="text-gray-500 mb-6">Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.).</p>

        {qrCodeUrl && (
          <div className="flex justify-center mb-6">
            <img src={qrCodeUrl} alt="MFA QR Code" className="border border-gray-200 rounded-lg" />
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center tracking-widest text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="000 000"
            maxLength={6}
          />
          <button
            onClick={handleVerify}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Verify & Enable
          </button>
        </div>
      </div>
    </div>
  );
}
