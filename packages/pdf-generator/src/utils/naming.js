function sanitiseSegment(input, fallback) {
  const value = (input || fallback || '').toString().trim();
  if (!value) return 'document';
  return (
    value
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'document'
  );
}

function buildFileNameForType(pdfType, { requestId, consultantName }) {
  const rid = sanitiseSegment(requestId, 'request');
  const cseg = sanitiseSegment(consultantName, 'Consultant');
  if (pdfType === 'customer') {
    return `Approved-Field-Ticket-${cseg}-${rid}.pdf`;
  }
  if (pdfType === 'consultant') {
    return `Approved-Timesheet-${rid}.pdf`;
  }
  return `Internal-Ticket-${cseg}-${rid}.pdf`;
}

module.exports = { sanitiseSegment, buildFileNameForType };

