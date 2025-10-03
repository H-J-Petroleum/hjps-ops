jest.mock('axios');
const axios = require('axios');
const HubSpotFilesService = require('../src/services/hubspotFilesService');

describe('HubSpotFilesService', () => {
  beforeEach(() => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = 'test-token';
    axios.post.mockReset();
  });

  test('uploadPDF posts to HubSpot Files API', async () => {
    axios.post.mockResolvedValue({ data: { id: '1', url: 'https://files/1' } });
    const svc = new HubSpotFilesService();
    const res = await svc.uploadPDF({ buffer: Buffer.from('pdf'), fileName: 'test.pdf', folderPath: 'ApprovedFieldTickets' });
    expect(res).toEqual({ id: '1', url: 'https://files/1' });
    expect(axios.post).toHaveBeenCalled();
    const [url] = axios.post.mock.calls[0];
    expect(url).toBe('https://api.hubapi.com/files/v3/files');
  });
});

