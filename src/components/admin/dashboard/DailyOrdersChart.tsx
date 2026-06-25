import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyOrdersData {
  date: string;
  pedidos: number;
}

interface DailyOrdersChartProps {
  dailyOrdersData: DailyOrdersData[];
}

const DailyOrdersChart: React.FC<DailyOrdersChartProps> = ({ dailyOrdersData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos Diários</CardTitle>
        <CardDescription>
          Volume de pedidos nos últimos dias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyOrdersData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pedidos" fill="#8884d8" name="Pedidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyOrdersChart;