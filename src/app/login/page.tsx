"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AlertError from "@/components/ui/AlertError";
import { Arizonia } from "next/font/google";
import { FaEyeSlash, FaEye } from "react-icons/fa";

const arizonia = Arizonia({
  weight: "400",
  subsets: ["latin"],
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      const { token, data: user } = data;
      const { id, role } = user;

      if (!token) throw new Error("No token returned from server");

      login({ token, role, id });

      if (role === "admin") {
        router.push(`/admin/${id}`);
        console.log("going to admin");
      } else {
        router.push(`/employee/${id}`);
        console.log("going to employees");
      }
    } catch (error) {
      setErr((error as Error).message || "خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="container mx-auto min-h-[90vh] flex flex-col items-center justify-center">
        <h1
          className={`text-5xl font-bold text-center text-blue-600 my-5 ${arizonia.className}`}
        >
          Styles Disptach EG
        </h1>

        <form
          className="border border-gray-400 rounded-lg py-10 px-5 shadow w-100"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col items-center gap-1 mb-10">
            <span className="text-4xl wave">👋</span>
            <h2 className="text-3xl font-bold text-blue-800 text-center">
              Good Afternoon
            </h2>
            <p className="text-sm text-gray-600">
              😊Wishing for you a good day😊
            </p>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label htmlFor="email">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              required
              placeholder="Email Address"
              className="px-5 py-3 rounded-md border border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2 mb-6 relative">
            <label htmlFor="password">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              id="password"
              required
              placeholder="*******"
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

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 transition-colors text-white"
          >
            {loading ? "loading..." : "Login"}
          </button>

          {err && <AlertError>{err}</AlertError>}
        </form>
      </section>
    </>
  );
}
