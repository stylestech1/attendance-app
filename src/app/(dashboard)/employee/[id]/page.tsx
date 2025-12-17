"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import Loading from "@/components/ui/Loading";
import Link from "next/link";
import {
  FaSignOutAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaIdBadge,
  FaKey,
  FaClock,
  FaHistory,
  FaPlay,
  FaStop,
  FaCoffee,
  FaBusinessTime,
} from "react-icons/fa";

// types
type Attendance = {
  id: string;
  date: string;
  checkInAt: string;
  checkOutAt: string | null;
  totalWorkedHours: string | null;
  totalBreakMinutes?: string | null;
  breaks?: { start: string; end: string }[];
};

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  position: string;
  jobId: number;
};

type EmployeeState = {
  isCheckedIn: boolean;
  isBreak: boolean;
  lastCheckInTime: string | null;
  lastAttendanceId: string | null;
  currentAttendance: Attendance | null;
};

const EmployeePage = () => {
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();
  const { auth, logout, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Save employee state to localStorage
  const saveEmployeeState = (state: EmployeeState) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`employeeState_${id}`, JSON.stringify(state));
    }
  };

  // Load employee state from localStorage
  const loadEmployeeState = (): EmployeeState | null => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`employeeState_${id}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (err) {
          console.error("Error parsing saved state:", err);
          return null;
        }
      }
    }
    return null;
  };

  // Clear employee state from localStorage
  const clearEmployeeState = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`employeeState_${id}`);
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load saved state on component mount
  useEffect(() => {
    const savedState = loadEmployeeState();
    if (savedState) {
      setIsCheckedIn(savedState.isCheckedIn);
      setIsBreak(savedState.isBreak);

      if (savedState.currentAttendance) {
        setAttendance((prev) => {
          const exists = prev.some(
            (att) => att.id === savedState.currentAttendance?.id
          );
          if (!exists && savedState.currentAttendance) {
            return [savedState.currentAttendance, ...prev];
          }
          return prev;
        });
      }
    }
  }, [id]);

  useEffect(() => {
    if (!auth?.token) {
      console.log("No token found, redirecting to login");
      return;
    }

    if (authLoading) {
      console.log("Still loading auth context...");
      return;
    }

    if (!id) {
      console.log("No employee ID found");
      toast.error("Employee ID is missing", {
        style: { background: "#dc2626", color: "#fff" },
      });
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${apiUrl}/api/v1/userDashboard/getMyData`, {
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!res.ok) {
          const err = await res.json();

          if (res.status === 401 || res.status === 403) {
            toast.error("Session expired. Please login again.", {
              style: { background: "#dc2626", color: "#fff" },
            });
            logout();
            return;
          }

          throw new Error(err.message || "Failed to fetch user data");
        }

        const result = await res.json();

        if (result.data) {
          setProfile(result.data);
          toast.success(result.message || "Profile loaded successfully");
        } else {
          throw new Error("No user data received from server");
        }
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message || "Profile loaded failed ❌", {
            style: { background: "#dc2626", color: "#fff" },
          });
        }

        if (
          err instanceof Error &&
          (err.message.includes("Unauthorized") ||
            err.message.includes("Session expired"))
        ) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, auth?.token, router, apiUrl, logout, authLoading]);

  useEffect(() => {
    if (authLoading || !auth?.token || !id) return;

    const fetchAttendance = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/v1/userDashboard/getMyData`, {
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        });

        const result = await res.json();

        let attendanceData: Attendance[] = [];

        if (Array.isArray(result.data)) {
          attendanceData = result.data;
        } else if (Array.isArray(result.attendance)) {
          attendanceData = result.attendance;
        } else if (result.data && Array.isArray(result.data.attendance)) {
          attendanceData = result.data.attendance;
        }

        const savedState = loadEmployeeState();
        if (savedState?.currentAttendance) {
          const exists = attendanceData.some(
            (att) => att.id === savedState.currentAttendance?.id
          );
          if (!exists) {
            attendanceData = [savedState.currentAttendance, ...attendanceData];
          }
        }

        setAttendance(attendanceData);

        const ongoingAttendance = attendanceData.find(
          (att) => att.checkInAt && !att.checkOutAt
        );

        if (ongoingAttendance) {
          setIsCheckedIn(true);
          const hasActiveBreak = ongoingAttendance.breaks?.some(
            (breakItem) => breakItem.start && !breakItem.end
          );
          setIsBreak(!!hasActiveBreak);
        }
      } catch (err) {
        console.log("Attendance fetch error:", err);
      }
    };

    fetchAttendance();
  }, [id, auth?.token, apiUrl, authLoading]);

  // Check In function
  const handleCheckIn = async () => {
    if (!auth?.token) {
      toast.error("Please login first", {
        style: { background: "#dc2626", color: "#fff" },
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/v1/attendance/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ employeeId: id }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.message) {
          toast.error(result.message || "Check-in failed! ✅", {
            style: { background: "#16a34a", color: "#fff" },
          });
          return;
        }
        throw new Error(result.message || "Check-in failed");
      }

      if (result.data) {
        const newAttendance: Attendance = {
          ...result.data,
          date: new Date().toISOString().split("T")[0],
          checkInAt: new Date().toISOString(),
          checkOutAt: null,
          totalWorkedHours: "0.00",
          totalBreakMinutes: "0",
        };

        // حفظ في localStorage
        saveEmployeeState({
          isCheckedIn: true,
          isBreak: false,
          lastCheckInTime: new Date().toISOString(),
          lastAttendanceId: result.data.id,
          currentAttendance: newAttendance,
        });

        // تحديث state
        setAttendance((prev) => [newAttendance, ...prev]);
      }

      setIsCheckedIn(true);
      setIsBreak(false);
      toast.success(result.message || "Checkin successfully! ✅", {
        style: { background: "#16a34a", color: "#fff" },
      });
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

  // Check Out function
  const handleCheckOut = async () => {
    if (!auth?.token) {
      toast.error("Please login first", {
        style: { background: "#dc2626", color: "#fff" },
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${apiUrl}/api/v1/attendance/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ employeeId: id }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Check-out failed");
      }

      if (result.data) {
        // تحديث الattendance المحلي
        setAttendance((prev) =>
          prev.map((att) => (att.id === result.data.id ? result.data : att))
        );

        // مسح من localStorage
        clearEmployeeState();
      }

      setIsCheckedIn(false);
      setIsBreak(false);
      toast.success(result.message || "Checked out successfully");
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

  // Break function
  const handleBreak = async () => {
    if (!auth?.token) {
      toast.error("Please login first", {
        style: { background: "#dc2626", color: "#fff" },
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${apiUrl}/api/v1/attendance/toggle-break`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ employeeId: id }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Break failed");
      }

      if (result.data) {
        // تحديث الattendance المحلي
        setAttendance((prev) =>
          prev.map((att) => (att.id === result.data.id ? result.data : att))
        );

        const newBreakState = !isBreak;

        // تحديث localStorage
        const savedState = loadEmployeeState();
        if (savedState) {
          saveEmployeeState({
            ...savedState,
            isBreak: newBreakState,
            currentAttendance: result.data,
          });
        }
      }

      setIsBreak((prev) => !prev);
      toast.success(result.message || "Break status updated");
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

  // Format time function
  const formatTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading authentication...</div>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (!auth?.token) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaBusinessTime className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Welcome back,{" "}
                <span className="text-blue-600">
                  {profile?.name || "Employee"}
                </span>
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <FaClock className="text-blue-500" />
                Employee Dashboard
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Current Time Display */}
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Current Time</div>
              <div className="text-xl font-bold text-gray-800">
                {currentTime.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
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
                  badge: true,
                  color: "blue",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <item.icon className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {item.label}
                    </p>
                    {item.badge ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 capitalize">
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

              <div className="md:col-span-2 lg:col-span-1">
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

        {/* Attendance Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <FaClock className="text-white text-sm" />
            </div>
            Attendance Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Check In Button */}
            <button
              onClick={handleCheckIn}
              disabled={loading || isCheckedIn}
              className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <FaPlay className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-lg">Check In</div>
                <div className="text-sm opacity-90">Start your work day</div>
              </div>
            </button>

            {/* Break Button */}
            <button
              onClick={handleBreak}
              disabled={loading || !isCheckedIn}
              className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <FaCoffee className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-lg">
                  {isBreak ? "End Break" : "Start Break"}
                </div>
                <div className="text-sm opacity-90">Take a break</div>
              </div>
            </button>

            {/* Check Out Button */}
            <button
              onClick={handleCheckOut}
              disabled={loading || !isCheckedIn}
              className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <FaStop className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-lg">Check Out</div>
                <div className="text-sm opacity-90">End your work day</div>
              </div>
            </button>
          </div>

          {/* Status Indicators */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border ${
                isCheckedIn
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isCheckedIn ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                <span className="font-medium">
                  Status: {isCheckedIn ? "Checked In" : "Checked Out"}
                </span>
              </div>
              {isCheckedIn && (
                <div className="text-sm mt-2 text-green-700">
                  ✓ You are currently checked in
                </div>
              )}
            </div>
            <div
              className={`p-4 rounded-xl border ${
                isBreak
                  ? "bg-orange-50 border-orange-200 text-orange-800"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isBreak ? "bg-orange-500" : "bg-gray-400"
                  }`}
                ></div>
                <span className="font-medium">
                  Break: {isBreak ? "On Break" : "Active"}
                </span>
              </div>
              {isBreak && (
                <div className="text-sm mt-2 text-orange-700">
                  ☕ You are currently on break
                </div>
              )}
            </div>
          </div>
        </div>

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
                  Your recent attendance history
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                <FaClock className="text-blue-500" />
                <span>Total Records: {attendance.length}</span>
              </div>
            </div>
          </div>

          <Toaster position="top-center" reverseOrder={false} />

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
                {attendance && attendance.length > 0 ? (
                  attendance.map((att, index) => (
                    <tr
                      key={att.id || index}
                      className="hover:bg-blue-50/30 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <FaHistory className="text-white text-sm" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {att.date ? formatDate(att.date) : "No date"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {att.checkInAt ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                            {formatTime(att.checkInAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            --
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {att.checkOutAt ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {formatTime(att.checkOutAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            --
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {att.totalWorkedHours ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            {Number(att.totalWorkedHours).toFixed(2) + "h"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {att.totalBreakMinutes ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            {Number(att.totalBreakMinutes).toFixed(0) + "m"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            -
                          </span>
                        )}
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
                          No attendance records found
                        </h3>
                        <p className="text-gray-500 mb-4 text-center">
                          {loading
                            ? "Loading attendance data..."
                            : "Start your day by checking in above to see your attendance history here."}
                        </p>
                        {!loading && (
                          <button
                            onClick={handleCheckIn}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                          >
                            <FaPlay size={16} />
                            Check In Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmployeePage;
