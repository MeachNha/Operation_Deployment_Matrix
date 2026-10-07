import { useState, useCallback } from 'react';
import { deploymentModel } from '../models/deploymentModel';

export const useTransferController = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const transferTeam = useCallback(
    async ({
      currentDeploymentId,
      teamId,
      newAssignedDuId,
      newProjectId,
      newProvince,
      transferDate,
      newOpsLetterRef,
      newRemarks,
      endCurrentRemarks,
    }) => {
      setLoading(true);
      setError(null);
      try {
        // Step 1: End the current deployment
        if (currentDeploymentId) {
          await deploymentModel.endDeployment(currentDeploymentId, transferDate);
          if (endCurrentRemarks) {
            await deploymentModel.update(currentDeploymentId, {
              remarks: endCurrentRemarks,
            });
          }
        }

        // Step 2: Create the new deployment
        const newDeployment = await deploymentModel.create({
          team_id: teamId,
          assigned_du_id: newAssignedDuId,
          project_id: newProjectId,
          province: newProvince,
          start_date: transferDate,
          end_date: null,
          ops_letter_ref: newOpsLetterRef,
          remarks: newRemarks,
        });

        return { success: true, data: newDeployment };
      } catch (err) {
        console.error('Transfer error:', err);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { transferTeam, loading, error };
};