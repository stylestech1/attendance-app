"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/ui/Loading";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  FaSearch,
  FaPlus,
  FaSignOutAlt,
  FaEye,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaIdBadge,
  FaKey,
  FaUsers,
  FaChartLine,
  FaCog,
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
};
type TUser = TProfile & {
  active: boolean;
};

const AdminDashboard = () => {
  const { id } = useParams();
  const { auth, logout } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<TUser[]>([]);
  const [profile, setProfile] = useState<TProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeStats, setActiveStats] = useState({ active: 0, total: 0 });

  // Fetching All Employees
  useEffect(() => {
    if (!auth?.token) {
      console.log("No token found, redirecting to login");
      router.replace("/login");
      return;
    }

    const apiURL = process.env.NEXT_PUBLIC_API_URL;

    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${apiURL}/api/v1/adminDashboard?page=${page}&limit=10`,
          {
            method: "GET",
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        const result = await res.json();
        if (res.ok) {
          setUsers(result.data);
          setTotalPages(result.paginationResult.totalPages);

          // Calculate active users stats
          const activeCount = result.data.filter(
            (user: TUser) => user.active
          ).length;
          setActiveStats({
            active: activeCount,
            total: result.data.length,
          });
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
    fetchAllUsers();
  }, [auth.token, logout, router, page]);

  // Fetching Information
  useEffect(() => {
    if (!auth?.token) {
      console.log("No token found, redirecting to login");
      router.replace("/login");
      return;
    }

    const apiURL = process.env.NEXT_PUBLIC_API_URL;

    const getInfoData = async () => {
      try {
        setLoading(false);
        const res = await fetch(`${apiURL}/api/v1/userDashboard/getMyData`, {
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
  }, [auth.token, logout, router]);

  // Logout Function
  const handleLogout = () => {
    logout();
  };

  // Filter with Name or JobID
  const filteredUser = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.jobId.toString().includes(search)
  );

  // set Loading
  if (loading) return <Loading />;

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaUsers className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Welcome back
                {profile && (
                  <span className="text-blue-600">
                    , {profile.name.split(" ")[0]}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <FaChartLine className="text-green-500" />
                Admin Dashboard
              </p>
            </div>
          </div>

          <Toaster position="top-center" reverseOrder={false} />

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none min-w-[300px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="search"
                name="search"
                placeholder="Search by name or job ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
            </div>

            <div className="flex gap-3">
              <Link
                href={"/admin/addUser"}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-105"
              >
                <FaPlus size={16} />
                Add User
              </Link>

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Employees
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {activeStats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {activeStats.active} active employees
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rate</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {activeStats.total > 0
                    ? Math.round((activeStats.active / activeStats.total) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FaChartLine className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      activeStats.total > 0
                        ? (activeStats.active / activeStats.total) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Current Page
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {page}/{totalPages}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FaCog className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                {filteredUser.length} employees shown
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaUser className="text-white text-sm" />
              </div>
              Profile Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  icon: FaUser,
                  label: "Role",
                  value: profile.role,
                  capitalize: true,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <item.icon className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="font-semibold text-gray-800">
                      {item.capitalize
                        ? item.value.charAt(0).toUpperCase() +
                          item.value.slice(1)
                        : item.value}
                    </p>
                  </div>
                </div>
              ))}

              <div className="md:col-span-2 lg:col-span-3 xl:col-span-1">
                <Link
                  href={"/forgetPassword"}
                  className="flex items-center gap-3 w-full p-4 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-orange-700 rounded-xl border border-orange-200 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <FaKey className="text-orange-600" />
                  </div>
                  <span className="font-semibold">Reset Password</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Employees Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Employees Management
                </h2>
                <p className="text-gray-600 text-sm">
                  Manage your team members and their attendance
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                <FaUsers className="text-blue-500" />
                <span>Total: {users.length} employees</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/60">
                {filteredUser.length > 0 ? (
                  filteredUser.map((user, i) => (
                    <tr
                      key={i}
                      className="hover:bg-blue-50/30 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          #{user.jobId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{user.email}</div>
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">{user.position}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                            user.active
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              user.active ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === "admin" ? (
                          <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-lg">
                            Admin Account
                          </span>
                        ) : (
                          <Link
                            href={`/admin/employeeAttendance/${user.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow hover:shadow-md group"
                          >
                            <FaEye size={14} />
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                          <FaUsers className="text-blue-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          No employees found
                        </h3>
                        <p className="text-gray-500 mb-6 text-center">
                          {search
                            ? "No employees match your search criteria."
                            : "Start building your team by adding the first employee."}
                        </p>
                        <Link
                          href={"/admin/addUser"}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                          <FaPlus size={16} />
                          Add First Employee
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {filteredUser.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold">{filteredUser.length}</span>{" "}
              employees on page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-200 hover:shadow-md"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
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

export default AdminDashboard;
