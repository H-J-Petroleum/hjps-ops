import fs from 'fs';
import path from 'path';

const HUBSPOT_BASE_URL = process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com';
const HUBSPOT_PRIVATE_APP_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

if (!HUBSPOT_PRIVATE_APP_TOKEN) {
  console.error('Missing HUBSPOT_PRIVATE_APP_TOKEN environment variable.');
  process.exit(1);
}

const CONSULTANT_PORTAL_ID = 302673; // encrypted ID from portal link
const CONSULTANT_ID_OFFSET = 3522;
const consultantContactId = CONSULTANT_PORTAL_ID - CONSULTANT_ID_OFFSET;
const consultantEmail = 'justin.e.lott@gmail.com';
const projectIdentifier = 'hjp-15911-37197';

const issueDir = path.resolve('analysis/issues/2025-09-30-consultant-api-timesheet');
const dataDir = path.join(issueDir, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function hubspotRequest(pathname, { method = 'GET', body, query } = {}) {
  const url = new URL(HUBSPOT_BASE_URL + pathname);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${HUBSPOT_PRIVATE_APP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HubSpot request failed: ${response.status} ${response.statusText} — ${text}`);
  }

  return response.json();
}

function sanitizeEmail(email) {
  if (!email) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local[0]}***@${domain}`;
}

function summarizeDeal(deal) {
  if (!deal) return null;
  return {
    id: deal.id,
    properties: {
      pipeline: deal.properties?.pipeline,
      dealstage: deal.properties?.dealstage,
      consultant_full_name: deal.properties?.consultant_full_name,
      consultant_unique_id: deal.properties?.consultant_unique_id,
      consultant_email: sanitizeEmail(deal.properties?.consultant_email),
      link_for_consultant: deal.properties?.link_for_consultant,
      assign_consultant_to_a_new_sales_deal: deal.properties?.assign_consultant_to_a_new_sales_deal,
      title_job: deal.properties?.title_job,
      test: deal.properties?.test,
      test_link: deal.properties?.test_link,
      hj_customer_id: deal.properties?.hj_customer_id,
      hj_customer_name: deal.properties?.hj_customer_name,
      hj_operator_id: deal.properties?.hj_operator_id,
      hj_operator_name: deal.properties?.hj_operator_name,
      owner_email: sanitizeEmail(deal.properties?.owner_email),
      create_associate_well: deal.properties?.create_associate_well,
      missing_important_info: deal.properties?.missing_important_info,
      hj_project_id: deal.properties?.hj_project_id
    }
  };
}

async function main() {
  const output = {
    consultantContactId,
    projectIdentifier,
    timestamp: new Date().toISOString(),
    recruitingDeal: null,
    salesDeal: null,
    project: null,
    wells: [],
    consultantRecord: null
  };

  console.log('🔍 Searching for recruiting deal...');
  const recruitingSearch = await hubspotRequest('/crm/v3/objects/deals/search', {
    method: 'POST',
    body: {
      filterGroups: [
        {
          filters: [
            { propertyName: 'consultant_unique_id', operator: 'EQ', value: String(consultantContactId) }
          ]
        }
      ],
      properties: [
        'consultant_full_name',
        'consultant_unique_id',
        'consultant_email',
        'link_for_consultant',
        'assign_consultant_to_a_new_sales_deal',
        'title_job',
        'test',
        'test_link',
        'pipeline',
        'dealstage'
      ],
      limit: 2
    }
  });

  if (recruitingSearch.results?.length) {
    output.recruitingDeal = summarizeDeal(recruitingSearch.results[0]);
  }

  console.log('🔍 Searching for HJ project object...');
  const projectSearch = await hubspotRequest('/crm/v3/objects/2-26103074/search', {
    method: 'POST',
    body: {
      filterGroups: [
        {
          filters: [
            { propertyName: 'hj_project_id', operator: 'EQ', value: projectIdentifier }
          ]
        }
      ],
      properties: [
        'hj_project_name',
        'hj_project_is_locked',
        'hj_approver_email',
        'hj_sales_deal_owner_email'
      ],
      limit: 2
    }
  });

  if (projectSearch.results?.length) {
    const project = projectSearch.results[0];
    output.project = {
      id: project.id,
      properties: {
        hj_project_name: project.properties?.hj_project_name,
        hj_project_is_locked: project.properties?.hj_project_is_locked,
        hj_approver_email: sanitizeEmail(project.properties?.hj_approver_email),
        hj_sales_deal_owner_email: sanitizeEmail(project.properties?.hj_sales_deal_owner_email)
      }
    };
  }

  let salesDealId = null;
  if (output.project?.id) {
    console.log('🔍 Fetching sales deal association from project');
    const projectDealAssociations = await hubspotRequest(`/crm/v4/objects/2-26103074/${output.project.id}/associations/deal`, {
      query: { limit: '10' }
    });
    salesDealId = projectDealAssociations.results?.[0]?.toObjectId || null;
  }

  if (salesDealId) {
    console.log('🔍 Loading sales deal', salesDealId);
    const salesDeal = await hubspotRequest(`/crm/v3/objects/deals/${salesDealId}`, {
      query: {
        properties: [
          'hj_customer_id',
          'hj_customer_name',
          'hj_operator_id',
          'hj_operator_name',
          'owner_email',
          'create_associate_well',
          'missing_important_info',
          'pipeline',
          'dealstage'
        ].join(',')
      }
    });
    output.salesDeal = summarizeDeal(salesDeal);
  }

  if (salesDealId) {
    console.log('🔍 Fetching well associations for sales deal', salesDealId);
    const associations = await hubspotRequest(`/crm/v4/objects/deal/${salesDealId}/associations/2-26102958`, {
      query: { limit: '200' }
    });

    const wellIds = associations.results?.map(r => r.toObjectId) || [];
    const wells = [];
    for (const wellId of wellIds) {
      try {
        const well = await hubspotRequest(`/crm/v3/objects/2-26102958/${wellId}`, {
          query: {
            properties: [
              'hj_well_name',
              'hj_well_operator',
              'hj_well_operator_id',
              'hj_well_is_active',
              'hj_well_afe'
            ].join(',')
          }
        });
        wells.push({
          id: well.id,
          name: well.properties?.hj_well_name,
          operator: well.properties?.hj_well_operator,
          operator_id: well.properties?.hj_well_operator_id,
          is_active: well.properties?.hj_well_is_active,
          afe: well.properties?.hj_well_afe
        });
      } catch (err) {
        wells.push({ id: wellId, error: err.message });
      }
    }
    output.wells = wells;
  }

  console.log('🔍 Searching for HJ consultant record...');
  const consultantSearch = await hubspotRequest('/crm/v3/objects/2-26103040/search', {
    method: 'POST',
    body: {
      filterGroups: [
        {
          filters: [
            { propertyName: 'consultant_email', operator: 'EQ', value: consultantEmail }
          ]
        }
      ],
      properties: [
        'consultant_full_name',
        'consultant_deal_id',
        'consultant_role',
        'job_service',
        'well',
        'hourly_role_price',
        'daily_role_price',
        'per_each_price',
        'per_mile_price',
        'hj_project_id',
        'hj_project_name'
      ],
      limit: 2
    }
  });

  if (consultantSearch.results?.length) {
    const consultant = consultantSearch.results[0];
    output.consultantRecord = {
      id: consultant.id,
      properties: {
        consultant_full_name: consultant.properties?.consultant_full_name,
        consultant_deal_id: consultant.properties?.consultant_deal_id,
        consultant_role: consultant.properties?.consultant_role,
        job_service: consultant.properties?.job_service,
        well: consultant.properties?.well,
        hourly_role_price: consultant.properties?.hourly_role_price,
        daily_role_price: consultant.properties?.daily_role_price,
        per_each_price: consultant.properties?.per_each_price,
        per_mile_price: consultant.properties?.per_mile_price,
        hj_project_id: consultant.properties?.hj_project_id,
        hj_project_name: consultant.properties?.hj_project_name
      }
    };
  }

  const outputPath = path.join(dataDir, `prereq-validation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Validation results saved to ${outputPath}`);
}

main().catch(err => {
  console.error('❌ Validation script failed:', err.message);
  process.exit(1);
});
