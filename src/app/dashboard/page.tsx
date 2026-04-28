import ActivityOverview from "@/components/dashboard/ActivityOverview";
import MainActions from "@/components/dashboard/MainActions";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

function DashboardPage() {
  return (
    <>
      <Navbar />

      <div className="px-6 py-8 pt-24 mx-auto max-w-7xl">
        <WelcomeSection />
        <MainActions />
        <ActivityOverview />
      </div>
    </>
  );
}
export default DashboardPage;
