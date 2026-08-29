import { QuestShell } from './features/quest/QuestShell';
import { ErrorBoundary } from './shared/ui/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <QuestShell />
    </ErrorBoundary>
  );
}
