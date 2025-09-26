"use client";
// Importing React Hooks
import { useState, useEffect, use } from "react";
// Importing Next Components
import Image from "next/image";
// Importing Components
import Loading from "@/components/ui/Loading";

// types
type TAttendance = {
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalMinutes?: number;
};
type TEmployee = {
  id: string;
  jobId: number
  name: string;
  email: string;
  phone: string;
  position: string;
  role: string;
  active: boolean;
  attendance: TAttendance[];
};

const EmployeeDetails = ({ params }: { params: Promise<{ id: string }> }) => {
  const [employee, setEmployee] = useState<TEmployee | null>(null);
  const [loading, setLoading] = useState(false);
  const { id } = use(params);

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      const res = await fetch(`/api/employee/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      }
      setLoading(false);
    }
    fetchEmployees();
  }, [id]);

  // Set Loading
  if (loading) return <Loading />;
  if (!employee) return <p>No Employee Found.</p>;

  // Set form of Total
  const minutesToHHMM = (minutes?: number) => {
    if (!minutes) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} : ${m}`;
  };

  //   DeActiving Accounts
  const toggleActive = async () => {
    if(!employee) return
    const updated = ({...employee, active: !employee.active})
    setEmployee(updated)

    // update Status in API
    const res = await fetch(`/api/employee/${employee.id}`, {
      method: 'PATCH',
      headers:{'content-type': 'application/json'},
      body: JSON.stringify({active: updated.active})
    })
    if(!res.ok){
      setEmployee(employee)
    }
  }

  return (
    <section className="container mx-auto my-20">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-5">
          <Image
            src={"/user.webp"}
            width={100}
            height={100}
            alt="profile"
            loading="lazy"
          />
          <div>
            <h2 className="text-2xl font-bold mb-2">{employee.name}</h2>
            <p className="text-md">Job-ID: <span className="font-bold text-blue-700">{employee.jobId}</span></p>
            <p className="text-md">Email: {employee.email}</p>
            <p className="text-md">Position: {employee.position}</p>
            <p className="text-md">Phone: {employee.phone}</p>
            <p className="text-md">Role: {employee.role}</p>
          </div>
        </div>

        <button
          onClick={toggleActive}
          className={`w-30 py-3 rounded-lg ${
            employee.active
              ? "bg-red-700 hover:bg-red-800"
              : "bg-green-700 hover:bg-green-800"
          } cursor-pointer transition-colors text-white`}
        >
          {employee.active ? "Deactive" : "Active"}
        </button>
      </div>

      <div className="my-20">
        <h2 className="text-3xl font-bold">Attendance Details</h2>

        <table className="w-full border-collapse border border-gray-300 my-5">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Day</th>
              <th className="border p-2">Check In</th>
              <th className="border p-2">Check Out</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>

          <tbody>
            {employee.attendance.map((att, i) => (
              <tr key={i}>
                <td className="border p-2">{att.date}</td>
                <td className="border p-2">
                  {att.checkIn
                    ? new Date(att.checkIn).toLocaleTimeString()
                    : "-"}
                </td>
                <td className="border p-2">
                  {att.checkOut
                    ? new Date(att.checkOut).toLocaleTimeString()
                    : "-"}
                </td>
                <td className="border p-2">
                  {minutesToHHMM(att.totalMinutes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default EmployeeDetails;
