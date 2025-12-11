import React, { useMemo } from "react";
import { FaTimes, FaInfoCircle, FaHistory } from "react-icons/fa";

/* ------------------------------------------------------
   KOMPONEN REUSABLE DI LUAR PARENT COMPONENT
------------------------------------------------------ */
const MetaInfoItem = ({ label, value, fieldLabels }) => (
  <div className="flex flex-col gap-0.5">
    <label className="font-semibold text-[10px] text-gray-500 uppercase">
      {fieldLabels[label] || label}
    </label>
    <span className="text-gray-800 text-[10px]">
      {label.includes("_at") ? <span className="font-mono">{value}</span> : value}
    </span>
  </div>
);

const ChangeItem = ({ field, beforeVal, afterVal, fieldLabels }) => {
  const label = field === "project_type_id" ? "Project Type" : fieldLabels[field] || field;
  return (
    <div className="grid grid-cols-3 text-center border-t border-gray-100 divide-x divide-gray-100 hover:bg-gray-50 transition-colors">
      <span className="text-gray-800 font-medium p-1 text-[10px]">{label}</span>
      <span className="text-red-500 italic p-1 text-[10px]">{beforeVal || "-"}</span>
      <span className="text-green-600 font-semibold p-1 text-[10px]">{afterVal || "-"}</span>
    </div>
  );
};

const HistoryItem = ({ update, index, formatDateTime, config, formatValue, getProjectTypeName }) => {
  const changes = update.changes?.split(", ") || [];

  return (
    <div className="mb-2 p-1 border border-gray-300 rounded-md bg-white last:mb-0 shadow-sm">
      <div className="text-gray-700 text-[10px] mb-1 pb-1 border-b">
        <span className="font-bold text-gray-900">{update.updated_by}</span> updated at{" "}
        <span className="font-mono text-blue-700">{formatDateTime(update.updated_at)}</span>
      </div>

      {changes.length > 0 ? (
        <div className="text-gray-700 border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 bg-blue-50 font-semibold text-center py-1 text-[10px] text-gray-700 border-b border-blue-200">
            <span>Field</span>
            <span>Before</span>
            <span>After</span>
          </div>
          {changes.map((change, i) => {
            const [rawField, rawValues] = change.split(": ");
            const [before, after] = rawValues?.split(" → ") || ["", ""];
            const field = rawField?.trim();
            if (config.excludedFields.includes(field)) return null;

            let beforeVal = before?.replace(/'/g, "") || "";
            let afterVal = after?.replace(/'/g, "") || "";

            if (field === "project_type_id") {
              beforeVal = getProjectTypeName(beforeVal);
              afterVal = getProjectTypeName(afterVal);
            } else {
              beforeVal = formatValue(field, beforeVal);
              afterVal = formatValue(field, afterVal);
            }

            return (
              <ChangeItem
                key={`${index}-${i}`}
                field={field}
                beforeVal={beforeVal}
                afterVal={afterVal}
                fieldLabels={config.fieldLabels}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-gray-500 text-[10px] italic p-1">No significant changes recorded.</div>
      )}
    </div>
  );
};

/* ------------------------------------------------------
   COMPONENT UTAMA
------------------------------------------------------ */
const InfoProject = ({ project, onClose }) => {
  const config = useMemo(
    () => ({
      primaryBlue: "bg-blue-600",
      textPrimary: "text-blue-600",
      fieldLabels: {
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
        created_at: "Created At",
        created_by: "Created By",
        updated_at: "Updated At",
        updated_by: "Updated By"
      },
      excludedFields: ["actual_start", "actual_end", "task_progress", "status"]
    }),
    []
  );

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return "-";
    return `${d.getDate()} ${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return "-";
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  };

  const formatStringValue = (value) => {
    if (!value) return "-";
    if (typeof value !== "string") return value;
    if (/^[A-Z\s]+$/.test(value)) {
      return value.toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    if (value.includes("_")) {
      return value.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return value;
  };

  const formatValue = (field, value) => {
    if (!value) return "-";
    if (field.includes("date") && field !== "created_at" && field !== "updated_at") return formatDateOnly(value);
    if (["project_type", "level", "status"].includes(field)) return formatStringValue(value);
    return formatStringValue(value);
  };

  const getProjectTypeName = (id) => {
    if (!id || !project.available_types) return id;
    const found = project.available_types.find((t) => String(t.id_project_type) === String(id));
    return found ? found.project_type : id;
  };

  const hasUpdate = project.updated_at && project.updated_at !== project.created_at;
  const hasHistory = project.update_history && project.update_history.length > 0;

  const metaItems = [
    { key: "created_at", value: formatDateTime(project.created_at) },
    { key: "created_by", value: project.created_by || "-" },
    ...(hasUpdate ? [
      { key: "updated_at", value: formatDateTime(project.updated_at) },
      { key: "updated_by", value: project.updated_by || "-" }
    ] : [])
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] max-w-[95%] shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        {/* Header */}
        <div className={`p-3 flex justify-between items-center text-white ${config.primaryBlue} border-b border-blue-700`}>
          <h3 className="text-sm font-bold m-0 tracking-wide flex items-center gap-2">
            <FaInfoCircle className="w-4 h-4" /> PROJECT INFORMATION
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors text-white" aria-label="Close form">
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 text-xs space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b pb-3">
            {metaItems.map((item) => (
              <MetaInfoItem key={item.key} label={item.key} value={item.value} fieldLabels={config.fieldLabels} />
            ))}
          </div>

          {hasHistory && (
            <div>
              <h4 className={`font-bold text-xs mb-2 pb-1 border-b ${config.textPrimary} flex items-center gap-2`}>
                <FaHistory className="w-3 h-3" /> Update History
              </h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 shadow-inner">
                {project.update_history.map((update, idx) => (
                  <HistoryItem
                    key={idx}
                    update={update}
                    index={idx}
                    formatDateTime={formatDateTime}
                    config={config}
                    formatValue={formatValue}
                    getProjectTypeName={getProjectTypeName}
                  />
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
