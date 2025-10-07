"use client";
import AlertError from "@/components/ui/AlertError";
import Loading from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaEyeSlash, FaEye, FaUserPlus, FaSignOutAlt, FaUser, FaEnvelope, FaPhone, FaLock, FaBriefcase, FaCalendar, FaUserShield } from "react-icons/fa";

const AddUser = () => {
  const { auth, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
    position: "",
    hiringDate: "",
    role: "employee",
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

    if (form.password !== form.passwordConfirmation) {
      setErr("Password do not match");
      setLoading(false);
      return;
    }

    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${apiURL}/api/v1/adminDashboard`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          passwordConfirmation: form.passwordConfirmation,
          position: form.position,
          hiringDate: form.hiringDate,
          role: form.role,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to create user");

      router.push(`/admin/${auth?.id}`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Logout Function
  const handleLogout = () => {
    logout();
  };

  // set Loading
  if (loading) return <Loading />;

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaUserPlus className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Add New User
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Admin Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FaSignOutAlt size={16} />
            Logout
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          {/* Form Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <FaUserPlus className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Create New User Account</h2>
                <p className="text-gray-600 text-sm">Fill in the details to add a new team member</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 lg:p-8">
            {err && (
              <div className="mb-6">
                <AlertError>{err}</AlertError>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUser className="text-blue-500" />
                  Personal Information
                </h3>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaUser className="text-blue-500 text-xs" />
                  Full Name
                </label>
                <div className="relative">
                  <input
                    value={form.name}
                    onChange={handleChange}
                    type="text"
                    id="name"
                    required
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaEnvelope className="text-blue-500 text-xs" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    id="email"
                    required
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaPhone className="text-blue-500 text-xs" />
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    value={form.phone}
                    onChange={handleChange}
                    type="tel"
                    id="phone"
                    required
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label htmlFor="position" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaBriefcase className="text-blue-500 text-xs" />
                  Position
                </label>
                <div className="relative">
                  <input
                    value={form.position}
                    onChange={handleChange}
                    type="text"
                    id="position"
                    required
                    placeholder="Enter position"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBriefcase className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="lg:col-span-2 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaLock className="text-green-500" />
                  Security & Access
                </h3>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaLock className="text-green-500 text-xs" />
                  Password
                </label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="passwordConfirmation" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaLock className="text-green-500 text-xs" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    value={form.passwordConfirmation}
                    onChange={handleChange}
                    type={showPasswordConfirm ? "text" : "password"}
                    id="passwordConfirmation"
                    required
                    placeholder="Confirm password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-4 w-4 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPasswordConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Employment Details */}
              <div className="lg:col-span-2 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaCalendar className="text-purple-500" />
                  Employment Details
                </h3>
              </div>

              {/* Hiring Date */}
              <div className="space-y-2">
                <label htmlFor="hiringDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaCalendar className="text-purple-500 text-xs" />
                  Hiring Date
                </label>
                <div className="relative">
                  <input
                    value={form.hiringDate}
                    onChange={handleChange}
                    type="date"
                    id="hiringDate"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaUserShield className="text-purple-500 text-xs" />
                  Role
                </label>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={handleChange}
                    id="role"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserShield className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating User...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaUserPlus size={16} />
                    Create User Account
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AddUser;