import { useState, useCallback } from 'react';
import { deploymentModel } from '../models/deploymentModel';

export const useTransferController = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────────────────────────────
  // TRANSFER — end current, create new, write history row
  // ─────────────────────────────────────────────────────
  const transferTeam = useCallback(
    async ({
      currentDeploymentId,
      teamId,
      newAssignedDuId,
      newProjectId,
      newProvince,
      transferDate,
      newPlanEndDeploy,
      newOpsLetterRef,
      newRemarks,
      endCurrentRemarks,
    }) => {
      setLoading(true);
      setError(null);

      let currentSnapshot = null;   // full old record, for history
      let oldMini = null;           // mini snapshot for auto-rollback

      try {
        // ─── Step 0: snapshot the current deployment ──
        if (currentDeploymentId) {
          currentSnapshot = await deploymentModel.getById(currentDeploymentId);
          if (!currentSnapshot) {
            throw new Error('Current deployment not found');
          }
          oldMini = {
            id: currentSnapshot.id,
            end_deploy: currentSnapshot.end_deploy,
            status: currentSnapshot.status,
            remarks: currentSnapshot.remarks,
          };
        }

        // ─── Step 1: end the current deployment ───────
        if (currentDeploymentId) {
          await deploymentModel.endDeployment(currentDeploymentId, transferDate);
          if (endCurrentRemarks) {
            await deploymentModel.update(currentDeploymentId, {
              remarks: endCurrentRemarks,
            });
          }
        }

        // ─── Step 2: create the new deployment ────────
        const newDeployment = await deploymentModel.create({
          team_id: teamId,
          assigned_du_id: newAssignedDuId,
          project_id: newProjectId,
          province: newProvince,
          start_date: transferDate,
          plan_end_deploy: newPlanEndDeploy || null,
          end_date: null,
          ops_letter_ref: newOpsLetterRef,
          remarks: newRemarks,
        });

        // ─── Step 3: write the history row ────────────
        if (currentSnapshot) {
          await deploymentModel.createHistoryEntry({
            deploymentId: newDeployment.id,
            previousDeployment: currentSnapshot,
          });
        }

        return {
          success: true,
          data: newDeployment,
          rollback: {
            oldDeploymentId: currentDeploymentId,
            oldSnapshot: oldMini,
            newDeploymentId: newDeployment.id,
          },
        };
      } catch (err) {
        console.error('Transfer error:', err);
        setError(err.message);

        // Auto-restore old deployment if we already ended it
        if (oldMini) {
          try {
            await deploymentModel.update(oldMini.id, {
              end_deploy: oldMini.end_deploy,
              status: oldMini.status,
              remarks: oldMini.remarks,
            });
          } catch (restoreErr) {
            console.error('Auto-restore failed:', restoreErr);
          }
        }

        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────
  // ROLLBACK — same-session undo of a just-made transfer
  // ─────────────────────────────────────────────────────
  const rollbackTransfer = useCallback(
    async ({
      oldDeploymentId,
      oldSnapshot,
      newDeploymentId,
      mode = 'cancel',
      cancelRemarks = 'Rolled back transfer',
    }) => {
      setLoading(true);
      setError(null);
      const results = { newRemoved: false, oldRestored: false, error: null };

      try {
        if (newDeploymentId) {
          if (mode === 'cancel') {
            await deploymentModel.update(newDeploymentId, {
              status: 'cancelled',
              end_deploy: new Date().toISOString().split('T')[0],
              remarks: cancelRemarks,
            });
          } else {
            await deploymentModel.remove(newDeploymentId);
          }
          results.newRemoved = true;
        }

        if (oldDeploymentId && oldSnapshot) {
          await deploymentModel.update(oldDeploymentId, {
            end_deploy: oldSnapshot.end_deploy ?? null,
            status: oldSnapshot.status || 'active',
            remarks: oldSnapshot.remarks ?? null,
          });
          results.oldRestored = true;
        }

        return { success: true, ...results };
      } catch (err) {
        console.error('Rollback error:', err);
        setError(err.message);
        return { success: false, ...results, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────
  // UNDO — restore old from history, HARD-DELETE new
  // ─────────────────────────────────────────────────────
const undoToPreviousDeployment = useCallback(
  async ({ currentDeployment }) => {
    if (!currentDeployment?.id) {
      return { success: false, error: 'Missing deployment information' };
    }
    setLoading(true);
    setError(null);
    try {
      const restored = await deploymentModel.undoTransfer(currentDeployment.id);
      return { success: true, data: restored };
    } catch (err) {
      console.error('Undo error:', err);
      // Friendly message for the most common failure
      let msg = err.message;
      if (msg.includes('NO_TRANSFER_HISTORY')) {
        msg =
          'No transfer history found for this deployment. ' +
          'It was not created by a transfer, so it cannot be undone.';
      }
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  },
  []
);

  return {
    transferTeam,
    rollbackTransfer,
    undoToPreviousDeployment,
    loading,
    error,
  };
};