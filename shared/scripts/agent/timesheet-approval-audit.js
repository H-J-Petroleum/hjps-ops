const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const MODULES_ROOT = path.join(PROJECT_ROOT, 'data', 'raw', 'themes', 'Timesheets-Theme', 'modules');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'analysis', 'timesheet_process', 'phases', '02-timesheet-creation', 'agents', 'timesheet_approval');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'audit-report.json');
const OUTPUT_MANIFEST_FILE = path.join(OUTPUT_DIR, 'audit-manifest.json');

const HTML_FILE = 'module.html';
const CSS_FILE = 'module.css';
const JS_FILE = 'module.js';
const FIELDS_FILE = 'fields.json';
const META_FILE = 'meta.json';

const STAGE_RULES = [
  { stage: 'line_items_flow', patterns: [/line-items/] },
  { stage: 'consultant_request', patterns: [/consultant/] },
  { stage: 'customer_response', patterns: [/customer-approval-response/] },
  { stage: 'internal_response', patterns: [/hjpetro/] },
  { stage: 'field_ticket_flow', patterns: [/field-ticket/, /filed-ticket/] },
  { stage: 'thank_you', patterns: [/thank/] }
];

function detectStage(moduleName) {
  const name = moduleName.toLowerCase();
  const match = STAGE_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(name)));
  return match ? match.stage : 'uncategorized';
}

function readFileIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return '';
  }
  return fs.readFileSync(targetPath, 'utf8');
}

function parseJsonFile(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(targetPath, 'utf8');
    return raw.trim().length ? JSON.parse(raw) : null;
  } catch (error) {
    return { error: error.message };
  }
}

