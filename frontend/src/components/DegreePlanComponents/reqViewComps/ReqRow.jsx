/**
 * File: frontend/src/components/DegreePlanComponents/reqViewComps/ReqRow.jsx
 * Component to display a single requirement row within the requirements view of the degree plan.
 */

export default function ReqRow({ req, level, program }) {
    const completedReqCredits = req.completedCredits || 0;
    const requiredReqCredits = req.required_credits || 0;
    const rowStyle = { "--level": level };

    // Render the requirement row with description and credits
    return (
        <tr
            key={`req=${req.requirement_id}`}
            className={`req-row req-level-${level}`}
            style={rowStyle}
        >
            <td
                colSpan={program.program_type !== 'certificate' ? 9 : 8}
                className="requirement-header-cell"
            >
                <div className="requirement-header-content">
                    {/* Requirement Description and Credits */}
                    <strong>{req.req_description}</strong>
                    {requiredReqCredits > 0 && (
                        <span style={{ marginLeft: '20px' }}>
                            {completedReqCredits} / {requiredReqCredits}
                        </span>
                    )}
                </div>
            </td>
        </tr>
    )
}