"use client";
import AlertError from "@/components/ui/AlertError";
import Loading from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const RestPassword = () => {
  const { auth, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
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
      setErr("Password do not match");
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

      if (!res.ok) throw new Error(result.message || "Failed to create user");

      alert(result.message);
      router.push(`/login`);
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
        <h1 className="text-4xl font-bold">Rest Password</h1>

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
        className="mx-auto border border-gray-400 rounded-lg py-10 px-5 my-10 w-100 shadow"
      >
        <div className="flex flex-col items-center gap-1 mb-10">
          <span className="text-4xl">🔏</span>
          <h2 className="text-3xl font-bold text-blue-800 text-center">
            Update Password
          </h2>
        </div>

        {err && <AlertError>{err}</AlertError>}

        <div className="grid grid-cols-1 gap-5 my-5">
          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              value={form.currentPassword}
              onChange={handleChange}
              type="password"
              id="currentPassword"
              required
              placeholder="Your Current Password"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="newPassword">New Password</label>
            <input
              value={form.newPassword}
              onChange={handleChange}
              type="password"
              id="newPassword"
              required
              placeholder="Enter New Password"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="newPasswordConfirm">Confirm New Password</label>
            <input
              value={form.newPasswordConfirm}
              onChange={handleChange}
              type="password"
              id="newPasswordConfirm"
              required
              placeholder="Confirm New Password"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer w-full py-3 mt-5 rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors text-white"
        >
          {loading ? "loading..." : "Update Password"}
        </button>
      </form>
    </section>
  );
};

export default RestPassword;
