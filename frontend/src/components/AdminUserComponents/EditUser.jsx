/**
 * file: frontend/src/components/AdminUserComponents/EditUser.jsx
 * description: Component for editing user details in the admin panel.
 */
import { useEffect, useState } from 'react';
import { useApiClient } from '../../lib/apiClient';

// EditUser component allows admin to edit user details, roles, permissions, and assignments.
export default function EditUser({
  roles,
  roleToggles,
  handleToggle,
  setRoleToggles,
  handleSave,
  handleDelete,
  selectedUser,
  setSelectedUser,
  defaultView,
  setdefaultView,
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  editPhone,
  setEditPhone,
  editPassword,
  setEditPassword,
  allPermissions,
  rolePermissionMap,
  assignedStudents,
  setAssignedStudents,
  manualStudents,
  setManualStudents,
  assignedAdvisors,
  setAssignedAdvisors,
  studentPrograms,
  programsList,
}) {
  // Normalize default view for comparison
  const normalizedDefaultView = defaultView?.toLowerCase() || '';
  const [newStudentId, setNewStudentId] = useState('');
  const [newProgramId, setNewProgramId] = useState('');
  const [currentPrograms, setCurrentPrograms] = useState(studentPrograms || []);
  const apiClient = useApiClient();

  /**
   * Updates the current programs state when studentPrograms prop changes.
   */
  useEffect(() => {
    setCurrentPrograms(studentPrograms || []);
  }, [studentPrograms]);

  /**
   * Fetches a user's basic public information using their public ID.
   *
   * @async
   * @function fetchUserById
   * @param {string} id - The public ID of the user to fetch.
   * @returns {Promise<Object|null>} An object with `user_id` and `name`, or `null` if not found.
   */
  const fetchUserById = async (id) => {
    try {
      const res = await apiClient.get(`/users/public/${id}`);
      return { user_id: id, name: res.name };
    } catch (err) {
      console.error('Failed to fetch user:', err);
      return null;
    }
  };

  /**
   * Adds a student to the manual assignment list by public ID.
   *
   * @async
   * @function handleAddStudent
   * @effect Validates the ID, checks for duplicates, fetches user data, and updates `manualStudents`.
   *         Displays an alert if the student is invalid or already assigned.
   */
  const handleAddStudent = async () => {
    const id = newStudentId.trim().padStart(9, '0');
    const alreadyAssigned = assignedStudents.some(s => s.user_id === id);
    const alreadyManual = manualStudents.some(s => s.user_id === id);

    if (!id || alreadyAssigned || alreadyManual) return;

    const user = await fetchUserById(id);
    if (user) {
      setManualStudents(prev => [...prev, user]);
      setNewStudentId('');
    } else {
      alert(`User ID ${id} is not valid or does not exist.`);
    }
  };


  /**
   * Updates the student's enrolled programs by adding a new program.
   * @param {*} newProgramId - The ID of the program to add.
   */
  const handleAddProgram  = (programId) => {
    // Find the program in the available programs list
    const program = programsList.find(p => p.program_id === Number(programId));
    if (program) {
      const alreadyAdded = currentPrograms.some(p => p.program_id === program.program_id);
      if (alreadyAdded) {
        alert('Student is already enrolled in this program.');
        return;
      }

      setCurrentPrograms(prev => [...prev, program]);
    }
  }

  /**
   * Removes a program from the student's list of enrolled programs.
   * @param {*} programId - The ID of the program to remove.
   */
  const handleRemoveProgram = (programId) => {
    setCurrentPrograms(prev => prev.filter(p => p.program_id !== programId));
  };

  /**
   * Validates the user's email and phone number before saving.
   * - Ensures the email ends with `@u.boisestate.edu` or `@boisestate.edu`.
   * - Ensures the phone number is provided and contains at least 10 characters, 
   *   to be acceptable for non US numbers.
   *
   * If validation fails, an alert message is displayed and the save process is aborted.
   * If validation succeeds, `handleSave` function is invoked.
   *
   * @returns {void} This function does not return a value.
   */
  const validateAndSaveUser = () => {
    // Email validation
    const emailValid =
      editEmail.endsWith('@u.boisestate.edu') ||
      editEmail.endsWith('@boisestate.edu');

      // If email is not valid, show an alert and stop the save process
    if (!emailValid) {
      alert('Email is not valid. Valid emails must end in @u.boisestate.edu or @boisestate.edu');
      return;
    }

    // Phone validation
    if (!editPhone || editPhone.length < 10) {
      alert('Phone number should follow the format ###-###-####, but is not constrained to this.');
      return;
    }

    // Determine programs to add and remove
    const originalPrograms = studentPrograms;
    const updatedPrograms = currentPrograms;

    // Programs to add
    const programsToAdd = updatedPrograms.filter(
      p => !originalPrograms.some(op => op.program_id === p.program_id)
    );

    const programsToRemove = originalPrograms.filter(
      p => !updatedPrograms.some(up => up.program_id === p.program_id)
    );

    handleSave({ programsToAdd, programsToRemove });
  };

  /**
   * Cancels editing and resets manual student assignments.
   *
   * @function handleCancel
   * @effect Clears the selected user and resets `manualStudents`.
   */
  const handleCancel = () => {
    setSelectedUser(null);
    setManualStudents([]);
    setCurrentPrograms(studentPrograms || []);
  };

  /**
   * Ensures the default view role is toggled on when selected.
   *
   * @dependency {string} defaultView - The selected default view role name.
   * @effect Updates `roleToggles` to enable the default view role.
   */
  useEffect(() => {
    if (defaultView) {
      setRoleToggles(prev => ({
        ...prev,
        [defaultView]: true
      }));
    }
  }, [defaultView]);

  // Render the EditUser component UI
  return (
    <div className='section-results-side'>
      {/* Header with action buttons */}
      <div className='h2-row'>
        <h2>Edit User</h2>
        <div className="button-row">
          <button onClick={validateAndSaveUser}>Save</button>
          <button onClick={handleCancel} style={{ marginLeft: '10px' }}>Cancel</button>
          <button onClick={handleDelete} className='error-message'>Delete</button>
        </div>
      </div>
      <div className='horizontal-line'></div>
      {/* Basic Info */}
      <div className='textbox-row'>
        <p className='layout'>Name:</p>
        <input type="text" value={editName} className='textbox' onChange={e => setEditName(e.target.value)} placeholder="Full name" />
      </div>
      {/* Email */}
      <div className='textbox-row'>
        <p className='layout'>Email:</p>
        <input type="email" value={editEmail} className='textbox' onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
      </div>
      {/* Phone */}
      <div className='textbox-row'>
        <p className='layout'>Phone:</p>
        <input type="tel" value={editPhone} className='textbox' onChange={e => setEditPhone(e.target.value)} placeholder="Phone" />
      </div>
      {/* Password */}
      <div className='textbox-row'>
        <p className='layout'>Password:</p>
        <input type="password" value={editPassword} className='textbox' onChange={e => setEditPassword(e.target.value)} placeholder="New password (optional)" />
      </div>
      {/* Default View */}
      <div className='textbox-row'>
        <p className='layout'>Default View:</p>
        <select value={defaultView} className='textbox' onChange={e => setdefaultView(e.target.value)}>
          <option value="">Select default view</option>
          {roles.map(role => (
            <option key={role.role_id} value={role.role_name}>
              {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Advisor View */}
      {(roleToggles['Advisor'] || normalizedDefaultView === 'advisor') && (
        <div className="toggle-container">
          <h3>Assigned Students:</h3>
          <ul>
            {[...assignedStudents, ...manualStudents].map(student => (
              <li key={student.user_id}>
                {student.name}
                <button onClick={() => {
                  setAssignedStudents(prev => prev.filter(s => s.user_id !== student.user_id));
                  setManualStudents(prev => prev.filter(s => s.user_id !== student.user_id));
                }}>Remove</button>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newStudentId}
              onChange={e => setNewStudentId(e.target.value)}
              placeholder="Enter student ID"
              className="textbox"
            />
            <button onClick={handleAddStudent}>Add</button>
          </div>
        </div>
      )}

      {/* Student View */}
      {(roleToggles['Student'] || normalizedDefaultView === 'student') && (
        <div className="toggle-container">
          <h3>Programs:</h3>
          {/* Dropdown list of all programs to add */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select
              className="programs-dropdown"
              value={newProgramId}
              onChange={e => setNewProgramId(e.target.value)}
            >
              <option value="">Select a program to add</option>
              {programsList.map(program => (
                  <option key={program.program_id} value={program.program_id}>
                    {program.program_name}
                  </option>
                ))}
            </select>
            <button
              onClick={() => handleAddProgram(newProgramId)}
            >
              Add
            </button>
          </div>
          <ul>
            {/* Show all programs the student is enrolled in, and allow removing programs for the student */}
            {currentPrograms.length > 0 ? (
              currentPrograms.map(program => (
                <li key={program.program_id}>
                  {program.program_name}
                  <button onClick={() => handleRemoveProgram(program.program_id)}>
                    Remove
                  </button>
                </li>
              ))
            ) : (
              <li>Student is not enrolled in any programs.</li>
            )}
          </ul>

          <h3>Assigned Advisors:</h3>
          <ul>
            {/* Show all advisors assigned to the student, and allow removing advisors */}
            {assignedAdvisors.map(advisor => (
              <li key={advisor.user_id}>
                {advisor.name}
                <button onClick={() =>
                  setAssignedAdvisors(prev => prev.filter(a => a.user_id !== advisor.user_id))
                }>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {/* Input to add a new advisor by ID */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newStudentId}
              onChange={e => setNewStudentId(e.target.value)}
              placeholder="Enter advisor ID"
              className="textbox"
            />
            <button
              // Adds an advisor to the assigned advisor list by public ID.
              onClick={async () => {
                const publicId = newStudentId.trim();
                if (!publicId) return;

                try {
                  const data = await apiClient.get(`/users/public/${publicId}`);
                  const alreadyAssigned = assignedAdvisors.some(a => a.user_id === data.user_id);
                  if (alreadyAssigned) return;

                  setAssignedAdvisors(prev => [...prev, { user_id: data.user_id, name: data.name }]);
                  setNewStudentId('');
                } catch (err) {
                  alert(`Error fetching advisor with ID ${publicId}.`);
                  console.error('Advisor lookup failed:', err);
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Roles */}
      <div className="toggle-container">
        <h3>Assigned Roles:</h3>
        {roles.map((role, index) => (
          <div key={index} className="toggle-row">
            <h3>{role.role_name}</h3>
            <label className="switch">
              <input
                type="checkbox"
                id={`toggle-${index}`}
                checked={roleToggles[role.role_name] || false}
                onChange={() => handleToggle(role.role_name)}
                disabled={role.role_name.toLowerCase() === normalizedDefaultView}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>

      {/* Permissions */}
      <div className="toggle-container">
        <h3>Selected Permissions:</h3>
        <ul>
          {allPermissions.map((perm, index) => {
            const isHighlighted = Object.entries(roleToggles).some(
              ([roleName, isEnabled]) =>
                isEnabled && (rolePermissionMap[roleName] || []).includes(perm)
            );
            return (
              <li key={index} className={isHighlighted ? 'permission-highlighted' : ''}>
                {perm.replace(/_/g, ' ')}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
