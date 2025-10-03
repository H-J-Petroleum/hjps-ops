jest.mock('axios');
const axios = require('axios');

const HubSpotService = require('../src/services/hubspotService');

describe('HubSpotService', () => {
  beforeEach(() => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = 'test-token';
    axios.get.mockReset();
    axios.post.mockReset();
    axios.patch.mockReset();
  });

  test('updateApprovalWithFileMeta patches file id and url for customer', async () => {
    axios.patch.mockResolvedValue({ data: { success: true } });
    const svc = new HubSpotService();
    const approvalId = '123';
    const fileId = '987654';
    const url = 'https://files.hubspotusercontent.com/some.pdf';

    const result = await svc.updateApprovalWithFileMeta(approvalId, 'customer', fileId, url);

    expect(result).toEqual({ success: true });
    expect(axios.patch).toHaveBeenCalledTimes(1);
    const [apiUrl, body, opts] = axios.patch.mock.calls[0];
    expect(apiUrl).toBe('https://api.hubapi.com/crm/v3/objects/2-26103010/123');
    expect(body.properties).toMatchObject({ field_ticket_id: fileId, field_ticket_url: url });
    expect(opts.headers.Authorization).toBe('Bearer test-token');
  });

  test('getApprovalData returns record when lookup by id succeeds', async () => {
    const svc = new HubSpotService();
    const approvalId = '987654';
    const payload = { id: approvalId, properties: { approval_request_id: 'abc' } };
    axios.get.mockResolvedValue({ data: payload });

    const result = await svc.getApprovalData(approvalId);

    expect(result).toEqual(payload);
    expect(axios.get).toHaveBeenCalledWith(
      `https://api.hubapi.com/crm/v3/objects/2-26103010/${approvalId}`,
      expect.objectContaining({ params: expect.objectContaining({ properties: expect.any(String) }) })
    );
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('getApprovalData falls back to search when id lookup returns 404', async () => {
    const svc = new HubSpotService();
    const approvalRequestId = 'hjp-123';
    axios.get.mockRejectedValue({ response: { status: 404 } });
    const searchResult = { id: '112233', properties: { approval_request_id: approvalRequestId } };
    axios.post.mockResolvedValue({ data: { results: [searchResult] } });

    const result = await svc.getApprovalData(approvalRequestId);

    expect(result).toEqual(searchResult);
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.hubapi.com/crm/v3/objects/2-26103010/search',
      expect.objectContaining({ filterGroups: expect.any(Array) }),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  test('getApprovalData throws when fallback search is empty', async () => {
    const svc = new HubSpotService();
    const approvalRequestId = 'hjp-missing';
    axios.get.mockRejectedValue({ response: { status: 404 } });
    axios.post.mockResolvedValue({ data: { results: [] } });

    await expect(svc.getApprovalData(approvalRequestId)).rejects.toThrow('Approval hjp-missing not found in HubSpot');
  });

  test('getTimesheetData maps HubSpot ids into result payload', async () => {
    const svc = new HubSpotService();
    axios.post.mockResolvedValue({
      data: {
        results: [
          { id: '1', properties: { timesheet_project_id: 'p', timesheet_quantity: '5' } },
          { id: '2', properties: { timesheet_project_id: 'p', timesheet_quantity: '3' } }
        ]
      }
    });

    const rows = await svc.getTimesheetData('p', 'req', 'cid');

    expect(rows).toEqual([
      { hs_object_id: '1', timesheet_project_id: 'p', timesheet_quantity: '5' },
      { hs_object_id: '2', timesheet_project_id: 'p', timesheet_quantity: '3' }
    ]);
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.hubapi.com/crm/v3/objects/2-26173281/search',
      expect.objectContaining({ limit: 100 }),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });
});
