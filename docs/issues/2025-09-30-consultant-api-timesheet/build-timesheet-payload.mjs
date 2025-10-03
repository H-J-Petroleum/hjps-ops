import fs from 'fs';
import path from 'path';

const issueDir = 'analysis/issues/2025-09-30-consultant-api-timesheet';
const dataDir = path.join(issueDir, 'data');

const consultantsRaw = JSON.parse(fs.readFileSync(path.join(dataDir, 'hj-consultants-justin-lott.json'), 'utf8'));
const lookupRows = JSON.parse(fs.readFileSync(path.join(dataDir, 'hj-consultant-lookup-table.json'), 'utf8'));
const contact = JSON.parse(fs.readFileSync(path.join(dataDir, 'contact-299151.json'), 'utf8'));

const targetDeals = new Set(lookupRows.map(row => row.afe));
const consultantsByDeal = {};
for (const result of consultantsRaw.results) {
  const props = result.properties;
  const deal = props.payment_deal_id;
  if (!deal || !targetDeals.has(deal)) continue;
  if (!consultantsByDeal[deal]) {
    consultantsByDeal[deal] = {
      well: props.well,
      consultantTitle: props.consultant_title_job || props.consultant_role || '',
      services: {}
    };
  }
  consultantsByDeal[deal].services[props.job_service] = {
    consultantPrice: parseFloat(props.daily_role_price || props.per_mile_price || props.per_each_price || props.fee_one_time_price || '0'),
    hjPrice: parseFloat(props.hj_hj_daily_price || props.hj_hj_per_mile_price || props.hj_hj_per_each_price || props.hj_hj_fee_one_time_price || '0')
  };
}

const wells = lookupRows.map(row => {
  const data = consultantsByDeal[row.afe];
  if (!data) throw new Error(`Missing consultant data for payment deal ${row.afe}`);
  return {
    paymentDealId: row.afe,
    well: data.well,
    consultantTitle: data.consultantTitle,
    services: data.services
  };
});

const totalWeekly = 7200;
const serviceDefs = {
  day: {
    job: 'Construction Supervisor III',
    unit: 'Day',
    consultantPrice: 990,
    hjPrice: 1100
  },
  perDiem: {
    job: 'Per Diem',
    unit: 'Day',
    consultantPrice: 75,
    hjPrice: 75
  },
  mileage: {
    job: 'Mileage',
    unit: 'Per Mile',
    consultantPrice: 1.25,
    hjPrice: 1.5
  }
};
const serviceWeights = {
  day: 990,
  perDiem: 75,
  mileage: 375
};
const weightSum = Object.values(serviceWeights).reduce((a, b) => a + b, 0);
const round = (amount, decimals = 2) => Number(amount.toFixed(decimals));

const allocate = serviceKey => {
  const total = totalWeekly * serviceWeights[serviceKey] / weightSum;
  const perWell = total / wells.length;
  const allocations = [];
  let running = 0;
  for (let i = 0; i < wells.length; i++) {
    if (i === wells.length - 1) {
      allocations.push(round(total - running));
    } else {
      const amount = round(perWell);
      allocations.push(amount);
      running += amount;
    }
  }
  return allocations;
};

const serviceAllocations = {
  day: allocate('day'),
  perDiem: allocate('perDiem'),
  mileage: allocate('mileage')
};

const computeQuantity = (amount, price, decimals) => price ? Number((amount / price).toFixed(decimals)) : 0;
const computeHJTotal = (amount, consultantPrice, hjPrice) => consultantPrice ? round(amount * (hjPrice / consultantPrice)) : round(amount * (hjPrice ? 1 : 0));

const consultantProps = contact.properties;
const shared = {
  timesheet_project_id: consultantProps.cg_project_id,
  timesheet_project_name: consultantProps.cg_project_name,
  timesheet_customer: consultantProps.cg_customer,
  timesheet_operator: consultantProps.cg_operator,
  timesheet_sales_deal_id: consultantProps.cg_sales_deal_id,
  timesheet_consultant_id: consultantProps.hs_object_id,
  timesheet_consultant_email: consultantProps.email,
  timesheet_consultant_full_name: `${consultantProps.firstname} ${consultantProps.lastname}`.trim(),
  timesheet_role: consultantProps.cg_role,
  terms: consultantProps.hj_terms,
  terms__number_format_: consultantProps.hj_terms === 'Net 30' ? '30' : '',
  taxable: consultantProps.hj_taxable,
  class: consultantProps.hj_class,
  bill_terms: consultantProps.quote_consultant_id,
  type: consultantProps.quote_consultant_name,
  consultant_bill_account: consultantProps.quote_customer_id,
  bill_account: 'Payroll Expenses'
};

