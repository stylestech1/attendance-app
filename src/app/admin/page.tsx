"use client";
import { useState, useEffect } from "react";
import Loading from "@/components/ui/Loading";
import Link from "next/link";

// Types
type TEmpolyee = {
  id: string;
  jobId: number;
  name: string;
  email: string;
  position: string;
  phone: string;
  role: string;
  active: boolean;
};

const Admin = () => {
  const [employees, setEmployees] = useState<TEmpolyee[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (res.ok) {
        setEmployees(data);
      }
      setLoading(false);
    }
    fetchEmployees();
  }, []);

  if (loading) return <Loading />;

  // Filtering with name and jobId
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(searchLower) ||
      emp.jobId.toString().includes(searchLower)
    );
  });

  return (
    <section className="container mx-auto my-20">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          {employees.find((admin) => admin.role === "admin")?.name ?? "No Name"}
        </h1>
        <input
          type="search"
          name="search"
          placeholder="Search on Employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-5 py-3 rounded-md border border-[#6e6e6e] w-100"
        />
      </div>

      <table className="w-full border-collapse border border-gray-300 my-20">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Position</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Show Attendance</th>
          </tr>
        </thead>

        <tbody className="text-center">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp, i) => (
              <tr key={i}>
                <td className="border p-2 font-bold">{emp.jobId}</td>
                <td className="border p-2">{emp.name}</td>
                <td className="border p-2">{emp.email}</td>
                <td className="border p-2">{emp.phone}</td>
                <td className="border p-2">{emp.position}</td>
                <td className="border p-2">
                  {emp.active ? "Active" : "Deactive"}
                </td>
                <td className="border p-3">
                  <Link
                    href={`/admin/employee/${emp.id}`}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-600 text-white rounded transition-colors"
                  >
                    View Attendance
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="border p-2 text-center text-gray-500">
                No employees found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default Admin;
