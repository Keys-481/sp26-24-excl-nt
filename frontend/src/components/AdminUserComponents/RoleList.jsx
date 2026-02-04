/**
 * file: frontend/src/components/AdminUserComponents/RoleList.jsx
 * description: Component to display a list of user roles and their associated users in the admin panel.
 */
import { useState } from 'react';

// Component to display a list of user roles and their associated users
export default function RoleList({
    roles,
    allUsers,
    setIsAddingUser,
    setSelectedUser
}) {
    // State to manage collapsed roles
    const [collapsedRoles, setCollapsedRoles] = useState({});

    const toggleCollapse = (role) => {
        setCollapsedRoles(prev => ({
            ...prev,
            [role]: !prev[role]
        }));
    };

    // Render the role list with users
    return (
        <div className="section-results-side">
            <div className='header-row'>
                <button onClick={() => {
                    setSelectedUser(null);
                    setIsAddingUser(true);
                }}> + Add User</button>
            </div>
            {roles.length === 0 ? (
                <p>Loading roles...</p>
            ) : (
                roles.map(role => {
                    const roleName = role.role_name;
                    const usersInRole = allUsers.filter(user =>
                        user.roles.some(r => r.toLowerCase() === roleName.toLowerCase())
                    );
                    const isCollapsed = collapsedRoles[roleName];

                    return (
                        <div key={role.role_id} style={{ marginBottom: '20px' }}>
                            <div
                                className='h2-row'
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleCollapse(roleName)}
                            >
                                <h2>{roleName.charAt(0).toUpperCase() + roleName.slice(1)} {isCollapsed ? '▾' : '▴'}</h2>
                            </div>
                            {!isCollapsed && (
                                <table className="semester-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Public ID</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersInRole.map((user, idx) => (
                                            <tr key={idx}>
                                                <td>{user.name}</td>
                                                <td>{user.public}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
