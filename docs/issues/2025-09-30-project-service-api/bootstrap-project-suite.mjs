import fs from 'fs';
import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';
import { spawn } from 'child_process';

const SUMMARY_FILE_REGEX = /(project-run|project-consultant-run|service-run|service-association-run|scope-run|seed-company|seed-sales-deal|seed-consultant-contact|upstream-context|project-service-context|bootstrap-run)-(.*)\.json$/;
const SCRIPT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '.');
const REQUIRED_COMPANY_PROPS = ['name', 'msa_terms', 'hj_taxable'];
const REQUIRED_CONTACT_PROPS = ['firstname', 'lastname', 'email'];
const REQUIRED_DEAL_PROPS = ['hj_customer_id', 'hj_operator_id', 'approver_unique_id', 'hj_primary_customer_contact_id'];
const PLACEHOLDER_PREFIX = 'REPLACE_ME';

function isPlaceholder(value) {
  if (value === null || value === undefined) return true;
  const str = String(value);
  if (!str.trim()) return true;
  return str.startsWith(PLACEHOLDER_PREFIX);
}

function filterValidIds(list) {
  return (list || [])
    .map(id => (id && typeof id === 'object') ? (id.companyId || id.contactId || id.id) : id)
    .map(id => id && String(id))
    .filter(id => id && !isPlaceholder(id));
}

function processSummaries(summaries, outputs, handler) {
  for (const summaryPath of summaries) {
    outputs.summaries.push(summaryPath);
    try {
      const data = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      if (handler) handler(summaryPath, data);
    } catch (err) {
      console.warn(`Failed to parse summary ${summaryPath}: ${err.message}`);
    }
  }
}

function recordValidation(outputs, stage, warnings) {
  if (!outputs.validation) outputs.validation = [];
  const status = warnings.length ? 'warning' : 'ok';
  outputs.validation.push({ stage, status, warnings });
  if (warnings.length) {
    warnings.forEach(w => console.warn(`⚠️  ${stage}: ${w}`));
  } else {
    console.log(`✅ ${stage} validation passed.`);
  }
}

