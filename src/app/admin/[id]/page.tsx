"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/ui/Loading";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

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
    <section className="container mx-auto my-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        {profile && (<h1 className="text-4xl font-bold">👋 Welcom {profile.name.split(' ')[0]}</h1>)}
        <input
          type="search"
          name="search"
          placeholder="Search on Employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-5 py-2 rounded-md border border-[#6e6e6e] w-100"
        />
        <div className="flex items-center gap-5">
          <Link
            href={"/admin/addUser"}
            className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-fit"
          >
            Add User
          </Link>

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
            <div className="flex gap-x-2">
              <Link
                href={"/forgetPassword"}
                className="text-sm text-blue-800 hover:underline"
              >
                I Forgot My Password
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <table className="w-full border-collapse border border-gray-300 my-20">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Position</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Attendance</th>
          </tr>
        </thead>

        <tbody className="text-center">
          {filteredUser.length > 0 ? (
            filteredUser.map((user, i) => (
              <tr key={i}>
                <td className="border p-2">{user.jobId}</td>
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.phone}</td>
                <td className="border p-2">{user.position}</td>
                <td className="border p-2">
                  {user.active ? "Active ✅" : "Inactive ❌"}
                </td>
                <td className="border p-2">
                  {user.role === "admin" ? (
                    <span>This is an admin</span>
                  ) : (
                    <Link
                      href={`/admin/employeeAttendance/${user.id}`}
                      className="py-2 px-5 bg-blue-700 text-white rounded-md cursor-pointer"
                    >
                      View
                    </Link>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center">
                  <div className="text-lg mb-2">📊</div>
                  <div>No Employees records found</div>
                  <div className="text-sm mt-1">Start by adding one</div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-end gap-4 mt-5">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="cursor-pointer px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          {" "}
          Previous
        </button>
        <span className="px-4 py-2">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((prev) => prev + 1)}
          className="cursor-pointer px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default AdminDashboard;
