import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

const DEAL_PROPERTIES = [
  'hs_object_id',
  'dealname',
  'pipeline',
  'dealstage',
  'hubspot_owner_id',
  'owner_name',
  'owner_email',
  'owner_contact_id',
  'hj_customer_name',
  'hj_customer_id',
  'hj_operator_name',
  'hj_operator_id',
  'hj_primary_customer_contact_name',
  'hj_primary_contact_email',
  'hj_primary_customer_contact_id',
  'approver_full_name',
  'approver_contact_email',
  'approver_unique_id',
  'hj_approver_is',
  'terms',
  'taxable',
  'class',
  'project_object_id',
  'project_unique_id'
];

const RECRUITING_PROPERTIES = [
  'hs_object_id',
  'dealname',
  'pipeline',
  'dealstage',
  'consultant_full_name',
  'consultant_email',
  'consultant_unique_id',
  'consultant_role',
  'consultant_title_job',
  'hubspot_owner_id'
];

const CONTACT_PROPERTIES = [
  'hs_object_id',
  'firstname',
  'lastname',
  'email',
  'phone',
  'submitted_as_timesheet_contact',
  'main_contact_id',
  'main_contact_email'
];

const COMPANY_PROPERTIES = [
  'hs_object_id',
  'name',
  'msa_terms',
  'hj_taxable',
  'domain',
  'phone',
  'city',
  'state',
  'zip'
];

const OBJECT_PATHS = {
  deal: 'deals',
  recruiting: 'deals',
  contact: 'contacts',
  company: 'companies'
};

function propertyQuery(properties) {
  return { properties: properties.join(',') };
}

async function fetchObject(objectType, id, properties) {
  const res = await hubspotRequest(`/crm/v3/objects/${objectType}/${id}`, {
    query: propertyQuery(properties)
  });
  return {
    id: res.id,
    properties: res.properties || {}
  };
}

async function fetchDealAssociations(dealId) {
  const res = await hubspotRequest(`/crm/v4/objects/deal/${dealId}/associations/company`, {
    query: { limit: 200 }
  });
  return res.results || [];
}

async function collectDealContext(dealId, options, summary) {
  logStep(`Fetching sales deal ${dealId}`);
  const deal = await fetchObject(OBJECT_PATHS.deal, dealId, DEAL_PROPERTIES);
  summary.salesDeal = deal;

  const assoc = await fetchDealAssociations(dealId);
  if (assoc.length) {
    summary.salesDealAssociations = assoc.map(item => ({
      companyId: item.toObjectId,
      associationTypes: item.associationTypes
    }));

    const uniqueCompanyIds = [...new Set(assoc.map(item => item.toObjectId))];
    summary.companies = summary.companies || [];
    for (const companyId of uniqueCompanyIds) {
      const existing = summary.companies.find(c => c.id === String(companyId));
      if (existing) continue;
      logStep(`Fetching company ${companyId}`);
      const company = await fetchObject(OBJECT_PATHS.company, companyId, COMPANY_PROPERTIES);
      summary.companies.push(company);
    }
  }

  if (options.collectApproverContact && deal.properties.approver_unique_id) {
    const approverId = deal.properties.approver_unique_id;
    logStep(`Fetching approver contact ${approverId}`);
    summary.approverContact = await fetchObject(OBJECT_PATHS.contact, approverId, CONTACT_PROPERTIES);
  }

  if (options.collectPrimaryContact && deal.properties.hj_primary_customer_contact_id) {
    const primaryId = deal.properties.hj_primary_customer_contact_id;
    if (!summary.approverContact || summary.approverContact.id !== primaryId) {
      logStep(`Fetching primary contact ${primaryId}`);
      summary.primaryContact = await fetchObject(OBJECT_PATHS.contact, primaryId, CONTACT_PROPERTIES);
    }
  }
}

async function collectRecruitingContext(recruitingDealId, summary) {
  logStep(`Fetching recruiting deal ${recruitingDealId}`);
  const recruitingDeal = await fetchObject(OBJECT_PATHS.recruiting, recruitingDealId, RECRUITING_PROPERTIES);
  summary.recruitingDeal = recruitingDeal;

  // Pull associated consultant contacts (typeId 4 labelled Consultant)
  const res = await hubspotRequest(`/crm/v4/objects/deal/${recruitingDealId}/associations/contact`, {
    query: { limit: 200 }
  });
  const assocContacts = (res.results || []).filter(item =>
    (item.associationTypes || []).some(type => type.associationTypeId === 4)
  );

  if (assocContacts.length) {
    summary.recruitingContacts = [];
    for (const item of assocContacts) {
      const contactId = item.toObjectId;
      logStep(`Fetching recruiting contact ${contactId}`);
      const contact = await fetchObject(OBJECT_PATHS.contact, contactId, CONTACT_PROPERTIES);
      summary.recruitingContacts.push(contact);
    }
  }
}

async function collectContacts(contactIds, summary) {
  summary.contacts = summary.contacts || [];
  for (const contactId of contactIds) {
    if (summary.contacts.some(c => c.id === String(contactId))) continue;
    logStep(`Fetching contact ${contactId}`);
    const contact = await fetchObject(OBJECT_PATHS.contact, contactId, CONTACT_PROPERTIES);
    summary.contacts.push(contact);
  }
}

async function collectCompanies(companyIds, summary) {
  summary.companies = summary.companies || [];
  for (const companyId of companyIds) {
    if (summary.companies.some(c => c.id === String(companyId))) continue;
    logStep(`Fetching company ${companyId}`);
    const company = await fetchObject(OBJECT_PATHS.company, companyId, COMPANY_PROPERTIES);
    summary.companies.push(company);
  }
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node collect-upstream-context.mjs <request-context.json>');
    process.exit(1);
  }
  const request = readJson(contextPath);
  const outputDir = request.outputDir
    ? path.resolve(request.outputDir)
    : path.dirname(path.resolve(contextPath));

  const summary = {
    generatedAt: new Date().toISOString()
  };

  if (request.salesDealId) {
    await collectDealContext(request.salesDealId, request.options || {}, summary);
  }

  if (request.recruitingDealId) {
    await collectRecruitingContext(request.recruitingDealId, summary);
  }

  if (Array.isArray(request.contactIds) && request.contactIds.length) {
    await collectContacts(request.contactIds, summary);
  }

  if (Array.isArray(request.companyIds) && request.companyIds.length) {
    await collectCompanies(request.companyIds, summary);
  }

  const outputPath = writeJson(outputDir, 'upstream-context', summary);
  console.log(`\nContext saved to ${outputPath}`);
}

main().catch(err => {
  console.error('collect-upstream-context failed:', err);
  process.exit(1);
});
