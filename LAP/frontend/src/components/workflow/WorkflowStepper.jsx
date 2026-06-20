import { Steps, StepItem } from "../../components/ui/steps.jsx";
import { APPLICATION_STAGES } from "../../constants/applicationStages.js";

export default function WorkflowStepper({ activeStage = 'LEAD' }) {
  const activeIndex = APPLICATION_STAGES.indexOf(activeStage);
  const steps = APPLICATION_STAGES.slice(0, 8);

  return (
    <Steps>
      {steps.map((stage, idx) => (
        <li key={stage}>
          <StepItem
            label={stage}
            isActive={idx === activeIndex}
            isCompleted={idx < activeIndex}
          />
        </li>
      ))}
    </Steps>
  );
}

