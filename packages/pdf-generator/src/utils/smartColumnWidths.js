/**
 * Smart Column Width Calculator
 * Calculates optimal column widths based on content and constraints
 * Reusable utility for PDF table generation
 */

/**
 * Calculate smart column widths for any table
 * @param {Object} doc - PDFKit document instance
 * @param {Array} headers - Array of header labels
 * @param {Array} rows - Array of row data objects
 * @param {Array} columnConfig - Array of { property, mustFit } configs
 * @param {Number} availableWidth - Available page width
 * @returns {Array} Calculated widths for each column
 */
function calculateGenericSmartWidths(doc, headers, rows, columnConfig, availableWidth) {
  // Safety check for rows
  if (!Array.isArray(rows) || rows.length === 0) {
    // Return default widths if no data
    return columnConfig.map(() => 100);
  }

  // Measure max content width for each column
  const columnWidths = columnConfig.map((config, colIdx) => {
    // Start with header width as MINIMUM
    doc.font('Helvetica-Bold').fontSize(10);
    let maxWidth = doc.widthOfString(headers[colIdx]) + 12;
    const minWidth = maxWidth;

    // Check all data rows
    doc.font('Helvetica').fontSize(9);
    rows.forEach(row => {
      const content = row[config.property] || '';
      const contentWidth = doc.widthOfString(String(content)) + 12;

      // For text content, ensure we have enough width for the longest word
      // This prevents breaking words in the middle (like "Comanche" getting cut to "Comanc")
      if (typeof content === 'string' && content.includes(' ')) {
        const words = content.split(' ');
        const longestWord = words.reduce((longest, word) =>
          word.length > longest.length ? word : longest, '');
        const longestWordWidth = doc.widthOfString(longestWord) + 12;
        maxWidth = Math.max(maxWidth, longestWordWidth);
      } else {
        maxWidth = Math.max(maxWidth, contentWidth);
      }
    });

    const finalWidth = Math.max(maxWidth, minWidth);

    return {
      width: finalWidth,
      mustFit: config.mustFit,
      property: config.property
    };
  });

  // Calculate required vs flexible widths
  const requiredWidth = columnWidths.filter(c => c.mustFit).reduce((sum, c) => sum + c.width, 0);
  const flexibleWidth = columnWidths.filter(c => !c.mustFit).reduce((sum, c) => sum + c.width, 0);
  const totalNeeded = requiredWidth + flexibleWidth;

  // Scale if needed
  if (totalNeeded > availableWidth) {
    const availableForFlexible = availableWidth - requiredWidth;

    // Safety check: avoid division by zero
    if (flexibleWidth === 0) {
      // All columns are mustFit, return original widths
      return columnWidths.map(c => Math.ceil(c.width));
    }

    const flexScale = availableForFlexible / flexibleWidth;

    return columnWidths.map(c => {
      if (c.mustFit) {
        return Math.ceil(c.width);
      } else {
        const scaled = Math.floor(c.width * flexScale);
        // Never scale below the content width - this ensures "Comanche 6628H" doesn't get cut off
        return Math.max(scaled, c.width);
      }
    });
  }

  // Distribute extra space to flexible columns
  const extraSpace = availableWidth - totalNeeded;
  const flexibleColumns = columnWidths.filter(c => !c.mustFit);

  // Safety check: avoid division by zero
  if (flexibleColumns.length === 0) {
    // All columns are mustFit, return original widths
    return columnWidths.map(c => Math.ceil(c.width));
  }

  const spacePerCol = Math.floor(extraSpace / flexibleColumns.length);

  return columnWidths.map(c => {
    if (!c.mustFit) {
      return Math.floor(c.width + spacePerCol);
    }
    return Math.ceil(c.width);
  });
}

module.exports = {
  calculateGenericSmartWidths
};