function extractMatches(source, regex) {
  if (!source) {
    return [];
  }
  const matches = new Set();
  let match;
  while ((match = regex.exec(source)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

function detectPotentialIssues({ html, fields, hasInlineStyle, hasModuleCss, hasModuleJs, queryParams, crmObjects, externalScripts }) {
  const notes = [];
  if (!html) {
    notes.push('Missing module.html file');
  }
  if (!hasModuleCss && hasInlineStyle) {
    notes.push('All styling is inline; module.css is empty');
  }
  if (!hasModuleCss && !hasInlineStyle) {
    notes.push('No styling detected in module.css or inline');
  }
  if (!hasModuleJs && (html && html.includes('<script'))) {
    notes.push('module.js is empty; logic embedded directly inside HTML');
  }
  if (fields && Array.isArray(fields) && fields.length === 0) {
    notes.push('fields.json is empty; module relies entirely on query parameters');
  }
  if (queryParams.length > 8) {
    notes.push('High number of query parameters; consider structured module fields or shared data layer');
  }
  if (crmObjects.length > 3) {
    notes.push('Multiple crm_objects calls; evaluate for consolidation or helper macros');
  }
  if (externalScripts.length > 2) {
    notes.push('Several external scripts loaded inside module.html; move to shared asset bundle');
  }
  if (html && html.includes('base64')) {
    notes.push('Base64 payload detected; consider moving to separate asset or API response');
  }
  return notes;
}

function analyzeModule(moduleDir) {
  const modulePath = path.join(MODULES_ROOT, moduleDir);
  const htmlPath = path.join(modulePath, HTML_FILE);
  const cssPath = path.join(modulePath, CSS_FILE);
  const jsPath = path.join(modulePath, JS_FILE);
  const fieldsPath = path.join(modulePath, FIELDS_FILE);
  const metaPath = path.join(modulePath, META_FILE);

  const html = readFileIfExists(htmlPath);
  const css = readFileIfExists(cssPath);
  const js = readFileIfExists(jsPath);
  const fields = parseJsonFile(fieldsPath);
  const meta = parseJsonFile(metaPath);

  const externalScripts = extractMatches(html, /<script[^>]*src=["']([^"']+)["'][^>]*>/gi);
  const crmObjects = extractMatches(html, /crm_objects\(["']([^"']+)["']/gi);
  const queryParams = extractMatches(html, /request\.query_dict\.([a-zA-Z0-9_]+)/g);
  const forms = extractMatches(html, /<form[^>]*action=["']([^"']*)["'][^>]*>/gi);
  const inlineStyleSize = (html.match(/<style[\s\S]*?<\/style>/gi) || []).reduce((size, block) => size + block.length, 0);

  const hasModuleCss = Boolean(css && css.trim().length);
  const hasModuleJs = Boolean(js && js.trim().length);
  const hasInlineStyle = inlineStyleSize > 0;

  const issues = detectPotentialIssues({ html, fields, hasInlineStyle, hasModuleCss, hasModuleJs, queryParams, crmObjects, externalScripts });
  const stage = detectStage(moduleDir.replace(/\.module$/, ''));

  return {
    module: moduleDir.replace(/\.module$/, ''),
    path: path.relative(PROJECT_ROOT, modulePath).split(path.sep).join('/'),
    stage,
    externalScripts,
    crmObjects,
    queryParams,
    forms,
    inlineStyleBytes: inlineStyleSize,
    hasModuleCss,
    hasModuleJs,
    hasInlineStyle,
    fieldsSummary: Array.isArray(fields) ? { type: 'array', length: fields.length } : fields,
    meta,
    potentialIssues: issues
  };
}

function buildStageManifest(report) {
  const stageBuckets = {};

  report.forEach((item) => {
    const key = item.stage;
    if (!stageBuckets[key]) {
      stageBuckets[key] = {
        modules: [],
        totals: {
          inlineStyleBytes: 0,
          crmObjects: 0,
          queryParams: 0,
          externalScripts: 0
        },
        issueCounts: {}
      };
    }

    const bucket = stageBuckets[key];
    bucket.modules.push({
      module: item.module,
      path: item.path,
      inlineStyleBytes: item.inlineStyleBytes,
      crmObjects: item.crmObjects.length,
      queryParams: item.queryParams.length,
      externalScripts: item.externalScripts.length,
      hasModuleCss: item.hasModuleCss,
      hasModuleJs: item.hasModuleJs,
      hasInlineStyle: item.hasInlineStyle,
      potentialIssues: item.potentialIssues
    });

    bucket.totals.inlineStyleBytes += item.inlineStyleBytes;
    bucket.totals.crmObjects += item.crmObjects.length;
    bucket.totals.queryParams += item.queryParams.length;
    bucket.totals.externalScripts += item.externalScripts.length;

    item.potentialIssues.forEach((issue) => {
      bucket.issueCounts[issue] = (bucket.issueCounts[issue] || 0) + 1;
    });
  });

  const stageSummary = Object.keys(stageBuckets)
    .sort()
    .map((stage) => {
      const bucket = stageBuckets[stage];
      const moduleCount = bucket.modules.length;
      const averages = moduleCount
        ? {
            inlineStyleBytes: bucket.totals.inlineStyleBytes / moduleCount,
            crmObjects: bucket.totals.crmObjects / moduleCount,
            queryParams: bucket.totals.queryParams / moduleCount,
            externalScripts: bucket.totals.externalScripts / moduleCount
          }
        : {
            inlineStyleBytes: 0,
            crmObjects: 0,
            queryParams: 0,
            externalScripts: 0
          };

      const issueFrequency = Object.entries(bucket.issueCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([issue, count]) => ({ issue, count }));

      return {
        stage,
        moduleCount,
        totals: bucket.totals,
        averages,
        issueFrequency,
        modules: bucket.modules
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    stageCount: stageSummary.length,
    stages: stageSummary
  };
}

(function main() {
  if (!fs.existsSync(MODULES_ROOT)) {
    console.error('Modules root not found at ' + MODULES_ROOT);
    process.exitCode = 1;
    return;
  }

  const moduleDirs = fs
    .readdirSync(MODULES_ROOT)
    .filter((entry) => entry.endsWith('.module'))
    .filter((entry) => entry.toLowerCase().includes('approval'))
    .sort();

  if (!moduleDirs.length) {
    console.warn('No approval-related modules found.');
  }

  const report = moduleDirs.map(analyzeModule);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    moduleCount: report.length,
    summary: {
      modulesWithInlineStyles: report.filter((item) => item.hasInlineStyle).length,
      modulesMissingModuleCss: report.filter((item) => !item.hasModuleCss).length,
      modulesMissingModuleJs: report.filter((item) => !item.hasModuleJs).length,
      avgExternalScripts: report.length ? report.reduce((sum, item) => sum + item.externalScripts.length, 0) / report.length : 0,
      avgCrmObjectsCalls: report.length ? report.reduce((sum, item) => sum + item.crmObjects.length, 0) / report.length : 0,
      avgQueryParams: report.length ? report.reduce((sum, item) => sum + item.queryParams.length, 0) / report.length : 0
    },
    modules: report
  };

  const manifest = buildStageManifest(report);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(OUTPUT_MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Timesheet approval audit written to ' + OUTPUT_FILE);
  console.log('Stage manifest written to ' + OUTPUT_MANIFEST_FILE);
})();
