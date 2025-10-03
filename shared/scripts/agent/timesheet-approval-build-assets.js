const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const ANALYSIS_DIR = path.join(PROJECT_ROOT, 'analysis', 'timesheet_process', 'phases', '02-timesheet-creation', 'agents', 'timesheet_approval');
const MANIFEST_PATH = path.join(ANALYSIS_DIR, 'audit-manifest.json');
const SHARED_ROOT = path.join(PROJECT_ROOT, 'data', 'raw', 'themes', 'Timesheets-Theme', 'shared');
const PARTIALS_ROOT = path.join(SHARED_ROOT, 'partials');
const OUTPUT_CSS = path.join(SHARED_ROOT, 'hj-timesheet-approval.css');
const OUTPUT_JS = path.join(SHARED_ROOT, 'hj-timesheet-approval.js');
const OUTPUT_MANIFEST_COPY = path.join(SHARED_ROOT, 'hj-timesheet-approval-manifest.json');
const OUTPUT_PARTIAL = path.join(PARTIALS_ROOT, 'require-shared-assets.html');

const HEADER_START = '/* AUTO-GENERATED HEADER START */';
const HEADER_END = '/* AUTO-GENERATED HEADER END */';

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error('Manifest not found at ' + MANIFEST_PATH);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildHeaderLines(assetType, manifest) {
  const lines = [
    HEADER_START,
    '/* Timesheet approval ' + assetType + ' scaffold generated ' + new Date().toISOString() + ' */',
    '/* Total stages: ' + manifest.stageCount + ', modules audited: ' + manifest.stages.reduce((sum, stage) => sum + stage.moduleCount, 0) + ' */'
  ];

  manifest.stages.forEach((stage) => {
    const moduleList = stage.modules.map((mod) => mod.module).join(', ');
    lines.push('/* Stage: ' + stage.stage + ' — modules: ' + (moduleList || 'none') + ' */');
  });

  lines.push(HEADER_END);
  return lines;
}

function extractBodyLines(existingLines) {
  const start = existingLines.indexOf(HEADER_START);
  const end = existingLines.indexOf(HEADER_END);

  if (start !== -1 && end !== -1 && end > start) {
    return existingLines.slice(end + 1).filter((line, index) => !(index === 0 && line.trim() === ''));
  }

  return existingLines;
}

function writeFileWithHeader(targetPath, headerLines, defaultBodyLines) {
  let bodyLines = defaultBodyLines.slice();

  if (fs.existsSync(targetPath)) {
    const existingLines = fs.readFileSync(targetPath, 'utf8').split('\n');
    const extracted = extractBodyLines(existingLines);
    if (extracted.join('').trim()) {
      bodyLines = extracted;
    }
  }

  const contentLines = headerLines.concat(['']).concat(bodyLines);
  fs.writeFileSync(targetPath, contentLines.join('\n') + '\n', 'utf8');
}

function scaffoldPartial() {
  const partialLines = [
    '{# Shared loader for timesheet approval assets. Pass module.shared_assets as context. #}',
    '{% if context.css_asset_path %}',
    '  {% require_css(get_asset_url(context.css_asset_path)) %}',
    '{% endif %}',
    '{% if context.js_asset_path %}',
    '  {% require_js(get_asset_url(context.js_asset_path)) %}',
    '{% endif %}'
  ];
  fs.writeFileSync(OUTPUT_PARTIAL, partialLines.join('\n') + '\n', 'utf8');
}

(function main() {
  try {
    const manifest = loadManifest();
    ensureDir(SHARED_ROOT);
    ensureDir(PARTIALS_ROOT);

    const cssHeaderLines = buildHeaderLines('CSS', manifest);
    const jsHeaderLines = buildHeaderLines('JS', manifest);

    writeFileWithHeader(OUTPUT_CSS, cssHeaderLines, ['/* TODO: Consolidate shared timesheet approval styles here. */']);
    writeFileWithHeader(OUTPUT_JS, jsHeaderLines, [
      '(function(window){',
      '  window.hjpTimesheetApproval = window.hjpTimesheetApproval || {};',
      '})(window);'
    ]);

    fs.writeFileSync(OUTPUT_MANIFEST_COPY, JSON.stringify(manifest, null, 2), 'utf8');
    scaffoldPartial();

    console.log('Shared asset scaffold generated under ' + SHARED_ROOT);
  } catch (error) {
    console.error('Failed to build shared assets scaffold:', error.message);
    process.exitCode = 1;
  }
})();