function runScript(script, args) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(SCRIPT_DIR, script);
    const proc = spawn('node', [fullPath, ...args], { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

function stageEnabled(stages, key) {
  if (stages == null) return true;
  if (typeof stages[key] === 'boolean') return stages[key];
  return true;
}

function writeTempContext(filename, payload) {
  const abs = path.join(SCRIPT_DIR, 'data', filename);
  fs.writeFileSync(abs, JSON.stringify(payload, null, 2));
  return abs;
}

function findNewSummaries(before, after) {
  const beforeSet = new Set(before.map(f => f.name));
  return after
    .filter(f => !beforeSet.has(f.name) && SUMMARY_FILE_REGEX.test(f.name))
    .map(f => path.join(f.dir, f.name));
}

function listDataFiles() {
  const dir = path.join(SCRIPT_DIR, 'data');
  return fs.readdirSync(dir).map(name => ({ dir, name }));
}

async function validateCompanyState(companyId) {
  try {
    const res = await hubspotRequest(`/crm/v3/objects/companies/${companyId}`, {
      query: { properties: REQUIRED_COMPANY_PROPS.join(',') }
    });
    const props = res.properties || {};
    const missing = REQUIRED_COMPANY_PROPS.filter(prop => !props[prop]);
    return missing.length ? [`Company ${companyId} missing properties: ${missing.join(', ')}`] : [];
  } catch (err) {
    return [`Failed to validate company ${companyId}: ${err.message}`];
  }
}

async function validateSalesDealState(dealId, expectedCompanies, expectedContacts) {
  const warnings = [];
  try {
    const res = await hubspotRequest(`/crm/v3/objects/deals/${dealId}`, {
      query: { properties: REQUIRED_DEAL_PROPS.join(',') }
    });
    const props = res.properties || {};
    REQUIRED_DEAL_PROPS.forEach(prop => {
      if (!props[prop]) warnings.push(`Deal ${dealId} missing property ${prop}`);
    });

    const companyAssocRes = await hubspotRequest(`/crm/v4/objects/deal/${dealId}/associations/company`, {
      query: { limit: 500 }
    });
    const companyResults = companyAssocRes.results || [];
    const hasCustomerLabel = companyResults.some(item => (item.associationTypes || []).some(t => t.associationTypeId === 207));
    const hasOperatorLabel = companyResults.some(item => (item.associationTypes || []).some(t => t.associationTypeId === 205));
    if (!hasCustomerLabel) warnings.push(`Deal ${dealId} missing Customer association (type 207)`);
    if (!hasOperatorLabel) warnings.push(`Deal ${dealId} missing Operator association (type 205)`);

    filterValidIds(expectedCompanies.customer).forEach(companyId => {
      const present = companyResults.some(item => String(item.toObjectId) === String(companyId));
      if (!present) warnings.push(`Deal ${dealId} missing association to customer company ${companyId}`);
    });
    filterValidIds(expectedCompanies.operator).forEach(companyId => {
      const present = companyResults.some(item => String(item.toObjectId) === String(companyId));
      if (!present) warnings.push(`Deal ${dealId} missing association to operator company ${companyId}`);
    });

    const contactAssocRes = await hubspotRequest(`/crm/v4/objects/deal/${dealId}/associations/contact`, {
      query: { limit: 500 }
    });
    const contactResults = contactAssocRes.results || [];
    filterValidIds(expectedContacts).forEach(contactId => {
      const present = contactResults.some(item => String(item.toObjectId) === String(contactId));
      if (!present) warnings.push(`Deal ${dealId} missing association to contact ${contactId}`);
    });
  } catch (err) {
    warnings.push(`Failed to validate sales deal ${dealId}: ${err.message}`);
  }
  return warnings;
}

async function validateConsultantState(contactId, recruitingDealId) {
  const warnings = [];
  try {
    const res = await hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, {
      query: { properties: [...REQUIRED_CONTACT_PROPS, 'phone', 'submitted_as_timesheet_contact'].join(',') }
    });
    const props = res.properties || {};
    REQUIRED_CONTACT_PROPS.forEach(prop => {
      if (!props[prop]) warnings.push(`Contact ${contactId} missing property ${prop}`);
    });
    if (!props.phone) warnings.push(`Contact ${contactId} missing phone`);
    if (!props.submitted_as_timesheet_contact) warnings.push(`Contact ${contactId} missing submitted_as_timesheet_contact`);

    if (recruitingDealId && !isPlaceholder(recruitingDealId)) {
      const assocRes = await hubspotRequest(`/crm/v4/objects/contact/${contactId}/associations/deal`, {
        query: { limit: 500 }
      });
      const assoc = assocRes.results || [];
      const present = assoc.some(item => String(item.toObjectId) === String(recruitingDealId));
      if (!present) warnings.push(`Contact ${contactId} not associated to recruiting deal ${recruitingDealId}`);
    }
  } catch (err) {
    warnings.push(`Failed to validate contact ${contactId}: ${err.message}`);
  }
  return warnings;
}

async function validateProjectState(projectId, expectedConsultants) {
  const warnings = [];
  try {
    await hubspotRequest(`/crm/v3/objects/2-26103074/${projectId}`, {
      query: { properties: 'hj_project_id,hj_customer,hj_operator' }
    });
    if (expectedConsultants && expectedConsultants.length) {
      const assocRes = await hubspotRequest(`/crm/v4/objects/2-26103074/${projectId}/associations/contact`, {
        query: { limit: 500 }
      });
      const assoc = assocRes.results || [];
      filterValidIds(expectedConsultants).forEach(contactId => {
        const present = assoc.some(item => String(item.toObjectId) === String(contactId));
        if (!present) warnings.push(`Project ${projectId} missing consultant contact ${contactId}`);
      });
    }
  } catch (err) {
    warnings.push(`Failed to validate project ${projectId}: ${err.message}`);
  }
  return warnings;
}

async function validateServiceAssociationState(dealId, serviceIds) {
  const warnings = [];
  const validIds = filterValidIds(serviceIds);
  if (!validIds.length) return warnings;
  try {
    const assocRes = await hubspotRequest(`/crm/v4/objects/deal/${dealId}/associations/2-26102982`, {
      query: { limit: 500 }
    });
    const assoc = assocRes.results || [];
    validIds.forEach(serviceId => {
      const present = assoc.some(item => String(item.toObjectId) === String(serviceId));
      if (!present) warnings.push(`Deal ${dealId} missing association to service ${serviceId}`);
    });
  } catch (err) {
    warnings.push(`Failed to validate service association for deal ${dealId}: ${err.message}`);
  }
  return warnings;
}

async function validateScopeState(scopeId, expected) {
  const warnings = [];
  if (!scopeId || isPlaceholder(scopeId)) return warnings;
  try {
    const res = await hubspotRequest(`/crm/v3/objects/2-26103040/${scopeId}`, {
      query: { properties: 'consultant_id,hj_project_id,hj_approved,sales_deal_id' }
    });
    const props = res.properties || {};
    if (!props.consultant_id) warnings.push(`Scope ${scopeId} missing consultant_id`);
    if (!props.hj_project_id) warnings.push(`Scope ${scopeId} missing hj_project_id`);
    if (!props.sales_deal_id) warnings.push(`Scope ${scopeId} missing sales_deal_id`);
    if (expected?.consultantId && String(props.consultant_id) !== String(expected.consultantId)) {
      warnings.push(`Scope ${scopeId} consultant mismatch: expected ${expected.consultantId}, found ${props.consultant_id}`);
    }
    if (expected?.projectId && String(props.hj_project_id) !== String(expected.projectId)) {
      warnings.push(`Scope ${scopeId} project mismatch: expected ${expected.projectId}, found ${props.hj_project_id}`);
    }
    if (expected?.salesDealId && String(props.sales_deal_id) !== String(expected.salesDealId)) {
      warnings.push(`Scope ${scopeId} sales deal mismatch: expected ${expected.salesDealId}, found ${props.sales_deal_id}`);
    }
  } catch (err) {
    warnings.push(`Failed to validate scope ${scopeId}: ${err.message}`);
  }
  return warnings;
}

function deriveContactName(props = {}) {
  const first = props.firstname || props.firstName || '';
  const last = props.lastname || props.lastName || '';
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  return props.fullName || props.name || '';
}

function ensureContactProperties(props = {}) {
  const output = { ...props };
  if (!output.firstname) output.firstname = 'Contact';
  if (!output.lastname) output.lastname = 'Placeholder';
  if (!output.email) output.email = `placeholder-${Date.now()}@example.com`;
  if (!output.phone) output.phone = '+10000000000';
  return output;
}

function upsertContactAssociation(salesDealConfig, contactId, associationTypeId) {
  if (!salesDealConfig) return;
  salesDealConfig.associations = salesDealConfig.associations || {};
  const list = salesDealConfig.associations.contacts = salesDealConfig.associations.contacts || [];
  const existing = list.find(entry => String(entry.contactId || entry.id) === String(contactId));
  if (existing) {
    existing.contactId = contactId;
    existing.id = contactId;
    existing.associationTypeId = associationTypeId;
  } else {
    list.push({ contactId, associationTypeId });
  }
}

function applyContactMappings(mapping, contactId, contactProps, context) {
  if (!mapping) return;
  const name = mapping.nameValue || deriveContactName(contactProps);
  const email = contactProps.email;
  const phone = contactProps.phone;

  if (context.salesDeal?.properties) {
    const dealProps = context.salesDeal.properties;
    if (mapping.dealId) dealProps[mapping.dealId] = contactId;
    if (mapping.dealEmail && email) dealProps[mapping.dealEmail] = email;
    if (mapping.dealName && name) dealProps[mapping.dealName] = name;
    if (mapping.dealPhone && phone) dealProps[mapping.dealPhone] = phone;
  }

  if (context.scope?.properties) {
    const scopeProps = context.scope.properties;
    if (mapping.scopeContactId) scopeProps[mapping.scopeContactId] = contactId;
    if (mapping.scopeEmail && email) scopeProps[mapping.scopeEmail] = email;
    if (mapping.scopeName && name) scopeProps[mapping.scopeName] = name;
  }
}

async function seedContactFromConfig(key, config, context, outputs, tempFiles, dryRun) {
  if (!config) return null;
  const contactProps = ensureContactProperties(config.properties);
  const payload = {
    dryRun,
    contactId: config.contactId,
    properties: contactProps,
    recruitingDeal: config.recruitingDeal
  };
  const file = writeTempContext(`bootstrap-temp-seed-contact-${key}.json`, payload);
  tempFiles.push(file);
  const before = listDataFiles();
  await runScript('seed-consultant-contact.mjs', [file]);
  const after = listDataFiles();
  const summaries = findNewSummaries(before, after);
  let contactId = config.contactId;
  processSummaries(summaries, outputs, (summaryPath, data) => {
    if (data?.contactId) contactId = data.contactId;
  });
  if (!contactId) contactId = config.contactId || (dryRun ? `DRY_RUN_CONTACT_${key.toUpperCase()}` : null);
  if (!contactId) return null;

  const associationTypeId = config.associationTypeId || 19;
  upsertContactAssociation(context.salesDeal, contactId, associationTypeId);
  applyContactMappings(config.mapping, contactId, contactProps, context);

  config.contactId = contactId;
  outputs.stages[`seedContact_${key}`] = true;

  if (!dryRun && contactId && !isPlaceholder(contactId)) {
    const warnings = await validateConsultantState(contactId, config.recruitingDeal?.dealId);
    recordValidation(outputs, `contact-${key}`, warnings);
  }
  return contactId;
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node bootstrap-project-suite.mjs <bootstrap-context.json>');
    process.exit(1);
  }

  const context = readJson(contextPath);
  const dryRun = context.dryRun !== false; // default true
  const stages = context.stages || {};
  const outputs = { generatedAt: new Date().toISOString(), dryRun, stages: {}, summaries: [] };

  const tempFiles = [];
  try {
    if (stageEnabled(stages, 'seedCompany') && context.company) {
      const { customer, operator } = context.company;
      if (customer) {
        logStep('Seeding customer company');
        const file = writeTempContext('bootstrap-temp-seed-company-customer.json', {
          dryRun,
          companyId: customer.companyId,
          properties: customer.properties
        });
        tempFiles.push(file);
        const before = listDataFiles();
        await runScript('seed-company.mjs', [file]);
        const after = listDataFiles();
        const summaries = findNewSummaries(before, after);
        processSummaries(summaries, outputs, (summaryPath, data) => {
          if (!data) return;
          const newId = data.companyId;
          if (newId) {
            customer.companyId = newId;
            if (context.salesDeal?.properties) {
              if (isPlaceholder(context.salesDeal.properties.hj_customer_id)) {
                context.salesDeal.properties.hj_customer_id = newId;
              }
            }
            if (context.salesDeal?.associations?.customer) {
              context.salesDeal.associations.customer.forEach(entry => {
                entry.companyId = newId;
                entry.id = newId;
              });
            }
            if (context.scope?.properties && isPlaceholder(context.scope.properties.hj_customer)) {
              context.scope.properties.hj_customer = customer.properties?.name || context.salesDeal?.properties?.hj_customer_name || '';
            }
          }
        });
        if (customer.createContact) {
          await seedContactFromConfig('customerPrimary', customer.createContact, context, outputs, tempFiles, dryRun);
        }
        outputs.stages.seedCompanyCustomer = true;
        if (!dryRun && customer.companyId && !isPlaceholder(customer.companyId)) {
          const warnings = await validateCompanyState(customer.companyId);
          recordValidation(outputs, 'companyCustomer', warnings);
        }
      }
      if (operator && operator.companyId && (!customer || operator.companyId !== customer.companyId)) {
        logStep('Seeding operator company');
        const file = writeTempContext('bootstrap-temp-seed-company-operator.json', {
          dryRun,
          companyId: operator.companyId,
          properties: operator.properties
        });
        tempFiles.push(file);
        const before = listDataFiles();
        await runScript('seed-company.mjs', [file]);
        const after = listDataFiles();
        const summaries = findNewSummaries(before, after);
        processSummaries(summaries, outputs, (summaryPath, data) => {
          if (!data) return;
          const newId = data.companyId;
          if (newId) {
            operator.companyId = newId;
            if (context.salesDeal?.properties) {
              if (isPlaceholder(context.salesDeal.properties.hj_operator_id)) {
                context.salesDeal.properties.hj_operator_id = newId;
              }
            }
            if (context.salesDeal?.associations?.operator) {
              context.salesDeal.associations.operator.forEach(entry => {
                entry.companyId = newId;
                entry.id = newId;
              });
            }
            if (context.scope?.properties && isPlaceholder(context.scope.properties.hj_operator)) {
              context.scope.properties.hj_operator = operator.properties?.name || context.salesDeal?.properties?.hj_operator_name || '';
            }
          }
        });
        if (operator.createContact) {
          await seedContactFromConfig('operatorContact', operator.createContact, context, outputs, tempFiles, dryRun);
        }
        outputs.stages.seedCompanyOperator = true;
        if (!dryRun && operator.companyId && !isPlaceholder(operator.companyId)) {
          const warnings = await validateCompanyState(operator.companyId);
          recordValidation(outputs, 'companyOperator', warnings);
        }
      }
    }

    if (stageEnabled(stages, 'seedSalesDeal') && context.salesDeal) {
      logStep('Seeding sales deal');
      const seedPayload = {
        dryRun,
        dealId: context.salesDeal.dealId,
        properties: context.salesDeal.properties,
        customerAssociations: context.salesDeal.associations?.customer,
        operatorAssociations: context.salesDeal.associations?.operator,
        contactAssociations: context.salesDeal.associations?.contacts
      };
      const file = writeTempContext('bootstrap-temp-seed-sales-deal.json', seedPayload);
      tempFiles.push(file);
      const before = listDataFiles();
      await runScript('seed-sales-deal.mjs', [file]);
      const after = listDataFiles();
      const summaries = findNewSummaries(before, after);
      processSummaries(summaries, outputs, (summaryPath, data) => {
        if (!data) return;
        if (data.dealId) {
          context.salesDeal.dealId = data.dealId;
          if (context.service) context.service.dealId = data.dealId;
          if (context.serviceAssociation) context.serviceAssociation.dealId = data.dealId;
          if (context.scope?.properties) context.scope.properties.sales_deal_id = data.dealId;
        }
      });
      outputs.stages.seedSalesDeal = true;
      if (!dryRun && context.salesDeal.dealId && !isPlaceholder(context.salesDeal.dealId)) {
        const expectedCompanies = {
          customer: filterValidIds(context.salesDeal.associations?.customer),
          operator: filterValidIds(context.salesDeal.associations?.operator)
        };
        const expectedContacts = filterValidIds(context.salesDeal.associations?.contacts);
        const warnings = await validateSalesDealState(context.salesDeal.dealId, expectedCompanies, expectedContacts);
        recordValidation(outputs, 'salesDeal', warnings);
      }
    }

    if (stageEnabled(stages, 'seedConsultant') && context.consultant) {
      logStep('Seeding consultant contact');
      const seedPayload = {
        dryRun,
        contactId: context.consultant.contactId,
        properties: context.consultant.properties,
        recruitingDeal: context.consultant.recruitingDeal
      };
      const file = writeTempContext('bootstrap-temp-seed-consultant.json', seedPayload);
      tempFiles.push(file);
      const before = listDataFiles();
      await runScript('seed-consultant-contact.mjs', [file]);
      const after = listDataFiles();
      const summaries = findNewSummaries(before, after);
      processSummaries(summaries, outputs, (summaryPath, data) => {
        if (!data) return;
        if (data.contactId) {
          context.consultant.contactId = data.contactId;
          if (context.projectConsultants?.consultants) {
            context.projectConsultants.consultants = context.projectConsultants.consultants.map(id => isPlaceholder(id) ? data.contactId : id);
            if (!context.projectConsultants.consultants.includes(data.contactId)) {
              context.projectConsultants.consultants.push(data.contactId);
            }
          }
          if (context.scope?.properties) {
            if (isPlaceholder(context.scope.properties.consultant_id)) context.scope.properties.consultant_id = data.contactId;
            if (isPlaceholder(context.scope.properties.consultantContactId)) context.scope.properties.consultantContactId = data.contactId;
          }
        }
      });
      outputs.stages.seedConsultant = true;
      if (!dryRun && context.consultant.contactId && !isPlaceholder(context.consultant.contactId)) {
        const recruitingDealId = context.consultant.recruitingDeal?.dealId;
        const warnings = await validateConsultantState(context.consultant.contactId, recruitingDealId);
        recordValidation(outputs, 'consultantContact', warnings);
      }
    }

    if (stageEnabled(stages, 'createProject') && context.project) {
      logStep('Creating project');
      const payload = {
        dryRun,
        skipIfExists: context.project.skipIfExists !== false,
        dealId: context.salesDeal?.dealId,
        projectName: context.project.projectName,
        projectId: context.project.projectId
      };
      const file = writeTempContext('bootstrap-temp-create-project.json', payload);
      tempFiles.push(file);
      const before = listDataFiles();
      await runScript('create-project.mjs', [file]);
      const after = listDataFiles();
      const summaries = findNewSummaries(before, after);
      processSummaries(summaries, outputs, (summaryPath, data) => {
        if (!data) return;
        if (data.projectObjectId) {
          context.project.projectObjectId = data.projectObjectId;
          if (!context.projectConsultants.projectId || isPlaceholder(context.projectConsultants.projectId)) {
            context.projectConsultants.projectId = data.projectObjectId;
          }
        }
        if (data.projectId) {
          context.project.projectId = data.projectId;
          if (context.projectConsultants?.projectProperties) {
            if (isPlaceholder(context.projectConsultants.projectProperties.hj_project_id)) context.projectConsultants.projectProperties.hj_project_id = data.projectId;
            if (isPlaceholder(context.projectConsultants.projectProperties.hj_project_name)) context.projectConsultants.projectProperties.hj_project_name = context.project.projectName || data.projectId;
          }
          if (context.scope?.properties) {
            if (isPlaceholder(context.scope.properties.hj_project_id)) context.scope.properties.hj_project_id = data.projectId;
            if (isPlaceholder(context.scope.properties.hj_project_name)) context.scope.properties.hj_project_name = context.project.projectName || data.projectId;
          }
        }
      });
      outputs.stages.createProject = true;
      const projectObjectId = context.projectConsultants?.projectId || context.project?.projectObjectId;
      if (!dryRun && projectObjectId && !isPlaceholder(projectObjectId)) {
        const warnings = await validateProjectState(projectObjectId, context.projectConsultants?.consultants);
        recordValidation(outputs, 'project', warnings);
      }
    }

    if (stageEnabled(stages, 'assignConsultants') && context.projectConsultants) {
      logStep('Assigning consultants to project');
      const payload = {
        dryRun,
        project: {
          id: context.projectConsultants.projectId || context.project?.projectObjectId || context.project?.projectId,
          properties: context.projectConsultants.projectProperties
        },
        consultants: context.projectConsultants.consultants,
        updateContactProperties: context.projectConsultants.updateContactProperties
      };
      const file = writeTempContext('bootstrap-temp-assign-consultants.json', payload);
      tempFiles.push(file);
      const before = listDataFiles();
      await runScript('assign-consultants-to-project.mjs', [file]);
      const after = listDataFiles();
      const summaries = findNewSummaries(before, after);
      processSummaries(summaries, outputs, null);
      outputs.stages.assignConsultants = true;
      const projectObjectId = context.projectConsultants?.projectId || context.project?.projectObjectId;
      if (!dryRun && projectObjectId && !isPlaceholder(projectObjectId)) {
        const warnings = await validateProjectState(projectObjectId, context.projectConsultants?.consultants);
        recordValidation(outputs, 'projectConsultants', warnings);
      }
    }

    if (stageEnabled(stages, 'createService') && context.service) {
      logStep('Creating service');
      const payload = {
        dryRun,
        dealId: context.service.dealId,
        service: {
          ...context.service.properties,
          dealId: context.service.dealId
        }
      };
      const file = writeTempContext('bootstrap-temp-create-service.json', payload);
      tempFiles.push(file);
      const before = listDataFiles();
      await runScript('create-service.mjs', [file]);
      const after = listDataFiles();
      const summaries = findNewSummaries(before, after);
      processSummaries(summaries, outputs, (summaryPath, data) => {
        if (!data) return;
        if (data.serviceObjectId) {
          context.service.latestServiceId = data.serviceObjectId;
          if (!context.serviceAssociation.serviceIds || !context.serviceAssociation.serviceIds.length || context.serviceAssociation.serviceIds.every(isPlaceholder)) {
            context.serviceAssociation.serviceIds = [data.serviceObjectId];
          }
        }
      });
      outputs.stages.createService = true;
    }

    if (stageEnabled(stages, 'assignService') && context.serviceAssociation) {
      logStep('Associating service to deal');
      const payload = {
        dryRun,
        dealId: context.serviceAssociation.dealId,
        serviceIds: context.serviceAssociation.serviceIds,
        associationTypeId: context.serviceAssociation.associationTypeId
      };
      const file = writeTempContext('bootstrap-temp-assign-service.json', payload);
      tempFiles.push(file);
      const before = listDataFiles();
      await runScript('assign-service-to-deal.mjs', [file]);
      const after = listDataFiles();
      const summaries = findNewSummaries(before, after);
      processSummaries(summaries, outputs, null);
      outputs.stages.assignService = true;
      if (!dryRun && context.salesDeal?.dealId && !isPlaceholder(context.salesDeal.dealId)) {
        const warnings = await validateServiceAssociationState(context.salesDeal.dealId, context.serviceAssociation.serviceIds);
        recordValidation(outputs, 'serviceAssociation', warnings);
      }
    }

    if (stageEnabled(stages, 'createScope') && context.scope) {
      logStep('Creating scope of work');
      const payload = {
        dryRun,
        scope: context.scope.properties
      };
      const file = writeTempContext('bootstrap-temp-create-scope.json', payload);
      tempFiles.push(file);
      const before = listDataFiles();
      await runScript('create-scope-of-work.mjs', [file]);
      const after = listDataFiles();
      const summaries = findNewSummaries(before, after);
      processSummaries(summaries, outputs, (summaryPath, data) => {
        if (!data) return;
        if (data.scopeObjectId) {
          context.scope.scopeObjectId = data.scopeObjectId;
        }
      });
      outputs.stages.createScope = true;
      if (!dryRun && context.scope?.scopeObjectId && !isPlaceholder(context.scope.scopeObjectId)) {
        const warnings = await validateScopeState(context.scope.scopeObjectId, {
          consultantId: context.scope?.properties?.consultant_id,
          projectId: context.scope?.properties?.hj_project_id,
          salesDealId: context.scope?.properties?.sales_deal_id
        });
        recordValidation(outputs, 'scope', warnings);
      }
    }

    if (stageEnabled(stages, 'collectSnapshots') && context.snapshot) {
      if (context.snapshot.upstreamRequest) {
        logStep('Collecting upstream snapshot');
        const file = writeTempContext('bootstrap-temp-upstream-request.json', context.snapshot.upstreamRequest);
        tempFiles.push(file);
        const before = listDataFiles();
        await runScript('collect-upstream-context.mjs', [file]);
        const after = listDataFiles();
        const summaries = findNewSummaries(before, after);
        processSummaries(summaries, outputs, null);
      }
      if (context.snapshot.projectContextRequest) {
        logStep('Collecting project/service snapshot');
        const file = writeTempContext('bootstrap-temp-project-context-request.json', context.snapshot.projectContextRequest);
        tempFiles.push(file);
        const before = listDataFiles();
        await runScript('collect-project-service-context.mjs', [file]);
        const after = listDataFiles();
        const summaries = findNewSummaries(before, after);
        processSummaries(summaries, outputs, null);
      }
      outputs.stages.collectSnapshots = true;
    }

    const summaryPath = writeJson(path.dirname(path.resolve(contextPath)), 'bootstrap-run', outputs);
    console.log(`\nBootstrap run summary saved to ${summaryPath}`);
  } finally {
    if (context.cleanupTemp !== false) {
      for (const file of tempFiles) {
        try {
          fs.unlinkSync(file);
        } catch {}
      }
    }
  }
}

main().catch(err => {
  console.error('bootstrap-project-suite failed:', err);
  process.exit(1);
});
