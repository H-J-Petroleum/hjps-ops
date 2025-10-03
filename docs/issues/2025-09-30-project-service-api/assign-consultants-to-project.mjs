import path from 'path';
import {
  hubspotRequest,
  readJson,
  writeJson,
  logStep
} from './lib/hubspot-client.mjs';

const PROJECT_PROPERTIES = [
  'hj_project_id',
  'hj_project_name',
  'hj_customer',
  'hj_operator'
];

async function fetchProject(projectId) {
  const res = await hubspotRequest(`/crm/v3/objects/2-26103074/${projectId}`, {
    query: { properties: PROJECT_PROPERTIES.join(',') }
  });
  return {
    id: res.id,
    properties: res.properties || {}
  };
}

async function associateConsultant(projectObjectId, contactId) {
  await hubspotRequest(`/crm/v4/objects/2-26103074/${projectObjectId}/associations/contact/${contactId}`, {
    method: 'PUT',
    body: [
      {
        associationCategory: 'USER_DEFINED',
        associationTypeId: 209
      }
    ]
  });
}

async function patchContact(contactId, properties) {
  await hubspotRequest(`/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    body: { properties }
  });
}

async function ensureContactId(entry) {
  if (typeof entry === 'string') return entry;
  if (entry && entry.id) return entry.id;
  if (entry && entry.contactId) return entry.contactId;
  throw new Error('Consultant entry is missing contact id');
}

async function main() {
  const contextPath = process.argv[2];
  if (!contextPath) {
    console.error('Usage: node assign-consultants-to-project.mjs <context.json>');
    process.exit(1);
  }
  const context = readJson(contextPath);

  const projectObjectId = context.projectObjectId || context.project?.id;
  if (!projectObjectId) {
    throw new Error('Context must provide projectObjectId or project.id');
  }

  const project = context.project || await fetchProject(projectObjectId);
  const projProps = project.properties || {};

  const consultants = context.consultants;
  if (!Array.isArray(consultants) || consultants.length === 0) {
    throw new Error('Context must include non-empty consultants array');
  }

  const contactIds = await Promise.all(consultants.map(ensureContactId));
  const dryRun = Boolean(context.dryRun);

  logStep(`Associating ${contactIds.length} consultant(s) to project`);
  const associationResults = [];
  for (const contactId of contactIds) {
    if (dryRun) {
      console.log(`[dry-run] Would associate project ${projectObjectId} with contact ${contactId}`);
      associationResults.push({ contactId, status: 'skipped (dry-run)' });
    } else {
      await associateConsultant(projectObjectId, contactId);
      associationResults.push({ contactId, status: 'associated' });
    }

    if (context.updateContactProperties !== false) {
      const contactProps = {
        hj_notify_project_id: projProps.hj_project_id || context.projectId || '',
        hj_notify_project_object_id: projectObjectId,
        hj_notify_project_name: projProps.hj_project_name || '',
        hj_notify_project_customer: projProps.hj_customer || '',
        hj_notify_project_operator: projProps.hj_operator || ''
      };
      if (dryRun) {
        console.log(`[dry-run] Would patch contact ${contactId} with`, contactProps);
      } else {
        await patchContact(contactId, contactProps);
      }
    }
  }

  const summary = {
    projectObjectId,
    projectId: projProps.hj_project_id || context.projectId || null,
    contacts: associationResults,
    dryRun,
    generatedAt: new Date().toISOString()
  };
  const summaryPath = writeJson(path.join(path.dirname(path.resolve(contextPath))), 'project-consultant-run', summary);

  console.log('\nConsultant assignment completed.');
  console.log(`Summary saved to ${summaryPath}`);
}

main().catch(err => {
  console.error('assign-consultants-to-project failed:', err);
  process.exit(1);
});
