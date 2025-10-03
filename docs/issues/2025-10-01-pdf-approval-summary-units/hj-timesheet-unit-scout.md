# HubSpot Timesheet Unit Analysis
Generated: 2025-10-01T16:54:26.731Z

Total records retrieved: **9,330**

## Billing Frequency Values
| Billing Frequency | Count | Share |
| --- | --- | --- |
| Day | 6186 | 66.30% |
| Hour | 1582 | 16.96% |
| Per Mile | 1009 | 10.81% |
| Per Each | 517 | 5.54% |
| Fee/One Time | 36 | 0.39% |

## Constant Billing Frequency Values
| Constant Billing Frequency | Count | Share |
| --- | --- | --- |
| Day | 6159 | 66.01% |
| Hour | 1580 | 16.93% |
| Per Mile | 1009 | 10.81% |
| Per Each | 517 | 5.54% |
| Fee/One Time | 36 | 0.39% |
| Hour or Day | 29 | 0.31% |

## Derived Units (ValueFormattingService)
| Derived Unit | Count | Share |
| --- | --- | --- |
| days | 6186 | 66.30% |
| hours | 1582 | 16.96% |
| mi | 1009 | 10.81% |
| each | 517 | 5.54% |
| one-time fee | 36 | 0.39% |

## Top Service + Unit Combinations
| Service | Unit | Count | Share |
| --- | --- | --- | --- |
| Per Diem | days | 1343 | 14.39% |
| Mileage | mi | 1004 | 10.76% |
| Drilling Fluids Specialist | days | 571 | 6.12% |
| Drilling Supervisor III | days | 557 | 5.97% |
| Construction Supervisor III | days | 442 | 4.74% |
| Per Diem (24 Hr Service) | days | 391 | 4.19% |
| Field Drilling Superintendent (unit dollar) | each | 376 | 4.03% |
| Talent Management | hours | 369 | 3.95% |
| Facilities Engineer III | hours | 361 | 3.87% |
| Drilling Supervisor IV | days | 331 | 3.55% |
| Production and Workover Supervisor | days | 328 | 3.52% |
| Director of Operations and Finance | hours | 252 | 2.70% |
| Per Diem - Drilling Supervisor Only | days | 247 | 2.65% |
| Drilling Fluid Specialist III (24hr Service) | days | 243 | 2.60% |
| Solids Control Specialist | days | 211 | 2.26% |

## Sample Records by Derived Unit
- **days** → Service: Per Diem, Billing Frequency: Day, Constant Frequency: Day, Qty: 1
- **mi** → Service: Mileage, Billing Frequency: Per Mile, Constant Frequency: Per Mile, Qty: 286
- **hours** → Service: Production & Workover Engineer, Billing Frequency: Hour, Constant Frequency: Hour, Qty: 2.00
- **one-time fee** → Service: Solids Control Rig Audit, Billing Frequency: Fee/One Time, Constant Frequency: Fee/One Time, Qty: 0.17
- **each** → Service: Reimbursable Expenses, Billing Frequency: Per Each, Constant Frequency: Per Each, Qty: 200.00

## Additional Notes
- Billing frequency fields are free text; keep extending aliases as new phrasing appears (e.g., custom studies).
- All current records resolve to a normalized unit; add regression tests for `one-time fee` scenarios to guard future changes.
