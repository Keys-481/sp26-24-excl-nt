/**
 * File: frontend/src/components/AdminUserComponents/AddUser.jsx
 * Component to add a new user with role and permission assignments.
 */
import { useEffect, useState } from 'react';
import { useApiClient } from '../../lib/apiClient';

// AddUser component definition
export default function AddUser({
  roles,
  defaultView,
  setdefaultView,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserPhone,
  setNewUserPhone,
  newUserPassword,
  setNewUserPassword,
  handleAddUser,
  setIsAddingUser,
  selectedRoles,
  setSelectedRoles
}) {
  const [allPermissions, setAllPermissions] = useState([]); 
  const [rolePermissionMap, setRolePermissionMap] = useState({});
  const apiClient = useApiClient();

  /**
   * Automatically adds the default view role to the selectedRoles set whenever defaultView changes.
   *
   * @effect
   * @dependency defaultView
   * @sideEffect Updates selectedRoles state to include defaultView.
   */
  useEffect(() => {
    if (defaultView) {
      setSelectedRoles(prev => {
        const updated = new Set(prev);
        updated.add(defaultView);
        return updated;
      });
    }
  }, [defaultView]);

  /**
   * Fetches all available permissions and maps each role to its associated permissions.
   *
   * @effect
   * @dependency roles
   * @sideEffect Updates allPermissions and rolePermissionMap state.
   *
   * @remarks
   * - Requires `/api/users/permissions` and `/api/users/roles/:roleName/permissions` endpoints to be available.
   * - Executes only when roles are populated.
   */
  useEffect(() => {
    const fetchAllPermissions = async () => {
      try {
        const res = await apiClient.get('/users/permissions'); // You must expose this endpoint
        setAllPermissions(res);
      } catch (err) {
        console.error('Failed to fetch all permissions:', err);
        setAllPermissions([]);
      }
    };

    // Fetch permissions for each role and build a mapping
    const fetchRolePermissions = async () => {
      const map = {};
      for (const role of roles) {
        try {
          const res = await apiClient.get(`/users/roles/${role.role_name}/permissions`);
          map[role.role_name] = res;
        } catch (err) {
          console.error(`Failed to fetch permissions for ${role.role_name}:`, err);
          map[role.role_name] = [];
        }
      }
      setRolePermissionMap(map);
    };

    // Only fetch if roles are available
    if (roles.length > 0) {
      fetchAllPermissions();
      fetchRolePermissions();
    }
  }, [roles]);

  /**
   * Toggles a role in the selectedRoles set.
   * Prevents unselecting the defaultView role.
   *
   * @function handleRoleToggle
   * @param {string} roleName - The name of the role to toggle.
   * @sideEffect Updates selectedRoles state.
   */
  const handleRoleToggle = (roleName) => {
    if (roleName === defaultView) return; // prevent unchecking defaultView
    setSelectedRoles(prev => {
      const updated = new Set(prev);
      if (updated.has(roleName)) {
        updated.delete(roleName);
      } else {
        updated.add(roleName);
      }
      return updated;
    });
  };

  /**
   * Validates the user's email and phone number before saving.
   * - Ensures the email ends with `@u.boisestate.edu` or `@boisestate.edu`.
   * - Ensures the phone number is provided and contains at least 10 characters, 
   *   to be acceptable for non US numbers.
   *
   * If validation fails, an alert message is displayed and the save process is aborted.
   * If validation succeeds, `handleAddUser` function is invoked.
   *
   * @returns {void} This function does not return a value.
   */
  const validateAndAddUser = () => {
    // Email validation
    const emailValid = newUserEmail.endsWith('@u.boisestate.edu') || newUserEmail.endsWith('@boisestate.edu');

    if (!emailValid) {
      alert('Email is not valid, valid emails end in @u.boisestate.edu or @boisestate.edu');
      return;
    }

    // Phone validation
    if (!newUserPhone || newUserPhone.length < 10) {
      alert('Phone number should follow the format ###-###-####, but is not constrained to this.');
      return;
    }

    handleAddUser();
  };

  // Render the AddUser component UI
  return (
    <div className="section-results-side">

      {/* Header Row with Add and Cancel Buttons */}
      <div className='h2-row'>
        <h2>Add New User</h2>
        <div className="button-row">
          <button onClick={validateAndAddUser}>Add</button>
          <button onClick={() => setIsAddingUser(false)} style={{ marginLeft: '10px' }}>Cancel</button>
        </div>
      </div>
      {/* Input Fields for User Details */}
      <div className='horizontal-line'></div>
      <div className='textbox-row'>
        <p className='layout'>Name:</p>
        <input
          type="text"
          value={newUserName}
          className='textbox'
          onChange={e => setNewUserName(e.target.value)}
          placeholder="Enter full name"
        />
      </div>
      {/* Email Input Field */}
      <div className='textbox-row'>
        <p className='layout'>Email:</p>
        <input
          type="email"
          value={newUserEmail}
          className='textbox'
          onChange={e => setNewUserEmail(e.target.value)}
          placeholder="Enter email"
        />
      </div>
      {/* Phone Number Input Field */}
      <div className='textbox-row'>
        <p className='layout'>Phone Number:</p>
        <input
          type="tel"
          value={newUserPhone}
          className='textbox'
          onChange={e => setNewUserPhone(e.target.value)}
          placeholder="Enter phone number"
        />
      </div>
      {/* Password Input Field */}
      <div className='textbox-row'>
        <p className='layout'>Password:</p>
        <input
          type="password"
          value={newUserPassword}
          className='textbox'
          onChange={e => setNewUserPassword(e.target.value)}
          placeholder="Enter password"
        />
      </div>
      {/* Default View Selection */}
      <div className='textbox-row'>
        <p className='layout'>Default View:</p>
        <select
          className='textbox'
          value={defaultView}
          onChange={e => setdefaultView(e.target.value)}
        >
          <option value="">Select a default view</option>
          {roles.map(role => (
            <option key={role.role_id} value={role.role_name}>
              {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {/* Role Assignment Toggles and Permission Highlights */}
      <div className="toggle-container">
        <h3>Assign Roles:</h3>
        {roles.map(role => (
          <div key={role.role_id} className="toggle-row">
            <strong>{role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}</strong>
            <label className="switch">
              <input
                type="checkbox"
                checked={selectedRoles.has(role.role_name)}
                disabled={role.role_name === defaultView}
                onChange={() => handleRoleToggle(role.role_name)}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
        <p className="subtext">*Please note that Advisor-Student relationships are assigned when editing current users.</p>
      </div>
      {/* Permissions Highlight Section */}
      <div className="toggle-container">
        <h3>Selected Permissions:</h3>
        <ul>
          {allPermissions.map((perm, index) => {
            const isHighlighted = Array.from(selectedRoles).some(role =>
              (rolePermissionMap[role] || []).includes(perm)
            );
            return (
              <li
                key={index}
                className={isHighlighted ? 'permission-highlighted' : ''}
              >
                {perm.replace(/_/g, ' ')}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
