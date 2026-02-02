"use client";

import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

const TOUR_STORAGE_KEY = "sheety-onboarding-tour-completed";

const steps: Step[] = [
  {
    target: "body",
    content: (
      <div>
        <h2 className="text-2xl font-sans font-bold mb-3">
          Welcome to Sheety CRM! 👋
        </h2>
        <p className="font-sans text-base">
          Let&apos;s take a quick tour of your new workspace. We&apos;ll show
          you the key features in just a few steps.
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="dashboard"]',
    content: (
      <div>
        <h3 className="text-xl font-sans font-bold mb-2">Dashboard Overview</h3>
        <p className="font-sans">
          Your dashboard shows a quick summary of your leads, opportunities, and
          pipeline value. Check here to get a bird&apos;s-eye view of your
          business.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="pipeline"]',
    content: (
      <div>
        <h3 className="text-xl font-sans font-bold mb-2">
          Pipeline Management
        </h3>
        <p className="font-sans">
          The Pipeline page shows all your opportunities organized by stage.
          Drag and drop cards to move deals through your sales process.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="leads"]',
    content: (
      <div>
        <h3 className="text-xl font-sans font-bold mb-2">Leads Ledger</h3>
        <p className="font-sans">
          Track all your leads in one place. View, filter, and convert leads
          into opportunities when they&apos;re qualified.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="add-lead"]',
    content: (
      <div>
        <h3 className="text-xl font-sans font-bold mb-2">Add New Leads</h3>
        <p className="font-sans">
          Click here to add a new lead to your CRM. You can also add
          opportunities directly from the Pipeline page.
        </p>
      </div>
    ),
    placement: "left",
  },
  {
    target: '[data-tour="settings"]',
    content: (
      <div>
        <h3 className="text-xl font-sans font-bold mb-2">
          Settings & Customization
        </h3>
        <p className="font-sans">
          Customize your workspace, manage your Google Sheets connection, and
          configure your CRM preferences here.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: (
      <div>
        <h2 className="text-2xl font-sans font-bold mb-3">
          You&apos;re All Set! 🎉
        </h2>
        <p className="font-sans text-base mb-3">
          You now know the basics of Sheety CRM. Start by adding your first lead
          or exploring the dashboard.
        </p>
        <p className="font-mono text-xs text-gray-600">
          Tip: You can always access help from the menu.
        </p>
      </div>
    ),
    placement: "center",
  },
];

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

export default function OnboardingTour({
  run = false,
  onComplete,
}: OnboardingTourProps) {
  const [runTour, setRunTour] = useState(run);

  useEffect(() => {
    setRunTour(run);
  }, [run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      // Mark tour as completed in localStorage
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#000",
          textColor: "#333",
          zIndex: 10000,
        },
        tooltip: {
          fontSize: 14,
        },
        buttonNext: {
          backgroundColor: "#000",
          fontSize: 13,
          padding: "8px 16px",
          textTransform: "uppercase",
        },
        buttonBack: {
          color: "#666",
          fontSize: 13,
        },
        buttonSkip: {
          color: "#999",
          fontSize: 12,
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}

export function isTourCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
}

export function resetTour(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
