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
  const [summary, setSummary] = useState<TSummary | null>(null);
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

    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${apiURL}/api/v1/attendance/summary/${userId}`,
          {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${auth?.token}`,
            },
          }
        );

        const result = await res.json();

        if (res.ok) {
          setSummary(result.summary);
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
  }, [auth.token, userId]);

  // Logout Function
  const handleLogout = () => {
    logout();
  };

  //   set Loading
  if (loading) return <Loading />;

  return (
    <section className="container mx-auto my-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        {profile && (
          <h1 className="text-3xl">
            🔍Preview{" "}
            <span className="font-bold">{profile.name.split(" ")[0]}</span>{" "}
            Summary
          </h1>
        )}

        <button
          onClick={handleLogout}
          className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-fit"
        >
          Logout
        </button>
      </div>

      {/* Profile Information */}
      {/* {profile && (
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
      )} */}

      {/* Attendance Table */}
      <div className="my-10">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Summary Records
        </h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date From</th>
              <th className="border p-2">Date To</th>
              <th className="border p-2">Days Worked</th>
              <th className="border p-2">Days Absented</th>
              <th className="border p-2">Expected Hours</th>
              <th className="border p-2">Actual Hours</th>
              <th className="border p-2">Total Break Hours</th>
              <th className="border p-2">Difference Hours</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {summary ? (
              <tr>
                <td className="border p-2">
                  {new Date(summary.period.from).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  {new Date(summary.period.to).toLocaleDateString()}
                </td>
                <td className="border p-2">{summary.daysWorked}</td>
                <td className="border p-2">{summary.daysAbsent}</td>
                <td className="border p-2">{summary.expectedHours}</td>
                <td className="border p-2">{summary.actualHours.toFixed(2)}</td>
                <td className="border p-2">
                  {summary.totalBreakHours.toFixed(2)}
                </td>
                <td className="border p-2">
                  {summary.differenceHours.toFixed(2)}
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No attendance summary found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Summary;
