// File: frontend/src/components/DegreePlanComponents/GraduationStatus.jsx
import React, { useEffect, useState } from "react";
import { useApiClient } from "../../lib/apiClient";
import "../../styles/Styles.css";

/**
 * GraduationStatus
 * Component to view and edit the graduation status of a student.
 */
export default function GraduationStatus({ studentId, student, onUpdate, userRole }) {
  const api = useApiClient();
  const [gradApp, setGradApp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Not Applied");

  // Fetch graduation application for student
  useEffect(() => {
    if (!studentId) {
      setGradApp(null);
      setSelectedStatus("Not Applied");
      return;
    }

    let cancelled = false; // to handle cleanup
    (async () => {
      setLoading(true);
      try {
        const q = ["Not Applied", "Applied", "Under Review", "Approved", "Rejected"].join(","); // all statuses
        const data = await api.get(`/graduation?status=${encodeURIComponent(q)}`); // fetch all applications
        const apps = Array.isArray(data?.students) ? data.students : [];
        const match = apps.find(
          (a) =>
            String(a.school_student_id) === String(studentId) || // match by school_student_id
            String(a.student_id) === String(studentId) // match by student_id
        );
        if (!cancelled) {
          setGradApp(match || null);
          setSelectedStatus(match?.status ?? "Not Applied");
        }
      } catch (err) {
        console.error("GraduationStatus fetch error", err); // log error
        if (!cancelled) setGradApp(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId, api]);

  // Save updated status
  async function saveStatus() {
    // if (!gradApp) {
    //   alert("No graduation application exists for this student."); // alert if no application 
    //   return;
    // }
    setSaving(true);
    try {
      const res = await api.put(`/graduation/${gradApp.application_id}/status`, { // update status
        status: selectedStatus,
      });
      setGradApp(res || { ...gradApp, status: selectedStatus }); // update local state
      setShowModal(false);
      if (typeof onUpdate === "function") onUpdate(res || gradApp);
    } catch (err) {
      console.error("GraduationStatus save error", err); // log error
      alert("Failed to update graduation status");
    } finally {
      setSaving(false);
    }
  }

  const displayName = // construct display name
    student?.first_name || student?.last_name
      ? `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() //
      : "";

  return (
    <div className="gs-inline">
      <strong>Graduation Status:</strong>{" "}
      {loading ? (
        <em>Loading...</em>
      ) : (
        <>
          <span className="gs-status-text">{gradApp?.status ?? "Not Applied"}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus(gradApp?.status ?? "Not Applied");
              setShowModal(true);
            }}
            disabled={!gradApp}
          >
            Edit
          </button>
        </>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="gs-modal-overlay"
        >
          <div className="gs-modal">
            <h4>Change Graduation Status</h4>
            {displayName && (
              <p>
                <strong>Student:</strong> {displayName}
              </p>
            )}

            <div className="gs-status-select">
              <label>
                Status:{" "}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="Not Applied">Not Applied</option>
                  <option value="Applied">Applied</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>
            </div>

            <div className="gs-modal-actions">
              <button onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </button>
              <button onClick={saveStatus} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
