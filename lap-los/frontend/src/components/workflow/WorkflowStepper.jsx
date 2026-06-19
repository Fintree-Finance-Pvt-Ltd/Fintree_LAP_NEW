import { Step, StepLabel, Stepper } from '@mui/material';
import { APPLICATION_STAGES } from '../../constants/applicationStages.js';

export default function WorkflowStepper({ activeStage = 'LEAD' }) {
  const activeStep = APPLICATION_STAGES.indexOf(activeStage);
  return <Stepper activeStep={activeStep} alternativeLabel>{APPLICATION_STAGES.slice(0, 8).map((stage) => <Step key={stage}><StepLabel>{stage.replaceAll('_', ' ')}</StepLabel></Step>)}</Stepper>;
}