const weeks = [
  { startDate: '2025-09-15', endDate: '2025-09-19' },
  { startDate: '2025-09-22', endDate: '2025-09-26' }
];

let startOrdinal = 0;
try {
  const token = fs.readFileSync('/mnt/d/code/hjpshubspot/.hubspot-token','utf8').trim();
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/2-26173281/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filterGroups: [{ filters: [
        { propertyName: 'timesheet_consultant_id', operator: 'EQ', value: consultantProps.hs_object_id }
      ] }],
      sorts: [{ propertyName: 'timesheet_ordinal_number', direction: 'DESCENDING' }],
      limit: 1,
      properties: ['timesheet_ordinal_number']
    })
  });
  if (response.ok) {
    const data = await response.json();
    const highest = data.results?.[0]?.properties?.timesheet_ordinal_number;
    if (highest) startOrdinal = parseInt(highest, 10);
  }
} catch (err) {
  console.warn('Unable to fetch existing ordinal number:', err.message);
}

const serviceOrder = ['day', 'perDiem', 'mileage'];

const payload = [];
let ordinal = startOrdinal;
for (const week of weeks) {
  wells.forEach((well, idx) => {
    serviceOrder.forEach(key => {
      const def = serviceDefs[key];
      const amount = serviceAllocations[key][idx];
      const quantityDecimals = key === 'mileage' ? 2 : 5;
      const quantity = computeQuantity(amount, def.consultantPrice, quantityDecimals);
      const totalPrice = round(amount);
      const totalHJPrice = computeHJTotal(amount, def.consultantPrice, def.hjPrice);
      const consultantTitle = well.consultantTitle || shared.timesheet_role;

      payload.push({
        properties: {
          ...shared,
          timesheet_payment_deal_id: well.paymentDealId,
          timesheet_ordinal_number: String(++ordinal),
          timesheet_well: well.well,
          timesheet_job_service: def.job,
          timesheet_billing_frequency: def.unit,
          timesheet_constant_billing_frequency: def.unit,
          timesheet_price: String(def.consultantPrice),
          timesheet_hj_price: String(def.hjPrice),
          timesheet_quantity: quantity.toString(),
          timesheet_total_price: totalPrice.toFixed(2),
          timesheet_hj_total_price: totalHJPrice.toFixed(2),
          timesheet_start_date: week.startDate,
          timesheet_end_date: week.endDate,
          timesheet_start_time: '00:00',
          timesheet_end_time: '00:00',
          bill_description: `${week.startDate}\nH&J Petroleum Management & Consulting\nWell: ${well.well}\n${consultantTitle}`,
          line_item_description: `${week.startDate}: ${well.well}, ${well.paymentDealId}; ${shared.timesheet_role}, See approved timesheet for additional information.`,
          timesheet_approval_status: 'Created'
        }
      });
    });
  });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const jsonPath = path.join(dataDir, `timesheet-payload-${timestamp}.json`);
const csvPath = path.join(dataDir, `timesheet-payload-${timestamp}.csv`);

fs.writeFileSync(jsonPath, JSON.stringify({ inputs: payload }, null, 2));

const csvRows = [
  ['week_start','week_end','well','service','quantity','unit_price','total_price','h_j_total_price','payment_deal_id','ordinal']
];
payload.forEach(item => {
  const p = item.properties;
  csvRows.push([
    p.timesheet_start_date,
    p.timesheet_end_date,
    p.timesheet_well,
    p.timesheet_job_service,
    p.timesheet_quantity,
    p.timesheet_price,
    p.timesheet_total_price,
    p.timesheet_hj_total_price,
    p.timesheet_payment_deal_id,
    p.timesheet_ordinal_number
  ]);
});
const csvContent = csvRows.map(row => row.map(value => {
  const str = value == null ? '' : String(value);
  return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}).join(',')).join('\n');
fs.writeFileSync(csvPath, csvContent);

console.log(`Payload written to ${jsonPath}`);
console.log(`CSV written to ${csvPath}`);
