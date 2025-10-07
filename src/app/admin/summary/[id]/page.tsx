"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Loading from "@/components/ui/Loading";
import { 
  FaSignOutAlt, 
  FaUser, 
  FaChartBar, 
  FaCalendarAlt, 
  FaClock, 
  FaCalendarCheck, 
  FaCalendarTimes, 
  FaBalanceScale,
  FaCoffee,
  FaArrowLeft
} from "react-icons/fa";

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
type TSummary = {
  period: { from: string; to: string };
  daysWorked: number;
  daysAbsent: number;
  expectedHours: number;
  actualHours: number;
  totalBreakHours: number;
  differenceHours: number;
};

const apiURL = process.env.NEXT_PUBLIC_API_URL;

const Summary = () => {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [profile, setProfile] = useState<TProfile | null>(null);
  const [summary, setSummary] = useState<TSummary[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    const query = new URLSearchParams({
      search: String(profile?.jobId || ""),
    });

    if (fromDate) query.append("from", fromDate);
    if (toDate) query.append("to", toDate);

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${apiURL}/api/v1/attendance/summary/${userId}?${query.toString()}`,
          {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${auth?.token}`,
            },
          }
        );

        const result = await res.json();

        if (res.ok) {
          setSummary([result.summary]);
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
  }, [auth.token, userId, fromDate, toDate, profile]);

  // Logout Function
  const handleLogout = () => {
    logout();
  };

  // Go Back Function
  const handleGoBack = () => {
    router.push(`/admin/employeeAttendance/${userId}`);
  };

  // set Loading
  if (loading) return <Loading />;

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaChartBar className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                {`${profile?.name.split(" ")[0]}'s`} Performance Summary
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Attendance Analytics & Insights
              </p>
            </div>
          </div>

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
                onClick={handleGoBack}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <FaArrowLeft size={16} />
                Back
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

        {/* Summary Cards */}
        {summary.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Days Worked */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Days Worked</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{summary[0].daysWorked}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FaCalendarCheck className="text-green-600 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Active attendance days
                </div>
              </div>
            </div>

            {/* Days Absent */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Days Absent</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{summary[0].daysAbsent}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <FaCalendarTimes className="text-red-600 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Missed work days
                </div>
              </div>
            </div>

            {/* Actual Hours */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actual Hours</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{summary[0].actualHours.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaClock className="text-blue-600 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600">
                  of {summary[0].expectedHours}h expected
                </div>
              </div>
            </div>

            {/* Break Time */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Break Time</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{summary[0].totalBreakHours.toFixed(1)}h</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FaCoffee className="text-orange-600 text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Total break duration
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {summary.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Hours Comparison */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaBalanceScale className="text-purple-500" />
                Hours Comparison
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Expected Hours:</span>
                  <span className="font-semibold text-gray-800">{summary[0].expectedHours}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Actual Hours:</span>
                  <span className="font-semibold text-gray-800">{summary[0].actualHours.toFixed(2)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Difference:</span>
                  <span className={`font-semibold ${
                    summary[0].differenceHours >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary[0].differenceHours >= 0 ? '+' : ''}{summary[0].differenceHours.toFixed(2)}h
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaChartBar className="text-blue-500" />
                Attendance Rate
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Attendance Rate</span>
                    <span>{((summary[0].daysWorked / (summary[0].daysWorked + summary[0].daysAbsent)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${(summary[0].daysWorked / (summary[0].daysWorked + summary[0].daysAbsent)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{summary[0].daysWorked}</div>
                    <div className="text-sm text-green-600">Days Worked</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{summary[0].daysAbsent}</div>
                    <div className="text-sm text-red-600">Days Absent</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <FaChartBar className="text-blue-500" />
              Detailed Summary Report
            </h2>
            <p className="text-gray-600 text-sm">Comprehensive overview of attendance and performance metrics</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">To Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Days Worked</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Days Absent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expected Hours</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actual Hours</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Break Hours</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Difference</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200/60">
                {summary.length > 0 ? (
                  summary.map((sum, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          Period {i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {new Date(sum.period.from).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {new Date(sum.period.to).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                          {sum.daysWorked}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                          {sum.daysAbsent}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                        {sum.expectedHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                        {sum.actualHours.toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                          {sum.totalBreakHours.toFixed(2)}h
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                          sum.differenceHours >= 0 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {sum.differenceHours >= 0 ? '+' : ''}{sum.differenceHours.toFixed(2)}h
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                          <FaChartBar className="text-gray-600 text-2xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No summary data</h3>
                        <p className="text-gray-500 mb-4 text-center">
                          {fromDate || toDate 
                            ? 'No summary data found for the selected date range.' 
                            : 'Select a date range to view attendance summary.'
                          }
                        </p>
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

export default Summary;