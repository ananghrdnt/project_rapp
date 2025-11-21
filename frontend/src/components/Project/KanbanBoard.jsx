import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoGitBranchOutline } from "react-icons/io5";
import { FiList, FiLoader, FiCheckCircle } from "react-icons/fi";
import { FaXmark } from "react-icons/fa6";

const KanbanBoard = ({ onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [filterType, setFilterType] = useState("PROJECT"); // PROJECT | ITGA | SAP | DATA_SCIENCE
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const filteredTasks = tasks.filter((t) => {
    const actualStart = t.actual_start ? new Date(t.actual_start) : null;
    const dateRef =
      actualStart ||
      (t.plan_start_date ? new Date(t.plan_start_date) : null);

    if (!selectedMonth && !selectedYear) return true; 
    if (!dateRef) return false;

    const dateRefMonth = dateRef.getUTCMonth() + 1;
    const dateRefYear = dateRef.getUTCFullYear();

    const matchMonth = !selectedMonth || dateRefMonth === parseInt(selectedMonth);
    const matchYear = !selectedYear || dateRefYear === parseInt(selectedYear);
    return matchMonth && matchYear;
  });

  const groupBy = (arr, keyFn) =>
    arr.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

  const groupedData = (() => {
    switch (filterType) {
      case "PROJECT":
        return groupBy(filteredTasks, (t) => t.project?.project_name || "Unknown Project");
      case "ITGA":
        return groupBy(
          filteredTasks.filter(t => t.user?.role?.role === "ITGA"),
          (t) => t.user?.name || "Unassigned ITGA"
        );
      case "SAP":
        return groupBy(
          filteredTasks.filter(t => t.user?.role?.role === "SAP"),
          (t) => t.user?.name || "Unassigned SAP"
        );
      case "DATA_SCIENCE":
        return groupBy(
          filteredTasks.filter(t => t.user?.role?.role === "DATA_SCIENCE"),
          (t) => t.user?.name || "Unassigned Data Science"
        );
      default:
        return {};
    }
  })();

  const statusColor = (status) => {
    switch (status) {
      case "TO_DO": return "bg-red-500 hover:bg-red-600";
      case "IN_PROGRESS": return "bg-yellow-400 hover:bg-yellow-500";
      case "COMPLETED": return "bg-green-500 hover:bg-green-600";
      default: return "bg-gray-400 hover:bg-gray-500";
    }
  };
  
  const statusIcon = (status) => {
    switch (status) {
      case "TO_DO": return <FiList size={14} />;
      case "IN_PROGRESS": return <FiLoader size={14} className="animate-spin" />;
      case "COMPLETED": return <FiCheckCircle size={14} />;
      default: return <IoGitBranchOutline size={14} />;
    }
  };

  const statuses = [
    { label: "To Do", value: "TO_DO" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
  ];

  const groupedByStatus = (status) => {
    const data = Object.entries(groupedData)
      .map(([key, value]) => {
        const count = value.filter((v) => v.status === status).length;
        return { name: key, task: count };
      })
      .filter(item => item.task > 0)
      .sort((a, b) => b.task - a.task);
    return data;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-[100]">
      <div className="bg-gradient-to-b from-white via-blue-50 to-blue-100 rounded-xl shadow-2xl w-[95%] max-w-7xl p-6 relative overflow-y-auto max-h-[95vh] transform transition-all duration-300 scale-95 md:scale-100 border border-blue-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 p-2 rounded-full transition-colors"
          title="Close"
        >
          <FaXmark size={20} />
        </button>

        <h2 className="text-xl font-extrabold mb-6 text-blue-800 flex items-center gap-3">
          <IoGitBranchOutline size={22} className="text-blue-500" /> Kanban Board Task Summary
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-inner text-[0.7rem]">
          <span className="font-semibold text-gray-700 mr-2">Filter By Date:</span>
          <select
            className="border border-gray-300 p-1.5 rounded-lg bg-white cursor-pointer text-[0.7rem]"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">All Months</option>
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="border border-gray-300 p-1.5 rounded-lg bg-white cursor-pointer text-[0.7rem]"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">All Years</option>
            {years.map((y, i) => (
              <option key={i} value={y}>{y}</option>
            ))}
          </select>

          <span className="font-semibold text-gray-700 ml-4 mr-2">Group By:</span>
          <select
            className="border border-blue-400 bg-blue-50 p-1.5 rounded-lg font-medium cursor-pointer text-[0.7rem]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="PROJECT">Project</option>
            <option value="ITGA">ITGA</option>
            <option value="SAP">SAP</option>
            <option value="DATA_SCIENCE">Data Science</option>
          </select>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <FiLoader className="animate-spin text-blue-500" size={30} />
            <p className="ml-3 text-[0.8rem] text-gray-600">Loading Tasks...</p>
          </div>
        ) : (
          <>
            <p className="text-[0.7rem] text-gray-600 mb-4 font-medium italic">
              {`Showing breakdown for ${filteredTasks.length} tasks grouped by ${filterType.replace("_", " ")}`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {statuses.map((status) => (
                <div key={status.value} className="bg-gray-50 border border-gray-300 rounded-xl shadow-lg overflow-hidden">
                  <div className={`text-white font-bold px-4 py-2.5 flex items-center justify-between text-[0.7rem] ${statusColor(status.value)}`}>
                    <span className="flex items-center gap-2">
                      {statusIcon(status.value)}
                      {status.label}
                    </span>
                    <span className="text-[0.65rem] bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                      {groupedByStatus(status.value).reduce((sum, item) => sum + item.task, 0)} Tasks
                    </span>
                  </div>

                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-[0.7rem] text-left border-separate border-spacing-y-1">
                      <thead>
                        <tr className="text-gray-600 uppercase text-[0.65rem]">
                          <th className="px-3 pt-2 pb-1 w-[10%]">#</th>
                          <th className="px-3 pt-2 pb-1 w-[70%]">
                            {filterType === "PROJECT" ? "Project Name" : "Name"}
                          </th>
                          <th className="px-3 pt-2 pb-1 w-[20%] text-center">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedByStatus(status.value).length === 0 ? (
                          <tr>
                            <td colSpan="3" className="text-center py-4 text-gray-500 italic text-[0.65rem]">
                              No {status.label} tasks found for this filter.
                            </td>
                          </tr>
                        ) : (
                          groupedByStatus(status.value).map((item, idx) => (
                            <tr key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                              <td className="px-3 py-2 text-center font-medium text-gray-700 text-[0.7rem]">{idx + 1}</td>
                              <td className="px-3 py-2 text-gray-800 font-semibold truncate max-w-[150px] text-[0.7rem]">{item.name}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-block font-bold text-white px-3 py-0.5 rounded-full text-[0.65rem] shadow-md ${statusColor(status.value)}`}>
                                  {item.task}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;
