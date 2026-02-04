/**
 * File: frontend/src/components/DegreePlanComponents/reqViewComps/CertificateAlert.jsx
 * Displays a note when a student has completed courses that could count toward a certificate.
 */
import { useState } from 'react';

export default function CertificateAlert({ program, courses }) {
    const [collapsed, setCollapsed] = useState(false);

    // skip if program is a certificate itself
    if (!program || program.program_type === "certificate" || !courses?.length) {
        return null;
    }

    // find completed courses that overlap with certificate programs
    const completedCertificateOverlaps = courses
        .filter(
            (c) =>
                c.course_status === 'Completed' &&
                c.certificate_overlaps &&
                c.certificate_overlaps.length > 0
        )
        .flatMap((c) =>
            c.certificate_overlaps.map((co) => co.certificate_name)
        )
        .filter((v, i, arr) => arr.indexOf(v) === i); // unique values

    // skip rendering if no overlaps found
    if (completedCertificateOverlaps.length === 0) {
        return null;
    }

    return (
        <div className="certificate-alert">
            {/* Certificate Alert Component */}
            <div className="certificate-alert-header">
                <strong>Certificate Opportunity</strong>
                <button className="certificate-alert-toggle" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? 'Show Details' : 'Hide Details'}
                </button>
            </div>
            {!collapsed && (
                <div className="certificate-alert-body">
                    {/* Certificate Alert Body */}
                    <p>
                        You’ve completed one or more courses that apply toward the following
                        certificate{completedCertificateOverlaps.length > 1 ? "s" : ""}:
                    </p>
                    <ul>
                        {completedCertificateOverlaps.map((cert) => (
                            <li key={cert}>{cert}</li>
                        ))}
                    </ul>
                    <p>
                        You may be eligible to apply for these certificate
                        {completedCertificateOverlaps.length > 1 ? "s" : ""}. Please check with your advisor.
                    </p>
                </div>
            )}
        </div>
    )

}