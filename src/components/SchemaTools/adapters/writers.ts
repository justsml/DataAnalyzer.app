import typescriptWriter from './writer.typescript';
import mongooseWriter from './writer.mongoose';
import knexWriter from './writer.knex';
import {
  ISchemaAnalyzerOptions,
  TypeSummary,
  helpers,
  CombinedFieldInfo,
  FieldInfo,
} from '../../../schema-analyzer/index';

export interface IDataStepWriter {
  render(options: IRenderArgs): string;
}
export interface IRenderArgs {
  schemaName: string;
  results: TypeSummary<CombinedFieldInfo>;
  options?: ISchemaAnalyzerOptions;
}

const writers = {
  typescript: typescriptWriter,
  mongoose: mongooseWriter,
  knex: knexWriter,
  sql: knexWriter,
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
  
    const header = `/*
Code Generated by DataStep.io
@date ${new Date().toLocaleString()}
*/\n\n`

    return header + renderer.render({
      schemaName,
      options,
      results: helpers.flattenTypes(results),
    });
  };
}
