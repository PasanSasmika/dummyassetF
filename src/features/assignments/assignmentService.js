import API from '../../api/axios';

const getAllAssignments  = async ()                  => { const { data } = await API.get('/assignments/assets/allassignments');                      return data; };
const getHistory        = async (assetId)            => { const { data } = await API.get(`/assignments/assets/${assetId}/assignments`);              return data; };
const getMyAssignments  = async ()                   => { const { data } = await API.get('/assignments/my-assignments');                             return data; };
const getById           = async (assignmentId)       => { const { data } = await API.get(`/assignments/assignments/${assignmentId}`);                return data; };
const assign            = async (assetId, body)      => { const { data } = await API.post(`/assignments/assets/${assetId}/assign`, body);            return data; };
const bulkAssign        = async (body)               => { const { data } = await API.post('/assignments/assets/bulk-assign', body);                  return data; };
const returnAsset       = async (assignmentId, body) => { const { data } = await API.post(`/assignments/assignments/${assignmentId}/return`, body);  return data; };
const bulkReturn        = async (body)               => { const { data } = await API.post('/assignments/assets/bulk-return', body);                  return data; };

const uploadReturnDoc = async (assignmentId, file, meta = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (meta.document_name) form.append('document_name', meta.document_name);
  if (meta.document_type) form.append('document_type', meta.document_type);
  const { data } = await API.post(
    `/assignments/assignments/${assignmentId}/upload-return-doc`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
};
const getReturnDoc = async (assignmentId) => {
  const { data } = await API.get(`/assignments/assignments/${assignmentId}/return-doc`);
  return data;
};

// ── Assign document ───────────────────────────────────────
/**
 * Upload / replace the signed assignment document.
 * Uses PATCH because it updates an existing assignment record.
 * @param {number|string} assignmentId
 * @param {File} file
 */
const uploadAssignDoc = async (assignmentId, file) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await API.patch(
    `/assignments/assignments/${assignmentId}/upload-assign-doc`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
};

const getAssignDoc = async (assignmentId) => {
  const { data } = await API.get(`/assignments/assignments/${assignmentId}/assign-doc`);
  return data;
};

const uploadGatePassDoc = async (assignmentId, file) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await API.patch(
    `/assignments/assignments/${assignmentId}/upload-gate-pass`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
};

const getGatePassDoc = async (assignmentId) => {
  const { data } = await API.get(`/assignments/assignments/${assignmentId}/gate-pass-doc`);
  return data;
};

const assignmentService = {
  getAllAssignments,
  getHistory,
  getMyAssignments,
  getById,
  assign,
  bulkAssign,
  returnAsset,
  bulkReturn,
  uploadReturnDoc,
  getReturnDoc,
  uploadAssignDoc,
  getAssignDoc,
  uploadGatePassDoc,
  getGatePassDoc,
};

export default assignmentService;
