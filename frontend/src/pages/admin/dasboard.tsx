import { useState } from "react";
import { LayoutDashboard, Users, CreditCard, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
interface AnalyticsCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  onClick: () => void;
}

// Analytics Card Component
const AnalyticsCard = ({
  icon: Icon,
  title,
  value,
  change,
  positive,
  onClick,
}: AnalyticsCardProps) => (
  <Card
    className="bg-card shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-200"
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-card-foreground">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-card-foreground">{value}</div>
      <p
        className={cn("text-xs", positive ? "text-green-600" : "text-red-600")}
      >
        {positive ? "+" : "-"}
        {change}% from last month
      </p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <main className="flex-1 overflow-y-auto">
      {/* Mobile Overlay when Sidebar is Open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl text-foreground font-bold">Dashboard</h2>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          icon={Users}
          onClick={() => navigate("/admin/users")}
          title="Total Users"
          value="3,542"
          change="5.2"
          positive={true}
        />
        <AnalyticsCard
          icon={CreditCard}
          onClick={() => navigate("/admin/transactions")}
          title="Revenue"
          value="$45,231"
          change="3.4"
          positive={true}
        />
        <AnalyticsCard
          icon={Settings}
          onClick={() => navigate("/admin/dashboard")}
          title="Active Projects"
          value="12"
          change="2.1"
          positive={false}
        />
        <AnalyticsCard
          icon={LayoutDashboard}
          onClick={() => navigate("/admin/dashboard")}
          title="Conversion Rate"
          value="12.5%"
          change="1.2"
          positive={true}
        />
      </div>
    </main>
  );
}
