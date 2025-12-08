"use client";
import AlertError from "@/components/ui/AlertError";
import Loading from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FaEyeSlash,
  FaEye,
  FaSignOutAlt,
  FaLock,
  FaKey,
  FaShieldAlt,
  FaArrowLeft,
} from "react-icons/fa";

const RestPassword = () => {
  const { auth, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPasswordCurrent, setShowPasswordCurrent] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });

  // Update state on inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    if (form.newPassword !== form.newPasswordConfirm) {
      setErr("New passwords do not match");
      setLoading(false);
      return;
    }

    if (form.newPassword.length < 6) {
      setErr("New password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${apiURL}/api/v1/updatePassword`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          newPasswordConfirm: form.newPasswordConfirm,
        }),
      });

      const result = await res.json();

      if (!res.ok)
        throw new Error(result.message || "Failed to update password");

      toast.success(result.message || "Password updated successfully ✅", {
        style: { background: "#16a34a", color: "#fff" },
      });
      router.push(`/login`);
    } catch (error) {
      if (error instanceof Error) {
        setErr(error.message || "Something Went Wrong");
        toast.error(error.message || "Something Went Wrong ❌", {
          style: { background: "#dc2626", color: "#fff" },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout Function
  const handleLogout = () => {
    logout();
  };

  // Go Back Function
  const handleGoBack = () => {
    router.back();
  };

  // set Loading
  if (loading) return <Loading />;

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 lg:p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex flex-col justify-center sm:flex-row items-start sm:items-center gap-6 mb-8">
          <div className="flex gap-3">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <FaArrowLeft size={14} />
              Back
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <FaSignOutAlt size={14} />
              Logout
            </button>
          </div>
        </div>

        <Toaster position="top-center" reverseOrder={false} />

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          {/* Form Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FaShieldAlt className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Update Your Password
                </h2>
                <p className="text-gray-600 text-sm">
                  Secure your account with a new password
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 lg:p-8">
            {err && (
              <div className="mb-6">
                <AlertError>{err}</AlertError>
              </div>
            )}

            <div className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <label
                  htmlFor="currentPassword"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <FaLock className="text-blue-500 text-xs" />
                  Current Password
                </label>
                <div className="relative">
                  <input
                    value={form.currentPassword}
                    onChange={handleChange}
                    type={showPasswordCurrent ? "text" : "password"}
                    id="currentPassword"
                    required
                    placeholder="Enter your current password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordCurrent((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPasswordCurrent ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <FaKey className="text-green-500 text-xs" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    value={form.newPassword}
                    onChange={handleChange}
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    required
                    placeholder="Enter your new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaKey className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label
                  htmlFor="newPasswordConfirm"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <FaShieldAlt className="text-green-500 text-xs" />
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    value={form.newPasswordConfirm}
                    onChange={handleChange}
                    type={showPasswordConfirm ? "text" : "password"}
                    id="newPasswordConfirm"
                    required
                    placeholder="Confirm your new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaShieldAlt className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPasswordConfirm ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FaShieldAlt className="text-blue-500" />
                  Password Requirements
                </h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li
                    className={`flex items-center gap-2 ${
                      form.newPassword.length >= 6 ? "text-green-600" : ""
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        form.newPassword.length >= 6
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    At least 6 characters long
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      form.newPassword === form.newPasswordConfirm &&
                      form.newPassword !== ""
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        form.newPassword === form.newPasswordConfirm &&
                        form.newPassword !== ""
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    Passwords must match
                  </li>
                  <li
                    className={`flex items-center gap-2 ${
                      form.newPassword !== form.currentPassword &&
                      form.newPassword !== ""
                        ? "text-green-600"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        form.newPassword !== form.currentPassword &&
                        form.newPassword !== ""
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                    Different from current password
                  </li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating Password...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaShieldAlt size={16} />
                    Update Password
                  </div>
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                After updating your password, you will be redirected to login
                again
              </p>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <FaShieldAlt className="text-yellow-600 text-xs" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                Security Tips
              </h3>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Use a unique password you have not used elsewhere</li>
                <li>• Include numbers, letters, and special characters</li>
                <li>• Avoid using personal information in your password</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RestPassword;
