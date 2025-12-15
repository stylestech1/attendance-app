"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Loading from "@/components/ui/Loading";
import Link from "next/link";
import {
  FaSignOutAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaIdBadge,
  FaUserShield,
  FaUserCheck,
  FaUserTimes,
  FaCalendarAlt,
  FaClock,
  FaHistory,
  FaChartBar,
  FaEye,
  FaTimes,
  FaTimesCircle,
  FaRegClock,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

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
  hireDate: string;
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
        } else {
          toast.error(result.message, {
            style: { background: "#dc2626", color: "#fff" },
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message, {
            style: { background: "#dc2626", color: "#fff" },
          });
        }
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
          search: String(profile?.jobId || ""),
        });

        if (fromDate) query.append("from", fromDate);
        if (toDate) query.append("to", toDate);

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
          toast.error(result.message, {
            style: { background: "#dc2626", color: "#fff" },
          });
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
        toast.error(result.message, {
          style: { background: "#dc2626", color: "#fff" },
        });
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
        toast.success(result.message, {
          style: { background: "#16a34a", color: "#fff" },
        });
        setProfile((prev) =>
          prev ? { ...prev, role: result.data.role } : prev
        );
      } else {
        toast.error(result.message, {
          style: { background: "#dc2626", color: "#fff" },
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
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

  // set Loading
  if (loading) return <Loading />;

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaEye className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Viewing {`${profile?.name.split(" ")[0]}'s`} Attendance
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Employee Attendance Details
              </p>
            </div>
          </div>

          <Toaster position="top-center" reverseOrder={false} />

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Date Filters */}
            <div className="flex gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-500 text-xs" />
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-500 text-xs" />
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={toggleRole}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <FaUserShield size={16} />
                {loading
                  ? "Updating..."
                  : `Make ${profile?.role === "admin" ? "Employee" : "Admin"}`}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <FaSignOutAlt size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FaUser className="text-white text-sm" />
                </div>
                Profile Information
              </h2>

              <button
                onClick={toggleActive}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                  profile?.active
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                }`}
              >
                {profile?.active ? (
                  <FaUserTimes size={16} />
                ) : (
                  <FaUserCheck size={16} />
                )}
                {profile?.active ? "Deactivate" : "Activate"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: FaUser, label: "Name", value: profile.name },
                { icon: FaEnvelope, label: "Email", value: profile.email },
                { icon: FaPhone, label: "Phone", value: profile.phone },
                {
                  icon: FaBriefcase,
                  label: "Position",
                  value: profile.position,
                },
                { icon: FaIdBadge, label: "Job ID", value: profile.jobId },
                {
                  icon: FaUserShield,
                  label: "Role",
                  value: profile.role,
                  badge: true,
                  color: profile.role === "admin" ? "purple" : "blue",
                },
                {
                  icon: FaRegClock,
                  label: "Hiring Date",
                  value: profile.hireDate.split("T")[0],
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <item.icon className={`text-${item.color || "blue"}-600`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {item.label}
                    </p>
                    {item.badge ? (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${item.color}-100 text-${item.color}-800 border border-${item.color}-200 capitalize`}
                      >
                        {item.value}
                      </span>
                    ) : (
                      <p className="font-semibold text-gray-800">
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                  <FaHistory className="text-blue-500" />
                  Attendance Records
                </h2>
                <p className="text-gray-600 text-sm">
                  Detailed attendance history and time tracking
                </p>
              </div>

              <Link
                href={`/admin/summary/${userId}`}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <FaChartBar size={16} />
                View Summary
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Worked Hours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Break Time
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/60">
                {attendance.length > 0 ? (
                  attendance.map((record, i) => (
                    <tr
                      key={i}
                      className="hover:bg-blue-50/30 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <FaCalendarAlt className="text-white text-sm" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {record.date.split("T")[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkInAt ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                            <FaClock className="mr-1" size={12} />
                            {new Date(record.checkInAt).toLocaleTimeString(
                              "en-US",
                              {
                                timeZone: "Africa/Cairo",
                              }
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            --
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.checkOutAt ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <FaClock className="mr-1" size={12} />
                            {new Date(record.checkOutAt).toLocaleTimeString(
                              "en-US",
                              {
                                timeZone: "Africa/Cairo",
                              }
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            --
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          {record.totalWorkedHours.toFixed(2)}h
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                          {record.totalBreakMinutes.toFixed(0)}m
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                          <FaHistory className="text-gray-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No attendance records
                        </h3>
                        <p className="text-gray-500 mb-4 text-center">
                          {fromDate || toDate
                            ? "No attendance records found for the selected date range."
                            : "No attendance records available for this employee."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination && attendance.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              Showing page{" "}
              <span className="font-semibold">{pagination.currentPage}</span> of{" "}
              <span className="font-semibold">{pagination.totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-200 hover:shadow-md"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 hover:shadow-md"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EmployeeAttendance;
