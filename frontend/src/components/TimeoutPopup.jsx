/**  File: frontend/src/components/TimeoutPopup.jsx
 *  Component to display a popup to inform a user they are about to be timed out
 */

import React, { useEffect, useRef } from "react";

// TimeoutPopup component displays a popup warning the user they are about to be timed out due to inactivity.
export default function TimeoutPopup({ visible, secondsLeft, onStay }) {
    const stayButtonRef = useRef(null);

    useEffect(() => {
        if (visible && stayButtonRef.current) stayButtonRef.current.focus();
    }, [visible]);

    if (!visible) return null;

    // Render the timeout popup
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeout-title"
            className="popup-wrapper"
        >
            <div
                className="popup-box"
            >
                <h2 id="session-timeout-title">Still there?</h2>
                <p className="popup-text">
                    You'll be signed out in <b>{secondsLeft}</b> seconds due to inactivity.
                </p>
                <div className="popup-buttom">
                    <button ref={stayButtonRef} onClick={onStay}>Stay Signed In</button>
                </div>
            </div>
        </div>
    );
}