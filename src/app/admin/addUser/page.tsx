"use client";
import AlertError from "@/components/ui/AlertError";
import Loading from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaEyeSlash, FaEye } from "react-icons/fa";

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
    <section className="container mx-auto my-20">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>

        <button
          onClick={handleLogout}
          className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-fit"
        >
          Logout
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto border border-gray-400 rounded-lg py-10 px-5 my-10 w-200 shadow"
      >
        <div className="flex flex-col items-center gap-1 mb-10">
          <span className="text-4xl wave">🎉</span>
          <h2 className="text-3xl font-bold text-blue-800 text-center">
            Create New User
          </h2>
        </div>

        {err && <AlertError>{err}</AlertError>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-5">
          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="name">Full Name</label>
            <input
              value={form.name}
              onChange={handleChange}
              type="text"
              id="name"
              required
              placeholder="Full Name"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="email">Email</label>
            <input
              value={form.email}
              onChange={handleChange}
              type="email"
              id="email"
              required
              placeholder="Email Address"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="phone">Phone</label>
            <input
              value={form.phone}
              onChange={handleChange}
              type="tel"
              id="phone"
              required
              placeholder="Phone Number"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4 relative">
            <label htmlFor="password">Password</label>
            <input
              value={form.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              id="password"
              required
              placeholder="Enter new password"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-11.5 text-gray-600 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-4 relative">
            <label htmlFor="passwordConfirmation">Confirm Password</label>
            <input
              value={form.passwordConfirmation}
              onChange={handleChange}
              type={showPasswordConfirm ? "text" : "password"}
              id="passwordConfirmation"
              required
              placeholder="Confirm password"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm((prev) => !prev)}
              className="absolute right-3 top-11.5 text-gray-600 cursor-pointer"
            >
              {showPasswordConfirm ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="position">Position</label>
            <input
              value={form.position}
              onChange={handleChange}
              type="text"
              id="position"
              required
              placeholder="Position"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="hiringDate">Hiring Date</label>
            <input
              value={form.hiringDate}
              onChange={handleChange}
              type="date"
              id="hiringDate"
              required
              placeholder="Hiring Date"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="role">Role</label>

            <select
              value={form.role}
              onChange={handleChange}
              id="role"
              className="px-5 py-3 rounded-md border border-gray-400 cursor-pointer"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer w-full py-3 mt-5 rounded-lg bg-green-700 hover:bg-green-800 transition-colors text-white"
        >
          {loading ? "loading..." : "Create"}
        </button>
      </form>
    </section>
  );
};

export default AddUser;
