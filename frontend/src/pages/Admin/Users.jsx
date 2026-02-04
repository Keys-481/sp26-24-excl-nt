/**
 * AdminUsers Component
 *
 * file: frontend/src/pages/Admin/Users.jsx
 * This component provides an administrative interface for managing users and their roles.
 * It allows administrators to:
 * - View all users grouped by roles
 * - Search for users by name or privilege type
 * - Add new users with selected roles
 * - Edit roles for existing users
 * - Delete users
 */
import { useEffect, useState } from 'react';
import { useApiClient } from '../../lib/apiClient';
import AddUser from '../../components/AdminUserComponents/AddUser';
import EditUser from '../../components/AdminUserComponents/EditUser';
import RoleList from '../../components/AdminUserComponents/RoleList';
import AdminNavBar from '../../components/NavBars/AdminNavBar';
import SearchBar from '../../components/SearchBar';

// Main AdminUsers component
export default function AdminUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleToggles, setRoleToggles] = useState({});
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [defaultView, setdefaultView] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissionMap, setRolePermissionMap] = useState({});
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [manualStudents, setManualStudents] = useState([]);
  const [assignedAdvisors, setAssignedAdvisors] = useState([]);
  const [studentPrograms, setStudentPrograms] = useState([]);
  const [programsList, setProgramsList] = useState([]);

  const apiClient = useApiClient();

  const searchEndpoint = '/users/search';

  /**
   * Fetches all users and roles from the backend on component mount.
   * Initializes role toggle states.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([
          apiClient.get('/users/all'),
          apiClient.get('/users/roles')
        ]);

        // Set fetched data to state
        setAllUsers(usersData);
        setRoles(rolesData);

        // Initialize toggle state for each role
        const initialToggles = {};
        rolesData.forEach(role => {
          initialToggles[role] = false;
        });
        setRoleToggles(initialToggles);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, []);

  /**
   * Fetches roles for the selected user and updates toggle states accordingly.
   */
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (selectedUser) {
        try {
          const res = await apiClient.get(`/users/${selectedUser.id}/roles`);
          const userRoles = res;

          const toggles = {};
          roles.forEach(role => {
            const normalizedRole = role.role_name.toLowerCase();
            const hasRole = userRoles.some(r => r.toLowerCase() === normalizedRole);
            toggles[role.role_name] = hasRole;
          });
          setRoleToggles(toggles);
        } catch (err) {
          console.error('Failed to fetch user roles:', err);
        }
      }
    };

    fetchUserRoles();
  }, [selectedUser, roles]);

  /**
   * Fetches basic details for the selected user.
   * Populates edit fields when a user is selected.
   */
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (selectedUser) {
        const res = await apiClient.get(`/users/${selectedUser.id}`);
        const data = res;
        setEditName(data.name);
        setEditEmail(data.email);
        setEditPhone(data.phone_number);
        setdefaultView(data.default_view);
      }
    };
    fetchUserDetails();
  }, [selectedUser]);

  /**
   * Fetches all permissions and maps role permissions.
   * Updates state when roles change.
   */
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const permsRes = await apiClient.get('/users/permissions');
        const perms = permsRes;
        setAllPermissions(perms);
      } catch (err) {
        console.error('Failed to fetch all permissions:', err);
      }

      const map = {};
      for (const role of roles) {
        try {
          const res = await apiClient.get(`/users/roles/${role.role_name}/permissions`);
          const perms = res;
          map[role.role_name] = perms;
        } catch (err) {
          console.error(`Failed to fetch permissions for ${role.role_name}:`, err);
          map[role.role_name] = [];
        }
      }
      setRolePermissionMap(map);
    };

    if (roles.length > 0) {
      fetchPermissions();
    }
  }, [roles]);

  /**
   * Fetches advising relationships for the selected user.
   * Updates assigned students and advisors.
   */
  useEffect(() => {
    const fetchAdvising = async () => {
      if (selectedUser) {
        const res = await apiClient.get(`/users/${selectedUser.id}/advising`);
        const data = res;

        // Preserve manual additions
        const existingIds = new Set(data.students.map(s => s.user_id));
        const preservedManuals = manualStudents.filter(s => !existingIds.has(s.user_id));

        setAssignedStudents([...data.students, ...preservedManuals]);
        setAssignedAdvisors(data.advisors || []);
      }
    };
    fetchAdvising();
  }, [selectedUser]);

  /**
   * Fetches all programs for one student
   */
    useEffect(() => {
      if (selectedUser) {
        apiClient.get(`/students/${selectedUser.public}/programs`)
          .then((data) => {
            setStudentPrograms(data.programs);
          })
          .catch((err) => {
            console.error('Failed to fetch student programs:', err);
          });
      }
  }, [selectedUser]);

  /**
   * Fetches all available programs
   */
  useEffect(() => {
    const fetchAllPrograms = async () => {
      try {
        const data = await apiClient.get('/programs');
        setProgramsList(data);
      } catch (err) {
        console.error('Failed to fetch all programs:', err);
      }
    };
    fetchAllPrograms();
  }, []);

  /**
   * Refreshes user and role data from the backend.
   * Resets role toggles.
   */
  const refreshData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get('/users/all'),
        apiClient.get('/users/roles')
      ]);

      const usersData = usersRes;
      const rolesData = rolesRes;

      setAllUsers(usersData);
      setRoles(rolesData);

      const initialToggles = {};
      rolesData.forEach(role => {
        initialToggles[role] = false;
      });
      setRoleToggles(initialToggles);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  };

  /**
   * Handles adding a new user with selected roles.
   * Sends a POST request to the backend and updates state.
   */
  const handleAddUser = async () => {
    const allRoles = Array.from(selectedRoles);

    try {
      const newUser = await apiClient.post('/users', {
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone,
          password: newUserPassword,
          default_view: defaultView,
          roles: allRoles
      });

        alert('User added successfully');
        setIsAddingUser(false);
        setNewUserName('');
        setdefaultView('');
        setAllUsers(prev => [...prev, { id: newUser.userId, name: newUser.name, roles: allRoles }]);
        await refreshData();

    } catch (err) {
      console.error('Add user error:', err);
      alert('Error adding user');
    }
  };

  /**
   * Handles saving updated roles for the selected user.
   * Sends a PUT request to the backend.
   */
  const handleSave = async ({ programsToAdd = [], programsToRemove = [] }) => {
    if (!selectedUser) return;

    const updatedRoles = Object.entries(roleToggles)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([role]) => role);

    try {
      // 1. Update user details
      const userRes = await apiClient.put(`/users/${selectedUser.id}`, {
          name: editName,
          email: editEmail,
          phone: editPhone,
          password: editPassword,
          default_view: defaultView
      });

      // 2. Update roles
      const rolesRes = await apiClient.put(`/users/${selectedUser.id}/roles`, {
        roles: updatedRoles
      });

      // 3. Update advising relationships
      const allStudentAssignments = [...assignedStudents, ...manualStudents];

      await apiClient.post(`/users/${selectedUser.id}/advising`, {
          advisorIds: assignedAdvisors.map(a => a.user_id),
          studentIds: allStudentAssignments.map(s => s.user_id)
      });

      // 4. Update student programs
      for (const program of programsToAdd) {
        await apiClient.patch(`/students/${selectedUser.public}/programs`, {
          programId: program.program_id
        });
      }
      
      for (const program of programsToRemove) {
        await apiClient.del(`/students/${selectedUser.public}/programs`, {
          programId: program.program_id
        });
      }

      alert('User updated successfully');
      setSearchResults([]);
      setSelectedUser(null);
      await refreshData();

    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving user');
    }
    setManualStudents([]);
  };

  /**
   * Handles deleting the selected user.
   * Sends a DELETE request to the backend.
   */
  const handleDelete = async () => {
    if (!selectedUser) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedUser.name}?`)) return;

    try {
      const res = await apiClient.del(`/users/${selectedUser.id}`);

      alert('User deleted');
      setSelectedUser(null);
      setSearchResults(prev => prev.filter(u => u.id !== selectedUser.id));
      setAllUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      await refreshData();
      
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting user');
    }
  };

  /**
   * Callback for handling search results from the SearchBar component.
   * @param {Array} results - Array of user objects returned from the search.
   */
  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  /**
   * Toggles the state of a role checkbox.
   * @param {string} role - The role to toggle.
   */
  const handleToggle = (role) => {
    setRoleToggles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  return (
    <div>
      {/* Main AdminUsers component */}
      <AdminNavBar />
      <div className='window'>
        <div className='title-bar'>
          <h1>Users</h1>
        </div>
        <div className='container'>
          <div className='side-panel'>
            <SearchBar onSearch={handleSearchResults} searchEndpoint={searchEndpoint} placeholder1="Privilege Type" placeholder2="Name" />
            <div className="horizontal-line-half"></div>
            <div className="side-panel-results">
              <div>
                {searchResults.length === 0 ? (
                  <p>No results found</p>
                ) : (
                  <ul className='results-list'>
                    {searchResults.map((item, index) => (
                      <li
                        key={index}
                        className={`result-item ${selectedUser?.id === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedUser(prev => (prev?.id === item.id ? null : item))}
                        style={{ cursor: 'pointer' }}
                      >
                        <strong>{item.name}</strong> <br />
                        {`PID: ${item.public}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Section for editing or adding users */}
          <div className='section-results'>
            {selectedUser ? (
              <EditUser
                roles={roles}
                roleToggles={roleToggles}
                setRoleToggles={setRoleToggles}
                handleToggle={handleToggle}
                handleSave={handleSave}
                handleDelete={handleDelete}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                defaultView={defaultView}
                setdefaultView={setdefaultView}
                editName={editName}
                setEditName={setEditName}
                editEmail={editEmail}
                setEditEmail={setEditEmail}
                editPhone={editPhone}
                setEditPhone={setEditPhone}
                editPassword={editPassword}
                setEditPassword={setEditPassword}
                allPermissions={allPermissions}
                rolePermissionMap={rolePermissionMap}
                assignedStudents={assignedStudents}
                setAssignedStudents={setAssignedStudents}
                manualStudents={manualStudents}
                setManualStudents={setManualStudents}
                assignedAdvisors={assignedAdvisors}
                setAssignedAdvisors={setAssignedAdvisors}
                studentPrograms={studentPrograms}
                programsList={programsList}
              />
            ) : isAddingUser ? (
              <AddUser
                roles={roles}
                defaultView={defaultView}
                setdefaultView={setdefaultView}
                newUserName={newUserName}
                setNewUserName={setNewUserName}
                newUserEmail={newUserEmail}
                setNewUserEmail={setNewUserEmail}
                newUserPhone={newUserPhone}
                setNewUserPhone={setNewUserPhone}
                newUserPassword={newUserPassword}
                setNewUserPassword={setNewUserPassword}
                handleAddUser={handleAddUser}
                setIsAddingUser={setIsAddingUser}
                selectedRoles={selectedRoles}
                setSelectedRoles={setSelectedRoles}
              />
            ) : (
              <RoleList
                roles={roles}
                allUsers={allUsers}
                setIsAddingUser={setIsAddingUser}
                setSelectedUser={setSelectedUser}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
