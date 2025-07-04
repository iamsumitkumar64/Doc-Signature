import { Table } from "antd";
import type { TableProps } from "antd";
import { ColumnsType } from "antd/es/table";
import { useMemo } from "react";

interface CustomTableProps<T> {
	serialNumberConfig: {
		show: boolean;
		name: string;
	};
	columns: TableProps<T>["columns"];
	data: T[];
	loading?: boolean;
	onPageChange?: (_page: number, _pageSize: number) => void;
}

const CustomTable = <T extends object>({
	columns,
	data,
	loading,
	serialNumberConfig,
	onPageChange,
}: CustomTableProps<T>) => {
	const processedData = useMemo(() => {
		return data.map((ele, index) => ({
			key: (ele as any)?._id ?? index,//Prefer id,fallback to index
			rowIndex: index + 1,
			...ele,
		}));
	}, [data]);
	const finalColumns: ColumnsType<T> = useMemo(() => {
		if (serialNumberConfig.show) {
			const newColumns = [...(columns ?? [])];
			newColumns.unshift({
				dataIndex: "rowIndex",
				key: "rowIndex",
				align: "center",
				title: serialNumberConfig.name,
				width: 60,
				fixed: "left",
			});
			return newColumns;
		}
		return columns ?? [];
	}, [columns, serialNumberConfig]);
	return (
		<Table
			columns={finalColumns}
			dataSource={processedData}
			loading={loading}
			pagination={{
				pageSize: 10,
				onChange: onPageChange,
			}}
			// bordered
			rowKey={(record) => (record as any)?._id ?? (record as any)?.rowIndex}
			className="shadow-md rounded-lg"
			scroll={{ x: 1200, y: "calc(100vh - 240px)" }}
			tableLayout="fixed"
		/>
	);
};

export default CustomTable;