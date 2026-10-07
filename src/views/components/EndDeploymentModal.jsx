import React, { useState, useEffect } from 'react';

export const EndDeploymentModal = ({
  isOpen,
  onClose,
  deployment,
  onEnd,
  saving = false,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [endDate, setEndDate] = useState(today);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && deployment) {
      setEndDate(today);
      setRemarks('');
      setError(null);
    }
  }, [isOpen, deployment, today]);

  if (!isOpen || !deployment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!endDate) {
      setError('End date is required');
      return;
    }

    if (endDate < deployment.start_deploy) {
      setError('End date must be on or after start date');
      return;
    }

    const result = await onEnd(deployment.id, endDate, remarks.trim() || null);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>End Deployment</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="current-info">
            <p><strong>Team:</strong> {deployment.team?.team_code}</p>
            <p><strong>Project:</strong> {deployment.project?.code}</p>
            <p><strong>DU:</strong> {deployment.assigned_du?.code}</p>
            <p><strong>Started:</strong> {deployment.start_deploy}</p>
            {deployment.plan_end_deploy && (
              <p><strong>Planned End:</strong> {deployment.plan_end_deploy}</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  min={deployment.start_deploy}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  placeholder="Optional notes about the ending"
                />
              </div>
            </div>

            <div style={{
              padding: 12,
              background: '#fffaf0',
              borderRadius: 8,
              borderLeft: '4px solid #ed8936',
              marginTop: 16,
              fontSize: 13,
              color: '#7b341e',
            }}>
              Ending marks this deployment as <strong>completed</strong>.
              The team will be idle until a new deployment is created.
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Ending...' : 'End Deployment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};