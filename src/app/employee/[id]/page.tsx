"use client";
// Importing React Hooks
import { useState, useEffect } from "react";
// importing Next Components
import { useParams, useRouter } from "next/navigation";
// importing contexts
import { useAuth } from "@/context/AuthContext";
// importing Components
import toast from "react-hot-toast";
import Loading from "@/components/ui/Loading";

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!auth?.token) {
      console.log("No token found, redirecting to login");
      router.replace("/login");
      return;
    }

    if (authLoading) {
      console.log("Still loading auth context...");
      return;
    }

    if (!id) {
      console.log("No employee ID found");
      alert("Employee ID is missing");
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
            alert("Session expired. Please login again.");
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
        console.error("Fetch user data error:", err);
        alert(err instanceof Error ? err.message : "Failed to load profile");

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

        if (Array.isArray(result.data)) {
          setAttendance(result.data);
        } else if (Array.isArray(result.attendance)) {
          setAttendance(result.attendance);
        } else {
          setAttendance([]); // fallback
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
      alert("Please login first");
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
          alert(result.message);
          return;
        }
        throw new Error(result.message || "Check-in failed");
      }

      if (result.data) {
        setAttendance((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return [result.data, ...safePrev];
        });
      }

      setIsCheckedIn(true);
      toast.success(result.message || "Checked in successfully");
    } catch (err) {
      console.error("Check-in error:", err);
      alert(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  // Check Out function
  const handleCheckOut = async () => {
    if (!auth?.token) {
      alert("Please login first");
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
        setAttendance((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return safePrev.map((att) =>
            att.id === result.data.id ? result.data : att
          );
        });
      }

      setIsCheckedIn(false);
      toast.success(result.message || "Checked out successfully");
    } catch (err) {
      console.error("Check-out error:", err);
      alert(err instanceof Error ? err.message : "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  // Break function
  const handleBreak = async () => {
    if (!auth?.token) {
      alert("Please login first");
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
        setAttendance((prev) => {
          const savePrev = Array.isArray(prev) ? prev : [];
          return savePrev.map((att) =>
            att.id === result.data.id ? result.data : att
          );
        });
      }

      setIsBreak((prev) => !prev);
      toast.success(result.message);
    } catch (err) {
      console.error("Break error:", err);
      alert(err instanceof Error ? err.message : "Break failed");
    } finally {
      setLoading(false);
    }
  };

  // Logout Function
  const handleLogout = () => {
    logout();
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

  // Formating Dates % Checin/out
  const formatTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <section className="container mx-auto my-10 px-4 flex flex-col items-center justify-center min-h-[85vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 w-full">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {profile?.name || "Employee"}
        </h1>
        <button
          onClick={handleLogout}
          className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-fit"
        >
          Logout
        </button>
      </div>

      {/* Profile Information */}
      {profile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border w-full">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Email:</span>
              <span className="text-gray-800">{profile.email}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Phone:</span>
              <span className="text-gray-800">{profile.phone}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Role:</span>
              <span className="text-gray-800 capitalize">{profile.role}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Position:</span>
              <span className="text-gray-800">{profile.position}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Job-ID:</span>
              <span className="text-gray-800">{profile.jobId}</span>
            </div>
          </div>
        </div>
      )}

      {/* Check In/Out Buttons */}
      <div className="flex items-center justify-between w-full">
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleCheckIn}
            disabled={loading || isCheckedIn}
            className="cursor-pointer px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Check In"}
          </button>
          <button
            onClick={handleCheckOut}
            disabled={loading || !isCheckedIn}
            className="cursor-pointer px-6 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Check Out"}
          </button>
        </div>

        <button
          onClick={handleBreak}
          disabled={loading}
          className="cursor-pointer px-6 py-2 bg-orange-700 text-white rounded-md hover:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing..." : isBreak ? "End Break" : "Start Break"}
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm border w-full">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Attendance Records
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                  Check In
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                  Check Out
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                  Total Works Hours
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                  Total Break Minutes
                </th>
              </tr>
            </thead>
            <tbody>
              {attendance.length > 0 ? (
                attendance.map((att, index) => (
                  <tr
                    key={att.id}
                    className={`hover:bg-gray-50 ${
                      index !== attendance.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {att.date.split("T")[0]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {formatTime(att.checkInAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {att.checkOutAt ? formatTime(att.checkOutAt) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {att.totalWorkedHours
                        ? Number(att.totalWorkedHours).toFixed(2)
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {att.totalBreakMinutes
                        ? Number(att.totalBreakMinutes).toFixed(2)
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-lg mb-2">📊</div>
                      <div>No attendance records found</div>
                      <div className="text-sm mt-1">
                        Start by checking in above
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default EmployeePage;
