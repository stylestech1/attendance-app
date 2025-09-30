"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Loading from "@/components/ui/Loading";
import Link from "next/link";

// Types
type TProfile = {
  id: string;
  jobId: number;
  name: string;
  email: string;
  position: string;
  phone: string;
  role: string;
  active: boolean;
};
type TAttendance = {
  id: string;
  userName: string;
  jobId: number;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  totalWorkedHours: number;
  totalBreakMinutes: number;
};
type TPagination = {
  currentPage: number;
  limit: number;
  totalPages: number;
};

const apiURL = process.env.NEXT_PUBLIC_API_URL;

const EmployeeAttendance = () => {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [profile, setProfile] = useState<TProfile | null>(null);
  const [attendance, setAttendance] = useState<TAttendance[]>([]);
  const [pagination, setPagination] = useState<TPagination | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Fetching Information
  useEffect(() => {
    if (!auth?.token) {
      console.log("No token found, redirecting to login");
      router.replace("/login");
      return;
    }

    const getInfoData = async () => {
      try {
        setLoading(false);
        const res = await fetch(`${apiURL}/api/v1/adminDashboard/${userId}`, {
          method: "GET",
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        });
        const result = await res.json();
        if (res.ok) {
          setProfile(result.data);
          // console.log(userId)
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Fetch user data error:", error);
        alert(
          error instanceof Error ? error.message : "Failed to load profile"
        );
        logout();
      } finally {
        setLoading(false);
      }
    };
    getInfoData();
  }, [auth.token, logout, router, userId]);

  // Fetching Attendance
  useEffect(() => {
    if (!profile?.jobId) return;

    const fetchAttendance = async () => {
      try {
        setLoading(true);

        const query = new URLSearchParams({
          page: String(page),
          limit: String(20),
          search: String(profile?.jobId || '')
        })

        if(fromDate) query.append('from', fromDate)
        if(toDate) query.append('to', toDate)
        
        const res = await fetch(
          `${apiURL}/api/v1/attendance?${query.toString()}`,
          {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${auth?.token}`,
            },
          }
        );

        const result = await res.json();

        if (res.ok) {
          setAttendance(result.data);
          setPagination(result.paginationResult);
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Fetch attendance error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [profile, page, auth.token, fromDate, toDate]);

  // Toggling Activation
  const toggleActive = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const endpoint = profile.active
        ? `${apiURL}/api/v1/adminDashboard/deactivate/${userId}`
        : `${apiURL}/api/v1/adminDashboard/activate/${userId}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`,
        },
      });

      const result = await res.json();
      if (res.ok) {
        setProfile((prev) => (prev ? { ...prev, active: !prev.active } : prev));
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Toggle active error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggling Role
  const toggleRole = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      const newRole = profile.role === "admin" ? "employee" : "admin";

      const res = await fetch(`${apiURL}/api/v1/adminDashboard/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message || "✅ Role Update");
        setProfile((prev) =>
          prev ? { ...prev, role: result.data.role } : prev
        );
      } else {
        alert(result.message || "❌ Failed to update role");
      }
    } catch (error) {
      console.error("Toggle role error:", error);
      alert(error || "Error updating role");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-2">
          {profile && (
            <h1 className="text-3xl">
              👀 Preview{" "}
              <span className="font-bold">{profile.name.split(" ")[0]}</span>{" "}
              Attendance
            </h1>
          )}
          <button
            onClick={toggleRole}
            disabled={loading}
            className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading
              ? "Updating..."
              : `Make ${profile?.role === "admin" ? "Employee" : "Admin"}`}
          </button>
        </div>

        <div className="flex gap-4 my-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={toggleActive}
            className={`cursor-pointer px-4 py-2 rounded-md text-white transition-colors w-fit ${
              profile?.active
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {profile?.active ? "Deactivate" : "Activate"}
          </button>

          <button
            onClick={handleLogout}
            className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-fit"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Profile Information */}
      {profile && (
        <div className="my-10 p-4 bg-gray-50 rounded-lg border w-full">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex gap-x-2">
              <span className="font-medium text-gray-600">Name:</span>
              <span className="text-gray-800">{profile.name}</span>
            </div>
            <div className="flex gap-x-2">
              <span className="font-medium text-gray-600">Email:</span>
              <span className="text-gray-800">{profile.email}</span>
            </div>
            <div className="flex gap-x-2">
              <span className="font-medium text-gray-600">Phone:</span>
              <span className="text-gray-800">{profile.phone}</span>
            </div>
            <div className="flex gap-x-2">
              <span className="font-medium text-gray-600">Role:</span>
              <span className="text-gray-800 capitalize">{profile.role}</span>
            </div>
            <div className="flex gap-x-2">
              <span className="font-medium text-gray-600">Position:</span>
              <span className="text-gray-800">{profile.position}</span>
            </div>
            <div className="flex gap-x-2">
              <span className="font-medium text-gray-600">Job-ID:</span>
              <span className="text-gray-800">{profile.jobId}</span>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="my-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            Attendance Records
          </h2>

          <Link
            href={`/admin/summary/${userId}`}
            className="py-2 px-10 bg-blue-700 text-white rounded-md cursor-pointer"
          >
            View Summary
          </Link>
        </div>

        <table className="w-full border-collapse border border-gray-300 my-5">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Check In</th>
              <th className="border p-2">Check Out</th>
              <th className="border p-2">Worked Hours</th>
              <th className="border p-2">Break (mins)</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {attendance.length > 0 ? (
              attendance.map((record, i) => (
                <tr key={i}>
                  <td className="border p-2">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="border p-2">
                    {record.checkInAt
                      ? new Date(record.checkInAt).toLocaleTimeString()
                      : "--"}
                  </td>
                  <td className="border p-2">
                    {record.checkOutAt
                      ? new Date(record.checkOutAt).toLocaleTimeString()
                      : "--"}
                  </td>
                  <td className="border p-2">
                    {record.totalWorkedHours.toFixed(2)}
                  </td>
                  <td className="border p-2">
                    {record.totalBreakMinutes.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex justify-end items-center gap-5 mt-5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default EmployeeAttendance;
