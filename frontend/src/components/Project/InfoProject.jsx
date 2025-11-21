import React from "react";
import { FaTimes, FaInfoCircle, FaHistory } from "react-icons/fa";

const InfoProject = ({ project, onClose }) => {
  const primaryBlue = "bg-blue-600";
  const textPrimary = "text-blue-600";

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("default", { month: "long" });
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const seconds = d.getSeconds().toString().padStart(2, "0");
    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
  };

  const fieldLabels = {
    SAP: "ITBP",
    project_name: "Project Name",
    project_type: "Project Type",
    project_type_id: "Project Type",
    level: "Effort Level",
    req_date: "Request Date",
    plan_start_date: "Plan Start",
    plan_end_date: "Plan End",
    live_date: "Go Live",
    remark: "Remark",
  };

const formatValue = (field, value) => {
  if (!value) return "-";

  // Format tanggal
  if (field.includes("date")) {
    const d = new Date(value);
    if (isNaN(d)) return value;
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  }

  // 🔥 Kalau value huruf besar semua (contoh: ENHANCEMENT, MAINTENANCE) → ubah ke Title Case
  if (/^[A-Z\s]+$/.test(value)) {
    return value
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Format kata dengan underscore -> jadi kapital awal tiap kata
  if (typeof value === "string" && value.includes("_")) {
    return value
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Khusus untuk project_type, level, status, dsb
  if (["project_type", "level", "status"].includes(field)) {
    return value
      .toLowerCase()
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return value;
};



  const hasUpdate = project.updated_at && project.updated_at !== project.created_at;
  const hasHistory = project.update_history && project.update_history.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] max-w-[95%] shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        <div
          className={`p-3 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}
        >
          <h3 className="text-sm font-bold m-0 tracking-wide flex items-center gap-2">
            <FaInfoCircle className="w-4 h-4" /> PROJECT INFORMATION
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close form"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 text-xs space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b pb-3">
            <div className="flex flex-col gap-0.5">
              <label className="font-semibold text-[10px] text-gray-500 uppercase">Created At</label>
              <span className="text-gray-800 text-[10px] font-mono">{formatDateTime(project.created_at)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="font-semibold text-[10px] text-gray-500 uppercase">Created By</label>
              <span className="text-gray-800 text-[10px]">{project.created_by || "-"}</span>
            </div>

            {hasUpdate && (
              <>
                <div className="flex flex-col gap-0.5">
                  <label className="font-semibold text-[10px] text-gray-500 uppercase">Updated At</label>
                  <span className="text-gray-800 text-[10px] font-mono">{formatDateTime(project.updated_at)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="font-semibold text-[10px] text-gray-500 uppercase">Updated By</label>
                  <span className="text-gray-800 text-[10px]">{project.updated_by || "-"}</span>
                </div>
              </>
            )}
          </div>

          {hasHistory && (
            <div>
              <h4 className={`font-bold text-xs mb-2 pb-1 border-b ${textPrimary} flex items-center gap-2`}>
                <FaHistory className="w-3 h-3" /> Update History
              </h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 shadow-inner">
                {project.update_history.map((u, idx) => (
                  <div key={idx} className="mb-2 p-1 border border-gray-300 rounded-md bg-white last:mb-0 shadow-sm">
                    <div className="text-gray-700 text-[10px] mb-1 pb-1 border-b">
                      <span className="font-bold text-gray-900">{u.updated_by}</span> updated at{" "}
                      <span className="font-mono text-blue-700">{formatDateTime(u.updated_at)}</span>
                    </div>

                    {u.changes ? (
                      <div className="text-gray-700 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-3 bg-blue-50 font-semibold text-center py-1 text-[10px] text-gray-700 border-b border-blue-200">
                          <span>Field</span>
                          <span>Before</span>
                          <span>After</span>
                        </div>

                        {u.changes.split(", ").map((change, i) => {
                          const [rawField, rawValues] = change.split(": ");
                          const [before, after] = rawValues?.split(" → ") || ["", ""];

                          const field = rawField?.trim();

                          if (["actual_start", "actual_end", "task_progress", "status"].includes(field)) {
                            return null;
                          }

                          const label =
                            field === "project_type_id"
                              ? "Project Type"
                              : fieldLabels[field] || field;

                          let beforeVal = before.replace(/'/g, "");
                          let afterVal = after.replace(/'/g, "");

                          beforeVal = formatValue(field, beforeVal);
                          afterVal = formatValue(field, afterVal);

                          // 🔥 Jika field project_type_id → tampilkan nama Project Type, bukan ID
                          if (field === "project_type_id") {
                            const findTypeName = (id) => {
                              const types = project.available_types || [];
                              const found = types.find(
                                (t) => String(t.id_project_type) === String(id)
                              );
                              return found ? found.project_type : id;
                            };

                            beforeVal =
                              project.project_type_name && isNaN(beforeVal)
                                ? beforeVal
                                : findTypeName(beforeVal);
                            afterVal =
                              project.project_type_name && isNaN(afterVal)
                                ? afterVal
                                : findTypeName(afterVal);
                          }

                          return (
                            <div
                              key={i}
                              className="grid grid-cols-3 text-center border-t border-gray-100 divide-x divide-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-gray-800 font-medium p-1 text-[10px]">{label}</span>
                              <span className="text-red-500 italic p-1 text-[10px]">{beforeVal || "-"}</span>
                              <span className="text-green-600 font-semibold p-1 text-[10px]">{afterVal || "-"}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-[10px] italic p-1">No significant changes recorded.</div>
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

export default InfoProject;
