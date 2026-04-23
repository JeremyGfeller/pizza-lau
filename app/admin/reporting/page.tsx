import { ReportingBoard } from "@/components/admin/reporting-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReportingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporting ventes & performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ReportingBoard />
      </CardContent>
    </Card>
  );
}
