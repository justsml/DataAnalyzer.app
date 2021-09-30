import camelCase from 'lodash/camelCase';
import {
  CombinedFieldInfo,
  NumericFieldInfo,
  TypeNameStringComposite,
  TypeNameStringDecimal,
} from 'types';
import { properCase, removeBlankLines } from 'helpers';
import { KeyValPair } from 'types';
import type { IDataAnalyzerWriter } from './writers';

const getHeader = () => `const Joi = require("joi");\n\n`;

const getJoiType = ({ type, ...data }: CombinedFieldInfo) => {
  if (type === '$ref') return `object()`;
  if (type === 'Unknown') return `string()`;
  if (type === 'ObjectId') return `string()`;
  if (type === 'UUID') return `string().guid())`;
  if (type === 'Boolean') return `boolean()`;
  if (type === 'Date') return `date()`;
  if (type === 'Timestamp') return `date()`;
  if (type === 'Currency') return `number()`;
  if (type === 'Float') return `number()`;
  if (type === 'Number') return `number()`;
  if (type === 'BigNumber') return `string()`;
  if (type === 'Email') return `string().email()`;
  if (type === 'String') return `string()`;
  if (type === 'Array') return `array()`;
  if (type === 'Object') return `object()`;
  if (type === 'Null') return `any()`;
  console.error('failed to map type ', type, data);
  return `any()`;
};
const writer: IDataAnalyzerWriter = {
  render(results) {
    const { options } = results;
    const typeSummary = results.flatTypeSummary;
    const hasNestedTypes =
      typeSummary.nestedTypes && Object.keys(typeSummary.nestedTypes!).length > 0;
    // const { fields } = typeSummary;
    const getSchema = (schemaName: string, fields: KeyValPair<CombinedFieldInfo>) => {
      return (
        `export const ${properCase(schemaName)}Schema = Joi.object({\n` +
        Object.entries(fields)
          .map(([fieldName, fieldInfo]) => {
            if (fieldInfo == null) return `// null field info !!!`;
            return `  ${camelCase(fieldName)}: Joi.${getJoiType(fieldInfo)}
${fieldInfo.nullable ? '' : '\n    .required()'}${
              fieldInfo.value && TypeNameStringDecimal.includes(fieldInfo.type)
                ? '\n    .max(' + (fieldInfo as NumericFieldInfo).value + ')'
                : ''
            }${
              fieldInfo.value && TypeNameStringDecimal.includes(fieldInfo.type)
                ? '\n    .min(' + (fieldInfo as NumericFieldInfo).value + ')'
                : ''
            }${
              fieldInfo.value && TypeNameStringComposite.includes(fieldInfo.type)
                ? '\n    .length(' + fieldInfo.value + ')'
                : ''
            }${
              Array.isArray(fieldInfo.enum) && fieldInfo.enum.length > 0
                ? '\n    .enum(["' + fieldInfo.enum.join('", "') + '"])'
                : ''
            }
  }\n`;
          })
          .join(',\n') +
        `});\n`
      );
    };

    const getRecursive = () => {
      if (!options?.disableNestedTypes && hasNestedTypes) {
        return Object.entries(typeSummary.nestedTypes!)
          .map(([nestedName, results]) => {
            // console.log('nested mongoose schema:', nestedName);
            return getSchema(nestedName, results.fields);
          })
          .join('\n');
      }
      return '';
    };
    let code = moveModuleExports(
      getSchema(results.schemaName!, typeSummary.fields) + getRecursive(),
    );
    return getHeader() + removeBlankLines(code);
  },
};

function moveModuleExports(code: string): string {
  const mongooseModelLines = /^const.*mongoose.model.*$/gim;
  const moduleLines = /^module\.exports.*$/gim;
  let moduleMatch: null | string[] = moduleLines.exec(code);
  let mongooseMatch: null | string[] = mongooseModelLines.exec(code);
  const moduleConstLines: string[] = [];
  const moduleExportLines: string[] = [];
  while (Array.isArray(moduleMatch) && moduleMatch.length > 0) {
    moduleExportLines.push(...moduleMatch);
    moduleMatch = moduleLines.exec(code);
  }
  while (Array.isArray(mongooseMatch) && mongooseMatch.length > 0) {
    moduleConstLines.push(...mongooseMatch);
    mongooseMatch = mongooseModelLines.exec(code);
  }

  code =
    code.replace(moduleLines, '').replace(mongooseModelLines, '') +
    moduleConstLines.join('\n') +
    '\n\n' +
    moduleExportLines.join('\n');
  return code;
}

export default writer;
