import { HeroSection } from "@/components/HeroSection";
import { LayeredBrowsing } from "@/components/LayeredBrowsing";
import { GovernanceDashboard } from "@/components/GovernanceDashboard";

const LandingPage = () => {
  return (
    <div className="flex flex-col"> 
      
      <HeroSection />
        <LayeredBrowsing />
        <GovernanceDashboard />
    </div>
  );
};

export default LandingPage;