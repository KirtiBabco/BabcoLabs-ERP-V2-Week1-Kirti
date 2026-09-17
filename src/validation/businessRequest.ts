import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });
const lineSchema = {
  type: 'object', additionalProperties: false,
  required: ['line_number','item_code','description','quantity','unit'],
  properties: {
    line_number: { type: 'integer', minimum: 1 },
    item_code: { type: 'string', minLength: 1, maxLength: 60 },
    description: { type: 'string', minLength: 1, maxLength: 300 },
    quantity: { type: 'number', exclusiveMinimum: 0 },
    unit: { enum: ['EA','CS','LB','KG'] }
  }
};
const createSchema = {
  type: 'object', additionalProperties: false,
  required: ['request_number','request_type','title','priority','status','owner_code'],
  properties: {
    request_number: { type: 'string', minLength: 1, maxLength: 40 },
    request_type: { enum: ['PURCHASE','PRICING','INVENTORY','OPERATIONS'] },
    title: { type: 'string', minLength: 5, maxLength: 200 },
    description: { type: 'string', maxLength: 2000 },
    priority: { enum: ['LOW','NORMAL','HIGH','URGENT'] },
    status: { enum: ['OPEN','ON_HOLD','CLOSED'] },
    owner_code: { type: 'string', minLength: 1, maxLength: 50 },
    lines: { type: 'array', items: lineSchema }
  }
};
const patchSchema = {
  type: 'object', additionalProperties: false, minProperties: 1,
  properties: {
    title: { type: 'string', minLength: 5, maxLength: 200 },
    description: { type: ['string','null'], maxLength: 2000 },
    priority: { enum: ['LOW','NORMAL','HIGH','URGENT'] },
    status: { enum: ['OPEN','ON_HOLD','CLOSED'] },
    owner_code: { type: 'string', minLength: 1, maxLength: 50 }
  }
};
export const validateCreate = ajv.compile(createSchema);
export const validateLine = ajv.compile(lineSchema);
export const validatePatch = ajv.compile(patchSchema);
