import typescriptWriter from './writer.typescript';
import mongooseWriter from './writer.mongoose';
import knexWriter from './writer.knex';
import golangWriter from './writer.golang';
import sqlWriter from './writer.sql';

import {
  ISchemaAnalyzerOptions,
  TypeSummary,
  helpers,
  CombinedFieldInfo,
  FieldInfo,
} from '../schema-analyzer/index';

export interface IDataAnalyzerWriter {
  render(options: IRenderArgs): string;
}
export interface IRenderArgs {
  schemaName: string;
  results: TypeSummary<CombinedFieldInfo>;
  options?: ISchemaAnalyzerOptions;
}

const writers = {
  typescript: typescriptWriter,
  golang: golangWriter,

  mongoose: mongooseWriter,
  knex: knexWriter,
  sql: sqlWriter,
};

export type AdapterNames = keyof typeof writers;

export function render({
  schemaName,
  options,
  writer,
}: {
  schemaName: string;
  options: ISchemaAnalyzerOptions;
  writer: AdapterNames;
}) {
  return (results: TypeSummary<FieldInfo>) => {
    const renderer = writers[writer];
    if (!renderer) throw new Error(`Invalid Render Adapter Specified: ${writer}`);

    const flatTypeMap = helpers.flattenTypes(results);
    const header = `/*
Code Generated by DataAnalyzer.app
@date ${new Date().toLocaleString()}
@debug ${Boolean(options.debug)}
*/\n${options.debug ? '' + getDebugSummary(flatTypeMap, options) + '\n' : ''}\n`;
    // console.log('flatTypeMap', flatTypeMap);
    return (
      header +
      renderer.render({
        schemaName,
        options,
        results: flatTypeMap,
      })
    );
  };
}

function getDebugSummary(
  typeSummary: TypeSummary<CombinedFieldInfo>,
  options: ISchemaAnalyzerOptions,
) {
  const { nestedTypes } = typeSummary;
  const nestedTypeNames: string[] = nestedTypes != null ? Object.keys(nestedTypes) : [];

  return `\n\n/*
#### DEBUG INFO ####
@SchemaName: ${typeSummary.schemaName}
@TotalRows: ${typeSummary.totalRows}
@Options:
${Object.entries(options)
  .map((opt) => '    ' + opt.join(': '))
  .join('\n')}
@SubTypes: // ${nestedTypeNames.length} found
${nestedTypeNames
  .slice()
  .sort()
  .filter((name) => name[0] !== '_')
  .map((name) => '    ' + name + ' ' + getDebugFieldsInfo(nestedTypes![name]!))
  .join('\n')}
*/`;
}

function getDebugFieldsInfo(typeSummary: TypeSummary<CombinedFieldInfo>) {
  return `// ${Object.keys(typeSummary.fields).length} fields; ${
    typeSummary.totalRows
  } rows processed.`;
}
