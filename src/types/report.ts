// Structure: { [type]: { [year]: { [month]: value } } }
export type MonthlyReport = Record<string, number>;
export type YearlyReport = Record<string, MonthlyReport>;
export type AllReportData = Record<string, YearlyReport>;
