import React from "react";
import { FaTimes, FaInfoCircle, FaHistory } from "react-icons/fa";

// Helper
const formatDateTime = (dateStr, short = false) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  if (short) {
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  }
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getDate()} ${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// Komponen Metadata
const MetadataItem = ({ label, value, short = false }) => (
  <div className="flex flex-col gap-0.5">
    <label className="font-semibold text-[10px] text-gray-500 uppercase">{label}</label>
    <span className={`text-gray-800 text-[10px] font-mono`}>{short ? formatDateTime(value, true) : value || "-"}</span>
  </div>
);

// Komponen History Row
const HistoryRow = ({ change, fieldLabels, formatAssignedHistory }) => {
  const [rawField, rawValues] = change.split(": ");
  const [before, after] = rawValues?.split(" → ") || ["", ""];
  const field = rawField?.trim();
  if (field === "status") return null;

  const label = fieldLabels[field] || field;

  let beforeVal = before.replace(/'/g, "");
  let afterVal = after.replace(/'/g, "");

  if (field === "SAP" || field === "Assigned") {
    beforeVal = formatAssignedHistory(beforeVal);
    afterVal = formatAssignedHistory(afterVal);
  }

  const formatValue = (val, f) => {
    if (!val) return "-";
    if (f.includes("date") || f === "actual_start" || f === "actual_end") {
      return formatDateTime(val, true);
    }
    return val;
  };

  return (
    <div className="grid grid-cols-3 text-center border-t border-gray-100 divide-x divide-gray-100 hover:bg-gray-50 transition-colors">
      <span className="text-gray-800 font-medium p-1 text-[10px]">{label}</span>
      <span className="text-red-500 italic p-1 text-[10px]">{formatValue(beforeVal, field)}</span>
      <span className="text-green-600 font-semibold p-1 text-[10px]">{formatValue(afterVal, field)}</span>
    </div>
  );
};

const InfoTask = ({ task, onClose }) => {
  const primaryBlue = "bg-blue-600";
  const textPrimary = "text-blue-600";

  const fieldLabels = {
    SAP: "Assigned",
    task_group: "Task Group",
    task_detail: "Task Detail",
    plan_start_date: "Plan Start",
    plan_end_date: "Plan End",
    actual_start: "Actual Start",
    actual_end: "Actual End",
    platform: "Platform",
    task_progress: "Progress (%)",
  };

  const hasUpdate = task.updated_at && task.updated_at !== task.created_at;
  const hasHistory = task.update_history && task.update_history.length > 0;

  const formatAssignedHistory = (assignedValue) => assignedValue;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] max-w-[95%] shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        <div className={`p-3 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}>
          <h3 className="text-sm font-bold m-0 tracking-wide flex items-center gap-2">
            <FaInfoCircle className="w-4 h-4" /> TASK INFORMATION
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors text-white">
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 text-xs space-y-4">
          {/* Task Overview */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 shadow-inner">
            <h4 className={`font-bold text-xs mb-2 pb-1 border-b ${textPrimary} flex items-center gap-2`}>Task Detail</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-800 text-xs font-medium whitespace-pre-wrap">{task.task_detail || "-"}</span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b pb-3">
            <MetadataItem label="Created At" value={task.created_at} short />
            <MetadataItem label="Created By" value={task.created_by} />
            {hasUpdate && (
              <>
                <MetadataItem label="Updated At" value={task.updated_at} short />
                <MetadataItem label="Updated By" value={task.updated_by} />
              </>
            )}
          </div>

          {/* Update History */}
          {hasHistory && (
            <div>
              <h4 className={`font-bold text-xs mb-2 pb-1 border-b ${textPrimary} flex items-center gap-2`}>
                <FaHistory className="w-3 h-3" /> Update History
              </h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 shadow-inner">
                {task.update_history.map((u, idx) => (
                  <div key={idx} className="mb-2 p-1 border border-gray-300 rounded-md bg-white last:mb-0 shadow-sm">
                    <div className="text-gray-700 text-[10px] mb-1 pb-1 border-b">
                      <span className="font-bold text-gray-900">{u.updated_by}</span> updated at{" "}
                      <span className="font-mono text-blue-700">{formatDateTime(u.updated_at)}</span>
                    </div>
                    {u.changes ? (
                      <div className="text-gray-700 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-3 bg-blue-50 font-semibold text-center py-1 text-[10px] text-gray-700 border-b">
                          <span>Field</span>
                          <span>Before</span>
                          <span>After</span>
                        </div>
                        {u.changes.split(", ").map((change, i) => (
                          <HistoryRow key={i} change={change} fieldLabels={fieldLabels} formatAssignedHistory={formatAssignedHistory} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-[10px] italic p-1">No changes recorded.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoTask;
