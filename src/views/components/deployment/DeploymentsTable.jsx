import React from 'react';
import { TableHorizontalScroll } from '../shared/TableHorizontalScroll';

export const DeploymentsTable = ({
  deployments,
  loading,
  undoing,
  onOpenModal,
  onUndo,
}) => {
  return (
    <TableHorizontalScroll style={{ marginTop: 12 }}>
      {loading && deployments.length > 0 && (
        <div className="table-loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

        <table className="deployments-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>MAT</th>
              <th>Staff</th>
              <th>DU</th>
              <th>Project</th>
              <th>Province</th>
              <th>Ops Letter</th>
              <th>Start</th>
              <th>Plan End</th>
              <th>Actual End</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deployments.length === 0 ? (
              <tr>
                <td colSpan="12" className="empty-row">
                  No deployments yet. Click "+ Add Deployment" to create one.
                </td>
              </tr>
            ) : (
              deployments.map((deployment) => (
                <tr
                  key={deployment.id}
                  className={deployment.status === 'active' ? 'row-active' : ''}
                >
                  <td>
                    <strong>{deployment.team?.team_code}</strong>
                  </td>
                  <td>
                    <span className="badge">{deployment.team?.mat}</span>
                  </td>
                  <td>{deployment.team?.staff_count}</td>
                  <td>{deployment.assigned_du?.code}</td>
                  <td>{deployment.project?.code}</td>
                  <td>{deployment.province || '—'}</td>
                  <td>
                    {deployment.ops_letter_ref ? (
                      <span
                        className="ops-letter-pill"
                        title={deployment.ops_letter_ref}
                      >
                        {deployment.ops_letter_ref}
                      </span>
                    ) : (
                      <span className="ops-letter-pill no-letter">No ref</span>
                    )}
                  </td>
                  <td>{deployment.start_deploy}</td>
                  <td>{deployment.plan_end_deploy || '—'}</td>
                  <td>{deployment.end_deploy || '—'}</td>
                  <td>
                    <span className={`status-badge status-${deployment.status}`}>
                      {deployment.status === 'active' && 'Active'}
                      {deployment.status === 'completed' && 'Completed'}
                      {deployment.status === 'cancelled' && 'Cancelled'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {deployment.status === 'active' && (
                        <>
                          <button
                            className="btn-sm btn-transfer"
                            onClick={() => onOpenModal('transfer', deployment)}
                          >
                            Transfer
                          </button>
                          <button
                            className="btn-sm btn-end"
                            onClick={() => onOpenModal('end', deployment)}
                          >
                            End
                          </button>
                          <button
                            className="btn-sm btn-delete"
                            onClick={() => onOpenModal('cancel', deployment)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-sm btn-undo"
                            title="Delete this deployment and restore the team's previous deployment"
                            disabled={undoing}
                            onClick={() => onUndo(deployment)}
                          >
                            {undoing ? '↩ Undoing…' : '↩ Undo'}
                          </button>
                        </>
                      )}
                      <button
                        className="btn-sm"
                        style={{ background: '#805ad5', color: 'white' }}
                        onClick={() => onOpenModal('edit', deployment)}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
    </TableHorizontalScroll>
  );
};
