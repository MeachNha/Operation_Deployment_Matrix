import React, { useState, useEffect } from 'react';

export const CancelDeploymentModal = ({
  isOpen,
  onClose,
  deployment,
  onCancel,
  saving = false,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [cancelDate, setCancelDate] = useState(today);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCancelDate(today);
      setReason('');
      setError(null);
    }
  }, [isOpen, today]);

  if (!isOpen || !deployment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    if (cancelDate < deployment.start_deploy) {
      setError('Cancel date must be on or after start date');
      return;
    }

    const result = await onCancel(deployment.id, cancelDate, reason.trim());

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
          <h2>Cancel Deployment</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="current-info">
            <p><strong>Team:</strong> {deployment.team?.team_code}</p>
            <p><strong>Project:</strong> {deployment.project?.code}</p>
            <p><strong>Started:</strong> {deployment.start_deploy}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Cancel Date *</label>
                <input
                  type="date"
                  value={cancelDate}
                  min={deployment.start_deploy}
                  onChange={(e) => setCancelDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Reason for Cancellation *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g., Security incident, funding withdrawn, weather emergency..."
                  required
                />
              </div>
            </div>

            <div style={{
              padding: 12,
              background: '#fff5f5',
              borderRadius: 8,
              borderLeft: '4px solid #c53030',
              marginTop: 16,
              fontSize: 13,
              color: '#742a2a',
            }}>
              ⚠️ Cancelling marks this deployment as cancelled.
              The row is preserved but excluded from success reports.
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={saving}>
                Back
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={saving}
                style={{
                  background: '#c53030',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};