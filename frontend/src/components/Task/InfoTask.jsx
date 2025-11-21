import React from "react";
import { FaTimes, FaInfoCircle, FaHistory } from "react-icons/fa";

const InfoTask = ({ task, onClose }) => {
  // Warna dan styling konsisten dengan InfoProject
  const primaryBlue = "bg-blue-600";
  const textPrimary = "text-blue-600";

  // Logika: Format Tanggal dan Waktu (Tetap)
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

  // Logika: Label Field (Diubah: Status dihapus)
  const fieldLabels = {
    SAP: "Assigned",
    task_group: "Task Group",
    task_detail: "Task Detail",
    plan_start_date: "Plan Start",
    plan_end_date: "Plan End",
    actual_start: "Actual Start", // Label tetap
    actual_end: "Actual End", // Label tetap
    platform: "Platform",
    task_progress: "Progress (%)",
    // status: "Status", // <--- DIHILANGKAN
  };

  // Logika: Format Nilai Field (Diubah: Format tanggal untuk actual_start/end sama dengan plan, status dihapus)
  const formatValue = (field, value) => {
    if (!value) return "-";

    // Semua field date, termasuk actual_start dan actual_end, menggunakan format tanggal pendek
    if (field.includes("date") || field === "actual_start" || field === "actual_end") {
      const d = new Date(value);
      if (isNaN(d)) return value;
      return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
    }

    // if (["status"].includes(field)) { // <--- DIHAPUS
    //   return value
    //     .toLowerCase()
    //     .split("_")
    //     .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    //     .join(" ");
    // }

    return value;
  };

  // Logika: Cek Update & History (Tetap)
  const hasUpdate = task.updated_at && task.updated_at !== task.created_at;
  const hasHistory = task.update_history && task.update_history.length > 0;

    
  // Untuk compatibility dengan history yang mungkin tidak punya data user/role lengkap di log perubahan lama
  const formatAssignedHistory = (assignedValue) => {
      // Logic untuk history di sini diabaikan karena logic di bawah sudah menangani kasus 'SAP'
      return assignedValue;
  }

  return (
    // Backdrop blur & styling modal container
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      {/* Modal box styling (rounded-xl, shadow-2xl) */}
      <div className="bg-white rounded-xl w-[700px] max-w-[95%] shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        
        {/* Header - Ukuran tetap agar judul utama terlihat jelas */}
        <div
          className={`p-3 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}
        >
          <h3 className="text-sm font-bold m-0 tracking-wide flex items-center gap-2">
            <FaInfoCircle className="w-4 h-4" /> TASK INFORMATION
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close form"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Body - Padding p-4 dan **ukuran text default diubah menjadi text-xs** */}
        <div className="p-4 text-xs space-y-4">

          {/* Section: Task Overview */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 shadow-inner">
            {/* Judul Section diubah ke text-xs */}
            <h4 className={`font-bold text-xs mb-2 pb-1 border-b ${textPrimary} flex items-center gap-2`}>
                Task Detail
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Task Detail Utama */}
              <div className="flex flex-col gap-0.5">
                {/* Nilai diubah ke text-xs */}
                <span className="text-gray-800 text-xs font-medium whitespace-pre-wrap">{task.task_detail || "-"}</span>
              </div>

            
            
              
       
              
            </div>
          </div>

          {/* Section: Metadata (Tidak berubah) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b pb-3">
            {/* Created At & Created By */}
            <div className="flex flex-col gap-0.5">
              {/* Label diubah ke text-[10px] */}
              <label className="font-semibold text-[10px] text-gray-500 uppercase">Created At</label>
              {/* Nilai diubah ke text-[10px] */}
              <span className="text-gray-800 text-[10px] font-mono">{formatDateTime(task.created_at)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {/* Label diubah ke text-[10px] */}
              <label className="font-semibold text-[10px] text-gray-500 uppercase">Created By</label>
              {/* Nilai diubah ke text-[10px] */}
              <span className="text-gray-800 text-[10px]">{task.created_by || "-"}</span>
            </div>

            {/* Updated At & Updated By */}
            {hasUpdate && (
              <>
                <div className="flex flex-col gap-0.5">
                  {/* Label diubah ke text-[10px] */}
                  <label className="font-semibold text-[10px] text-gray-500 uppercase">Updated At</label>
                  {/* Nilai diubah ke text-[10px] */}
                  <span className="text-gray-800 text-[10px] font-mono">{formatDateTime(task.updated_at)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {/* Label diubah ke text-[10px] */}
                  <label className="font-semibold text-[10px] text-gray-500 uppercase">Updated By</label>
                  {/* Nilai diubah ke text-[10px] */}
                  <span className="text-gray-800 text-[10px]">{task.updated_by || "-"}</span>
                </div>
              </>
            )}
          </div>

          {/* Section: Update History (Logika format actual_start/end dan status diubah) */}
          {hasHistory && (
            <div>
              {/* Judul History diubah ke text-xs */}
              <h4 className={`font-bold text-xs mb-2 pb-1 border-b ${textPrimary} flex items-center gap-2`}>
                <FaHistory className="w-3 h-3" /> Update History
              </h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 shadow-inner">
                {task.update_history.map((u, idx) => (
                  <div key={idx} className="mb-2 p-1 border border-gray-300 rounded-md bg-white last:mb-0 shadow-sm">
                    {/* Waktu Update diubah ke text-[10px] */}
                    <div className="text-gray-700 text-[10px] mb-1 pb-1 border-b">
                      <span className="font-bold text-gray-900">{u.updated_by}</span> updated at{" "}
                      <span className="font-mono text-blue-700">{formatDateTime(u.updated_at)}</span>
                    </div>

                    {u.changes ? (
                      <div className="text-gray-700 border border-gray-200 rounded-lg overflow-hidden">
                        {/* Header Tabel diubah ke text-[10px] */}
                        <div className="grid grid-cols-3 bg-blue-50 font-semibold text-center py-1 text-[10px] text-gray-700 border-b border-blue-200">
                          <span>Field</span>
                          <span>Before</span>
                          <span>After</span>
                        </div>

                        {u.changes.split(", ").map((change, i) => {
                          const [rawField, rawValues] = change.split(": ");
                          const [before, after] = rawValues?.split(" → ") || ["", ""];

                          const field = rawField?.trim();
                          
                          // Hapus log perubahan Status
                          if (field === "status") return null;

                          const label = fieldLabels[field] || field;

                          let beforeVal = formatValue(field, before.replace(/'/g, ""));
                          let afterVal = formatValue(field, after.replace(/'/g, ""));

                          // Format Assigned di History (Disimpan sebagai field 'SAP' di controller)
                          if (field === "SAP" || field === "Assigned") { // Tambahkan field Engineer untuk kompatibilitas log lama
                            beforeVal = formatAssignedHistory(before.replace(/'/g, ""));
                            afterVal = formatAssignedHistory(after.replace(/'/g, ""));
                          }

                          return (
                            <div
                              key={i}
                              className="grid grid-cols-3 text-center border-t border-gray-100 divide-x divide-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              {/* Nilai Tabel diubah ke text-[10px] */}
                              <span className="text-gray-800 font-medium p-1 text-[10px]">{label}</span>
                              <span className="text-red-500 italic p-1 text-[10px]">{beforeVal || "-"}</span>
                              <span className="text-green-600 font-semibold p-1 text-[10px]">{afterVal || "-"}</span>
                            </div>
                          );
                        }).filter(Boolean)} {/* Filter untuk menghilangkan 'status' */}
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