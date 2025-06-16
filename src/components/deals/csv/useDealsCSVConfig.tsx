
import { csvTemplateColumns, exportColumns } from './dealsCSVColumns';
import { useDealsCSVProcessor } from './useDealsCSVProcessor';

export function useDealsCSVConfig() {
  const { processCSVData } = useDealsCSVProcessor();

  const handleCSVImport = async (data: any[]) => {
    return await processCSVData(data);
  };

  return {
    csvTemplateColumns,
    exportColumns,
    handleCSVImport,
  };
}
